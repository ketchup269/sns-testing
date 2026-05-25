'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, ChevronRight, Instagram,
    Clock, Plus, X, CheckCircle2, Trash2, Loader2, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { firstImageUrl } from '@/lib/utils'
import { useTranslations } from 'next-intl'

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

/* @testable */
export function getWeekDays(offsetWeeks: number): WeekDay[] {
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

/* @testable */
export function statusColor(status: string) {
    switch (status) {
        case 'PUBLISHED': return 'text-green-600'
        case 'PENDING': return 'text-purple-600'
        case 'FAILED': return 'text-red-600'
        default: return 'text-orange-500'
    }
}

/* @testable */
export function statusLabel(status: string, t: any) {
    switch (status) {
        case 'PUBLISHED': return t('published')
        case 'PENDING': return t('scheduled')
        case 'PROCESSING': return t('processing')
        case 'FAILED': return t('failed')
        default: return status
    }
}



// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendarClient({ schedules, weekOffset }: CalendarClientProps) {
    const t = useTranslations('Calendar')
    const router = useRouter()
    const [selectedPost, setSelectedPost] = useState<Schedule | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<Schedule | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (schedule: Schedule) => {
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/posts/${schedule.post.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                alert(data?.error || t('deleteFailed'))
            } else {
                setConfirmDelete(null)
                setSelectedPost(null)
                router.refresh()
            }
        } catch {
            alert(t('deleteFailed'))
        } finally {
            setIsDeleting(false)
        }
    }

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
            return d >= dayStart && d <= dayEnd
        })
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Calendar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                </div>
                <div className="flex items-center gap-3 bg-card p-1 rounded-xl shadow-sm border border-card-border">
                    <Link
                        href={`?week=${weekOffset - 1}`}
                        className="p-2 hover:bg-surface/80 dark:hover:bg-surface/50 rounded-lg transition-all duration-200 ease-out active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                    <span className="text-sm font-bold px-2 whitespace-nowrap">{weekLabel}</span>
                    <Link
                        href={`?week=${weekOffset + 1}`}
                        className="p-2 hover:bg-surface/80 dark:hover:bg-surface/50 rounded-lg transition-all duration-200 ease-out active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((day) => {
                    const posts = getPostsForDay(day)
                    const isToday = day.fullDate.toDateString() === new Date().toDateString()
                    return (
                        <div key={day.name} className={`bg-card rounded-2xl border shadow-sm flex flex-col min-h-[200px] md:min-h-[400px] ${isToday ? 'border-purple-200 ring-1 ring-purple-100' : 'border-card-border'}`}>
                            {/* Day Header */}
                            <div className={`p-4 border-b ${isToday ? 'border-purple-50 dark:border-purple-500/20 bg-purple-50/30 dark:bg-purple-500/10' : 'border-card-border'}`}>
                                <p className="text-xs font-bold text-muted-text/80 uppercase tracking-widest">{day.name}</p>
                                <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-purple-700 dark:text-purple-400' : 'text-foreground'}`}>{day.date}</p>
                                {isToday && (
                                    <div className="mt-2 flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg w-fit">
                                        <span className="text-[10px] font-black uppercase tracking-wider">{t('today')}</span>
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
                                                {statusLabel(schedule.status, t)}
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
                            <h2 className="text-xl font-bold text-foreground">{t('postDetails')}</h2>
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
                                        <p className="text-xs font-bold text-muted-text/80 uppercase tracking-widest leading-none">{t('account')}</p>
                                        <h3 className="text-lg font-bold text-foreground mt-2">
                                            @{selectedPost.post.connectedAccount?.username || 'instagram'}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-card-border rounded-xl">
                                        <Instagram className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-xs font-bold text-foreground/80">Instagram</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-surface rounded-2xl border border-card-border">
                                        <p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">{t('status')}</p>
                                        <p className={`text-sm font-bold mt-1 flex items-center gap-2 ${statusColor(selectedPost.status)}`}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {statusLabel(selectedPost.status, t)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-surface rounded-2xl border border-card-border">
                                        <p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">{t('scheduledDate')}</p>
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
                                        <p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest mb-3">{t('caption')}</p>
                                        <p className="text-sm text-muted-text bg-surface p-4 rounded-2xl border border-card-border leading-relaxed italic">
                                            &quot;{selectedPost.post.caption}&quot;
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-8 mt-auto border-t border-card-border space-y-3">
                            {/* Only allow deleting PENDING posts from the calendar */}
                            {selectedPost.status === 'PENDING' && (
                                <button
                                    onClick={() => setConfirmDelete(selectedPost)}
                                    className="w-full py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-bold border border-red-100 dark:border-red-500/20 transition-all duration-200 ease-out active:scale-95 text-sm flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t('deleteSchedule')}
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="w-full py-3 bg-surface text-foreground/80 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-surface/80 transition-all duration-200 ease-out active:scale-95 text-sm"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => !isDeleting && setConfirmDelete(null)}
                >
                    <div
                        className="bg-card rounded-2xl border border-card-border shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground text-sm">{t('deleteConfirm')}</h3>
                                <p className="text-xs text-muted-text mt-0.5">{t('deleteWarning')}</p>
                            </div>
                        </div>
                        {confirmDelete.post.caption && (
                            <p className="text-xs text-muted-text bg-surface border border-card-border rounded-xl px-3 py-2 line-clamp-2 italic">
                                &quot;{confirmDelete.post.caption}&quot;
                            </p>
                        )}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl border border-card-border bg-surface text-foreground/80 text-sm font-bold hover:bg-gray-100 dark:hover:bg-surface/80 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => handleDelete(confirmDelete)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <span className="w-4 h-4">{isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</span>
                                <span>{t('deleteBtn')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
