'use client'
import { ActionResult } from '@/lib/types'

import { useState } from 'react'
import { MediaItem } from '../types'
import { useLocale } from 'next-intl'
import type { ImageAnalysis, PatternAnalysis } from '@/lib/ai/types'


export interface AnalysisResults {
    imageAnalysis?: ImageAnalysis;
    patternAnalysis?: PatternAnalysis;
    pastCaptionsUsed?: string[];
}

export function usePostGeneration() {
    const locale = useLocale()
    const [caption, setCaption] = useState('')
    const [customPrompt, setCustomPrompt] = useState('')
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)
    const [generationError, setGenerationError] = useState<string | null>(null)
    const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)

    /** Convert file-based media items to base64 for the AI pipeline */
    const getImagePayloads = async (
        mediaItems: MediaItem[]
    ): Promise<{ base64: string; mimeType: string }[]> => {
        const images: { base64: string; mimeType: string }[] = []

        for (const item of mediaItems) {
            if (item.type === 'file' && !item.file.type.startsWith('video/')) {
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(item.file)
                })
                images.push({ base64: dataUrl, mimeType: item.file.type })
            } else if (item.type === 'url' && !item.isVideo) {
                try {
                    const res = await fetch(item.url)
                    const blob = await res.blob()
                    const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.onerror = reject
                        reader.readAsDataURL(blob)
                    })
                    images.push({ base64: dataUrl, mimeType: blob.type })
                } catch (err) {
                    console.error('Failed to fetch image URL for AI:', err)
                }
            }
        }

        return images
    }

    /** Main AI generation function */
    const generateCaption = async (
        mediaItems: MediaItem[],
        projectId?: string,
        projectHashtags: string[] = []
    ) => {
        if (mediaItems.length === 0) {
            setGenerationError('キャプションを生成するには、まず画像を準備してください。')
            return
        }

        setIsGeneratingAI(true)
        setGenerationError(null)
        setAnalysisResults(null)

        try {
            const images = await getImagePayloads(mediaItems)

            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images,
                    customPrompt,
                    currentCaption: caption,
                    projectId: projectId || undefined,
                    locale
                }),
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'AIキャプションの生成に失敗しました。')

            if (json.options && json.options.length > 0) {
                const opt = json.options[0]
                // Combine AI hashtags and project hashtags, remove duplicates
                const allTags = Array.from(new Set([...(opt.hashtags || []), ...projectHashtags]))
                
                // Directly set the caption and hashtags
                const combinedCaption = allTags.length > 0
                    ? `${opt.caption}\n\n${allTags.join(' ')}`
                    : opt.caption

                setCaption(combinedCaption)
            } else {
                // Fallback
                const fallbackTags = Array.from(new Set([...(Array.isArray(json.hashtags) ? json.hashtags : []), ...projectHashtags]))
                const combinedCaption = fallbackTags.length > 0
                    ? `${json.caption}\n\n${fallbackTags.join(' ')}`
                    : (json.caption || '')
                    
                setCaption(combinedCaption)
            }

            if (json.analysis) {
                setAnalysisResults(json.analysis)
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'AIの生成に失敗しました。'
            console.error('[usePostGeneration] AI gen error:', error)
            setGenerationError(message)
        } finally {
            setIsGeneratingAI(false)
        }
    }

    return {
        caption,
        setCaption,
        customPrompt,
        setCustomPrompt,
        isGeneratingAI,
        generationError,
        setGenerationError,
        analysisResults,
        generateCaption
    }
}
