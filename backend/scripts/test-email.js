'use strict'

// Скрипт: создаёт тестовый аккаунт Ethereal и отправляет одно письмо,
// выводит preview URL (работает без внешней почты).

async function main() {
	const nodemailer = require('nodemailer')
	console.log('[test-email] creating test account...')
	const testAccount = await nodemailer.createTestAccount()
	console.log(`[test-email] account: ${testAccount.user} / ${testAccount.pass}`)

	const transporter = nodemailer.createTransport({
		host: testAccount.smtp.host,
		port: testAccount.smtp.port,
		secure: testAccount.smtp.secure,
		auth: { user: testAccount.user, pass: testAccount.pass },
	})

	const from = process.env.SMTP_FROM || `"TV Schedule" <${testAccount.user}>`
	const to = testAccount.user // send to the ethereal inbox itself
	const subject = 'Тестовое письмо от tv-schedule'
	const html = `<p>Это тестовое письмо, сгенерированное скриптом <b>test-email.js</b>.</p>
    <p>Время: ${new Date().toISOString()}</p>`

	console.log(`[test-email] sending to ${to}...`)
	const info = await transporter.sendMail({ from, to, subject, html, text: html.replace(/<[^>]+>/g, '') })
	console.log('[test-email] send result:', info.messageId)
	const preview = nodemailer.getTestMessageUrl(info)
	if (preview) console.log('[test-email] preview URL:', preview)
	else console.log('[test-email] preview URL not available')
}

main().catch((err) => {
	console.error('[test-email] error:', err && err.stack ? err.stack : err)
	process.exit(1)
})
