'use client'

import { useState, useEffect } from 'react'
import { MediaItem, HistoryItem, ProjectImage } from '../types'

export function useMediaManagement() {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])

    const isVideo = mediaItems.length > 0 && (
        mediaItems[0].type === 'file'
            ? mediaItems[0].file.type.startsWith('video/')
            : mediaItems[0].isVideo
    )


    /** Accept newly dropped/selected files. Videos are limited to 1; images can be many. */
    const handleFiles = (incoming: File[]) => {
        if (incoming.length === 0) return
        const first = incoming[0]
        const firstIsVideo = first.type.startsWith('video/')

        const newItems: MediaItem[] = incoming.map(f => ({
            type: 'file' as const,
            file: f,
            id: Math.random().toString(36).slice(2)
        }))

        if (firstIsVideo) {
            // Only 1 video/reel at a time
            setMediaItems([newItems[0]])
        } else {
            setMediaItems(prev => {
                const filtered = prev.filter(item =>
                    item.type === 'file' ? !item.file.type.startsWith('video/') : !item.isVideo
                )
                return [...filtered, ...newItems.filter(
                    item => item.type === 'file' && !item.file.type.startsWith('video/')
                )]
            })
        }
    }

    /** Remove one media item by id */
    const removeMedia = (id: string) => {
        setMediaItems(prev => prev.filter(m => m.id !== id))
    }

    /** Clear all media */
    const clearMedia = () => setMediaItems([])

    /** Load media from a draft post — supports both single and carousel URLs */
    const loadFromDraft = (draft: HistoryItem) => {
        let urls: string[] = []
        try {
            if (draft.imageUrl?.startsWith('[')) {
                urls = JSON.parse(draft.imageUrl)
            } else {
                urls = [draft.imageUrl]
            }
        } catch {
            urls = [draft.imageUrl]
        }
        setMediaItems(urls.map(url => ({
            type: 'url' as const,
            url,
            isVideo: draft.mediaType === 'VIDEO',
            id: Math.random().toString(36).slice(2)
        })))
    }

    /** Load media from a historical high-performing post */
    const loadFromHistory = (hist: HistoryItem) => {
        let urls: string[] = []
        try {
            if (hist.imageUrl?.startsWith('[')) {
                urls = JSON.parse(hist.imageUrl)
            } else {
                urls = [hist.imageUrl]
            }
        } catch {
            urls = [hist.imageUrl]
        }

        const isHistVideo = hist.mediaType === 'VIDEO'
        if (isHistVideo) {
            setMediaItems([{ type: 'url', url: urls[0], isVideo: true, id: Math.random().toString(36).slice(2) }])
        } else {
            setMediaItems(prev => {
                const filtered = prev.filter(item =>
                    item.type === 'file' ? !item.file.type.startsWith('video/') : !item.isVideo
                )
                const newItems = urls.map(url => ({
                    type: 'url' as const,
                    url,
                    isVideo: false,
                    id: Math.random().toString(36).slice(2)
                }))
                return [...filtered, ...newItems]
            })
        }
    }

    /** Load a single image from the project image library */
    const loadFromLibrary = (img: ProjectImage) => {
        setMediaItems(prev => {
            const hasVideo = prev.some(item =>
                item.type === 'file' ? item.file.type.startsWith('video/') : item.isVideo
            )
            if (hasVideo) return prev

            return [...prev, {
                type: 'url' as const,
                url: img.url,
                isVideo: false,
                id: Math.random().toString(36).slice(2),
                libraryImageId: img.id
            }]
        })
    }

    return {
        mediaItems,
        setMediaItems,
        isVideo,
        handleFiles,
        removeMedia,
        loadFromDraft,
        loadFromHistory,
        loadFromLibrary
    }
}
