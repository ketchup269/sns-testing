'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bot, CheckCircle2, AlertCircle, MessageCircle, UserPlus, ChevronLeft, ChevronRight, ShieldCheck, Lock, UserCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { saveAutomationSettings, getAutomationLog, getAutomationSettings } from './actions'
import { useAccount } from '@/app/components/AccountContext'
import Link from 'next/link'

interface AutomationClientProps {
    initialSettings: any | null
}

export default function AutomationClient({ initialSettings }: AutomationClientProps) {
    const { activeAccount: connectedAccount } = useAccount()
    const t = useTranslations('Automation')

    const [settings, setSettings] = useState<any>(initialSettings)
    
    const [autoDmReply, setAutoDmReply] = useState(false)
    const [dmReplyTemplate, setDmReplyTemplate] = useState('')
    const [dmUseAi, setDmUseAi] = useState(false)
    const [dmAiPersonality, setDmAiPersonality] = useState('')
    
    const [autoCommentReply, setAutoCommentReply] = useState(false)
    const [commentReplyTemplate, setCommentReplyTemplate] = useState('')
    const [commentUseAi, setCommentUseAi] = useState(false)
    const [commentAiPersonality, setCommentAiPersonality] = useState('')

    const [pendingToggle, setPendingToggle] = useState<'dm' | 'comment' | null>(null)
    const [modalAgreed, setModalAgreed] = useState(false)

    const handleToggleDm = (checked: boolean) => {
        if (checked) {
            setPendingToggle('dm')
        } else {
            setAutoDmReply(false)
        }
    }

    const handleToggleComment = (checked: boolean) => {
        if (checked) {
            setPendingToggle('comment')
        } else {
            setAutoCommentReply(false)
        }
    }

    useEffect(() => {
        if (settings) {
            setAutoDmReply(settings.autoDmReply ?? false)
            setDmReplyTemplate(settings.dmReplyTemplate ?? settings.dmTemplate ?? '')
            setDmUseAi(settings.dmUseAi ?? (settings.dmMode === 'AI'))
            setDmAiPersonality(settings.dmAiPersonality ?? '')
            setAutoCommentReply(settings.autoCommentReply ?? false)
            setCommentReplyTemplate(settings.commentReplyTemplate ?? settings.commentTemplate ?? '')
            setCommentUseAi(settings.commentUseAi ?? (settings.commentMode === 'AI'))
            setCommentAiPersonality(settings.commentAiPersonality ?? '')
        } else {
            setAutoDmReply(false)
            setDmReplyTemplate('')
            setDmUseAi(false)
            setDmAiPersonality('')
            setAutoCommentReply(false)
            setCommentReplyTemplate('')
            setCommentUseAi(false)
            setCommentAiPersonality('')
        }
    }, [settings])

    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    
    const [logPage, setLogPage] = useState(1)
    const [log, setLog] = useState<any[]>([])
    const [totalLogPages, setTotalLogPages] = useState(1)
    const [isLoadingLog, setIsLoadingLog] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const errorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [error])

    const loadLog = async (page: number, dmOn?: boolean, commentOn?: boolean) => {
        if (!connectedAccount) return
        setIsLoadingLog(true)
        
        const dm = dmOn ?? settings?.autoDmReply ?? false
        const comment = commentOn ?? settings?.autoCommentReply ?? false
        
        const res = await getAutomationLog(connectedAccount.id, page, 20, dm, comment)
        setIsLoadingLog(false)
        if (res.success && res.data) {
            setLog(res.data.events)
            setTotalLogPages(res.data.pages)
            setLogPage(page)
        } else {
            setLog([])
            setTotalLogPages(1)
        }
    }

    useEffect(() => {
        if (connectedAccount) {
            getAutomationSettings(connectedAccount.id).then(res => {
                if (res.success && res.data) {
                    setSettings(res.data)
                    loadLog(1, res.data.autoDmReply, res.data.autoCommentReply)
                } else {
                    setSettings(null)
                    loadLog(1, false, false)
                }
            })
        } else {
            setSettings(null)
            setLog([])
        }
    }, [connectedAccount?.id])

    const handleSave = async (overrides?: { autoDmReply?: boolean, autoCommentReply?: boolean }) => {
        if (!connectedAccount) return
        
        setError('')
        setMessage('')
        
        setIsSaving(true)
        const res = await saveAutomationSettings({
            connectedAccountId: connectedAccount.id,
            autoDmReply: overrides?.autoDmReply ?? autoDmReply,
            dmReplyTemplate,
            dmReplyDelayMin: 1,
            dmReplyDelayMax: 5,
            dmUseAi,
            dmAiPersonality,
            autoCommentReply: overrides?.autoCommentReply ?? autoCommentReply,
            commentUseAi,
            commentReplyTemplate,
            commentAiPersonality
        })
        setIsSaving(false)
        
        if (res.error) {
            setError(res.error)
        } else {
            setMessage(t('saveSuccess', { defaultValue: 'Settings saved successfully!' }))
            setIsSettingsOpen(false)
            
            // Re-fetch latest settings to update UI instantly
            const updatedSettingsRes = await getAutomationSettings(connectedAccount.id)
            if (updatedSettingsRes.success && updatedSettingsRes.data) {
                setSettings(updatedSettingsRes.data)
                loadLog(1, updatedSettingsRes.data.autoDmReply, updatedSettingsRes.data.autoCommentReply)
            } else {
                setSettings(null)
                loadLog(1, false, false)
            }
        }
    }

    const confirmToggle = () => {
        if (pendingToggle === 'dm') {
            setAutoDmReply(true)
        } else if (pendingToggle === 'comment') {
            setAutoCommentReply(true)
        }
        setPendingToggle(null)
        setModalAgreed(false)
    }

    const cancelToggle = () => {
        setPendingToggle(null)
        setModalAgreed(false)
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('title', { defaultValue: 'Automation' })}</h1>
            </div>

            {!connectedAccount && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm font-bold text-yellow-800 dark:text-yellow-500">
                            {t('noAccountWarning', { defaultValue: 'Please connect an Instagram account first.' })}
                        </p>
                    </div>
                    <Link href="/account" className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-500 text-sm font-bold rounded-lg transition-colors whitespace-nowrap">
                        {t('connectAccount', { defaultValue: 'Go to Account' })}
                    </Link>
                </div>
            )}

            {error && (
                <div ref={errorRef} className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm mt-6">
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="w-full px-6 py-5 border-b border-card-border bg-gray-50/50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-100/50 dark:hover:bg-white/10 transition-colors cursor-pointer text-left"
                >
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-foreground">
                            {t('automationSettingsTitle', { defaultValue: 'Automation Settings' })}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {message && <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>{message}</span>}
                        <ChevronRight className={`w-5 h-5 text-muted-text transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : ''}`} />
                    </div>
                </button>
                
                {isSettingsOpen && (
                <div className="p-6 space-y-8 animate-in slide-in-from-top-2 duration-300">

                            {/* Auto DM Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <MessageCircle className="w-5 h-5 text-teal-500" />
                                    <h2 className="text-lg font-bold text-foreground">
                                        {t('autoDmTitle', { defaultValue: 'Auto DM reply' })}
                                    </h2>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-foreground">{t('autoDmToggleLabel', { defaultValue: 'Automatically reply to incoming direct messages' })}</h3>
                                    </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={autoDmReply} onChange={e => handleToggleDm(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {autoDmReply && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className={`flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-all ${!dmUseAi ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10' : 'border-card-border hover:border-gray-300 hover:bg-surface/80'}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <input type="radio" checked={!dmUseAi} onChange={() => setDmUseAi(false)} className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                                <span className="font-bold text-foreground">{t('dmModeTemplate', { defaultValue: 'Template' })}</span>
                                            </div>
                                            <p className="text-sm text-muted-text pl-8">{t('dmModeTemplateDesc', { defaultValue: 'Fixed reply text' })}</p>
                                        </label>
                                        <label className={`flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-all ${dmUseAi ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10' : 'border-card-border hover:border-gray-300 hover:bg-surface/80'}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <input type="radio" checked={dmUseAi} onChange={() => setDmUseAi(true)} className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                                <span className="font-bold text-foreground">{t('dmModeAi', { defaultValue: 'AI generated' })}</span>
                                            </div>
                                            <p className="text-sm text-muted-text pl-8">{t('dmModeAiDesc', { defaultValue: 'Gemini writes a contextual reply' })}</p>
                                        </label>
                                    </div>

                                    {!dmUseAi ? (
                                        <div className="space-y-2">
                                            <label className="font-bold text-foreground text-sm">{t('dmTemplateText', { defaultValue: 'Reply template' })}</label>
                                            <textarea 
                                                value={dmReplyTemplate} 
                                                onChange={e => setDmReplyTemplate(e.target.value)} 
                                                maxLength={1000}
                                                rows={4}
                                                placeholder={t('dmTemplatePlaceholder', { defaultValue: 'e.g. ありがとうございます！フォローありがとう 🎉' })}
                                                className="w-full p-3 border border-card-border rounded-xl bg-surface focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="font-bold text-foreground text-sm">{t('dmAiPersonality', { defaultValue: 'AI Personality/Tone' })}</label>
                                            <textarea 
                                                value={dmAiPersonality} 
                                                onChange={e => setDmAiPersonality(e.target.value)} 
                                                maxLength={500}
                                                rows={3}
                                                placeholder={t('dmAiPersonalityPlaceholder', { defaultValue: 'e.g. Warm and friendly. Use casual Japanese.' })}
                                                className="w-full p-3 border border-card-border rounded-xl bg-surface focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            </div>

                            {/* Auto Comment Section */}
                            <div className="mt-12 pt-8 border-t border-card-border">
                                <div className="flex items-center gap-2 mb-6">
                                    <MessageCircle className="w-5 h-5 text-indigo-500" />
                                    <h2 className="text-lg font-bold text-foreground">
                                        {t('autoCommentTitle', { defaultValue: 'Auto Comment reply' })}
                                    </h2>
                                </div>
                                
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-foreground">{t('autoCommentToggleLabel', { defaultValue: 'Automatically reply to incoming comments' })}</h3>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={autoCommentReply} onChange={e => handleToggleComment(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {autoCommentReply && (
                                    <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <label className={`flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-all ${!commentUseAi ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10' : 'border-card-border hover:border-gray-300 hover:bg-surface/80'}`}>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <input type="radio" checked={!commentUseAi} onChange={() => setCommentUseAi(false)} className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                                    <span className="font-bold text-foreground">{t('dmModeTemplate', { defaultValue: 'Template' })}</span>
                                                </div>
                                                <p className="text-sm text-muted-text pl-8">{t('dmModeTemplateDesc', { defaultValue: 'Fixed reply text' })}</p>
                                            </label>
                                            <label className={`flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-all ${commentUseAi ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10' : 'border-card-border hover:border-gray-300 hover:bg-surface/80'}`}>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <input type="radio" checked={commentUseAi} onChange={() => setCommentUseAi(true)} className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                                    <span className="font-bold text-foreground">{t('dmModeAi', { defaultValue: 'AI generated' })}</span>
                                                </div>
                                                <p className="text-sm text-muted-text pl-8">{t('dmModeAiDesc', { defaultValue: 'Gemini writes a contextual reply' })}</p>
                                            </label>
                                        </div>

                                        {!commentUseAi ? (
                                            <div className="space-y-2">
                                                <label className="font-bold text-foreground text-sm">{t('commentTemplateText', { defaultValue: 'Reply template' })}</label>
                                                <textarea 
                                                    value={commentReplyTemplate} 
                                                    onChange={e => setCommentReplyTemplate(e.target.value)} 
                                                    maxLength={1000}
                                                    rows={4}
                                                    placeholder={t('commentTemplatePlaceholder', { defaultValue: 'e.g. ありがとうございます！🎉' })}
                                                    className="w-full p-3 border border-card-border rounded-xl bg-surface focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="font-bold text-foreground text-sm">{t('commentAiPersonality', { defaultValue: 'AI Personality/Tone' })}</label>
                                                <textarea 
                                                    value={commentAiPersonality} 
                                                    onChange={e => setCommentAiPersonality(e.target.value)} 
                                                    maxLength={500}
                                                    rows={3}
                                                    placeholder={t('dmAiPersonalityPlaceholder', { defaultValue: 'e.g. Warm and friendly. Use casual Japanese.' })}
                                                    className="w-full p-3 border border-card-border rounded-xl bg-surface focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={() => handleSave()}
                            disabled={isSaving || !connectedAccount}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            {isSaving ? t('saving', { defaultValue: 'Saving...' }) : t('saveSettings', { defaultValue: 'Save settings' })}
                        </button>
                    </div>
                </div>
                )}
            </div>

            {/* Activity Log */}
            {(settings?.autoDmReply || settings?.autoCommentReply) && (
                <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-card-border bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-bold text-foreground">{t('recentActivity', { defaultValue: 'Recent activity' })}</h2>
                        </div>
                        <button
                            onClick={() => loadLog(logPage)}
                            disabled={isLoadingLog}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all disabled:opacity-50"
                        >
                            {isLoadingLog ? '...' : '↻ Refresh'}
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-card-border bg-surface/50 text-xs text-muted-text font-bold uppercase tracking-wider">
                                    <th className="px-6 py-3">{t('logType', { defaultValue: 'Type' })}</th>
                                    <th className="px-6 py-3">{t('logIgUserId', { defaultValue: 'IG User ID' })}</th>
                                    <th className="px-6 py-3">{t('logStatus', { defaultValue: 'Status' })}</th>
                                    <th className="px-6 py-3">{t('logDetails', { defaultValue: 'Details' })}</th>
                                    <th className="px-6 py-3">{t('logTime', { defaultValue: 'Time' })}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border">
                                {isLoadingLog && log.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-muted-text">{t('loading', { defaultValue: 'Loading...' })}</td>
                                    </tr>
                                ) : log.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <MessageCircle className="w-8 h-8 text-muted-text/30" />
                                                <p className="text-muted-text text-sm">{t('noActivity', { defaultValue: 'No activity yet' })}</p>
                                                <p className="text-muted-text/60 text-xs">DM events will appear here once automation is active</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    log.map((event) => (
                                        <tr key={event.id} className="hover:bg-surface/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {event.eventType === 'COMMENT_REPLY' ? (
                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                                        Comment reply
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                                                        DM reply
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium font-mono text-xs">{event.igUserId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${
                                                    event.status === 'DONE' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                    event.status === 'PENDING' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                                                    event.status === 'PROCESSING' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                                                    event.status === 'FAILED' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                    'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        event.status === 'DONE' ? 'bg-green-500' :
                                                        event.status === 'PENDING' ? 'bg-purple-500 animate-pulse' :
                                                        event.status === 'PROCESSING' ? 'bg-orange-500 animate-pulse' :
                                                        event.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-400'
                                                    }`} />
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm max-w-xs">
                                                <div className="space-y-1">
                                                    {event.incomingText && (
                                                        <div className="flex items-start gap-1.5">
                                                            <span className="text-muted-text/60 text-xs mt-0.5 shrink-0">IN:</span>
                                                            <span className="text-foreground truncate" title={event.incomingText}>{event.incomingText}</span>
                                                        </div>
                                                    )}
                                                    {event.outgoingText && (
                                                        <div className="flex items-start gap-1.5">
                                                            <span className="text-teal-500 text-xs mt-0.5 shrink-0">OUT:</span>
                                                            <span className="text-muted-text truncate" title={event.outgoingText}>{event.outgoingText}</span>
                                                        </div>
                                                    )}
                                                    {event.error && <div className="text-red-500 text-xs mt-1 truncate" title={event.error}>⚠ {event.error}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-text whitespace-nowrap">
                                                {new Date(event.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {totalLogPages > 1 && (
                        <div className="px-6 py-4 border-t border-card-border flex items-center justify-between">
                            <span className="text-sm text-muted-text">Page {logPage} of {totalLogPages}</span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => loadLog(logPage - 1)} 
                                    disabled={logPage === 1 || isLoadingLog}
                                    className="p-2 border border-card-border rounded-lg disabled:opacity-50 hover:bg-surface transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => loadLog(logPage + 1)} 
                                    disabled={logPage === totalLogPages || isLoadingLog}
                                    className="p-2 border border-card-border rounded-lg disabled:opacity-50 hover:bg-surface transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {pendingToggle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-card-border p-8 relative">
                        <button 
                            onClick={cancelToggle} 
                            className="absolute top-6 right-6 p-2 text-muted-text hover:text-foreground hover:bg-surface rounded-full transition-colors"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Data Access & Privacy</h2>
                                <p className="text-sm text-muted-text mt-1">What we access to power your automations</p>
                            </div>
                        </div>

                        <div className="space-y-6 text-sm text-foreground/90">
                            <p className="font-medium text-muted-text">
                                Before we enable automation, we want to be completely transparent about what data our app accesses from your connected Business or Creator profile, why we need it, and how it's protected.
                            </p>

                            <div className="space-y-4">
                                <div className="bg-surface rounded-2xl p-5 border border-card-border">
                                    <h3 className="font-bold text-base flex items-center gap-2 mb-3">
                                        <MessageCircle className="w-5 h-5 text-indigo-500" />
                                        1. Direct Message Data <span className="text-xs font-normal text-muted-text bg-card px-2 py-0.5 rounded-full border border-card-border">via manage_messages</span>
                                    </h3>
                                    <p className="text-muted-text mb-2">We access DMs <strong>so that</strong> we can trigger instant auto-replies when customers message you.</p>
                                    <ul className="list-disc list-outside ml-5 space-y-1 text-muted-text">
                                        <li>Access to <strong>full text, voice notes, links, and media</strong> within customer DMs.</li>
                                        <li>Access to <strong>sender profiles</strong> (Name, profile picture, and platform-scoped ID).</li>
                                        <li>Access to <strong>thread metadata</strong> (Timestamps, read receipts, and delivery status).</li>
                                        <li>Authority to <strong>automatically send messages</strong> and apply tags on your behalf.</li>
                                    </ul>
                                </div>

                                <div className="bg-surface rounded-2xl p-5 border border-card-border">
                                    <h3 className="font-bold text-base flex items-center gap-2 mb-3">
                                        <MessageCircle className="w-5 h-5 text-teal-500" />
                                        2. Comment Data <span className="text-xs font-normal text-muted-text bg-card px-2 py-0.5 rounded-full border border-card-border">via manage_comments</span>
                                    </h3>
                                    <p className="text-muted-text mb-2">We access comments <strong>so that</strong> we can instantly auto-send your lead magnet links when a customer comments on your Reel or post.</p>
                                    <ul className="list-disc list-outside ml-5 space-y-1 text-muted-text">
                                        <li>Access to <strong>public text and media</strong> left on posts, Reels, and live videos.</li>
                                        <li>Access to the commenter's <strong>public profile name and ID</strong>.</li>
                                        <li>Linkage to the <strong>specific post or ad campaign</strong> being commented on.</li>
                                        <li>Authority to <strong>reply to, hide, or delete comments</strong> based on automation rules.</li>
                                    </ul>
                                </div>

                                <div className="bg-surface rounded-2xl p-5 border border-card-border">
                                    <h3 className="font-bold text-base flex items-center gap-2 mb-3">
                                        <UserCircle className="w-5 h-5 text-purple-500" />
                                        3. Account Metadata
                                    </h3>
                                    <p className="text-muted-text mb-2">We access account details <strong>so that</strong> we can securely route messages to the correct automation flow.</p>
                                    <ul className="list-disc list-outside ml-5 space-y-1 text-muted-text">
                                        <li>Access to connected <strong>Business Page names, categories, and API access tokens</strong>.</li>
                                    </ul>
                                </div>

                                <div className="bg-surface rounded-2xl p-5 border border-card-border">
                                    <h3 className="font-bold text-base flex items-center gap-2 mb-3">
                                        <Lock className="w-5 h-5 text-green-500" />
                                        4. Data Security & Usage
                                    </h3>
                                    <ul className="list-disc list-outside ml-5 space-y-2 text-muted-text">
                                        <li>Data is stored securely solely to power the <strong>live-chat history dashboard</strong>.</li>
                                        <li><strong>We do not sell customer interaction data to data brokers or third-party advertisers.</strong></li>
                                        <li>If AI features are used, data is processed securely and <strong>never used to train public LLM models</strong>.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-card-border mt-8">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={modalAgreed}
                                        onChange={(e) => setModalAgreed(e.target.checked)}
                                        className="mt-0.5 w-5 h-5 rounded border-card-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-foreground group-hover:text-indigo-600 transition-colors">
                                        I have read and agree to the data access and privacy terms outlined above.
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-4 pt-4 mt-4">
                                <button 
                                    onClick={cancelToggle} 
                                    className="flex-1 py-3 bg-surface hover:bg-gray-100 dark:hover:bg-white/5 border border-card-border text-foreground font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmToggle} 
                                    disabled={!modalAgreed}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-colors"
                                >
                                    I Understand & Enable
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
