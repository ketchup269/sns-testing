'use client'

import Link from 'next/link'
import { use, useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
    ListChecks, PlusCircle, Clock, CheckCircle2, FileText, XCircle,
    Instagram, Image as ImageIcon, Video, Calendar, Eye, Heart,
    Trash2, AlertTriangle, Loader2, ChevronLeft, ChevronRight,
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
    DRAFT:      { label: '下書き',   color: 'text-muted-text',  bg: 'bg-surface',    border: 'border-card-border', dot: 'bg-gray-400',   icon: FileText,     pageParam: 'draft_page'     },
    PENDING:    { label: '予約済み', color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-100',  dot: 'bg-purple-500', icon: Clock,        pageParam: 'pending_page'   },
    PUBLISHED:  { label: '公開済み', color: 'text-green-600',   bg: 'bg-green-50',   border: 'border-green-100',   dot: 'bg-green-500',  icon: CheckCircle2, pageParam: 'published_page' },
    FAILED:     { label: '失敗',     color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100',     dot: 'bg-red-500',    icon: XCircle,      pageParam: 'failed_page'    },
    PROCESSING: { label: '処理中',   color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100',    dot: 'bg-blue-500',   icon: Clock,        pageParam: 'processing_page' },
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

interface ColumnData {
    posts: Post[]
    currentPage: number
    totalPages: number
    totalCount: number
}

interface WorkflowClientProps {
    columns: Record<'DRAFT' | 'PENDING' | 'PUBLISHED' | 'FAILED', ColumnData>
    insightsPromise: Promise<Record<string, { likes: number; views: number }>>
}

const COLUMNS: ('DRAFT' | 'PENDING' | 'PUBLISHED' | 'FAILED')[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'FAILED']
const DELETABLE: StatusKey[] = ['DRAFT', 'PENDING', 'FAILED']

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
    post,
    statusKey,
    onDeleteRequest,
}: {
    post: Post
    statusKey: StatusKey
    onDeleteRequest: (id: string, caption: string | null) => void
}) {
    const schedule = post.schedules[0]
    const isVideo = post.mediaType === 'VIDEO'
    const canDelete = DELETABLE.includes(statusKey)

    return (
        <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden group hover:border-purple-200 hover:shadow-md transition-all relative">
            <div className={`aspect-[4/3] relative overflow-hidden ${isVideo ? 'bg-gray-900' : 'bg-surface'}`}>
                <img
                    src={firstImageUrl(post.imageUrl)}
                    alt={post.caption || 'Post'}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                        isVideo ? 'opacity-50' : 'group-hover:scale-105'
                    }`}
                />
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                    </div>
                )}
                {post.connectedAccount?.username && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 pointer-events-none">
                        <Instagram className="w-2.5 h-2.5 text-white" />
                        <span className="text-[9px] font-bold text-white">@{post.connectedAccount.username}</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/40 backdrop-blur flex items-center justify-center border border-white/20 pointer-events-none">
                    {isVideo ? <Video className="w-3 h-3 text-white" /> : <ImageIcon className="w-3 h-3 text-white" />}
                </div>

                {canDelete && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteRequest(post.id, post.caption) }}
                        className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-600/90 backdrop-blur-sm hover:bg-red-700 text-white rounded-lg border border-red-400/40 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 shadow-lg"
                        title="削除"
                    >
                        <Trash2 className="w-3 h-3" />
                        <span className="text-[9px] font-bold">削除</span>
                    </button>
                )}
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

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({
    caption,
    isDeleting,
    onConfirm,
    onCancel,
}: {
    caption: string | null
    isDeleting: boolean
    onConfirm: () => void
    onCancel: () => void
}) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="bg-card rounded-2xl border border-card-border shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-sm">投稿を削除しますか？</h3>
                        <p className="text-xs text-muted-text mt-0.5">この操作は取り消せません。</p>
                    </div>
                </div>
                {caption && (
                    <p className="text-xs text-muted-text bg-surface border border-card-border rounded-xl px-3 py-2 line-clamp-2 italic">
                        &quot;{caption}&quot;
                    </p>
                )}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl border border-card-border bg-surface text-foreground/80 text-sm font-bold hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        削除する
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Column Paginator ─────────────────────────────────────────────────────────

function PaginationLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            aria-disabled={disabled}
            className={`flex items-center justify-center w-7 h-7 rounded-lg border border-card-border bg-card transition-colors ${
                disabled
                    ? 'opacity-30 pointer-events-none'
                    : 'hover:bg-surface text-muted-text hover:border-gray-200'
            }`}
        >
            {children}
        </Link>
    )
}

function ColumnPaginator({
    statusKey,
    currentPage,
    totalPages,
}: {
    statusKey: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'FAILED'
    currentPage: number
    totalPages: number
}) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const pageParam = statusConfig[statusKey].pageParam

    function buildHref(page: number) {
        const params = new URLSearchParams(searchParams.toString())
        params.set(pageParam, String(page))
        return `${pathname}?${params.toString()}`
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-between px-1 pt-1">
            <PaginationLink href={buildHref(currentPage - 1)} disabled={currentPage <= 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
            </PaginationLink>

            <span className="text-[10px] font-bold text-muted-text/70 tabular-nums">
                {currentPage} / {totalPages}
            </span>

            <PaginationLink href={buildHref(currentPage + 1)} disabled={currentPage >= totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
            </PaginationLink>
        </div>
    )
}

// ─── Workflow Column ──────────────────────────────────────────────────────────

function WorkflowColumn({
    statusKey,
    columnData,
    onDeleteRequest,
}: {
    statusKey: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'FAILED'
    columnData: ColumnData
    onDeleteRequest: (id: string, caption: string | null) => void
}) {
    const cfg = statusConfig[statusKey]
    const Icon = cfg.icon
    const { posts, currentPage, totalPages, totalCount } = columnData
    const [olderOpen, setOlderOpen] = useState(false)

    const pinned = posts[0] ?? null
    const older = posts.slice(1)

    return (
        <div className="space-y-3">
            {/* Column header */}
            <div className={`flex items-center justify-between px-4 py-3 ${cfg.bg} border ${cfg.border} rounded-xl`}>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-black uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className={`text-xs font-black ${cfg.color} bg-white/60 px-2 py-0.5 rounded-full`}>{totalCount}</span>
            </div>

            {/* Empty state */}
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-8 bg-card border border-dashed border-card-border rounded-2xl text-center">
                    <Icon className="w-6 h-6 text-gray-200" />
                    <p className="text-xs font-semibold text-gray-300">{cfg.label}の投稿なし</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Latest Post (Pinned) */}
                    {pinned && <PostCard post={pinned} statusKey={statusKey} onDeleteRequest={onDeleteRequest} />}

                    {/* Older Posts & Pagination Dropdown */}
                    {(older.length > 0 || totalPages > 1) && (
                        <div className="space-y-2">
                            <button
                                onClick={() => setOlderOpen(!olderOpen)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    olderOpen
                                        ? 'bg-surface border-card-border text-muted-text shadow-inner'
                                        : 'bg-card border-card-border text-muted-text/80 hover:bg-surface/80 hover:text-gray-600 hover:border-gray-200'
                                }`}
                            >
                                <span>過去の投稿とページ移動</span>
                                {olderOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {olderOpen && (
                                <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                        {older.map(post => (
                                            <PostCard key={post.id} post={post} statusKey={statusKey} onDeleteRequest={onDeleteRequest} />
                                        ))}
                                    </div>

                                    {/* Per-column pagination */}
                                    <div className="pt-1 border-t border-gray-100/50">
                                        <ColumnPaginator
                                            statusKey={statusKey}
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                        />
                                    </div>
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

function CreatePostButton({ label = "新しい投稿を作成", className = "" }: { label?: string; className?: string }) {
    return (
        <Link
            href="/create"
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 instagram-gradient text-white rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:opacity-90 transition-all duration-200 ease-out active:scale-95 hover:shadow-xl hover:-translate-y-0.5 ${className}`}
        >
            <PlusCircle className="w-4 h-4" />{label}
        </Link>
    )
}

export default function WorkflowClient({ columns, insightsPromise }: WorkflowClientProps) {
    const liveInsights = use(insightsPromise)
    const router = useRouter()

    const [confirmDelete, setConfirmDelete] = useState<{ id: string; caption: string | null } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Enrich published posts with live insights
    const enrichedColumns = {
        ...columns,
        PUBLISHED: {
            ...columns.PUBLISHED,
            posts: columns.PUBLISHED.posts.map(p => ({
                ...p,
                likes: liveInsights[p.id]?.likes ?? p.likes,
                views: liveInsights[p.id]?.views ?? p.views,
            })),
        },
    }

    const totalPosts = COLUMNS.reduce((sum, key) => sum + columns[key].totalCount, 0)

    const handleDeleteRequest = useCallback((id: string, caption: string | null) => {
        setConfirmDelete({ id, caption })
    }, [])

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/posts/${confirmDelete.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                alert(data?.error || '削除に失敗しました')
            } else {
                setConfirmDelete(null)
                router.refresh()
            }
        } catch {
            alert('削除に失敗しました')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">投稿履歴</h1>
                </div>
                <CreatePostButton className="w-fit" />
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
                            <span className={`text-sm font-black ${cfg.color}`}>{columns[key].totalCount}</span>
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
                    <CreatePostButton label="投稿を作成" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {COLUMNS.map((key) => (
                        <WorkflowColumn
                            key={key}
                            statusKey={key}
                            columnData={enrichedColumns[key]}
                            onDeleteRequest={handleDeleteRequest}
                        />
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <ConfirmDeleteModal
                    caption={confirmDelete.caption}
                    isDeleting={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => !isDeleting && setConfirmDelete(null)}
                />
            )}
        </div>
    )
}