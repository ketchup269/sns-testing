'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bot, CheckCircle2, AlertCircle, MessageCircle, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { saveAutomationSettings, getAutomationLog } from './actions'
import Link from 'next/link'

interface AutomationClientProps {
    settings: any | null
    connectedAccount: { id: string; username: string | null } | null
}

export default function AutomationClient({ settings, connectedAccount }: AutomationClientProps) {
    const t = useTranslations('Automation')
    
    
    const [autoDmReply, setAutoDmReply] = useState(settings?.autoDmReply ?? false)
    const [dmReplyTemplate, setDmReplyTemplate] = useState(settings?.dmReplyTemplate ?? '')
    const [dmReplyDelayMin, setDmReplyDelayMin] = useState(settings?.dmReplyDelayMin ?? 1)
    const [dmReplyDelayMax, setDmReplyDelayMax] = useState(settings?.dmReplyDelayMax ?? 10)
    const [dmUseAi, setDmUseAi] = useState(settings?.dmUseAi ?? false)
    const [dmAiPersonality, setDmAiPersonality] = useState(settings?.dmAiPersonality ?? '')
    
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    

    
    const [logPage, setLogPage] = useState(1)
    const [log, setLog] = useState<any[]>([])
    const [totalLogPages, setTotalLogPages] = useState(1)
    const [isLoadingLog, setIsLoadingLog] = useState(false)

    const errorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [error])

    useEffect(() => {
        loadLog(1)
    }, [])

    const loadLog = async (page: number) => {
        setIsLoadingLog(true)
        const res = await getAutomationLog(page, 20)
        setIsLoadingLog(false)
        if (res.success && res.data) {
            setLog(res.data.events)
            setTotalLogPages(res.data.pages)
            setLogPage(page)
        }
    }

    const handleSave = async () => {
        if (!connectedAccount) return
        
        setError('')
        setMessage('')
        

        
        if (autoDmReply && dmReplyDelayMin > dmReplyDelayMax) {
            setError('DM reply min delay cannot be greater than max delay')
            return
        }
        
        setIsSaving(true)
        const res = await saveAutomationSettings({
            connectedAccountId: connectedAccount.id,

            autoDmReply,
            dmReplyTemplate,
            dmReplyDelayMin,
            dmReplyDelayMax,
            dmUseAi,
            dmAiPersonality
        })
        setIsSaving(false)
        
        if (res.error) setError(res.error)
        else setMessage(t('saveSuccess', { defaultValue: 'Settings saved successfully!' }))
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
                <div className="px-6 py-5 border-b border-card-border bg-gray-50/50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-teal-500" />
                        <h2 className="text-lg font-bold text-foreground">
                            {t('autoDmTitle', { defaultValue: 'Auto DM reply' })}
                        </h2>
                    </div>
                    {message && <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>{message}</span>}
                </div>
                
                <div className="p-6 space-y-8">

                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-foreground">{t('autoDmToggleLabel', { defaultValue: 'Automatically reply to incoming direct messages' })}</h3>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={autoDmReply} onChange={e => setAutoDmReply(e.target.checked)} />
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

                                    <div>
                                        <h4 className="font-bold text-foreground">{t('responseDelay', { defaultValue: 'Response delay (minutes)' })}</h4>
                                        <p className="text-sm text-muted-text mt-1">{t('responseDelayDesc', { defaultValue: 'A random delay makes the action look natural' })}</p>
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex flex-col gap-1 w-32">
                                                <label className="text-xs font-bold text-muted-text">Min</label>
                                                <input type="number" min="1" max="60" value={dmReplyDelayMin} onChange={e => setDmReplyDelayMin(parseInt(e.target.value))} className="w-full p-2 border border-card-border rounded-xl bg-surface focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div className="flex flex-col gap-1 w-32">
                                                <label className="text-xs font-bold text-muted-text">Max</label>
                                                <input type="number" min="1" max="120" value={dmReplyDelayMax} onChange={e => setDmReplyDelayMax(parseInt(e.target.value))} className="w-full p-2 border border-card-border rounded-xl bg-surface focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}


                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || !connectedAccount}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            {isSaving ? t('saving', { defaultValue: 'Saving...' }) : t('saveSettings', { defaultValue: 'Save settings' })}
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Log */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-card-border bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-bold text-foreground">{t('recentActivity', { defaultValue: 'Recent activity' })}</h2>
                    </div>
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
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-text">{t('noActivity', { defaultValue: 'No activity yet' })}</td>
                                </tr>
                            ) : (
                                log.map((event) => (
                                    <tr key={event.id} className="hover:bg-surface/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                                                    DM reply
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">{event.igUserId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {event.status === 'DONE' && <span className="text-green-600 dark:text-green-400 font-bold text-sm">DONE</span>}
                                            {event.status === 'PENDING' && <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">PENDING</span>}
                                            {event.status === 'PROCESSING' && <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">PROCESSING</span>}
                                            {event.status === 'FAILED' && <span className="text-red-600 dark:text-red-400 font-bold text-sm">FAILED</span>}
                                            {event.status === 'SKIPPED' && <span className="text-gray-500 font-bold text-sm">SKIPPED</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-text max-w-xs truncate">
                                            {`${event.incomingText?.substring(0,20) ?? ''}... → ${event.outgoingText?.substring(0,20) ?? ''}...`}
                                            {event.error && <div className="text-red-500 text-xs mt-1 truncate" title={event.error}>{event.error}</div>}
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
        </div>
    )
}
