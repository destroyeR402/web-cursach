'use strict'

const { query } = require('../config/database')

async function add(userId, subscription) {
	const endpoint = subscription.endpoint
	const keys = subscription.keys || {}
	const { rows } = await query(
		`INSERT INTO push_subscriptions (user_id, endpoint, keys) VALUES ($1, $2, $3)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, keys = EXCLUDED.keys, created_at = NOW()
     RETURNING *`,
		[userId, endpoint, keys]
	)
	return rows[0]
}

async function removeByEndpoint(endpoint) {
	await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint])
}

async function removeByUserAndEndpoint(userId, endpoint) {
	await query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint])
}

async function findByUser(userId) {
	const { rows } = await query('SELECT * FROM push_subscriptions WHERE user_id = $1', [userId])
	return rows
}

async function findByUserIds(userIds) {
	if (!userIds || !userIds.length) return []
	const { rows } = await query('SELECT * FROM push_subscriptions WHERE user_id = ANY($1)', [userIds])
	return rows
}

module.exports = { add, removeByEndpoint, removeByUserAndEndpoint, findByUser, findByUserIds }
