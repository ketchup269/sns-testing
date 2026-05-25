'use client'

import React from 'react'
import {
    Heart,
    MessageSquare,
    Send,
    Bookmark,
    Instagram,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ConnectedAccount, MediaItem } from '../types'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface MobilePreviewModalProps {
    show: boolean
    onClose: () => void
    mediaItems: MediaItem[]
    caption: string
    previewIndex: number
    setPreviewIndex: React.Dispatch<React.SetStateAction<number>>
    account?: ConnectedAccount
}

export function MobilePreviewModal({
    show,
    onClose,
    mediaItems,
    caption,
    previewIndex,
    setPreviewIndex,
    account
}: MobilePreviewModalProps) {
    if (!show) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="relative w-[393px] h-[852px] scale-[0.55] sm:scale-[0.65] origin-center bg-card rounded-[55px] shadow-[0_0_0_12px_#000,0_0_0_14px_#333,0_0_0_16px_#000,0_40px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                
                {/* Hardware Details (Side buttons) */}
                <div className="absolute top-[120px] -left-[14px] w-[3px] h-[32px] bg-[#111] rounded-l-md" />
                <div className="absolute top-[170px] -left-[14px] w-[3px] h-[64px] bg-[#111] rounded-l-md" />
                <div className="absolute top-[250px] -left-[14px] w-[3px] h-[64px] bg-[#111] rounded-l-md" />
                <div className="absolute top-[200px] -right-[14px] w-[3px] h-[96px] bg-[#111] rounded-r-md" />

                {/* iPhone 17 Pro Dynamic Island fake */}
                <div className="h-[44px] w-full flex justify-center pt-2.5 bg-card z-20 shrink-0 absolute top-0 left-0">
                    <div className="w-[120px] h-[35px] bg-black rounded-[20px] flex items-center px-3 justify-end shadow-inner relative">
                        <div className="w-3 h-3 rounded-full bg-black/90 border border-white/10 shadow-[inset_0_0_3px_rgba(255,255,255,0.2)] ml-auto relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-900 rounded-full blur-[1px]"></div>
                        </div>
                    </div>
                </div>
                
                {/* Header Spacer for Island */}
                <div className="h-[54px] w-full bg-card shrink-0" />
                
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-card-border shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-card border border-transparent overflow-hidden">
                                {(account && 'profilePictureUrl' in account && account.profilePictureUrl) ? (
                                    <img src={account.profilePictureUrl as string} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <Instagram className="w-full h-full p-1 text-muted-text/80" />
                                )}
                            </div>
                        </div>
                        <span className="text-xs font-bold text-foreground">{account?.username || account?.pageId || 'username'}</span>
                    </div>
                    <span className="text-foreground font-bold tracking-widest text-xs">...</span>
                </div>

                {/* Media — carousel support */}
                <div className="w-full aspect-square bg-surface relative shrink-0 overflow-hidden">
                    {mediaItems.length > 0 && (() => {
                        const idx = Math.min(previewIndex, mediaItems.length - 1)
                        const item = mediaItems[idx]
                        if(!item) return null;
                        const src = item.type === 'file' ? URL.createObjectURL(item.file) : item.url
                        return <img src={src} className="w-full h-full object-cover" alt="Preview" />
                    })()}
                    {mediaItems.length > 1 && (
                        <>
                            <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{Math.min(previewIndex, mediaItems.length - 1) + 1}/{mediaItems.length}</div>
                            {previewIndex > 0 && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewIndex(i => Math.max(0, i - 1)) }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all">
                                    <ChevronLeft className="w-4 h-4 text-gray-800" />
                                </button>
                            )}
                            {previewIndex < mediaItems.length - 1 && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewIndex(i => Math.min(mediaItems.length - 1, i + 1)) }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all">
                                    <ChevronRight className="w-4 h-4 text-gray-800" />
                                </button>
                            )}
                            {/* Carousel dots */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                                {mediaItems.map((_, i) => (
                                    <button 
                                        key={i} 
                                        type="button" 
                                        onClick={(e) => { e.stopPropagation(); setPreviewIndex(i) }} 
                                        className={cn("w-1.5 h-1.5 rounded-full transition-all", i === Math.min(previewIndex, mediaItems.length - 1) ? "bg-blue-500 w-3" : "bg-white/70 shadow-sm shadow-black/20")} 
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="px-3 py-2 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-4">
                            <Heart className="w-6 h-6 text-foreground" />
                            <MessageSquare className="w-6 h-6 text-foreground" />
                            <Send className="w-6 h-6 text-foreground" />
                        </div>
                        <Bookmark className="w-6 h-6 text-foreground" />
                    </div>
                    <p className="text-xs font-bold text-foreground mb-1">0 likes</p>
                </div>

                {/* Caption Scrollable Area */}
                <div className="px-3 pb-6 flex-1 overflow-y-auto min-h-0">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                        <span className="font-bold mr-2">{account?.username || account?.pageId || 'username'}</span>
                        {caption || 'キャプションがここに表示されます...'}
                    </p>
                </div>
                
                <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2">
                    <X className="w-8 h-8"/>
                </button>
            </div>
        </div>
    )
}
