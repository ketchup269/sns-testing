'use client'

import Link from 'next/link'
import {
    Eye, Heart, PlayCircle, CheckCircle2, Users,
    ArrowUpRight, MoreHorizontal, Calendar
} from 'lucide-react'
import { firstImageUrl } from '@/lib/utils'



// ─── Types ───────────────────────────────────────────────────────────────────

interface KPI {
    label: string
    value: string
    sub: string
    icon: React.ElementType
    color: string
    bg: string
    trend: string | null
    isPositive: boolean
}

interface Activity {
    id: number
    user: string
    detail: string
    time: string
    icon: React.ElementType
    iconColor: string
}

interface UpcomingSchedule {
    id: string
    scheduledFor: Date
    status: string
    post: {
        imageUrl: string
        caption: string | null
    }
}

interface ChartDay {
    label: string
    views: number
    engagement: number
}

interface InsightsData {
    totalImpressions: number
    totalLikes: number
    followersCount: number
    hasInsights: boolean
}

interface DashboardClientProps {
    userName: string | null | undefined
    upcomingSchedules: UpcomingSchedule[]
    chartData: ChartDay[]
    maxViews: number
    useRealData: boolean
    insightsPromise: Promise<InsightsData>
    publishedCount: number
    accountsCount: number
    connectedAccountUsername: string | null
}

function formatNum(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return n.toString()
}

// ─── Component ───────────────────────────────────────────────────────────────

import { use, Suspense } from 'react'
import { useTranslations } from 'next-intl'

function KPIGrid({
    insightsPromise,
    publishedCount,
    connectedAccountUsername
}: {
    insightsPromise: Promise<InsightsData>
    publishedCount: number
    connectedAccountUsername: string | null
}) {
    const { totalImpressions, totalLikes, followersCount, hasInsights } = use(insightsPromise)
    const t = useTranslations('Dashboard')
    
    const kpis: KPI[] = [
        { label: t('reach'), value: hasInsights ? formatNum(totalImpressions) : '--', sub: hasInsights ? t('reachSub') : t('noAccount'), icon: Eye, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', trend: hasInsights ? t('live') : null, isPositive: true },
        { label: t('profileViews'), value: hasInsights ? formatNum(totalLikes) : '--', sub: hasInsights ? t('profileViewsSub') : t('noData'), icon: Heart, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-500/10', trend: hasInsights ? t('live') : null, isPositive: true },
        { label: t('publishedCount'), value: publishedCount.toString(), sub: t('publishedSub'), icon: PlayCircle, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', trend: publishedCount > 0 ? `+${publishedCount}` : null, isPositive: true },
        { label: t('followers'), value: hasInsights ? formatNum(followersCount) : '--', sub: connectedAccountUsername ? `@${connectedAccountUsername}` : t('noAccountSub'), icon: Users, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', trend: hasInsights ? t('live') : null, isPositive: true },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {kpis.map((kpi) => (
                <div key={kpi.label} className="bg-card p-6 rounded-2xl border border-card-border shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out group overflow-hidden relative cursor-default">
                    <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.bg} rounded-full -mr-8 -mt-8 opacity-40 group-hover:scale-125 transition-transform duration-700 ease-out`} />
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center shadow-inner`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            </div>
                            {kpi.trend && (
                                <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100/50">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    {kpi.trend}
                                </div>
                            )}
                        </div>
                        <p className="text-sm font-medium text-muted-text">{kpi.label}</p>
                        <p className="text-3xl font-black text-foreground mt-1 tracking-tight">{kpi.value}</p>
                        <p className="text-xs text-muted-text/80 mt-1.5">{kpi.sub}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

function KPIGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-card p-6 rounded-2xl border border-card-border shadow-sm animate-pulse">
                    <div className="w-10 h-10 bg-surface rounded-xl mb-4" />
                    <div className="h-4 bg-surface rounded w-1/2 mb-2" />
                    <div className="h-8 bg-surface rounded w-3/4 mb-2" />
                    <div className="h-3 bg-surface rounded w-1/3" />
                </div>
            ))}
        </div>
    )
}

function Activities({
    insightsPromise,
    publishedCount,
    connectedAccountUsername
}: {
    insightsPromise: Promise<InsightsData>
    publishedCount: number
    connectedAccountUsername: string | null
}) {
    const { hasInsights } = use(insightsPromise)
    const t = useTranslations('Dashboard')
    
    const activities: Activity[] = [
        { id: 1, user: t('system'), detail: hasInsights ? t('sysInsights', { username: connectedAccountUsername || 'instagram' }) : t('sysWaiting'), time: t('live'), icon: CheckCircle2, iconColor: 'text-green-600 dark:text-green-400' },
        { id: 2, user: t('queue'), detail: t('sysPublished', { count: publishedCount }), time: t('sysCumulative'), icon: PlayCircle, iconColor: 'text-purple-600 dark:text-purple-400' },
    ]

    return (
        <div className="divide-y divide-card-border animate-in fade-in duration-500">
            {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full bg-surface border border-card-border flex items-center justify-center shrink-0 mt-0.5`}>
                        <activity.icon className={`w-4 h-4 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground/80">{activity.detail}</p>
                        <p className="text-xs text-muted-text/80 mt-0.5 font-medium">{activity.time}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ActivitiesSkeleton() {
    return (
        <div className="divide-y divide-card-border">
            {[1, 2].map(i => (
                <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-surface shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="h-4 bg-surface rounded w-3/4 mb-2" />
                        <div className="h-3 bg-surface rounded w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function DashboardClient({
    userName,
    upcomingSchedules,
    chartData,
    maxViews,
    useRealData,
    insightsPromise,
    publishedCount,
    accountsCount,
    connectedAccountUsername
}: DashboardClientProps) {
    const t = useTranslations('Dashboard')

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-text">{t('last12Days')}</span>
                    <button className="p-2 bg-card hover:bg-surface/80 dark:hover:bg-surface/50 rounded-lg border border-card-border shadow-sm transition-all duration-200 ease-out active:scale-95 group">
                        <MoreHorizontal className="w-4 h-4 text-muted-text group-hover:text-gray-800" />
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <Suspense fallback={<KPIGridSkeleton />}>
                <KPIGrid 
                    insightsPromise={insightsPromise}
                    publishedCount={publishedCount}
                    connectedAccountUsername={connectedAccountUsername}
                />
            </Suspense>

            {/* Performance Chart */}
            <div className="bg-card p-8 rounded-2xl border border-card-border shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">{t('performanceTitle')}</h2>
                        <p className="text-sm text-muted-text mt-1">{t('performanceSub')}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-muted-text uppercase tracking-wider">{t('views')}</span>
                        </div>
                    </div>
                </div>
                <div className="h-[200px] w-full relative">
                    <div className="absolute inset-0 flex items-end justify-between gap-1 pb-1">
                        {chartData.map((day, i) => {
                            const heightPct = maxViews > 0 ? Math.max(2, (day.views / maxViews) * 100) : 2
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                    <div className="w-full relative flex items-end justify-center h-full">
                                        <div
                                            style={{ height: `${heightPct}%` }}
                                            className={`absolute bottom-0 w-full ${useRealData && day.views > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-surface'} rounded-t-sm transition-all duration-300`}
                                        />
                                        {day.views > 0 && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl z-20 whitespace-nowrap">
                                                {day.views.toLocaleString()} {t('views')}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="flex justify-between mt-4 px-0">
                    {chartData.map((day, i) => (
                        <span key={i} className="text-[10px] font-bold text-muted-text/80 uppercase flex-1 text-center">{day.label}</span>
                    ))}
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Upcoming Posts */}
                <div className="bg-card rounded-2xl border border-card-border shadow-sm">
                    <div className="p-6 border-b border-card-border">
                        <h2 className="text-lg font-bold text-foreground">{t('upcomingTitle')}</h2>
                        <p className="text-sm text-muted-text mt-1">{t('upcomingSub')}</p>
                    </div>
                    <div className="divide-y divide-card-border">
                        {upcomingSchedules.length === 0 ? (
                            <div className="p-8 text-center">
                                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-muted-text/80">{t('noUpcoming')}</p>
                                <Link href="/create" className="mt-3 inline-block text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                    {t('schedulePost')}
                                </Link>
                            </div>
                        ) : upcomingSchedules.map((s) => (
                            <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface shrink-0">
                                    <img src={firstImageUrl(s.post.imageUrl)} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{s.post.caption || t('noCaption')}</p>
                                    <p className="text-xs text-muted-text mt-0.5 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(s.scheduledFor).toLocaleDateString(t('views') === 'Views' ? 'en-US' : 'ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">{t('scheduled')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-card rounded-2xl border border-card-border shadow-sm">
                    <div className="p-6 border-b border-card-border">
                        <h2 className="text-lg font-bold text-foreground">{t('activityTitle')}</h2>
                        <p className="text-sm text-muted-text mt-1">{t('activitySub')}</p>
                    </div>
                    <Suspense fallback={<ActivitiesSkeleton />}>
                        <Activities 
                            insightsPromise={insightsPromise}
                            publishedCount={publishedCount}
                            connectedAccountUsername={connectedAccountUsername}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
