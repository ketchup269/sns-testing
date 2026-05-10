'use client'

import Link from 'next/link'
import {
    Instagram, CheckCircle2, AlertCircle, Clock, ShieldCheck,
    RefreshCw, ChevronRight, UserCircle, LogOut, Check, MoreHorizontal,
    ArrowRight, LinkIcon
} from 'lucide-react'
import { disconnectAccount } from './actions'

interface ConnectedAccount {
    id: string
    username: string | null
    profilePictureUrl: string | null
    tokenExpiry: Date
    createdAt: Date
}

interface AccountClientProps {
    connectedAccounts: ConnectedAccount[]
    error?: string
    success?: string
}

export default function AccountClient({ connectedAccounts, error, success }: AccountClientProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Instagramアカウント</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2.5 px-6 py-3 bg-card border border-card-border text-foreground/80 rounded-2xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-surface/80 dark:hover:bg-surface/50 transition-all duration-200 ease-out active:scale-95">
                        <RefreshCw className="w-5 h-5" />全て更新
                    </button>
                </div>
            </div>

            {/* Status banners */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{success}</p>
                </div>
            )}

            {/* Connect Banner */}
            <div className="bg-card rounded-3xl border border-card-border p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Facebookで連携</h2>
                        <p className="text-sm text-muted-text mt-1 max-w-md">Facebookで認証することで、Instagramビジネスアカウントを安全に連携できます。</p>
                    </div>
                </div>
                <Link href="/api/auth/facebook" className="w-full md:w-auto px-8 py-3.5 bg-[#1877F2] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 hover:bg-[#166FE5] transition-all duration-200 ease-out active:scale-95 text-center shrink-0">
                    アカウントを連携する
                </Link>
            </div>

            {/* Connected Accounts */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-foreground">連携済みプロフィール ({connectedAccounts.length})</h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-text/80 uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />最終同期: ライブ
                    </div>
                </div>

                {connectedAccounts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {connectedAccounts.map((account) => (
                            <div key={account.id} className="bg-card rounded-3xl border border-card-border p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 instagram-gradient opacity-[0.03] rounded-bl-full -mr-8 -mt-8" />
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 instagram-gradient rounded-2xl flex items-center justify-center p-1 shadow-md">
                                            <div className="w-full h-full rounded-xl bg-card flex items-center justify-center overflow-hidden">
                                                {account.profilePictureUrl
                                                    ? <img src={account.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                    : <UserCircle className="w-8 h-8 instagram-text-gradient" />
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">@{account.username || 'unknown'}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-muted-text bg-surface px-2 py-0.5 rounded-lg border border-card-border uppercase tracking-tight">ビジネスアカウント</span>
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                                                    <CheckCircle2 className="w-3 h-3" />アクティブ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-surface/80 dark:hover:bg-surface/50 rounded-xl transition-all duration-200 ease-out active:scale-95 border border-transparent hover:border-gray-100">
                                        <MoreHorizontal className="w-5 h-5 text-muted-text/80" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-card-border relative z-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">トークンステータス</p>
                                        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-purple-500" />
                                            {account.tokenExpiry < new Date()
                                                ? '期限切れ'
                                                : `あと ${Math.ceil((new Date(account.tokenExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} 日で期限切れ`
                                            }
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] font-bold text-muted-text/80 uppercase tracking-widest">連携日</p>
                                        <p className="text-sm font-medium text-muted-text">{new Date(account.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8 pt-6 border-t border-card-border relative z-10">
                                    <button className="flex-1 py-3 bg-surface border border-card-border text-foreground/80 rounded-xl text-sm font-bold hover:bg-surface dark:hover:bg-surface/80 transition-all duration-200 ease-out active:scale-95 flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4" />更新
                                    </button>
                                    <form action={async () => { await disconnectAccount(account.id) }} className="flex-1">
                                        <button className="w-full py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all duration-200 ease-out active:scale-95 flex items-center justify-center gap-2">
                                            <LogOut className="w-4 h-4" />切断する
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card rounded-3xl border border-card-border p-20 text-center shadow-sm">
                        <div className="w-20 h-20 instagram-gradient rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-900/20 rotate-12">
                            <Instagram className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">Instagramアカウント未連携</h3>
                        <p className="text-muted-text mt-2 max-w-sm mx-auto leading-relaxed">最初のInstagramビジネスアカウントを連携して、今日からコンテンツ戦略の自動化を始めましょう。</p>
                        <button className="mt-8 px-8 py-4 instagram-gradient text-white rounded-2xl font-bold shadow-lg shadow-gray-900/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 ease-out active:scale-95 inline-flex items-center gap-2">
                            今すぐ連携する<ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Guide & Requirements */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[2.5rem] border border-purple-100 p-10 flex flex-col">
                    <div className="mb-10">
                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] bg-purple-100 px-3 py-1 rounded-full border border-purple-200">ガイド</span>
                        <h3 className="text-2xl font-bold text-foreground mt-4">接続フロー</h3>
                    </div>
                    <div className="space-y-8 flex-1">
                        {[
                            { step: '01', title: 'アカウント切替', desc: 'IGプロフィールをビジネスまたはクリエイターに変更してください。' },
                            { step: '02', title: 'Facebook連携', desc: 'IGプロフィールを管理するFacebookページと連携させてください。' },
                            { step: '03', title: 'アプリ認証', desc: 'Postaraにメディアとデータ管理の権限を付与してください。' },
                        ].map((item, idx) => (
                            <div key={item.step} className="flex gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center text-lg font-black text-purple-600 shadow-sm border border-purple-100 group-hover:scale-110 transition-transform">
                                    {item.step}
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground flex items-center gap-2">
                                        {item.title}
                                        {idx === 0 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    </h4>
                                    <p className="text-sm text-muted-text mt-1 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-12 text-sm font-bold text-purple-600 flex items-center gap-2 group hover:gap-3 hover:translate-x-1 transition-all duration-200 ease-out active:scale-95">
                        ドキュメントを読む <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>

                <div className="bg-card rounded-[2.5rem] border border-card-border p-10 shadow-sm">
                    <div className="mb-10">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">前提条件</span>
                        <h3 className="text-2xl font-bold text-foreground mt-4">API互換性</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { title: 'ビジネスカテゴリ', label: '必須', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
                            { title: '管理者権限', label: '確認済み', icon: LinkIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
                            { title: '公開Webhook', label: 'アクティブ', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
                            { title: 'アプリスコープ', label: '承認済み', icon: Check, color: 'text-pink-500', bg: 'bg-pink-50' },
                        ].map((req) => (
                            <div key={req.title} className="p-6 rounded-3xl border border-card-border bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all group">
                                <div className={`w-10 h-10 ${req.bg} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                    <req.icon className={`w-5 h-5 ${req.color}`} />
                                </div>
                                <h4 className="text-sm font-bold text-foreground">{req.title}</h4>
                                <p className="text-[10px] font-bold text-muted-text/80 mt-1 uppercase tracking-widest">{req.label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 p-5 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-orange-900">個人アカウントは非対応</p>
                            <p className="text-xs text-orange-700 mt-1 leading-relaxed">Meta APIはビジネスおよびクリエイタープロフィールのみ自動化に対応しています。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
