'use client'

import Link from 'next/link'
import {
    Eye, Heart, PlayCircle, CheckCircle2, Users,
    ArrowUpRight, MoreHorizontal, Calendar
} from 'lucide-react'

/** Safely extract the first image URL from a plain URL or a serialized JSON array */
function firstImageUrl(imageUrl: string): string {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('[')) {
        try { return JSON.parse(imageUrl)[0] ?? '' } catch { return '' }
    }
    return imageUrl
}

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
    
    const kpis: KPI[] = [
        { label: 'リーチ（過去30日）', value: hasInsights ? formatNum(totalImpressions) : '--', sub: hasInsights ? 'リーチしたユニークアカウント数' : 'アカウントを連携してください', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50', trend: hasInsights ? '↑ ライブ' : null, isPositive: true },
        { label: 'プロフィール閲覧（過去30日）', value: hasInsights ? formatNum(totalLikes) : '--', sub: hasInsights ? 'Instagram APIより取得' : 'データなし', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', trend: hasInsights ? '↑ ライブ' : null, isPositive: true },
        { label: '公開済み投稿数', value: publishedCount.toString(), sub: '累計・自動投稿', icon: PlayCircle, color: 'text-purple-600', bg: 'bg-purple-50', trend: publishedCount > 0 ? `+${publishedCount}` : null, isPositive: true },
        { label: 'フォロワー数', value: hasInsights ? formatNum(followersCount) : '--', sub: connectedAccountUsername ? `@${connectedAccountUsername}` : 'アカウントなし', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', trend: hasInsights ? '↑ ライブ' : null, isPositive: true },
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
    
    const activities: Activity[] = [
        { id: 1, user: 'システム', detail: hasInsights ? `@${connectedAccountUsername} のインサイトを同期しました` : '連携アカウントを待機中...', time: 'ライブ', icon: CheckCircle2, iconColor: 'text-green-600' },
        { id: 2, user: 'キュー', detail: `${publishedCount} 件の投稿を公開済み`, time: '累計', icon: PlayCircle, iconColor: 'text-purple-600' },
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
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">ダッシュボード概要</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-text">過去7日間</span>
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
                        <h2 className="text-lg font-bold text-foreground">パフォーマンス推移</h2>
                        <p className="text-sm text-muted-text mt-1">過去12日間の公開済み投稿のビュー数</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-muted-text uppercase tracking-wider">ビュー</span>
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
                                                {day.views.toLocaleString()} views
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
                        <h2 className="text-lg font-bold text-foreground">近日公開予定</h2>
                        <p className="text-sm text-muted-text mt-1">次回予約済み投稿</p>
                    </div>
                    <div className="divide-y divide-card-border">
                        {upcomingSchedules.length === 0 ? (
                            <div className="p-8 text-center">
                                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-muted-text/80">予約投稿なし</p>
                                <Link href="/create" className="mt-3 inline-block text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                    投稿を予約する →
                                </Link>
                            </div>
                        ) : upcomingSchedules.map((s) => (
                            <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface shrink-0">
                                    <img src={firstImageUrl(s.post.imageUrl)} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{s.post.caption || 'キャプションなし'}</p>
                                    <p className="text-xs text-muted-text mt-0.5 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(s.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">予約済み</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            {/* Activity Feed */}
            <div className="bg-card rounded-2xl border border-card-border shadow-sm">
                <div className="p-6 border-b border-card-border">
                    <h2 className="text-lg font-bold text-foreground">アクティビティ</h2>
                    <p className="text-sm text-muted-text mt-1">最近のシステムアクティビティ</p>
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
