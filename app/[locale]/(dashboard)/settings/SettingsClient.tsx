'use client'

import React, { useState } from 'react'
import { Settings, CreditCard, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSettings } from './hooks/useSettings'

import { useTranslations } from 'next-intl'

interface SettingsClientProps {
    user: {
        name: string | null
        email: string | null
        aiUsageOption: string
    }
}

const AI_OPTIONS = [
    { id: 'No AI', labelKey: 'noAi', descKey: 'noAiDesc' },
    { id: 'Slight AI Use', labelKey: 'slightAi', descKey: 'slightAiDesc' },
    { id: 'Normal AI Use', labelKey: 'normalAi', descKey: 'normalAiDesc' },
    { id: 'Strong AI Use', labelKey: 'strongAi', descKey: 'strongAiDesc' }
]

export default function SettingsClient({ user }: SettingsClientProps) {
    const t = useTranslations('Settings')
    const {
        selectedAiOption, setSelectedAiOption,
        isSaving, message, error, handleSaveAiOption
    } = useSettings(user.aiUsageOption)

    const errorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [error])

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('title')}</h1>
            </div>

            {/* Error Banner */}
            {error && (
                <div 
                    ref={errorRef}
                    className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300"
                >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* AI Preferences */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-card-border bg-gray-50/50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-foreground">{t('aiPreferences')}</h2>
                    </div>
                    {message && <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>{message}</span>}
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {AI_OPTIONS.map((opt) => (
                            <label key={opt.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedAiOption === opt.id ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10' : 'border-card-border hover:border-gray-300 hover:bg-surface/80 dark:hover:bg-surface/50'}`}>
                                <div className="mt-0.5">
                                    <input 
                                        type="radio" 
                                        name="aiOption" 
                                        value={opt.id} 
                                        checked={selectedAiOption === opt.id}
                                        onChange={() => setSelectedAiOption(opt.id)}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${selectedAiOption === opt.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-foreground'}`}>{t(opt.labelKey as any)}</h3>
                                    <p className="text-sm text-muted-text mt-1">{t(opt.descKey as any)}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button 
                            onClick={handleSaveAiOption}
                            disabled={isSaving || selectedAiOption === user.aiUsageOption}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                        >
                            {isSaving ? t('saving') : t('saveSettings')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Payments / Billing Mockup */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-card-border bg-gray-50/50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-lg font-bold text-foreground">{t('billing')}</h2>
                    </div>
                    <span className="px-3 py-1 bg-surface text-muted-text text-xs font-bold rounded-lg border border-card-border">{t('billingComingSoon')}</span>
                </div>
                <div className="p-6 opacity-60 pointer-events-none select-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current Plan */}
                        <div className="border border-card-border rounded-xl p-5 bg-gray-50/50 dark:bg-white/5">
                            <h3 className="text-sm font-bold text-muted-text mb-1">{t('currentPlan')}</h3>
                            <div className="text-2xl font-black text-foreground mb-4">{t('freePlan')}</div>
                            <ul className="space-y-2 text-sm text-muted-text">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> {t('monthlyPosts')}</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> {t('basicAi')}</li>
                                <li className="flex items-center gap-2 text-muted-text/80"><AlertCircle className="w-4 h-4"/> {t('teamLimit')}</li>
                            </ul>
                            <button className="mt-6 w-full py-2 bg-card border border-card-border rounded-lg font-bold text-muted-text/80">{t('upgradePlan')}</button>
                        </div>
                        
                        {/* Selected Payment Method */}
                        <div className="border border-card-border rounded-xl p-5 bg-gray-50/50 dark:bg-white/5">
                            <h3 className="text-sm font-bold text-muted-text mb-4">{t('registeredCard')}</h3>
                            <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-card-border rounded-xl bg-card">
                                <CreditCard className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                                <span className="text-sm font-bold text-muted-text/80">{t('noCard')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
