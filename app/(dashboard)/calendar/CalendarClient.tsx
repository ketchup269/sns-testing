'use client'

import { useState, useMemo } from 'react'
import {
    ChevronLeft, ChevronRight, Filter, Instagram,
    Clock, Plus, Search, X, CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Schedule {
    id: string
    scheduledFor: string
    status: string
    post: {
        id: string
        caption: string | null
        imageUrl: string
        connectedAccount: { username: string | null }
    }
}

interface WeekDay {
    name: string
    date: string
    fullDate: Date
}

interface CalendarClientProps {
    schedules: Schedule[]
    weekOffset: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getWeekDays(offsetWeeks: number): WeekDay[] {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offsetWeeks * 7)

    return DAY_NAMES.map((name, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        return {
            name,
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: d,
        }
    })
}

function statusColor(status: string) {
    switch (status) {
        case 'PUBLISHED': return 'text-green-600'
        case 'PENDING': return 'text-purple-600'
        case 'FAILED': return 'text-red-600'
        default: return 'text-orange-500'
    }
}

function statusLabel(status: string) {
    switch (status) {
        case 'PUBLISHED': return '公開済み'
        case 'PENDING': return '予約済み'
        case 'PROCESSING': return '処理中'
        case 'FAILED': return '失敗'
        default: return status
    }
}

/** Safely extract the first image URL from a plain URL or a serialized JSON array */
function firstImageUrl(imageUrl: string): string {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('[')) {
        try { return JSON.parse(imageUrl)[0] ?? '' } catch { return '' }
    }
    return imageUrl
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendarClient({ schedules, weekOffset: initialOffset }: CalendarClientProps) {
    const [weekOffset, setWeekOffset] = useState(initialOffset)
    const [selectedPost, setSelectedPost] = useState<Schedule | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset])
    const weekLabel = `${weekDays[0].date} – ${weekDays[6].date}, ${weekDays[6].fullDate.getFullYear()}`

    const weekSchedules = useMemo(() => {
        const start = new Date(weekDays[0].fullDate); start.setHours(0, 0, 0, 0)
        const end = new Date(weekDays[6].fullDate); end.setHours(23, 59, 59, 999)
        return schedules.filter(s => {
            const d = new Date(s.scheduledFor)
            return d >= start && d <= end
        })
    }, [schedules, weekDays])

    const getPostsForDay = (day: WeekDay) => {
        const dayStart = new Date(day.fullDate); dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day.fullDate); dayEnd.setHours(23, 59, 59, 999)
        return weekSchedules.filter(s => {
            const d = new Date(s.scheduledFor)
            const matchesSearch = !searchQuery ||
                s.post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.status.toLowerCase().includes(searchQuery.toLowerCase())
            return d >= dayStart && d <= dayEnd && matchesSearch
        })
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Calendar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">コンテンツカレンダー</h1>
                </div>
                <div className="flex items-center gap-3 bg-card p-1 rounded-xl shadow-sm border border-card-border">
                    <button
                        onClick={() => setWeekOffset(prev => prev - 1)}
                        className="p-2 hover:bg-surface/80 dark:hover:bg-surface/50 rounded-lg transition-all duration-200 ease-out active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold px-2 whitespace-nowrap">{weekLabel}</span>
                    <button
                        onClick={() => setWeekOffset(prev => prev + 1)}
                        className="p-2 hover:bg-surface/80 dark:hover:bg-surface/50 rounded-lg transition-all duration-200 ease-out active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((day) => {
                    const posts = getPostsForDay(day)
                    const isToday = day.fullDate.toDateString() === new Date().toDateString()
                    return (
                        <div key={day.name} className={`bg-white rounded-2xl border shadow-sm flex flex-col min-h-[400px] ${isToday ? 'border-purple-200 ring-1 ring-purple-100' : 'border-card-border'}`}>
                            {/* Day Header */}
                            <div className={`p-4 border-b ${isToday ? 'border-purple-50 bg-purple-50/30' : 'border-card-border'}`}>
                                <p className="text-xs font-bold text-muted-text/80 uppercase tracking-widest">{day.name}</p>
                                <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-purple-700' : 'text-foreground'}`}>{day.date}</p>
                                {isToday && (
                                    <div className="mt-2 flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg w-fit">
                                        <span className="text-[10px] font-black uppercase tracking-wider">今日</span>
                                    </div>
                                )}
                            </div>

                            {/* Posts */}
                            <div className="p-3 space-y-3 flex-1">
                                {posts.map((schedule) => (
                                    <button
                                        key={schedule.id}
                                        onClick={() => setSelectedPost(schedule)}
                                        className="w-full text-left bg-card rounded-xl border border-card-border shadow-sm p-2 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out active:scale-[0.98] group overflow-hidden"
                                    >
                                        <div className="aspect-square rounded-lg overflow-hidden bg-surface mb-2 relative">
                                            <img
                                                src={firstImageUrl(schedule.post.imageUrl)}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute top-1.5 right-1.5">
                                                <Instagram className="w-3.5 h-3.5 text-white drop-shadow-md" />
                                            </div>
                                        </div>
                                        <div className="px-1">
                                            <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${statusColor(schedule.status)}`}>
                                                {statusLabel(schedule.status)}
                                            </div>
                                            <p className="text-[11px] font-bold text-foreground line-clamp-1">
                                                {schedule.post.caption || 'No caption'}
                                            </p>
                                            <p className="text-[10px] text-muted-text/80 mt-0.5">
                                                {new Date(schedule.scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </button>
                                ))}

                                <Link
                                    href="/create"
                                    className="w-full py-3 border-2 border-dashed border-card-border rounded-xl flex items-center justify-center text-gray-300 hover:border-purple-200 hover:text-purple-300 transition-all duration-200 ease-out active:scale-95 mt-auto group"
                                >
                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Side Drawer */}
            {selectedPost && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 flex justify-end"
                    onClick={() => setSelectedPost(null)}
                >
                    <div
                        className="w-full max-w-md bg-card h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col p-8"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-foreground">投稿詳細</h2>
                            <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-surface dark:hover:bg-surface/80 rounded-full transition-all duration-200 ease-out active:scale-95">
                                <X className="w-5 h-5 text-muted-text/80" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-8 no-scrollbar">
                            <div className="aspect-square rounded-3xl bg-surface overflow-hidden shadow-inner border border-card-border">
                                <img src={firstImageUrl(selectedPost.post.imageUrl)} className="w-full h-full object-cover" alt="" />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-muted-text/80 uppercase tracking-widest leading-none">アカウント</p>
                                        <h3 className="text-lg font-bold text-foreground mt-2">
                                            @{selectedPost.post.connectedAccount?.username || 'instagram'}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-card-border rounded-xl">
                                        <Instagram className="w-4 h-4 text-purple-600" />
                                        <span className="text-xs font-bold text-foreground/80">Instagram</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-surface rounded-2xl border border-card-border">
                                        <p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">ステータス</p>
                                        <p className={`text-sm font-bold mt-1 flex items-center gap-2 ${statusColor(selectedPost.status)}`}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {statusLabel(selectedPost.status)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-surface rounded-2xl border border-card-border">
                                        <p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">予約日時</p>
                                        <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-muted-text/80" />
                                            {new Date(selectedPost.scheduledFor).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {selectedPost.post.caption && (
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest mb-3">キャプション</p>
                                        <p className="text-sm text-muted-text bg-surface p-4 rounded-2xl border border-card-border leading-relaxed italic">
                                            &quot;{selectedPost.post.caption}&quot;
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-8 mt-auto border-t border-card-border grid grid-cols-2 gap-4">
                            <Link
                                href="/create"
                                className="py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 hover:shadow-xl hover:-translate-y-0.5 hover:bg-purple-700 transition-all duration-200 ease-out active:scale-95 text-center text-sm"
                            >
                                投稿を編集
                            </Link>
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="py-3 bg-surface text-foreground/80 rounded-xl font-bold hover:bg-gray-200 transition-all duration-200 ease-out active:scale-95 text-sm"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
