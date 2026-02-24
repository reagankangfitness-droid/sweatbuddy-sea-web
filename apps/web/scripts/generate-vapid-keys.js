#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push notifications.
 *
 * Usage:
 *   node scripts/generate-vapid-keys.js
 *
 * Copy the output into your .env / .env.local file.
 */

const webpush = require('web-push')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('# Web Push VAPID Keys')
console.log('# Add these to your .env.local file:\n')
console.log(`VAPID_SUBJECT=mailto:noreply@sweatbuddies.co`)
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
