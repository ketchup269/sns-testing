import { NextRequest, NextResponse } from 'next/server'
import { AccountService } from '@/lib/services/account.service'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    if (error) {
        console.error('Facebook Auth Error:', error)
        return NextResponse.redirect(new URL('/account?error=auth_denied', appUrl))
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/account?error=invalid_callback', appUrl))
    }

    try {
        // 1. Decode state to verify user
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString('ascii'))
        const userId = stateData.userId

        if (!userId) {
            throw new Error('Invalid state identifier')
        }

        const redirectUri = `${appUrl}/api/auth/facebook/callback`

        // 2. Delegate to Service Layer
        await AccountService.processFacebookCallback(userId, code, redirectUri)

        return NextResponse.redirect(new URL('/account?success=true', appUrl))

    } catch (error: any) {
        console.error('Callback processing error:', error)

        const errorMessage = error.message
        if (['no_pages_found', 'no_ig_business_found'].includes(errorMessage)) {
            return NextResponse.redirect(new URL(`/account?error=${errorMessage}`, appUrl))
        }

        return NextResponse.redirect(new URL('/account?error=processing_failed', appUrl))
    }
}