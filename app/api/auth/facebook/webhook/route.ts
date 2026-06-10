import { NextResponse } from 'next/server'
import crypto from 'crypto'

const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ''

// Handle Facebook Webhook Verification
export async function GET(req: Request) {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Webhook verification token setup in Facebook App Dashboard -> Webhooks
    const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'insta_auto_webhook_verify'

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('[FacebookWebhook] Verification successful')
        return new NextResponse(challenge, { status: 200 })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Handle Facebook Webhook Events (Deauthorization, Data Deletion, Token Revocation, etc.)
export async function POST(req: Request) {
    try {
        const arrayBuffer = await req.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const signature = req.headers.get('x-hub-signature-256')

        if (!signature || !FACEBOOK_APP_SECRET) {
            console.warn('[FacebookWebhook] Missing signature or app secret')
            return NextResponse.json({ error: 'Missing signature or app secret' }, { status: 400 })
        }

        const expectedSignature = `sha256=${crypto
            .createHmac('sha256', FACEBOOK_APP_SECRET)
            .update(buffer)
            .digest('hex')}`

        if (signature !== expectedSignature) {
            console.error('[FacebookWebhook] Invalid Signature Warning (Bypassed for testing).', { 
                expected: expectedSignature, 
                received: signature,
                secretLength: FACEBOOK_APP_SECRET.length
            })
            // TEMPORARY BYPASS: Do not return 400 here so we can see what Meta is actually sending!
            // return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const payload = JSON.parse(buffer.toString('utf8'))

        console.log('[FacebookWebhook] Valid Webhook received:', JSON.stringify(payload, null, 2))

        // Example payload for deauthorization might include user IDs.
        // You would typically lookup the user in the DB and remove/invalidate their ConnectedAccounts.
        // e.g. for user data deletion callback:
        // if (payload.user_id) { await prisma.connectedAccount.deleteMany({ where: { facebookUserId: payload.user_id } }) }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (e) {
        console.error('[FacebookWebhook] POST Error:', e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
