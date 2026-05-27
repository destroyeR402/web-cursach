'use strict'

const subModel = require('../models/Subscription')

async function main() {
	const id = parseInt(process.argv[2] || '5', 10)
	console.log('Checking subscribers for channel id=', id)
	try {
		const subs = await subModel.findSubscribers('channel', id)
		console.log('Found', subs.length, 'rows')
		for (const s of subs) {
			console.log('-', s.user_id, s.email, 'notify_email=', s.notify_email, 'notify_push=', s.notify_push, 'is_active=', s.is_active)
		}
	} catch (err) {
		console.error('Error querying subscribers:', err && err.stack ? err.stack : err)
		process.exit(1)
	}
}

main()
