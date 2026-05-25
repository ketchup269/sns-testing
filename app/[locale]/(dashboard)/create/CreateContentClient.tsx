'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Video,
    Calendar,
    Send,
    Plus,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Instagram,
    Sparkles,
    Images,
    FileImage,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Search,
    FolderPlus,
    Trash2,
    Eye,
    History,
    MessageSquare,
    Heart,
    Bookmark,
    Settings,
    Upload,
    FileEdit,
    FolderKanban,
    Hash,
    Info
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MobilePreviewModal } from './components/MobilePreviewModal'
import { DraftSelectionModal } from './components/DraftSelectionModal'
import { HistorySelectionModal } from './components/HistorySelectionModal'
import { useMediaManagement } from './hooks/useMediaManagement'
import { usePostGeneration } from './hooks/usePostGeneration'
import { usePublishing } from './hooks/usePublishing'
import { useProjectData } from './hooks/useProjectData'
import { ConnectedAccount, HistoryItem } from './types'
import { useAccount } from '../../../components/AccountContext'
import ConfirmModal from '../../../components/ConfirmModal'
import { useTranslations } from 'next-intl'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function CreateContentClient({ accounts: _ignored, aiUsageOption = 'Normal AI Use', projects: initialProjects = [] }: { accounts?: ConnectedAccount[], aiUsageOption?: string, projects?: any[] }) {
    const router = useRouter()
    const { selectedAccountId, accounts } = useAccount()
    const t = useTranslations('Create')

    // ─────────────────────────────────────────────
    // Hooks: all state and business logic is scoped below
    // ─────────────────────────────────────────────
    const {
        projects,
        selectedProjectId,
        setSelectedProjectId,
        selectedProject,
        history,
        isLoadingHistory,
        drafts,
        isLoadingDrafts,
        projectImages,
        isLoadingProjectImages,
        isLibraryExpanded,
        setIsLibraryExpanded,
        isLibraryUploading,
        libraryUploadProgress,
        handleLibraryUpload,
        deleteProjectImage
    } = useProjectData(initialProjects)

    const {
        mediaItems,
        isVideo,
        handleFiles,
        removeMedia,
        loadFromDraft,
        loadFromHistory,
        loadFromLibrary
    } = useMediaManagement()

    const {
        caption,
        setCaption,
        customPrompt,
        setCustomPrompt,
        isGeneratingAI,
        generationError,
        setGenerationError,
        analysisResults,
        generateCaption
    } = usePostGeneration()

    const {
        result,
        setResult,
        clearResult,
        isPublishing,
        publish,
        saveAsDraft
    } = usePublishing()

    const errorRef = useRef<HTMLDivElement>(null)
    const [imageToDelete, setImageToDelete] = useState<string | null>(null)

    // Modal visibility
    const [showPreview, setShowPreview] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [showDraftsModal, setShowDraftsModal] = useState(false)
    const [previewIndex, setPreviewIndex] = useState(0)
    const [scheduledFor, setScheduledFor] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)

    // Auto-fill schedule when project with preferredTimeSlots is selected
    useEffect(() => {
        const timeStr = selectedProject?.preferredTimeSlots

        // If the new project has no preferred time, clear the schedule picker
        if (!timeStr) {
            setScheduledFor('')
            setShowDatePicker(false)
            return
        }

        // Parse the first time from strings like "19:00-21:00" or "19:00"
        const match = timeStr.match(/(\d{1,2}):(\d{2})/)
        if (!match) {
            setScheduledFor('')
            setShowDatePicker(false)
            return
        }

        const [, h, m] = match
        const currentTime = new Date()           // stable reference point
        const scheduled = new Date(currentTime)  // copy to mutate
        scheduled.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)

        // If the time has already passed today (or is right now), schedule for tomorrow
        if (scheduled <= currentTime) {
            scheduled.setDate(scheduled.getDate() + 1)
        }

        const offset = scheduled.getTimezoneOffset() * 60000
        const localISO = new Date(scheduled.getTime() - offset).toISOString().slice(0, 16)
        setScheduledFor(localISO)
        setShowDatePicker(true)
    }, [selectedProjectId])

    // When project changes, replace hashtag lines at end of caption with new project defaults
    const prevProjectIdRef = useRef(selectedProjectId)
    useEffect(() => {
        if (prevProjectIdRef.current === selectedProjectId) return
        prevProjectIdRef.current = selectedProjectId

        const newTags = selectedProject?.defaultHashtags ?? []
        setCaption(prev => {
            // Strip trailing hashtag lines from caption
            const lines = prev.trimEnd().split('\n')
            while (lines.length > 0 && lines[lines.length - 1].trim().startsWith('#')) {
                lines.pop()
            }
            const base = lines.join('\n').trimEnd()
            if (newTags.length === 0) return base
            return base ? `${base}\n\n${newTags.join(' ')}` : newTags.join(' ')
        })
    }, [selectedProjectId, selectedProject])

    // Clear caption/options when media is removed
    useEffect(() => {
        if (mediaItems.length === 0) {
            setCaption('')
            setCustomPrompt('')
        }
    }, [mediaItems])

    // Surface generation errors as result banners
    useEffect(() => {
        if (generationError) {
            setResult({ error: generationError })
            setGenerationError(null)
        }
    }, [generationError])

    // Scroll to error
    useEffect(() => {
        if (result?.error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [result?.error])


    const handleSelectDraft = (draft: HistoryItem) => {
        loadFromDraft(draft)
        if (draft.caption) setCaption(draft.caption)
    }

    const handleSelectHistorical = (hist: HistoryItem) => {
        loadFromHistory(hist)
        if (hist.caption && !caption) setCaption(hist.caption)
    }

    const handlePublishAction = (mode: 'now' | 'schedule') => {
        publish(mode, {
            caption,
            selectedAccountId,
            selectedProjectId,
            isVideo,
            scheduledFor,
            mediaItems
        }, (publishMode) => {
            setTimeout(() => router.push(publishMode === 'schedule' ? '/calendar' : '/dashboard'), 1500)
        })
    }

    const handleSaveDraft = () => {
        saveAsDraft({
            caption,
            selectedAccountId,
            selectedProjectId,
            isVideo,
            mediaItems
        }, () => {
            setTimeout(() => router.push('/workflow'), 1500)
        })
    }

    const handleGenerateCaption = () => {
        generateCaption(mediaItems, selectedProjectId, selectedProject?.defaultHashtags || [])
    }

    const isWorking = isPublishing || isGeneratingAI
    const actAccount = accounts?.find(a => a.id === selectedAccountId)

    // Project selector dropdown state
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false)
    const projectDropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
                setIsProjectDropdownOpen(false)
            }
        }
        if (isProjectDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isProjectDropdownOpen])

    return (
        <div className="w-full max-w-full h-full flex flex-col space-y-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 pb-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {t('title')}
                </h1>
            </div>

            {/* Error / Success Banner */}
            {result && (
                <div ref={errorRef} className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium',
                    result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                )}>
                    {result.success ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    <span>{result.success ? '成功しました！リダイレクトしています...' : result.error}</span>
                    {!result.success && <button onClick={clearResult} className="ml-auto p-1.5"><X className="w-4 h-4" /></button>}
                </div>
            )}

            {/* Form Container */}
            {projects.length === 0 ? (
                <div className="bg-card border border-card-border rounded-2xl overflow-hidden p-10 flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[400px]">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
                        <FolderPlus className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{t('createProjectTitle')}</h2>
                    <p className="text-muted-text text-center max-w-sm">
                        {t('createProjectDesc')}
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push('/projects')}
                        className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        {t('createProjectBtn')}
                    </button>
                </div>
            ) : (
                <form id="create-post-form" onSubmit={(e) => { e.preventDefault(); handlePublishAction('now'); }} className="bg-card border border-card-border rounded-2xl overflow-hidden p-6 md:p-8 space-y-6 shadow-sm">

                    {/* Project Selector & AI Badge */}
                    {projects.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 w-full">
                            <div className="relative" ref={projectDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsProjectDropdownOpen(prev => !prev)}
                                className={cn(
                                    'flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer',
                                    isProjectDropdownOpen
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-200 dark:ring-indigo-500/30'
                                        : 'bg-card border-card-border text-foreground/80 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10 shadow-sm'
                                )}
                            >
                                <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="max-w-[240px] truncate">{selectedProject?.name || t('projectSelect')}</span>
                                <ChevronDown className={cn('w-4 h-4 text-muted-text/80 transition-transform duration-200', isProjectDropdownOpen && 'rotate-180')} />
                            </button>
                            {isProjectDropdownOpen && (
                                <div className="absolute left-0 top-full mt-2 w-72 bg-card rounded-xl border border-card-border shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="max-h-64 overflow-y-auto py-1">
                                        {projects.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedProjectId(p.id)
                                                    setIsProjectDropdownOpen(false)
                                                }}
                                                className={cn(
                                                    'w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors',
                                                    p.id === selectedProjectId
                                                        ? 'bg-indigo-50 dark:bg-indigo-500/10'
                                                        : 'hover:bg-surface/80 dark:hover:bg-surface/50'
                                                )}
                                            >
                                                <FolderKanban className={cn('w-4 h-4 mt-0.5 shrink-0', p.id === selectedProjectId ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-text/80')} />
                                                <div className="flex-1 min-w-0">
                                                    <div className={cn('text-sm font-semibold truncate', p.id === selectedProjectId ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200')}>
                                                        {p.name}
                                                    </div>
                                                    {p.description && (
                                                        <div className="text-[11px] text-muted-text/80 truncate mt-0.5">{p.description}</div>
                                                    )}
                                                    {p.defaultHashtags?.length > 0 && (
                                                        <div className="text-[10px] text-blue-500 mt-1 truncate">
                                                            {p.defaultHashtags.slice(0, 3).join(' ')}{p.defaultHashtags.length > 3 ? ` +${p.defaultHashtags.length - 3}` : ''}
                                                        </div>
                                                    )}
                                                </div>
                                                {p.id === selectedProjectId && (
                                                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            </div>
                            <div className="ml-auto text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                {aiUsageOption === 'No AI' ? t('aiDisabled') : 
                                 aiUsageOption === 'Slight AI Use' ? t('aiSlight') : 
                                 aiUsageOption === 'Strong AI Use' ? t('aiStrong') : t('aiStandard')}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Section 1: Media & Gallery */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-bold text-foreground">{t('media')}</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowDraftsModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-card-border text-muted-text hover:text-amber-600 font-bold rounded-xl shadow-sm hover:bg-surface/80 dark:hover:bg-surface/50 hover:border-amber-200 transition-all text-xs"
                                    >
                                        <FileEdit className="w-3.5 h-3.5" />{t('editDraft')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowHistoryModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-card-border text-muted-text hover:text-indigo-600 font-bold rounded-xl shadow-sm hover:bg-surface/80 dark:hover:bg-surface/50 hover:border-indigo-200 transition-all text-xs"
                                    >
                                        <History className="w-3.5 h-3.5" />{t('reuseHistory')}
                                    </button>
                                </div>
                            </div>

                            {/* Currently Selected Media Strip */}
                            {mediaItems.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto pb-4 snap-x relative">
                                    {mediaItems.map((item) => {
                                        const src = item.type === 'file' ? URL.createObjectURL(item.file) : item.url
                                        return (
                                            <div key={item.id} className="relative shrink-0 snap-start group">
                                                {item.type === 'file' && item.file.type.startsWith('video/') || (item.type === 'url' && item.isVideo) ? (
                                                    <div className="w-[140px] h-[140px] rounded-xl bg-gray-900 flex items-center justify-center border border-card-border shadow-sm relative overflow-hidden">
                                                        <img src={src} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />
                                                        <Video className="w-8 h-8 text-white/80 z-10" />
                                                        <span className="absolute bottom-2 left-2 text-[10px] bg-white/20 text-white backdrop-blur-md px-2 py-0.5 rounded font-medium z-10">REEL</span>
                                                    </div>
                                                ) : (
                                                    <img src={src} className="w-[140px] h-[140px] rounded-xl object-cover border border-card-border shadow-sm" alt="media" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeMedia(item.id); }}
                                                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/90 rounded-full flex items-center justify-center text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-20"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                    {!isVideo && (
                                        <label className="shrink-0 w-[140px] h-[140px] rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 bg-surface flex flex-col items-center justify-center cursor-pointer transition-all gap-2">
                                            <Plus className="w-5 h-5 text-muted-text" />
                                            <span className="text-xs text-muted-text font-medium">{t('add')}</span>
                                            <input type="file" multiple className="hidden" accept="image/*" onChange={e => handleFiles(Array.from(e.target.files || []))} />
                                        </label>
                                    )}
                                </div>
                            )}

                            {/* ──────── 新デザインのメディアアップロード UI ──────── */}
                            <div className="space-y-4">

                                {/* 1. デバイスからアップロード（メインカード） */}
                                {mediaItems.length === 0 && (
                                    <div className="bg-card border border-card-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-surface/80 dark:hover:bg-surface/50 transition-colors shadow-sm relative group overflow-hidden h-40 md:h-56">
                                        <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*,video/*" onChange={e => handleFiles(Array.from(e.target.files || []))} />
                                        <div className="w-16 h-16 bg-blue-50/50 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
                                            <Upload className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                                        </div>
                                        <h3 className="text-base font-bold text-foreground mb-1">{t('uploadDevice')}</h3>
                                        <p className="text-sm text-muted-text/80 mb-4">{t('uploadDesc')}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-text/80">
                                            <span>JPG</span> • <span>PNG</span> • <span>WebP</span>
                                        </div>
                                    </div>
                                )}

                                {/* 2. ライブラリ（アコーディオン） */}
                                {selectedProjectId && (
                                    <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface/80 dark:hover:bg-surface/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                                                    <FolderPlus className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                                                </div>
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{t('library')}</span>
                                            </div>
                                            <ChevronDown className={cn("w-5 h-5 text-muted-text/80 transition-transform duration-300", isLibraryExpanded && "rotate-180")} />
                                        </button>

                                        <div className={cn("grid transition-[grid-template-rows] duration-300 ease-in-out", isLibraryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                                            <div className="overflow-hidden">
                                                <div className="p-6 pt-0 border-t border-card-border">
                                                    {isLibraryUploading ? (
                                                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                                            <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                                                <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${libraryUploadProgress}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-muted-text font-bold">{libraryUploadProgress}%</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-4 mt-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-bold text-muted-text/80">{projectImages.length} {t('items')}</span>
                                                                <label className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
                                                                    <Plus className="w-3 h-3" />{t('add')}
                                                                    <input type="file" multiple className="hidden" accept="image/*" onChange={e => {
                                                                        const files = Array.from(e.target.files || [])
                                                                        if (files.length > 0) handleLibraryUpload(files)
                                                                        e.target.value = '' // reset so same file can be re-selected
                                                                    }} />
                                                                </label>
                                                            </div>

                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                                                                {isLoadingProjectImages ? (
                                                                    <div className="col-span-full flex justify-center py-6">
                                                                        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                                                                    </div>
                                                                ) : projectImages.length > 0 ? (
                                                                    projectImages.map(img => (
                                                                        <div key={img.id} className="aspect-square relative rounded-xl border border-card-border overflow-hidden cursor-pointer group shadow-sm bg-surface" onClick={() => loadFromLibrary(img)}>
                                                                            <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                                                                <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-full border border-white/20">{t('use')}</span>
                                                                            </div>
                                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setImageToDelete(img.id); }} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 rounded flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all border border-white/20">
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="col-span-full py-8 flex flex-col items-center justify-center bg-surface rounded-xl border border-dashed border-card-border">
                                                                        <FolderPlus className="w-6 h-6 text-gray-300 mb-2" />
                                                                        <span className="text-xs text-muted-text/80 font-medium">{t('noImages')}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!selectedProjectId && mediaItems.length === 0 && (
                                <p className="text-xs text-muted-text/80 italic">{t('libraryHint')}</p>
                            )}
                            {mediaItems.length > 1 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg text-xs text-blue-700 dark:text-blue-400 w-fit">
                                    <Images className="w-4 h-4" />
                                    <span>{t('carouselHint')}</span>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Caption */}
                        <div className="space-y-4 flex flex-col h-full">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-bold text-foreground">{t('caption')}</label>
                            </div>
                            {aiUsageOption !== 'No AI' && (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={customPrompt}
                                            onChange={e => setCustomPrompt(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    if (!isWorking && mediaItems.length > 0) {
                                                        handleGenerateCaption()
                                                    }
                                                }
                                            }}
                                            placeholder={t('aiPrompt')}
                                            className="flex-1 bg-surface border border-card-border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm placeholder:text-gray-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGenerateCaption}
                                            disabled={isWorking || mediaItems.length === 0}
                                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border shrink-0 bg-card border-card-border text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="flex items-center w-4 h-4 mr-0.5">
                                                {isGeneratingAI ? <Loader2 className="w-full h-full animate-spin" /> : null}
                                            </span>
                                            <span>{t('autoGenerate')}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 flex flex-col group min-h-[250px]">
                                {/* Caption Textarea */}
                                <div className="relative flex-1">
                                    <textarea
                                        value={caption}
                                        onChange={e => setCaption(e.target.value)}
                                        placeholder={t('captionPlaceholder')}
                                        className={cn(
                                            "w-full h-full p-4 pb-10 rounded-xl text-foreground text-sm leading-relaxed placeholder:text-gray-400 focus:outline-none transition-all resize-none shadow-sm peer",
                                            caption.length > 0
                                                ? "bg-blue-50/30 dark:bg-blue-500/10 border-2 border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
                                                : "bg-surface border border-card-border focus:ring-2 focus:ring-black/5 focus:border-gray-400 focus:bg-white min-h-[200px]"
                                        )}
                                        maxLength={2200}
                                    />

                                    {/* AI Analysis info icon — top right of textarea */}
                                    {analysisResults && (
                                        <div className="absolute top-2.5 right-2.5 z-20 group/analysis opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button
                                                type="button"
                                                className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors shadow-sm border border-indigo-200 dark:border-indigo-500/30"
                                                aria-label="AI分析を見る"
                                            >
                                                <Info className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Hover tooltip — analysis panel */}
                                            <div className="absolute top-full right-0 mt-2 w-[340px] md:w-[420px] opacity-0 invisible group-hover/analysis:opacity-100 group-hover/analysis:visible transition-all duration-200 pointer-events-none group-hover/analysis:pointer-events-auto">
                                                <div className="bg-gradient-to-br from-indigo-50/95 to-purple-50/95 backdrop-blur-md border border-indigo-200 rounded-xl p-4 shadow-xl">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-bold text-gray-800">AI分析レポート</h4>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full">舞台裏のデータ</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {analysisResults.imageAnalysis && (
                                                            <div className="space-y-1.5 bg-white/60 rounded-lg p-3 border border-indigo-50">
                                                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">画像認識 (Vision)</div>
                                                                <div className="text-xs text-foreground/80 flex gap-2"><span className="font-semibold text-foreground w-16">シーン:</span> <span className="flex-1 truncate" title={analysisResults.imageAnalysis.scene}>{analysisResults.imageAnalysis.scene}</span></div>
                                                                <div className="text-xs text-foreground/80 flex gap-2"><span className="font-semibold text-foreground w-16">ムード:</span> <span className="flex-1 truncate" title={analysisResults.imageAnalysis.mood}>{analysisResults.imageAnalysis.mood}</span></div>
                                                                <div className="text-xs text-foreground/80 flex gap-2"><span className="font-semibold text-foreground w-16">被写体:</span> <span className="flex-1 truncate" title={analysisResults.imageAnalysis.primary_subject}>{analysisResults.imageAnalysis.primary_subject}</span></div>
                                                            </div>
                                                        )}
                                                        {analysisResults.patternAnalysis && (
                                                            <div className="space-y-1.5 bg-white/60 rounded-lg p-3 border border-indigo-50">
                                                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">過去の傾向 (Pattern)</div>
                                                                <div className="text-xs text-foreground/80 flex gap-2"><span className="font-semibold text-foreground w-12">トーン:</span> <span className="flex-1 truncate" title={analysisResults.patternAnalysis.tone}>{analysisResults.patternAnalysis.tone}</span></div>
                                                                <div className="text-xs text-foreground/80 flex gap-2"><span className="font-semibold text-foreground w-12">フック:</span> <span className="flex-1 truncate" title={analysisResults.patternAnalysis.hook_style}>{analysisResults.patternAnalysis.hook_style}</span></div>
                                                                <div className="text-xs text-foreground/80 flex gap-2"><span className="font-semibold text-foreground w-12">長さ:</span> <span className="flex-1 truncate" title={analysisResults.patternAnalysis.avg_length}>{analysisResults.patternAnalysis.avg_length}</span></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {analysisResults.patternAnalysis?.pattern_summary && (
                                                        <div className="mt-3 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-lg p-3 border border-indigo-100 dark:border-indigo-500/20">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                                                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">過去の投稿から学習したこと</div>
                                                            </div>
                                                            <div className="text-xs text-indigo-900 leading-relaxed font-medium">
                                                                {analysisResults.patternAnalysis.pattern_summary}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        <span className={cn(
                                            'text-[10px] font-bold px-2 py-1 rounded-md transition-colors border',
                                            caption.length > 2000 ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-100 dark:border-red-500/20' : 'bg-white/80 dark:bg-surface text-muted-text/80 border-card-border shadow-sm peer-focus:border-gray-300 peer-focus:text-gray-500'
                                        )}>
                                            {caption.length} / 2200
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                        <div className="h-px bg-surface" />

                        {/* Submit Controls Fixed to Bottom of Form */}
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex w-full items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(true)}
                                    disabled={mediaItems.length === 0}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all bg-white dark:bg-card border border-gray-200 dark:border-card-border text-gray-400 hover:bg-gray-50 dark:hover:bg-surface/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <Eye className="w-4 h-4" />
                                    {t('preview')}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={isWorking || !selectedAccountId || (mediaItems.length === 0 && !caption.trim())}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all bg-white dark:bg-card border border-gray-200 dark:border-card-border text-gray-400 hover:bg-gray-50 dark:hover:bg-surface/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <Bookmark className="w-4 h-4" />
                                    {t('saveDraft')}
                                </button>
                            </div>

                            <div className="flex w-full items-center lg:justify-end gap-3 flex-wrap sm:flex-nowrap">
                                {!showDatePicker ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowDatePicker(true)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all bg-white dark:bg-card border border-gray-200 dark:border-card-border text-gray-600 hover:bg-gray-50 dark:hover:bg-surface/50 active:scale-95 shadow-sm min-w-max"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        {t('schedule')}
                                    </button>
                                ) : (
                                    <div className="flex-1 sm:flex-none flex items-center gap-2 animate-in fade-in zoom-in-95 bg-surface p-1.5 rounded-xl border border-card-border w-full sm:w-auto">
                                        <input
                                            type="datetime-local"
                                            value={scheduledFor}
                                            onChange={e => setScheduledFor(e.target.value)}
                                            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 60000).toISOString().slice(0, 16)}
                                            className="w-full sm:w-auto bg-card border border-card-border rounded-lg py-2 pl-3 pr-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handlePublishAction('schedule')}
                                            disabled={isWorking || !selectedAccountId || mediaItems.length === 0 || !scheduledFor}
                                            className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md bg-purple-600 text-white hover:bg-purple-700 active:scale-95 disabled:opacity-50 shrink-0"
                                        >
                                            完了
                                        </button>
                                        <button type="button" onClick={() => setShowDatePicker(false)} className="p-2 text-muted-text/80 hover:text-gray-600 rounded-lg shrink-0"><X className="w-5 h-5" /></button>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handlePublishAction('now')}
                                    disabled={isWorking || !selectedAccountId || mediaItems.length === 0}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-max"
                                >
                                    {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                                    <span>{t('publishNow')}</span>
                                </button>
                            </div>
                        </div>
                    
                </form>
            )}

            {/* ─────────────────────────────────────────────
                Modals
            ───────────────────────────────────────────── */}

            {/* History Modal */}
            <HistorySelectionModal
                show={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                selectedProjectId={selectedProjectId}
                historyItems={history}
                isLoadingHistory={isLoadingHistory}
                handleSelectHistory={handleSelectHistorical}
            />

            {/* Drafts Modal */}
            <DraftSelectionModal
                show={showDraftsModal}
                onClose={() => setShowDraftsModal(false)}
                selectedProjectId={selectedProjectId}
                drafts={drafts}
                isLoadingDrafts={isLoadingDrafts}
                handleSelectDraft={handleSelectDraft}
            />



            {/* Instagram Preview Modal */}
            <MobilePreviewModal
                show={showPreview}
                onClose={() => setShowPreview(false)}
                mediaItems={mediaItems}
                caption={caption}
                previewIndex={previewIndex}
                setPreviewIndex={setPreviewIndex}
                account={actAccount}
            />

            <ConfirmModal
                isOpen={!!imageToDelete}
                title="画像の削除"
                message="ライブラリからこの画像を削除しますか？"
                confirmText="削除する"
                onCancel={() => setImageToDelete(null)}
                onConfirm={() => {
                    if (imageToDelete) {
                        deleteProjectImage(imageToDelete)
                        setImageToDelete(null)
                    }
                }}
            />
        </div>
    )
}
