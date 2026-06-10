import axios from 'axios'
import { IG_GRAPH_BASE } from '@/lib/constants'

export class FacebookApiError extends Error {
    constructor(
        public message: string,
        public code?: number,
        public subcode?: number,
        public fbType?: string,
        public userMessage?: string
    ) {
        super(message)
        this.name = 'FacebookApiError'
    }
}

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET

const graphApi = axios.create({
    baseURL: IG_GRAPH_BASE,
})

export interface AccessTokenResponse {
    access_token: string
    token_type: string
    expires_in: number
}

export interface FacebookProfile {
    id: string
    name: string
}

export interface FacebookPage {
    id: string
    name: string
    access_token: string
}

export interface InstagramBusinessAccount {
    id: string
    username?: string
    profile_picture_url?: string
}

export const facebookService = {
    /**
     * Generate the Facebook OAuth Login URL
     */
    generateAuthUrl(state: string, redirectUri: string): string {
        const params = new URLSearchParams({
            client_id: FACEBOOK_APP_ID,
            redirect_uri: redirectUri,
            state: state,
            scope: 'pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management',
            response_type: 'code',
        })
        return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
    },
    /**
     * Exchange the short-lived authorization code for a short-lived access token
     */
    async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
        try {
            const response = await axios.get<AccessTokenResponse>(`${IG_GRAPH_BASE}/oauth/access_token`, {
                params: {
                    client_id: FACEBOOK_APP_ID,
                    client_secret: FACEBOOK_APP_SECRET,
                    redirect_uri: redirectUri,
                    code,
                }
            })
            return response.data.access_token
        } catch (error: unknown) {
            console.error('[FacebookService] Failed to exchange code for token:', error.response?.data || error.message)
            const fbError = error.response?.data?.error
            throw new FacebookApiError(
                fbError?.message || 'Token exchange failure',
                fbError?.code,
                fbError?.error_subcode,
                fbError?.type,
                fbError?.error_user_msg
            )
        }
    },

    /**
     * Exchange a short-lived user token for a long-lived user token (valid ~60 days)
     * Production token refresh strategy:
     * This long-lived token should be saved and can be refreshed natively by keeping the session active,
     * or a background worker can prompt the user for re-authentication if it expires.
     */
    async exchangeForLongLivedToken(shortLivedToken: string): Promise<AccessTokenResponse> {
        try {
            const response = await axios.get<AccessTokenResponse>(`${IG_GRAPH_BASE}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: FACEBOOK_APP_ID,
                    client_secret: FACEBOOK_APP_SECRET,
                    fb_exchange_token: shortLivedToken,
                }
            })
            return response.data
        } catch (error: unknown) {
            console.error('[FacebookService] Failed to exchange for long-lived token:', error.response?.data || error.message)
            const fbError = error.response?.data?.error
            throw new FacebookApiError(
                fbError?.message || 'Long-lived token exchange failure',
                fbError?.code,
                fbError?.error_subcode,
                fbError?.type,
                fbError?.error_user_msg
            )
        }
    },

    /**
     * Fetch the user's base Meta profile (ID and Name)
     */
    async getUserProfile(accessToken: string): Promise<FacebookProfile> {
        try {
            const response = await graphApi.get<FacebookProfile>('/me', {
                params: {
                    access_token: accessToken,
                }
            })
            return response.data
        } catch (error: unknown) {
            console.error('[FacebookService] Failed to fetch user profile:', error.response?.data || error.message)
            const fbError = error.response?.data?.error
            throw new FacebookApiError(
                fbError?.message || 'Failed to fetch user profile',
                fbError?.code,
                fbError?.error_subcode,
                fbError?.type,
                fbError?.error_user_msg
            )
        }
    },

    /**
     * Fetch all pages the user manages
     */
    async getUserPages(accessToken: string): Promise<FacebookPage[]> {
        try {
            const response = await graphApi.get('/me/accounts', {
                params: {
                    access_token: accessToken,
                }
            })
            return response.data.data as FacebookPage[]
        } catch (error: unknown) {
            console.error('[FacebookService] Failed to fetch user pages:', error.response?.data || error.message)
            const fbError = error.response?.data?.error
            throw new FacebookApiError(
                fbError?.message || 'Failed to fetch user pages',
                fbError?.code,
                fbError?.error_subcode,
                fbError?.type,
                fbError?.error_user_msg
            )
        }
    },

    /**
     * Fetch the Instagram Business Account ID associated with a given Page
     */
    async getInstagramBusinessAccount(pageId: string, pageAccessToken: string): Promise<InstagramBusinessAccount | null> {
        try {
            const response = await graphApi.get(`/${pageId}`, {
                params: {
                    fields: 'instagram_business_account{id,username,profile_picture_url}',
                    access_token: pageAccessToken,
                }
            })

            if (response.data.instagram_business_account) {
                return response.data.instagram_business_account
            }
            return null
        } catch (error: unknown) {
            console.error(`[FacebookService] Failed to check IG Business Account for page ${pageId}:`, error.response?.data || error.message)
            const fbError = error.response?.data?.error
            if (fbError && (fbError.code === 10 || fbError.code === 190)) {
                // Return null if lacking permissions (e.g. app not approved for IG basic, or just permission denied)
                return null
            }
            // For rate limits, we should probably throw it so the top level catches it
            if (fbError && (fbError.code === 4 || fbError.code === 17 || fbError.code === 32 || fbError.code === 613)) {
                throw new FacebookApiError(
                    fbError.message || 'Rate limit exceeded',
                    fbError.code,
                    fbError.error_subcode,
                    fbError.type,
                    fbError.error_user_msg
                )
            }
            // If permission denied or missing, return null rather than crashing the whole flow
            return null
        }
    },

    /**
     * Fetch insights for a published IG Media.
     */
    async getMediaInsights(mediaId: string, accessToken: string): Promise<{ views: number, reach: number, saves: number, likes: number } | null> {
        try {
            // 1. Fetch basic media fields (likes)
            const basicRes = await graphApi.get(`/${mediaId}`, {
                params: {
                    fields: 'like_count',
                    access_token: accessToken,
                }
            })
            const likes = basicRes.data.like_count || 0

            // 2. Fetch insights (Graph API v22.0 replaces plays/impressions with unified 'views')
            const response = await graphApi.get(`/${mediaId}/insights`, {
                params: {
                    metric: 'reach,saved,views',
                    access_token: accessToken,
                }
            })

            const data = response.data.data
            if (!data || !Array.isArray(data)) return null

            let views = 0
            let reach = 0
            let saves = 0

            for (const metric of data) {
                const value = typeof metric.value === 'number' ? metric.value : (metric.values?.[0]?.value || 0)
                if (metric.name === 'views') views = value
                if (metric.name === 'reach') reach = value
                if (metric.name === 'saved') saves = value
            }

            return { views, reach, saves, likes }
        } catch (error: unknown) {
            const fbError = error.response?.data?.error
            if (fbError?.code === 100 && fbError?.error_subcode === 33) {
                // Media likely deleted on Instagram or unsupported media type (e.g., expired story)
                // Suppressing full error stack to avoid terminal noise
                console.warn(`[FacebookService] Media ${mediaId} not found or unsupported (likely deleted on IG).`)
            } else {
                console.error(`[FacebookService] Failed to fetch insights for media ${mediaId}:`, error.response?.data || error.message)
            }
            return null
        }
    },

    /**
     * Fetch account-level insights for an Instagram Business Account (last 30 days).
     * NOTE: `impressions` and `likes` are deprecated. Using `reach` and `profile_views` instead.
     */
    async getAccountInsights(igBusinessId: string, accessToken: string): Promise<{ totalImpressions: number, totalLikes: number } | null> {
        try {
            const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
            const until = Math.floor(Date.now() / 1000)

            // `reach` is a time-series metric — fetched with period=day
            const reachResponse = await graphApi.get(`/${igBusinessId}/insights`, {
                params: {
                    metric: 'reach',
                    period: 'day',
                    since,
                    until,
                    access_token: accessToken,
                }
            })

            // `profile_views` requires metric_type=total_value (cannot be mixed with time-series metrics)
            const profileViewsResponse = await graphApi.get(`/${igBusinessId}/insights`, {
                params: {
                    metric: 'profile_views',
                    metric_type: 'total_value',
                    period: 'day',
                    since,
                    until,
                    access_token: accessToken,
                }
            })

            let totalImpressions = 0
            let totalLikes = 0

            const reachData: { name: string; values: { value: number }[] }[] = reachResponse.data.data
            if (Array.isArray(reachData)) {
                for (const metric of reachData) {
                    const sum = metric.values.reduce((acc, v) => acc + (v.value || 0), 0)
                    if (metric.name === 'reach') totalImpressions = sum
                }
            }

            // total_value response shape: { data: [{ name, period, title, id, total_value: { value } }] }
            const pvData: { name: string; total_value?: { value: number }; values?: { value: number }[] }[] = profileViewsResponse.data.data
            if (Array.isArray(pvData)) {
                for (const metric of pvData) {
                    if (metric.name === 'profile_views') {
                        totalLikes = metric.total_value?.value
                            ?? metric.values?.reduce((acc, v) => acc + (v.value || 0), 0)
                            ?? 0
                    }
                }
            }

            return { totalImpressions, totalLikes }
        } catch (error: unknown) {
            console.error(`[FacebookService] Failed to fetch account insights for ${igBusinessId}:`, error.response?.data || error.message)
            return null
        }
    },

    /**
     * Fetch followers count for an Instagram Business Account
     */
    async getInstagramFollowersCount(igBusinessId: string, accessToken: string): Promise<number | null> {
        try {
            const response = await graphApi.get(`/${igBusinessId}`, {
                params: {
                    fields: 'followers_count',
                    access_token: accessToken,
                }
            })
            return response.data.followers_count || 0
        } catch (error: unknown) {
            console.error(`[FacebookService] Failed to fetch followers for ${igBusinessId}:`, error.response?.data || error.message)
            return null
        }
    }
}
