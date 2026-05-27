'use strict';

const subModel = require('../models/Subscription');
const auditLog = require('../models/AuditLog');

const queue = [];

async function enqueueForTarget({ type, targetId, subject, body }) {
  const subscribers = await subModel.findSubscribers(type, targetId);
  for (const sub of subscribers) {
    if (sub.notify_email) queue.push({ kind: 'email', to: sub.email, subject, body, userId: sub.user_id });
    if (sub.notify_push)  queue.push({ kind: 'push',  to: sub.user_id, subject, body, userId: sub.user_id });
  }
  return subscribers.length;
}

async function flush() {
  let sent = 0;
  while (queue.length) {
    const job = queue.shift();
    // заглушка отправки: вместо реальной интеграции с SMTP/WebPush — лог
    console.log(`[notify:${job.kind}] → ${job.to} · ${job.subject}`);
    await auditLog.log({ userId: job.userId, action: `notify.${job.kind}`, meta: { subject: job.subject } });
    sent++;
  }
  return sent;
}

function queueSize() { return queue.length; }

module.exports = { enqueueForTarget, flush, queueSize };
