'use client'

import { ChartDataPoint, TopPost } from '@/lib/types'
import {
    BarChart3, TrendingUp, Clock, Users, Heart, Bookmark, Share2,
    Instagram, Calendar, Download, ChevronDown
} from 'lucide-react'

interface Stat { label: string; value: string; trend: string; icon: React.ElementType; color: string; bg: string }
interface EngagementItem { label: string; value: number; max: number; color: string; icon: React.ElementType }

interface AnalyticsClientProps {
    postsCount: number
    publishedCount: number
    pendingCount: number
    accountsCount: number
    chartData: ChartDataPoint[]
    topPosts: TopPost[]
    bottomPosts: TopPost[]
    projects: { id: string, name: string }[]
    selectedProjectId: string
}

/* @testable */
export function formatNumber(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
}

/** Safely extract the first image URL from a plain URL or a serialized JSON array */
/* @testable */
export function firstImageUrl(imageUrl: string): string {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('[')) {
        try { return JSON.parse(imageUrl)[0] ?? '' } catch { return '' }
    }
    return imageUrl
}

export default function AnalyticsClient({ postsCount, publishedCount, pendingCount, accountsCount, chartData, topPosts, bottomPosts, projects, selectedProjectId }: AnalyticsClientProps) {
    const stats: Stat[] = [
        { label: '総投稿数', value: formatNumber(postsCount), trend: postsCount > 0 ? '+' + postsCount : '0', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: '公開済み', value: formatNumber(publishedCount), trend: publishedCount > 0 ? '+' + publishedCount : '0', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: '予約済み', value: formatNumber(pendingCount), trend: pendingCount > 0 ? '+' + pendingCount : '0', icon: Clock, color: 'text-pink-600', bg: 'bg-pink-50' },
        { label: '連携アカウント', value: formatNumber(accountsCount), trend: accountsCount > 0 ? '+' + accountsCount : '0', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    ]

    const engagementData: EngagementItem[] = [
        { label: '作成済み投稿', value: postsCount, max: Math.max(postsCount, 1), color: 'bg-pink-500', icon: Heart },
        { label: '公開済み', value: publishedCount, max: Math.max(postsCount, 1), color: 'bg-orange-500', icon: Bookmark },
        { label: '予約済み', value: pendingCount, max: Math.max(postsCount, 1), color: 'bg-blue-500', icon: Share2 },
    ]
    
    // Compute summary of analysis
    const totalLikes = topPosts.concat(bottomPosts).reduce((acc, p) => acc + p.likes, 0)
    const totalComments = topPosts.concat(bottomPosts).reduce((acc, p) => acc + p.comments, 0)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">アナリティクス</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select 
                            className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2 bg-card border border-card-border rounded-xl shadow-sm text-sm font-semibold text-foreground/80 cursor-pointer hover:bg-surface/80 dark:hover:bg-surface/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={selectedProjectId}
                            onChange={(e) => {
                                const url = new URL(window.location.href);
                                if (e.target.value) {
                                    url.searchParams.set('projectId', e.target.value);
                                } else {
                                    url.searchParams.delete('projectId');
                                }
                                window.location.href = url.toString();
                            }}
                        >
                            <option value="">すべてのプロジェクト</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-text/80 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-card p-6 rounded-2xl border border-card-border shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend.startsWith('+') && stat.trend !== '+0' ? 'text-green-600' : 'text-muted-text/80'}`}>
                                <TrendingUp className="w-3 h-3" />{stat.trend}
                            </div>
                        </div>
                        <div className="mt-4 relative z-10">
                            <p className="text-sm font-medium text-muted-text">{stat.label}</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                        </div>
                        <div className={`absolute -bottom-2 -right-2 w-24 h-24 ${stat.bg} rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500`} />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Activity Chart */}
                <div className="bg-card p-8 rounded-2xl border border-card-border shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">アクティビティ概要</h2>
                            <p className="text-sm text-muted-text mt-1">過去30日の投稿作成アクティビティ。</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-xs font-bold text-muted-text uppercase tracking-wider">投稿数</span></div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400" /><span className="text-xs font-bold text-muted-text uppercase tracking-wider">公開済み</span></div>
                        </div>
                    </div>
                    <div className="h-[280px] w-full mt-8 relative">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                            {[1,2,3,4].map(i => <div key={i} className="border-t border-gray-400 w-full h-[1px]" />)}
                        </div>
                        <div className="absolute inset-0 flex items-end justify-between gap-[2px] pb-1">
                            {chartData.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                    <div className="w-full relative flex items-end justify-center h-full">
                                        {day.count > 0 && <div style={{ height: `${day.height}%` }} className="absolute bottom-0 w-full bg-purple-200 rounded-t-sm" />}
                                        {day.count === 0 && <div className="absolute bottom-0 w-full h-[2px] bg-surface rounded-t-sm" />}
                                        {day.publishedCount > 0 && <div style={{ height: `${day.pubHeight}%` }} className="absolute bottom-0 w-full bg-purple-500 group-hover:bg-purple-600 rounded-t-sm" />}
                                        {day.count > 0 && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-20 whitespace-nowrap">
                                                {day.count} post{day.count !== 1 ? 's' : ''} ({day.publishedCount} published)
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between mt-4 px-2">
                        {chartData.filter(d => d.label).map((d, i) => (
                            <span key={i} className="text-[10px] font-bold text-muted-text/80 uppercase">{d.label}</span>
                        ))}
                    </div>
                </div>

                {/* Engagement */}
                <div className="bg-card p-8 rounded-2xl border border-card-border shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">コンテンツ内訳</h2>
                            <p className="text-sm text-muted-text mt-1">作成・公開・予約済みの比較。</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-text/80 bg-surface px-2 py-1 rounded">合計: {postsCount}</div>
                    </div>
                    <div className="space-y-8 mt-10">
                        {engagementData.map((item) => {
                            const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0
                            return (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <div className="flex items-center gap-2"><item.icon className="w-4 h-4 text-muted-text/80" /><span className="text-foreground/80">{item.label}</span></div>
                                        <span className="text-foreground">{item.value}</span>
                                    </div>
                                    <div className="h-3 w-full bg-surface rounded-full overflow-hidden border border-card-border">
                                        <div style={{ width: `${pct}%` }} className={`${item.color} h-full rounded-full transition-all duration-1000 animate-in slide-in-from-left shadow-sm`} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-12 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-xs text-purple-700">
                            {postsCount === 0 ? 'まだ投稿がありません。最初の投稿を作成して始めましょう！' : `${postsCount} 件の投稿を追跡中。このプロジェクトの分析: いいね計 ${totalLikes} 回、コメント計 ${totalComments} 件`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Posts */}
            <div id="recent-posts" className="scroll-mt-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground px-1">トップパフォーマンスの投稿</h2>
                    <span className="text-xs font-bold text-muted-text/80 uppercase tracking-widest">{topPosts.length} 件</span>
                </div>
                {topPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {topPosts.map((post) => {
                            const schedule = post.schedules[0]
                            const statusLabel = schedule
                                ? schedule.status === 'PUBLISHED' ? 'Published' : schedule.status === 'PENDING' ? 'Scheduled' : schedule.status === 'FAILED' ? 'Failed' : 'Processing'
                                : 'Draft'
                            return (
                                <div key={post.id} className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden group hover:border-purple-200 hover:shadow-md transition-all">
                                    <div className="aspect-square relative overflow-hidden bg-surface">
                                        <img src={firstImageUrl(post.imageUrl)} alt={post.caption || 'Post'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg flex items-center gap-1 border border-white/20">
                                            <Instagram className="w-3 h-3 text-white" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{post.connectedAccount?.username ? `@${post.connectedAccount.username}` : 'Post'}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">いいね</p>
                                                <p className={`text-sm font-bold mt-1 text-gray-900`}>{post.likes}</p>
                                            </div>
                                            <div className="text-right"><p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">コメント</p>
                                                <p className="text-sm font-bold text-foreground mt-1">{post.comments}</p>
                                            </div>
                                        </div>
                                        {post.caption && <p className="text-xs text-muted-text leading-relaxed line-clamp-2 italic">"{post.caption}"</p>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border-2 border-dashed border-card-border p-16 text-center">
                        <div className="w-14 h-14 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gray-900/20">
                            <BarChart3 className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-base font-bold text-foreground">投稿がまだありません</p>
                        <p className="text-sm text-muted-text/80 mt-1">最初の投稿を作成・予約して、ここにパフォーマンスを表示しましょう。</p>
                    </div>
                )}
            </div>

            {/* Bottom Posts */}
            {bottomPosts.length > 0 && (
                <div className="scroll-mt-8 mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-foreground px-1">改善が必要な投稿 (ワースト)</h2>
                        <span className="text-xs font-bold text-muted-text/80 uppercase tracking-widest">{bottomPosts.length} 件</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {bottomPosts.map((post) => {
                            const schedule = post.schedules[0]
                            return (
                                <div key={post.id} className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden group hover:border-red-200 hover:shadow-md transition-all opacity-80 hover:opacity-100">
                                    <div className="aspect-square relative overflow-hidden bg-surface grayscale hover:grayscale-0 transition-all">
                                        <img src={firstImageUrl(post.imageUrl)} alt={post.caption || 'Post'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg flex items-center gap-1 border border-white/20">
                                            <Instagram className="w-3 h-3 text-white" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{post.connectedAccount?.username ? `@${post.connectedAccount.username}` : 'Post'}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">いいね</p>
                                                <p className={`text-sm font-bold mt-1 text-gray-900`}>{post.likes}</p>
                                            </div>
                                            <div className="text-right"><p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">コメント</p>
                                                <p className="text-sm font-bold text-foreground mt-1">{post.comments}</p>
                                            </div>
                                        </div>
                                        {post.caption && <p className="text-xs text-muted-text leading-relaxed line-clamp-2 italic">"{post.caption}"</p>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
