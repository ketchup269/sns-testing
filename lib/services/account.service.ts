import { prisma } from '@/lib/prisma'
import { facebookService } from '@/lib/services/facebook.service'

export class AccountService {
    /**
     * Disconnects an account from the current user.
     */
    static async disconnectAccount(userId: string, accountId: string) {
        try {
            await prisma.connectedAccount.delete({
                where: { id: accountId, userId }
            })
        } catch {
            throw new Error('Failed to disconnect account')
        }
    }

    /**
     * Processes the Facebook OAuth callback to exchange tokens and persist connected accounts.
     */
    static async processFacebookCallback(userId: string, code: string, redirectUri: string) {
        // 1. Exchange code for short-lived token
        const shortLivedToken = await facebookService.exchangeCodeForToken(code, redirectUri)

        // 2. Exchange for long-lived token
        const longLivedResponse = await facebookService.exchangeForLongLivedToken(shortLivedToken)
        const longLivedToken = longLivedResponse.access_token

        // Calculate exact expiry date (default 60 days if expires_in is missing)
        const expiresIn = longLivedResponse.expires_in || (60 * 24 * 60 * 60)
        const tokenExpiry = new Date(Date.now() + (expiresIn * 1000))

        // 3. Get User Profile for ID
        const fbProfile = await facebookService.getUserProfile(longLivedToken)

        // 4. Get Facebook Pages
        const pages = await facebookService.getUserPages(longLivedToken)

        if (!pages || pages.length === 0) {
            throw new Error('no_pages_found')
        }

        let connectedCount = 0

        // 5. Iterate through pages to find linked IG accounts
        for (const page of pages) {
            try {
                const igAccount = await facebookService.getInstagramBusinessAccount(page.id, page.access_token)

                if (igAccount && igAccount.id) {
                    // 6. Store in Database
                    await prisma.connectedAccount.upsert({
                        where: {
                            userId_pageId: {
                                userId: userId,
                                pageId: page.id
                            }
                        },
                        update: {
                            instagramBusinessId: igAccount.id,
                            username: igAccount.username || page.name,
                            profilePictureUrl: igAccount.profile_picture_url,
                            pageAccessToken: page.access_token, // Store the page token for IG API calls
                            longLivedUserToken: longLivedToken,
                            tokenExpiry: tokenExpiry,
                            facebookUserId: fbProfile.id,
                        },
                        create: {
                            userId: userId,
                            facebookUserId: fbProfile.id,
                            pageId: page.id,
                            instagramBusinessId: igAccount.id,
                            username: igAccount.username || page.name,
                            profilePictureUrl: igAccount.profile_picture_url,
                            pageAccessToken: page.access_token,
                            longLivedUserToken: longLivedToken,
                            tokenExpiry: tokenExpiry,
                        }
                    })
                    connectedCount++
                }
            } catch (pageError) {
                console.warn(`Failed to process page ${page.id}:`, pageError)
                // Continue to next page
            }
        }

        if (connectedCount === 0) {
            throw new Error('no_ig_business_found')
        }
        
        return true
    }
}
