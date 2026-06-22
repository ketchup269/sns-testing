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
        <div className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in duration-500 pb-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('title')}</h1>
            </div>

            {/* Error Banner */}
            {error && (
                <div
                    ref={errorRef}
                    className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300"
                >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* AI Preferences */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-card-border bg-gray-50/50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-foreground">{t('aiPreferences')}</h2>
                    </div>
                    {message && (
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />{message}
                        </span>
                    )}
                </div>
                <div className="p-5">
                    <div className="space-y-3">
                        {AI_OPTIONS.map((opt) => (
                            <label
                                key={opt.id}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                    selectedAiOption === opt.id
                                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10'
                                        : 'border-card-border hover:border-gray-300 hover:bg-surface/80 dark:hover:bg-surface/50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="aiOption"
                                    value={opt.id}
                                    checked={selectedAiOption === opt.id}
                                    onChange={() => setSelectedAiOption(opt.id)}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <span className={`text-sm font-bold ${selectedAiOption === opt.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-foreground'}`}>
                                        {t(opt.labelKey as any)}
                                    </span>
                                    <span className="text-sm text-muted-text ml-2">
                                        {t(opt.descKey as any)}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSaveAiOption}
                            disabled={isSaving || selectedAiOption === user.aiUsageOption}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                        >
                            {isSaving ? t('saving') : t('saveSettings')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Billing — collapsed until feature is live */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-card-border bg-gray-50/50 dark:bg-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-lg font-bold text-foreground">{t('billing')}</h2>
                    </div>
                    <span className="px-3 py-1 bg-surface text-muted-text text-xs font-bold rounded-lg border border-card-border">
                        {t('billingComingSoon')}
                    </span>
                </div>
                <div className="px-5 py-4 flex items-center gap-3 opacity-60 pointer-events-none select-none">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-muted-text">{t('freePlan')} · {t('noCard')}</span>
                </div>
            </div>

        </div>
    )
}