import { NextResponse } from 'next/server'
import { automationService } from '@/lib/services/automation.service'

// This endpoint is called by a cron job (e.g. Vercel Cron) to process
// pending automation events (DM replies) that are past their scheduled time.
// Set CRON_SECRET in your environment variables and pass it as ?secret=...
export async function GET(req: Request) {
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || secret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('[CronProcess] Starting processDueEvents...')
        const result = await automationService.processDueEvents()
        console.log('[CronProcess] Done:', result)

        return NextResponse.json({
            success: true,
            processed: result.dmReplies,
            failed: result.failed
        })
    } catch (e) {
        console.error('[CronProcess] Error:', e)
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
}
