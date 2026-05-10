'use client'

import React, { useState } from 'react'
import { Settings, CreditCard, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { useSettings } from './hooks/useSettings'

interface SettingsClientProps {
    user: {
        name: string | null
        email: string | null
        aiUsageOption: string
    }
}

const AI_OPTIONS = [
    { id: 'No AI', label: 'AIを使用しない (No AI)', desc: 'すべて手動で作成します。' },
    { id: 'Slight AI Use', label: 'やや使用する (Slight AI Use)', desc: 'ベースとなる部分のみAIがサポートします。' },
    { id: 'Normal AI Use', label: '通常使用 (Normal AI Use)', desc: 'バランス良くAIを活用して生成します。' },
    { id: 'Strong AI Use', label: '積極的に使用する (Strong AI Use)', desc: 'AIがクリエイティビティを発揮し、大胆な提案を行います。' }
]

export default function SettingsClient({ user }: SettingsClientProps) {
    const {
        selectedAiOption, setSelectedAiOption,
        isSaving, message, handleSaveAiOption
    } = useSettings(user.aiUsageOption)

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">システム設定</h1>
            </div>

            {/* AI Preferences */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-card-border bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-foreground">AI 使用レベルの設定</h2>
                    </div>
                    {message && <span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>{message}</span>}
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {AI_OPTIONS.map((opt) => (
                            <label key={opt.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedAiOption === opt.id ? 'border-indigo-500 bg-indigo-50/30' : 'border-card-border hover:border-gray-300 hover:bg-surface/80 dark:hover:bg-surface/50'}`}>
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
                                    <h3 className={`font-bold ${selectedAiOption === opt.id ? 'text-indigo-900' : 'text-foreground'}`}>{opt.label}</h3>
                                    <p className="text-sm text-muted-text mt-1">{opt.desc}</p>
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
                            {isSaving ? '保存中...' : '設定を保存'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Payments / Billing Mockup */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-card-border bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-lg font-bold text-foreground">お支払い情報</h2>
                    </div>
                    <span className="px-3 py-1 bg-surface text-muted-text text-xs font-bold rounded-lg border border-card-border">今後のアップデートで実装予定</span>
                </div>
                <div className="p-6 opacity-60 pointer-events-none select-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current Plan */}
                        <div className="border border-card-border rounded-xl p-5 bg-gray-50/50">
                            <h3 className="text-sm font-bold text-muted-text mb-1">現在のプラン</h3>
                            <div className="text-2xl font-black text-foreground mb-4">フリープラン</div>
                            <ul className="space-y-2 text-sm text-muted-text">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 月間 20投稿</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 基本的なAI機能</li>
                                <li className="flex items-center gap-2 text-muted-text/80"><AlertCircle className="w-4 h-4"/> チームメンバー追加制限</li>
                            </ul>
                            <button className="mt-6 w-full py-2 bg-card border border-card-border rounded-lg font-bold text-muted-text/80">プランをアップグレード</button>
                        </div>
                        
                        {/* Selected Payment Method */}
                        <div className="border border-card-border rounded-xl p-5 bg-gray-50/50">
                            <h3 className="text-sm font-bold text-muted-text mb-4">登録済みのカード</h3>
                            <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-card-border rounded-xl bg-card">
                                <CreditCard className="w-8 h-8 text-gray-300 mb-2" />
                                <span className="text-sm font-bold text-muted-text/80">カード情報がありません</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
