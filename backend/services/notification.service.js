'use strict';

const subModel = require('../models/Subscription');
const auditLog = require('../models/AuditLog');
let nodemailer;
try { nodemailer = require('nodemailer'); } catch (e) { nodemailer = null; }

const queue = [];

async function enqueueForTarget({ type, targetId, subject, body }) {
  const subscribers = await subModel.findSubscribers(type, targetId);
  for (const sub of subscribers) {
    if (sub.notify_email && sub.email) {
      queue.push({ kind: 'email', to: sub.email, subject, body, userId: sub.user_id });
      console.log(`[notify:queue] email -> ${sub.email} (user:${sub.user_id}) for ${type}:${targetId} · ${subject}`);
    }
    if (sub.notify_push) {
      queue.push({ kind: 'push',  to: sub.user_id, subject, body, userId: sub.user_id });
      console.log(`[notify:queue] push  -> user:${sub.user_id} for ${type}:${targetId} · ${subject}`);
    }
  }
  return subscribers.length;
}

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && nodemailer);
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!smtpConfigured()) return null;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = (process.env.SMTP_SECURE === 'true') || port === 465;
  const auth = process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth,
  });
  return transporter;
}

async function sendEmail(to, subject, body) {
  const t = getTransporter();
  if (!t) {
    console.log(`[notify:email] SMTP not configured — skipping send to ${to} · ${subject}`);
    return false;
  }
  const from = process.env.SMTP_FROM || `noreply@localhost`;
  try {
    const info = await t.sendMail({ from, to, subject, html: body, text: String(body).replace(/<[^>]+>/g, '') });
    console.log(`[notify:send] email -> ${to} · subject: ${subject} · messageId: ${info.messageId} · accepted: ${(info.accepted||[]).join(',') || '-'}${(info.rejected&&info.rejected.length)?(' · rejected:'+info.rejected.join(',')) : ''}`);
    if (body) console.log(`[notify:send] email body preview: ${String(body).slice(0,200).replace(/\n/g,' ')}${String(body).length>200 ? '…' : ''}`);
    return true;
  } catch (err) {
    console.error('[notify] email send error:', err.message || err);
    return false;
  }
}

async function flush() {
  let sent = 0;
  while (queue.length) {
    const job = queue.shift();
    try {
      if (job.kind === 'email') {
        console.log(`[notify:proc] processing email job -> to:${job.to} user:${job.userId} reason:${job.subject}`);
        const ok = await sendEmail(job.to, job.subject, job.body);
        console.log(`[notify:result] email ${ok ? 'sent' : 'failed'} -> ${job.to} user:${job.userId} subject:${job.subject}`);
      } else if (job.kind === 'push') {
        // TODO: integrate real push service
        console.log(`[notify:proc] processing push job -> user:${job.to} reason:${job.subject}`);
        console.log(`[notify:push] → user:${job.to} · ${job.subject}`);
      } else {
        console.log(`[notify] unknown job kind ${job.kind}`);
      }
      await auditLog.log({ userId: job.userId, action: `notify.${job.kind}`, meta: { subject: job.subject } });
      sent++;
    } catch (err) {
      console.error('[notify] job processing error:', err.message || err);
    }
  }
  return sent;
}

function queueSize() { return queue.length; }

module.exports = { enqueueForTarget, flush, queueSize, smtpConfigured };
