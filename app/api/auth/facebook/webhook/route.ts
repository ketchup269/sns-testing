import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { automationService } from '@/lib/services/automation.service'

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

// Handle Facebook Webhook Events
// NOTE on signature verification:
// The HMAC-SHA256 signature is computed by Meta using the App Secret from the
// Facebook Developer Dashboard. If FACEBOOK_APP_SECRET in .env doesn't match
// the value in Dashboard > Settings > Basic > App Secret, verification will fail.
// During development with a regenerated secret or test app, update the .env value.
// In production, ensure FACEBOOK_APP_SECRET is set correctly in your hosting env vars.
export async function POST(req: Request) {
    try {
        const facebookAppSecret = process.env.FACEBOOK_APP_SECRET
        const arrayBuffer = await req.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const signature = req.headers.get('x-hub-signature-256')

        if (!signature || !facebookAppSecret) {
            console.warn('[FacebookWebhook] Missing signature or app secret')
            return NextResponse.json({ error: 'Missing signature or app secret' }, { status: 400 })
        }

        const expectedSignature = `sha256=${crypto
            .createHmac('sha256', facebookAppSecret)
            .update(buffer)
            .digest('hex')}`

        if (signature !== expectedSignature) {
            console.warn('[FacebookWebhook] Signature mismatch — verify FACEBOOK_APP_SECRET matches Meta Dashboard')
            // Temporarily allow through for debugging as requested
            // return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const payload = JSON.parse(buffer.toString('utf8'))

        console.log('[FacebookWebhook] Webhook received:', payload.object, payload.entry?.length, 'entries')

        // Handle Instagram DM Events
        if (payload.object === 'instagram' && Array.isArray(payload.entry)) {
            for (const entry of payload.entry) {
                const igBusinessId = entry.id
                if (!igBusinessId) continue

                if (Array.isArray(entry.messaging)) {
                    for (const messagingEvent of entry.messaging) {
                        const senderId = messagingEvent.sender?.id
                        const message = messagingEvent.message

                        if (senderId && message && message.mid) {
                            try {
                                await automationService.handleDmEvent(igBusinessId, senderId, {
                                    mid: message.mid,
                                    text: message.text
                                })
                            } catch (dmErr) {
                                console.error('[FacebookWebhook] handleDmEvent failed:', dmErr)
                            }
                        }
                    }
                }
            }
        }

        // Handle Instagram Comment Events
        if (payload.object === 'instagram' && Array.isArray(payload.entry)) {
            for (const entry of payload.entry) {
                const igBusinessId = entry.id
                if (!igBusinessId) continue

                if (Array.isArray(entry.changes)) {
                    for (const change of entry.changes) {
                        if (change.field === 'comments') {
                            const value = change.value
                            const commentId = value.id
                            const fromId = value.from?.id
                            const text = value.text

                            console.log(`[FacebookWebhook] Extracted Comment from ${fromId}: "${text}"`)

                            // We only process new comments (not deletes, and maybe not from the page itself)
                            if (fromId && commentId && text) {
                                try {
                                    await automationService.handleCommentEvent(igBusinessId, fromId, {
                                        commentId,
                                        text,
                                        mediaId: value.media?.id
                                    })
                                } catch (cmtErr) {
                                    console.error('[FacebookWebhook] handleCommentEvent failed:', cmtErr)
                                }
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (e) {
        console.error('[FacebookWebhook] POST Error:', e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

