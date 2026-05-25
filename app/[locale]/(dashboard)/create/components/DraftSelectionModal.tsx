'use client'

import React from 'react'
import {
    X,
    FileEdit,
    Loader2,
    Images,
    FolderPlus
} from 'lucide-react'
import { HistoryItem } from '../types'

interface DraftSelectionModalProps {
    show: boolean
    onClose: () => void
    selectedProjectId: string | null
    drafts: HistoryItem[]
    isLoadingDrafts: boolean
    handleSelectDraft: (draft: HistoryItem) => void
}

export function DraftSelectionModal({
    show,
    onClose,
    selectedProjectId,
    drafts,
    isLoadingDrafts,
    handleSelectDraft
}: DraftSelectionModalProps) {
    if (!show) return null

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card max-w-2xl w-full max-h-[85vh] rounded-3xl shadow-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-card-border">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">下書き</h2>
                        <p className="text-sm font-medium text-muted-text mt-1">保存した下書きを再開します</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface dark:hover:bg-surface/80 rounded-full text-muted-text transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {!selectedProjectId ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <FolderPlus className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-muted-text font-bold mb-1">プロジェクトが選択されていません</p>
                            <p className="text-muted-text/80 text-sm">下書きを表示するにはプロジェクトを選択してください</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {isLoadingDrafts ? (
                                <div className="py-20 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
                                    <p className="text-muted-text font-medium text-sm">読み込み中...</p>
                                </div>
                            ) : drafts.length > 0 ? (
                                drafts.map((draft) => (
                                    <div 
                                        key={draft.id}
                                        onClick={() => {
                                            handleSelectDraft(draft)
                                            onClose()
                                        }}
                                        className="flex gap-4 bg-card rounded-2xl border border-card-border p-4 cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-md transition-all group"
                                    >
                                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-card-border relative">
                                            <img src={(() => {
                                                try {
                                                    if (draft.imageUrl && draft.imageUrl.startsWith('[')) {
                                                        return JSON.parse(draft.imageUrl)[0]
                                                    }
                                                } catch {}
                                                return draft.imageUrl
                                            })()} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            {draft.imageUrl && draft.imageUrl.startsWith('[') && (
                                                <div className="absolute bottom-1 right-1 bg-black/60 rounded-md px-1.5 py-0.5">
                                                    <Images className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed">{draft.caption || '（キャプションなし）'}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] text-muted-text/80 font-medium">{new Date(draft.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">下書き</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-500/20">編集する</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <FileEdit className="w-12 h-12 text-gray-300 mb-4" />
                                    <p className="text-muted-text font-bold mb-1">下書きがありません</p>
                                    <p className="text-muted-text/80 text-sm">下書きボタンで保存すると、ここに表示されます</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
