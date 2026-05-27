'use strict'

const slotModel = require('../models/BroadcastSlot')
const notificationService = require('./notification.service')
const { query } = require('../config/database')
const auditLog = require('../models/AuditLog')

// Offsets in minutes before start to notify
const OFFSETS = [60, 30, 15, 5, 0]
const INTERVAL_MS = 5 * 60 * 1000 // every 5 minutes
const TOLERANCE_MS = 150000 // 2.5 minutes tolerance

async function alreadySent(slotId, offset) {
	const q = `SELECT 1 FROM audit_logs WHERE action = 'notify.reminder' AND (meta->>'slot_id') = $1 AND (meta->>'offset') = $2 LIMIT 1`
	const { rows } = await query(q, [String(slotId), String(offset)])
	return rows.length > 0
}

function formatOffsetText(offset) {
	if (offset === 0) return 'сейчас'
	if (offset >= 60) return `${Math.floor(offset / 60)} час${Math.floor(offset / 60) === 1 ? '' : 'а'}`
	return `${offset} минут`
}

async function runOnce() {
	try {
		const now = new Date()
		const from = new Date(now.getTime() - TOLERANCE_MS)
		const to = new Date(now.getTime() + 60 * 60 * 1000 + TOLERANCE_MS)
		const slots = await slotModel.listInRange(from, to, { onlyPublished: true })
		if (!slots || !slots.length) return

		let totalEnqueued = 0
		for (const s of slots) {
			const startsAt = new Date(s.starts_at)
			const diffMs = startsAt.getTime() - now.getTime()
			for (const offset of OFFSETS) {
				const targetMs = offset * 60 * 1000
				if (Math.abs(diffMs - targetMs) <= TOLERANCE_MS) {
					const sent = await alreadySent(s.id, offset)
					if (sent) {
						// already sent this reminder
						continue
					}

					const offsetText = formatOffsetText(offset)
					const subject = offset === 0
						? `Начинается: ${s.program_title} на ${s.channel_name}`
						: `Напоминание: ${s.program_title} начнётся через ${offsetText}`
					const startsStr = (new Date(s.starts_at)).toLocaleString('ru-RU')
					const body = `<p>На канале <b>${s.channel_name}</b> передача <b>${s.program_title}</b> начнётся ${offset === 0 ? 'сейчас' : 'через ' + offsetText} (в ${startsStr}).</p>`

					// enqueue both program and channel subscribers
					await notificationService.enqueueForTarget({ type: 'program', targetId: s.program_id, subject, body })
					await notificationService.enqueueForTarget({ type: 'channel', targetId: s.channel_id, subject, body })
					totalEnqueued++

					// mark as attempted in audit logs so we won't re-send
					await auditLog.log({ userId: null, action: 'notify.reminder', entity: 'broadcast_slot', entityId: s.id, meta: { slot_id: s.id, offset } })
				}
			}
		}

		if (totalEnqueued > 0) {
			console.log(`[reminder] enqueued ${totalEnqueued} reminder jobs, flushing notifications`)
			await notificationService.flush()
		}
	} catch (err) {
		console.error('[reminder] scheduler error:', err && err.stack ? err.stack : err)
	}
}

let timer = null
function start() {
	if (timer) return
	// run immediately
	runOnce().catch((e) => console.error('[reminder] initial run failed', e))
	timer = setInterval(() => runOnce().catch((e) => console.error('[reminder] scheduled run failed', e)), INTERVAL_MS)
	console.log('[reminder] started, interval ms=', INTERVAL_MS)
}

function stop() {
	if (!timer) return
	clearInterval(timer)
	timer = null
	console.log('[reminder] stopped')
}

module.exports = { start, stop, runOnce }
