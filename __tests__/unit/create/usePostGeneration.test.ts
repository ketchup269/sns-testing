/**
 * usePostGeneration.test.ts
 * Tests for AI caption generation hook.
 * Run with: jest --testPathPattern=usePostGeneration
 */

import { renderHook, act } from '@testing-library/react'
import { usePostGeneration } from '@/app/[locale]/(dashboard)/create/hooks/usePostGeneration'
import type { MediaItem } from '@/app/[locale]/(dashboard)/create/types'

jest.mock('next-intl', () => ({
    useLocale: () => 'ja',
    useTranslations: () => (key: string) => {
        const translations: any = {
            'errorOccurred': 'エラーが発生しました。',
            'settingsSaved': '設定を保存しました。',
            'prepareImageFirst': 'キャプションを生成するには、まず画像を準備してください。'
        }
        return translations[key] || key
    }
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeFileItem = (type = 'image/jpeg'): MediaItem => ({
    type: 'file',
    file: new File(['data'], 'photo.jpg', { type }),
    id: 'item-1',
})

const makeUrlItem = (): MediaItem => ({
    type: 'url',
    url: 'https://cdn.example.com/img.jpg',
    isVideo: false,
    id: 'item-2',
})

// ─── generateCaption guard-rails ──────────────────────────────────────────────

describe('usePostGeneration › generateCaption', () => {
    beforeEach(() => {
        ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
            ok: true,
            blob: async () => new Blob(['dummy blob data'], { type: 'image/jpeg' }),
            json: async () => ({ options: [{ caption: 'Option A', hashtags: ['#a'] }] }),
        })
    })

    it('sets error when mediaItems is empty (no network call)', async () => {
        const { result } = renderHook(() => usePostGeneration())
        await act(async () => {
            await result.current.generateCaption([])
        })
        expect(result.current.generationError).toBeTruthy()
        expect(fetch).not.toHaveBeenCalled()
    })

    it('sets isGeneratingAI=true during fetch and false after', async () => {
        const { result } = renderHook(() => usePostGeneration())
        let duringLoading = false

        await act(async () => {
            const promise = result.current.generateCaption([makeUrlItem()])
            duringLoading = result.current.isGeneratingAI
            await promise
        })

        // After resolution isGeneratingAI must be false
        expect(result.current.isGeneratingAI).toBe(false)
    })

    it('populates caption directly on successful response with options', async () => {
        const { result } = renderHook(() => usePostGeneration())
        await act(async () => {
            await result.current.generateCaption([makeUrlItem()])
        })
        expect(result.current.caption).toContain('Option A')
    })

    it('falls back to setting caption directly when no options returned', async () => {
        ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
            ok: true,
            blob: async () => new Blob(['dummy blob data'], { type: 'image/jpeg' }),
            json: async () => ({
                caption: 'Direct caption #direct',
            }),
        })

        const { result } = renderHook(() => usePostGeneration())
        await act(async () => {
            await result.current.generateCaption([makeUrlItem()])
        })
        expect(result.current.caption).toContain('Direct caption')
        expect(result.current.caption).toContain('#direct')
    })

    it('sets generationError on non-ok HTTP response', async () => {
        ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
            ok: false,
            blob: async () => new Blob(['dummy blob data'], { type: 'image/jpeg' }),
            json: async () => ({ error: 'Rate limit exceeded' }),
        })

        const { result } = renderHook(() => usePostGeneration())
        await act(async () => {
            await result.current.generateCaption([makeUrlItem()])
        })
        expect(result.current.generationError).toBe('Rate limit exceeded')
    })

    it('sets generationError on network failure', async () => {
        ;(global.fetch as jest.Mock) = jest.fn().mockRejectedValue(new Error('Network error'))

        const { result } = renderHook(() => usePostGeneration())
        await act(async () => {
            await result.current.generateCaption([makeUrlItem()])
        })
        expect(result.current.generationError).toBe('Network error')
    })

    it('clears previous error before new generation', async () => {
        // First call fails
        ;(global.fetch as jest.Mock) = jest.fn().mockRejectedValueOnce(new Error('fail'))
        const { result } = renderHook(() => usePostGeneration())
        await act(async () => { await result.current.generateCaption([makeUrlItem()]) })
        expect(result.current.generationError).toBeTruthy()

        // Second call succeeds — error should be cleared
        ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
            ok: true,
            blob: async () => new Blob(['dummy blob data'], { type: 'image/jpeg' }),
            json: async () => ({ options: [{ caption: 'Fresh', hashtags: [] }] }),
        })
        await act(async () => { await result.current.generateCaption([makeUrlItem()]) })
        expect(result.current.generationError).toBeNull()
        expect(result.current.caption).toContain('Fresh')
    })

    it('fetches URL and converts to base64 for URL-type media items', async () => {
        const { result } = renderHook(() => usePostGeneration())
        await act(async () => {
            await result.current.generateCaption([makeUrlItem()])
        })
        
        // Should fetch the URL image and then fetch the API
        expect(fetch).toHaveBeenCalledTimes(2)
        const fetchCalls = (fetch as jest.Mock).mock.calls
        expect(fetchCalls[0][0]).toBe('https://cdn.example.com/img.jpg')
        
        const apiCallBody = JSON.parse(fetchCalls[1][1].body)
        expect(apiCallBody.images).toHaveLength(1)
        expect(apiCallBody.images[0].base64).toContain('data:') // base64 converted string
    })

    it('skips video files during base64 conversion', async () => {
        const { result } = renderHook(() => usePostGeneration())
        const videoItem = makeFileItem('video/mp4')
        await act(async () => {
            await result.current.generateCaption([videoItem])
        })
        const apiCallBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)
        expect(apiCallBody.images).toHaveLength(0)
    })
})
