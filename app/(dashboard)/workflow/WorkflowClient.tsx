'use client'

import Link from 'next/link'
import { use, useState } from 'react'
import {
    ListChecks, PlusCircle, Clock, CheckCircle2, FileText, XCircle,
    Instagram, Image as ImageIcon, Video, Calendar, Eye, Heart,
    ChevronDown, ChevronUp
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

const statusConfig = {
    DRAFT: { label: '下書き', color: 'text-muted-text', bg: 'bg-surface', border: 'border-card-border', dot: 'bg-gray-400', icon: FileText },
    PENDING: { label: '予約済み', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', dot: 'bg-purple-500', icon: Clock },
    PUBLISHED: { label: '公開済み', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', dot: 'bg-green-500', icon: CheckCircle2 },
    FAILED: { label: '失敗', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500', icon: XCircle },
    PROCESSING: { label: '処理中', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500', icon: Clock },
} as const

type StatusKey = keyof typeof statusConfig

interface Post {
    id: string
    caption: string | null
    imageUrl: string
    mediaType: string
    createdAt: Date
    instagramMediaId: string | null
    connectedAccount: { username: string | null; pageAccessToken: string | null } | null
    schedules: { status: string; scheduledFor: Date }[]
    likes: number
    views: number
    reach: number
    saves: number
}

interface WorkflowClientProps {
    posts: Post[]
    insightsPromise: Promise<Record<string, { likes: number; views: number }>>
}

function getPostStatus(post: Post): StatusKey {
    const latest = post.schedules[0]
    if (!latest) return 'DRAFT'
    return latest.status as StatusKey
}

const COLUMNS: StatusKey[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'FAILED']

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, statusKey }: { post: Post; statusKey: StatusKey }) {
    const schedule = post.schedules[0]
    const isVideo = post.mediaType === 'VIDEO'

    return (
        <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden group hover:border-purple-200 hover:shadow-md transition-all">
            <div className="aspect-[4/3] relative overflow-hidden bg-surface">
                {isVideo ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                        <img src={firstImageUrl(post.imageUrl)} alt="" className="w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
                                <Video className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <img
                        src={firstImageUrl(post.imageUrl)}
                        alt={post.caption || 'Post'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                )}
                {post.connectedAccount?.username && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20">
                        <Instagram className="w-2.5 h-2.5 text-white" />
                        <span className="text-[9px] font-bold text-white">@{post.connectedAccount.username}</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/40 backdrop-blur flex items-center justify-center border border-white/20">
                    {isVideo ? <Video className="w-3 h-3 text-white" /> : <ImageIcon className="w-3 h-3 text-white" />}
                </div>
            </div>
            <div className="p-3 space-y-2">
                <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">
                    {post.caption || <span className="text-gray-300 italic">キャプションなし</span>}
                </p>
                {schedule && (
                    <div className="flex items-center gap-1 text-muted-text/80">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] font-semibold">
                            {new Date(schedule.scheduledFor).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}
                {!schedule && (
                    <div className="flex items-center gap-1 text-muted-text/80">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-semibold">
                            {new Date(post.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                )}
                {statusKey === 'PUBLISHED' && (
                    <div className="flex items-center gap-3 mt-2 border-t border-card-border pt-2">
                        <div className="flex items-center gap-1 text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">
                            <Heart className="w-3 h-3" /><span className="text-[10px] font-bold">{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            <Eye className="w-3 h-3" /><span className="text-[10px] font-bold">{post.views}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Workflow Column ──────────────────────────────────────────────────────────

function WorkflowColumn({ statusKey, posts }: { statusKey: StatusKey; posts: Post[] }) {
    const cfg = statusConfig[statusKey]
    const Icon = cfg.icon
    const [olderOpen, setOlderOpen] = useState(false)

    const pinned = posts[0] ?? null   // latest — always rendered
    const older  = posts.slice(1)     // rest — only rendered when expanded

    return (
        <div className="space-y-3">
            {/* Column header */}
            <div className={`flex items-center justify-between px-4 py-3 ${cfg.bg} border ${cfg.border} rounded-xl`}>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-black uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className={`text-xs font-black ${cfg.color} bg-white/60 px-2 py-0.5 rounded-full`}>{posts.length}</span>
            </div>

            {/* Empty state */}
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-8 bg-card border border-dashed border-card-border rounded-2xl text-center">
                    <Icon className="w-6 h-6 text-gray-200" />
                    <p className="text-xs font-semibold text-gray-300">{cfg.label}の投稿なし</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Latest post — always visible */}
                    {pinned && <PostCard post={pinned} statusKey={statusKey} />}

                    {/* Collapsible older posts — only mounted when open */}
                    {older.length > 0 && (
                        <div>
                            <button
                                onClick={() => setOlderOpen(prev => !prev)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                                    olderOpen
                                        ? 'bg-surface border-card-border text-muted-text'
                                        : 'bg-card border-card-border text-muted-text/80 hover:bg-surface/80 dark:hover:bg-surface/50 hover:text-gray-600 hover:border-gray-200'
                                }`}
                            >
                                <span>過去の投稿を見る ({older.length}件)</span>
                                {olderOpen
                                    ? <ChevronUp className="w-3.5 h-3.5" />
                                    : <ChevronDown className="w-3.5 h-3.5" />
                                }
                            </button>

                            {/* Lazy render: only mount DOM when expanded */}
                            {olderOpen && (
                                <div className="mt-2 space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    {older.map(post => (
                                        <PostCard key={post.id} post={post} statusKey={statusKey} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkflowClient({ posts, insightsPromise }: WorkflowClientProps) {
    const liveInsights = use(insightsPromise)
    const groups: Record<StatusKey, Post[]> = { DRAFT: [], PENDING: [], PUBLISHED: [], FAILED: [], PROCESSING: [] }

    const enrichedPosts = posts.map(p => ({
        ...p,
        likes: liveInsights[p.id]?.likes ?? p.likes,
        views: liveInsights[p.id]?.views ?? p.views,
    }))

    for (const post of enrichedPosts) groups[getPostStatus(post)].push(post)
    const totalPosts = enrichedPosts.length

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">投稿履歴</h1>
                </div>
                <Link
                    href="/create"
                    className="flex items-center gap-2 px-6 py-3 instagram-gradient text-white rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:opacity-90 transition-all duration-200 ease-out active:scale-95 hover:shadow-xl hover:-translate-y-0.5 w-fit"
                >
                    <PlusCircle className="w-4 h-4" />新しい投稿を作成
                </Link>
            </div>

            {/* Summary Pills */}
            <div className="flex flex-wrap gap-3">
                {COLUMNS.map((key) => {
                    const cfg = statusConfig[key]
                    const Icon = cfg.icon
                    return (
                        <div key={key} className={`flex items-center gap-2 px-4 py-2 ${cfg.bg} border ${cfg.border} rounded-xl`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                            <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                            <span className={`text-sm font-black ${cfg.color}`}>{groups[key].length}</span>
                        </div>
                    )
                })}
            </div>

            {totalPosts === 0 ? (
                <div className="bg-card rounded-2xl border-2 border-dashed border-card-border p-20 text-center">
                    <div className="w-14 h-14 instagram-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gray-900/20">
                        <ListChecks className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-base font-bold text-foreground">投稿履歴が空です</p>
                    <p className="text-sm text-muted-text/80 mt-1 mb-6">最初の投稿を作成してここでトラッキングしましょう。</p>
                    <Link
                        href="/create"
                        className="inline-flex items-center gap-2 px-6 py-3 instagram-gradient text-white rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:opacity-90 transition-all duration-200 ease-out active:scale-95"
                    >
                        <PlusCircle className="w-4 h-4" />投稿を作成
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {COLUMNS.map((key) => (
                        <WorkflowColumn key={key} statusKey={key} posts={groups[key]} />
                    ))}
                </div>
            )}
        </div>
    )
}
