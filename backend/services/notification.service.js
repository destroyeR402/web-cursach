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
    // fallback: if SMTP DNS failed (e.g. smtp.example.com) and nodemailer available,
    // create Ethereal test account and resend once for local testing
    const msg = String(err && (err.code || err.message || ''))
    if (nodemailer && /ENOTFOUND|getaddrinfo/i.test(msg)) {
      try {
        console.log('[notify] SMTP host unreachable — creating Ethereal test account as fallback')
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
    }
    return false
  }
}

async function flush() {
  let sent = 0
  console.log(`[notify:flush] starting flush, queueSize=${queue.length}, smtpConfigured=${smtpConfigured()}`)
  while (queue.length) {
    const job = queue.shift()
    try {
      if (job.kind === 'email') {
        console.log(`[notify:proc] processing email job -> to:${job.to} user:${job.userId} reason:${job.subject}`)
        const ok = await sendEmail(job.to, job.subject, job.body)
        console.log(`[notify:result] email ${ok ? 'sent' : 'failed'} -> ${job.to} user:${job.userId} subject:${job.subject}`)
      } else if (job.kind === 'push') {
        // TODO: integrate real push service
        console.log(`[notify:proc] processing push job -> user:${job.to} reason:${job.subject}`)
        console.log(`[notify:push] → user:${job.to} · ${job.subject}`)
      } else {
        console.log(`[notify] unknown job kind ${job.kind}`)
      }
      await auditLog.log({ userId: job.userId, action: `notify.${job.kind}`, meta: { subject: job.subject } })
      sent++
    } catch (err) {
      console.error('[notify] job processing error:', err && err.stack ? err.stack : (err.message || err))
    }
  }
  return sent
}

function queueSize() { return queue.length }

module.exports = { enqueueForTarget, flush, queueSize, smtpConfigured }
