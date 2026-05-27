'use strict'

const subModel = require('../models/Subscription')
const auditLog = require('../models/AuditLog')
const path = require('path')
const fs = require('fs')
const ejs = require('ejs')
let nodemailer
try { nodemailer = require('nodemailer') } catch (e) { nodemailer = null }

const queue = []

async function enqueueForTarget({ type, targetId, subject, body }) {
  const subscribers = await subModel.findSubscribers(type, targetId)
  for (const sub of subscribers) {
    if (sub.notify_email && sub.email) {
      queue.push({ kind: 'email', to: sub.email, subject, body, userId: sub.user_id })
      console.log(`[notify:queue] email -> ${sub.email} (user:${sub.user_id}) for ${type}:${targetId} · ${subject}`)
    }
    if (sub.notify_push) {
      queue.push({ kind: 'push', to: sub.user_id, subject, body, userId: sub.user_id })
      console.log(`[notify:queue] push  -> user:${sub.user_id} for ${type}:${targetId} · ${subject}`)
    }
  }
  return subscribers.length
}

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && nodemailer)
}

let transporter = null
function getTransporter() {
  if (transporter) return transporter
  if (!smtpConfigured()) return null
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const secure = (process.env.SMTP_SECURE === 'true') || port === 465
  const auth = process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth,
  })
  // verify transporter asynchronously and log result
  if (transporter && typeof transporter.verify === 'function') {
    transporter.verify().then(() => console.log('[notify:smtp] transporter verified/ready'))
      .catch((err) => console.error('[notify:smtp] transporter verify failed:', err && err.message ? err.message : err))
  }
  return transporter
}

async function sendEmail(to, subject, body) {
  const t = getTransporter()
  if (!t) {
    console.log(`[notify:email] SMTP not configured — skipping send to ${to} · ${subject}`)
    return false
  }
  const from = process.env.SMTP_FROM || `noreply@localhost`
  try {
    // if body is not HTML, attempt to render template
    let htmlBody = body
    const isHtml = /<[^>]+>/.test(String(body || ''))
    if (!isHtml) {
      // render local template if exists
      const tpl = path.join(__dirname, '..', 'templates', 'email', 'notification.ejs')
      if (fs.existsSync(tpl)) {
        try {
          htmlBody = await ejs.renderFile(tpl, { subject, body, isHtml: false })
        } catch (er) {
          console.error('[notify] template render error:', er && er.message ? er.message : er)
        }
      } else {
        // fallback: wrap plain text
        htmlBody = `<pre style="white-space:pre-wrap">${String(body)}</pre>`
      }
    }

    const info = await t.sendMail({ from, to, subject, html: htmlBody, text: String(body).replace(/<[^>]+>/g, '') })
    const accepted = (info.accepted || []).join(',') || '-'
    const rejected = (info.rejected || []).join(',') || '-'
    console.log(`[notify:send] email -> ${to} · subject: ${subject} · messageId: ${info.messageId} · accepted: ${accepted} · rejected: ${rejected}`)
    try {
      const preview = nodemailer && typeof nodemailer.getTestMessageUrl === 'function' ? nodemailer.getTestMessageUrl(info) : null
      if (preview) console.log(`[notify:send] preview URL: ${preview}`)
    } catch (e) {
      // ignore preview errors
    }
    if (body) console.log(`[notify:send] email body preview: ${String(body).slice(0, 200).replace(/\n/g, ' ')}${String(body).length > 200 ? '…' : ''}`)
    return true
  } catch (err) {
    console.error('[notify] email send error:', err && err.stack ? err.stack : (err.message || err))
    // fallback: controlled by SMTP_FALLBACK env var (values: 'ethereal'|'none').
    const fallbackMode = (process.env.SMTP_FALLBACK || 'ethereal').toLowerCase();
    const msg = String(err && (err.code || err.message || ''));
    if (fallbackMode === 'none') {
      console.log('[notify] SMTP fallback disabled by SMTP_FALLBACK=none; not attempting Ethereal resend');
      return false;
    }
    if (nodemailer && /ENOTFOUND|getaddrinfo/i.test(msg)) {
      try {
        console.log('[notify] SMTP host unreachable — attempting Ethereal fallback (SMTP_FALLBACK=' + fallbackMode + ')')
        const testAcc = await nodemailer.createTestAccount()
        const ethTrans = nodemailer.createTransport({
          host: testAcc.smtp.host,
          port: testAcc.smtp.port,
          secure: testAcc.smtp.secure,
          auth: { user: testAcc.user, pass: testAcc.pass },
        })
        const info2 = await ethTrans.sendMail({ from, to, subject, html: htmlBody, text: String(body).replace(/<[^>]+>/g, '') })
        console.log('[notify] fallback Ethereal send messageId:', info2.messageId)
        try { const preview2 = nodemailer.getTestMessageUrl(info2); if (preview2) console.log('[notify] fallback preview URL:', preview2) } catch (e) {}
        return true
      } catch (er2) {
        console.error('[notify] fallback send failed:', er2 && er2.stack ? er2.stack : (er2.message || er2))
        return false
      }
    } else {
      console.log('[notify] SMTP fallback not applicable for error:', msg);
    }
    return false
  }
}

async function flush() {
  let sent = 0
  console.log(`[notify:flush] starting flush, queueSize=${queue.length}, smtpConfigured=${smtpConfigured()}`)

  // take snapshot of queue and clear it to avoid processing items added during flush
  const jobs = queue.splice(0, queue.length)

  // group email jobs by userId (fallback to email address)
  const emailGroups = new Map()
  const pushJobs = []
  for (const job of jobs) {
    if (job.kind === 'email') {
      const key = job.userId != null ? String(job.userId) : job.to
      if (!emailGroups.has(key)) emailGroups.set(key, { to: job.to, userId: job.userId, items: [] })
      emailGroups.get(key).items.push(job)
    } else if (job.kind === 'push') {
      pushJobs.push(job)
    } else {
      console.log(`[notify] unknown job kind ${job.kind}`)
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    })
  }

  // send grouped emails
  for (const [key, grp] of emailGroups) {
    try {
      const count = grp.items.length
      const subject = count === 1 ? grp.items[0].subject : `Уведомления (${count}) · ${grp.items[0].subject}`
      const bodyParts = grp.items.map((it) => {
        const title = escapeHtml(it.subject)
        const content = /<[^>]+>/.test(String(it.body || '')) ? it.body : `<pre style="white-space:pre-wrap">${escapeHtml(it.body)}</pre>`
        return `<section style="margin-bottom:18px"><h3>${title}</h3>${content}</section>`
      })
      const combinedBody = bodyParts.join('\n<hr/>\n')

      console.log(`[notify:proc] sending grouped email -> to:${grp.to} user:${grp.userId} items=${count}`)
      const ok = await sendEmail(grp.to, subject, combinedBody)
      console.log(`[notify:result] grouped email ${ok ? 'sent' : 'failed'} -> ${grp.to} user:${grp.userId} items=${count}`)
      await auditLog.log({ userId: grp.userId, action: `notify.email.group`, meta: { count, subjects: grp.items.map(i => i.subject) } })
      if (ok) sent++
    } catch (err) {
      console.error('[notify] grouped email error:', err && err.stack ? err.stack : (err.message || err))
    }
  }

  // process push jobs individually
  for (const job of pushJobs) {
    try {
      console.log(`[notify:proc] processing push job -> user:${job.to} reason:${job.subject}`)
      console.log(`[notify:push] → user:${job.to} · ${job.subject}`)
      await auditLog.log({ userId: job.userId, action: `notify.push`, meta: { subject: job.subject } })
      sent++
    } catch (err) {
      console.error('[notify] push job processing error:', err && err.stack ? err.stack : (err.message || err))
    }
  }

  return sent
}

function queueSize() { return queue.length }

module.exports = { enqueueForTarget, flush, queueSize, smtpConfigured }
