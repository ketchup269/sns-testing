'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@supabase/supabase-js'
import { publishNow, schedulePost, saveDraft, getSignedUploadUrl } from '../actions'
import { ActionResult } from '@/lib/types'
import { MediaItem } from '../types'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PublishOptions {
    caption: string
    selectedAccountId: string
    selectedProjectId: string
    isVideo: boolean
    scheduledFor?: string
    mediaItems: MediaItem[]
}

export function usePublishing() {
    const [result, setResult] = useState<ActionResult<any> | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isPending, startTransition] = useTransition()

    const clearResult = () => setResult(null)

    const isPublishing = isPending || isUploading

    /** Upload all media items to Supabase Storage, returning an array of public URLs */
    const uploadAllMedia = async (mediaItems: MediaItem[]): Promise<string[] | null> => {
        if (mediaItems.length === 0) return null
        setIsUploading(true)
        try {
            const urls = await Promise.all(mediaItems.map(async (item) => {
                // Already a URL — pass through directly (no re-upload)
                if (item.type === 'url') return item.url

                const file = item.file
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`

                const { token, path, error: urlError } = await getSignedUploadUrl(fileName, file.type)
                if (urlError || !token || !path) {
                    throw new Error(urlError || 'セキュアなアップロードURLの取得に失敗しました。')
                }

                const { error: uploadError } = await supabase.storage
                    .from('media-uploads')
                    .uploadToSignedUrl(path, token, file, { cacheControl: '3600', upsert: false })

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('media-uploads').getPublicUrl(path)
                return data.publicUrl
            }))

            if (urls.some(u => u === null)) {
                throw new Error('一つまたは複数のファイルのアップロードに失敗しました。')
            }
            return urls as string[]
        } catch (error) {
            console.error('[usePublishing] Upload error:', error)
            setResult({ error: 'メディアのアップロードに失敗しました。もう一度お試しください。' })
            return null
        } finally {
            setIsUploading(false)
        }
    }

    /** Builds the FormData payload for server actions */
    const buildFormData = (
        mediaUrls: string[],
        { caption, selectedAccountId, selectedProjectId, isVideo, mediaItems }: PublishOptions
    ): FormData => {
        const fd = new FormData()
        
        fd.set('caption', caption.trim())
        fd.set('connectedAccountId', selectedAccountId)
        fd.set('isVideo', isVideo.toString())
        if (selectedProjectId) fd.set('projectId', selectedProjectId)

        // Attach libraryImageId if the first media item is a library image
        const libraryItem = mediaItems.find(item => item.type === 'url') as Extract<MediaItem, { type: 'url' }> | undefined
        if (libraryItem?.libraryImageId) {
            fd.set('libraryImageId', libraryItem.libraryImageId)
        }

        mediaUrls.forEach(url => fd.append('mediaUrls[]', url))
        if (mediaUrls.length > 0) fd.set('mediaUrl', mediaUrls[0])

        return fd
    }

    /** Publish or schedule the post */
    const publish = async (
        mode: 'now' | 'schedule',
        options: PublishOptions,
        onSuccess?: (mode: 'now' | 'schedule') => void
    ) => {
        if (isPublishing) return

        if (options.mediaItems.length === 0) {
            setResult({ error: '画像または動画をアップロードしてください。' })
            return
        }
        if (mode === 'schedule' && !options.scheduledFor) {
            setResult({ error: '予約投稿する日時を選択してください。' })
            return
        }

        const urls = await uploadAllMedia(options.mediaItems)
        if (!urls) return

        startTransition(async () => {
            const fd = buildFormData(urls, options)

            if (mode === 'schedule') {
                fd.set('scheduledFor', new Date(options.scheduledFor!).toISOString())
                const res = await schedulePost(fd)
                setResult(res)
                if (res.success) onSuccess?.(mode)
            } else {
                const res = await publishNow(fd)
                setResult(res)
                if (res.success) onSuccess?.(mode)
            }
        })
    }

    /** Save as draft without publishing */
    const saveAsDraft = async (
        options: PublishOptions,
        onSuccess?: () => void
    ) => {
        if (isPublishing) return

        const urls = await uploadAllMedia(options.mediaItems)
        if (!urls) return

        startTransition(async () => {
            const fd = buildFormData(urls, options)
            const res = await saveDraft(fd)
            setResult(res)
            if (res.success) onSuccess?.()
        })
    }

    return {
        result,
        setResult,
        clearResult,
        isPublishing,
        publish,
        saveAsDraft
    }
}
