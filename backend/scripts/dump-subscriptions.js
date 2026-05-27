'use strict'

const { query } = require('../config/database')

async function main() {
	try {
		const { rows } = await query('SELECT s.*, u.email, u.username FROM subscriptions s LEFT JOIN users u ON u.id = s.user_id ORDER BY s.id DESC LIMIT 200')
		console.log('subscriptions count:', rows.length)
		for (const r of rows) console.log(r.id, r.user_id, r.email, r.target_type, r.target_id, 'notify_email=', r.notify_email, 'notify_push=', r.notify_push)
	} catch (err) {
		console.error('error:', err && err.stack ? err.stack : err)
		process.exit(1)
	}
}

main()
