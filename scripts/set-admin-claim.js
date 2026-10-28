/**
 * DHRUV PHARMA — Server-Side Administrator Custom Claim Provisioning Script
 *
 * This script runs in a secure, trusted server environment (Node.js) using the
 * Firebase Admin SDK with service account credentials.
 *
 * It assigns { admin: true } custom user claims to an authorized administrator account.
 * Client-side applications cannot forge or modify these claims.
 *
 * Usage:
 *   1. Download your service account key from:
 *      Firebase Console -> Project Settings -> Service accounts -> Generate new private key
 *   2. Save the JSON file in this directory as `serviceAccountKey.json`
 *   3. Run:
 *      node scripts/set-admin-claim.js <admin-email>
 *
 * Example:
 *      node scripts/set-admin-claim.js uncle@dhruvpharma.com
 */

import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const targetEmail = process.argv[2]

if (!targetEmail) {
    console.error('\n❌ Error: Please provide the target administrator email address.')
    console.log('Usage: node scripts/set-admin-claim.js <admin-email>\n')
    process.exit(1)
}

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json')

if (!fs.existsSync(serviceAccountPath)) {
    console.error(`\n❌ Error: Service account key not found at ${serviceAccountPath}`)
    console.log('\nTo set admin custom claims:')
    console.log('1. Go to Firebase Console -> Project Settings -> Service accounts')
    console.log('2. Click "Generate new private key"')
    console.log('3. Save the downloaded file as "scripts/serviceAccountKey.json"')
    console.log('4. Re-run this command: node scripts/set-admin-claim.js', targetEmail)
    console.log('\n⚠️  SECURITY WARNING: Never commit serviceAccountKey.json to git or expose it in frontend code.\n')
    process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

async function setAdminClaim(email) {
    try {
        console.log(`\n🔍 Searching for user: ${email}...`)
        const user = await admin.auth().getUserByEmail(email)

        console.log(`✓ User found with UID: ${user.uid}`)
        console.log('⚙️  Setting custom claims { admin: true }...')

        await admin.auth().setCustomUserClaims(user.uid, {
            admin: true,
            role: 'administrator',
            assignedAt: new Date().toISOString(),
        })

        console.log('\n=============================================================')
        console.log(`✅ SUCCESS: ${email} is now an authorized Administrator!`)
        console.log('=============================================================')
        console.log('The user can now log in at /admin/login to access the Admin Dashboard.')
        console.log('Note: If the user is currently signed in, they should sign out and sign in again to refresh their token.\n')
        process.exit(0)
    } catch (error) {
        console.error('\n❌ Failed to set admin claim:', error.message)
        process.exit(1)
    }
}

setAdminClaim(targetEmail)

