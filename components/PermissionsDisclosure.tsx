'use client'

import { CheckCircle2, Shield, Database } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function PermissionsDisclosure() {
    const t = useTranslations('Account')

    const scopes = [
        { scope: 'instagram_basic', badge: t('permissionsBadgeRead'), desc: 'Read your Instagram profile', why: 'Display your username, profile picture, and account details' },
        { scope: 'instagram_content_publish', badge: t('permissionsBadgeWrite'), desc: 'Publish posts on your behalf', why: 'Post images, carousels, and Reels to Instagram via the official API' },
        { scope: 'instagram_manage_messages', badge: `${t('permissionsBadgeRead')}/${t('permissionsBadgeWrite')}`, desc: 'Read and send Instagram Direct Messages', why: 'Enable the Auto DM Reply automation feature' },
        { scope: 'pages_show_list', badge: t('permissionsBadgeRead'), desc: 'See your Facebook Pages', why: 'Identify which Facebook Page is linked to your Instagram Business account' },
        { scope: 'pages_read_engagement', badge: t('permissionsBadgeRead'), desc: 'Read Page engagement data', why: 'Fetch reach, profile views, and engagement metrics for your dashboard' },
        { scope: 'pages_manage_metadata', badge: t('permissionsBadgeWrite'), desc: 'Manage Page webhooks', why: 'Subscribe to real-time webhook events for incoming DMs and comments' },
        { scope: 'business_management', badge: t('permissionsBadgeRead'), desc: 'Access Business Manager', why: 'Confirm your account is a verified Business or Creator account' },
    ]

    const dataAccess = [
        { label: 'Instagram media insights', desc: 'views, reach, saves, like_count (read-only, for Analytics page)' },
        { label: 'Instagram profile', desc: 'followers_count, profile_views (read-only, for Dashboard KPIs)' },
        { label: 'Incoming DMs', desc: 'message text and sender ID (read, then optionally auto-reply)' },
        { label: 'Incoming comments', desc: 'comment text, comment ID, media ID (read, then optionally auto-reply)' },
        { label: 'Media publishing', desc: 'image URLs, video URLs, captions (write, only when you explicitly publish or schedule)' },
    ]

    return (
        <div className="bg-card border border-card-border rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">{t('permissionsTitle')}</h2>
                    <p className="text-sm text-muted-text mt-1">{t('permissionsSubtitle')}</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground mb-4">{t('permissionsMetaTitle')}</h3>
                    <div className="space-y-4">
                        {scopes.map((s, i) => (
                            <div key={i} className="flex gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-foreground">{s.scope}</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface border border-card-border uppercase tracking-wide text-muted-text">
                                            {s.badge}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-text mt-0.5">{s.desc}</p>
                                    <p className="text-xs text-muted-text/80 mt-0.5 italic">Why: {s.why}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-card-border pt-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">{t('permissionsDataTitle')}</h3>
                    <ul className="space-y-3">
                        {dataAccess.map((d, i) => (
                            <li key={i} className="flex gap-3">
                                <Database className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-foreground">{d.label}: </span>
                                    <span className="text-sm text-muted-text">{d.desc}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t border-card-border pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <p className="text-xs text-muted-text max-w-2xl leading-relaxed">
                        {t('permissionsFootnote')}
                    </p>
                    <a 
                        href="https://developers.facebook.com/docs/permissions" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
                    >
                        {t('permissionsLearnMore')}
                    </a>
                </div>
            </div>
        </div>
    )
}
