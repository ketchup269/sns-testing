import { renderHook, act } from '@testing-library/react'
import { useMediaManagement } from '@/app/[locale]/(dashboard)/create/hooks/useMediaManagement'
import { usePostGeneration } from '@/app/[locale]/(dashboard)/create/hooks/usePostGeneration'
import { useSettings } from '@/app/[locale]/(dashboard)/settings/hooks/useSettings'
import { updateAiUsageOption } from '@/app/[locale]/(dashboard)/settings/actions'

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

jest.mock('@/app/[locale]/(dashboard)/settings/actions')
const mockUpdateAiUsageOption = updateAiUsageOption as jest.Mock

// Mock FileReader for usePostGeneration
class MockFileReader {
    result = 'data:image/jpeg;base64,mock'
    onload: any = null
    readAsDataURL() {
        if (this.onload) {
            setTimeout(() => this.onload(), 0)
        }
    }
}
global.FileReader = MockFileReader as any

describe('useMediaManagement', () => {
    it('should add single image to mediaItems', () => {
        const { result } = renderHook(() => useMediaManagement())
        const file = new File([''], 'img.jpg', { type: 'image/jpeg' })
        
        act(() => {
            result.current.handleFiles([file])
        })

        expect(result.current.mediaItems).toHaveLength(1)
        expect(result.current.mediaItems[0].type).toBe('file')
    })

    it('should limit to only one video when first file is video', () => {
        const { result } = renderHook(() => useMediaManagement())
        const video = new File([''], 'vid.mp4', { type: 'video/mp4' })
        const image = new File([''], 'img.jpg', { type: 'image/jpeg' })

        act(() => {
            result.current.handleFiles([video, image])
        })

        expect(result.current.mediaItems).toHaveLength(1)
        expect(result.current.mediaItems[0].type).toBe('file')
        expect((result.current.mediaItems[0] as any).file.name).toBe('vid.mp4')
    })

    it('should remove video and add image when image is added to existing video state', () => {
        const { result } = renderHook(() => useMediaManagement())
        const video = new File([''], 'vid.mp4', { type: 'video/mp4' })
        const image = new File([''], 'img.jpg', { type: 'image/jpeg' })

        act(() => {
            result.current.handleFiles([video])
        })
        expect(result.current.isVideo).toBe(true)

        act(() => {
            result.current.handleFiles([image])
        })
        expect(result.current.mediaItems).toHaveLength(1)
        expect(result.current.isVideo).toBe(false)
    })

    it('should clear existing images when video is added', () => {
        const { result } = renderHook(() => useMediaManagement())
        const image = new File([''], 'img.jpg', { type: 'image/jpeg' })
        const video = new File([''], 'vid.mp4', { type: 'video/mp4' })

        act(() => {
            result.current.handleFiles([image])
        })
        act(() => {
            result.current.handleFiles([video])
        })

        expect(result.current.mediaItems).toHaveLength(1)
        expect(result.current.isVideo).toBe(true)
    })

    it('should remove media item by id', () => {
        const { result } = renderHook(() => useMediaManagement())
        const file = new File([''], 'img.jpg', { type: 'image/jpeg' })
        act(() => { result.current.handleFiles([file]) })
        const id = result.current.mediaItems[0].id

        act(() => { result.current.removeMedia(id) })
        expect(result.current.mediaItems).toHaveLength(0)
    })

    it('should load from draft correctly (JSON array URL)', () => {
        const { result } = renderHook(() => useMediaManagement())
        const draft: any = { imageUrl: '["url1","url2"]', mediaType: 'IMAGE' }

        act(() => { result.current.loadFromDraft(draft) })
        expect(result.current.mediaItems).toHaveLength(2)
        expect((result.current.mediaItems[0] as any).url).toBe('url1')
    })

    it('should load image from library and set libraryImageId', () => {
        const { result } = renderHook(() => useMediaManagement())
        const libImg: any = { id: 'lib-1', url: 'http://lib' }

        act(() => { result.current.loadFromLibrary(libImg) })
        expect(result.current.mediaItems).toHaveLength(1)
        expect((result.current.mediaItems[0] as any).libraryImageId).toBe('lib-1')
    })
})

describe('usePostGeneration', () => {
    beforeEach(() => {
        global.fetch = jest.fn()
    })

    it('should set generationError when mediaItems is empty', async () => {
        const { result } = renderHook(() => usePostGeneration())
        await act(async () => {
            await result.current.generateCaption([])
        })
        expect(result.current.generationError).toBe('キャプションを生成するには、まず画像を準備してください。')
        expect(result.current.isGeneratingAI).toBe(false)
    })

    it('should generate caption and set analysis results on success (new format)', async () => {
        const { result } = renderHook(() => usePostGeneration())
        const mediaItems: any = [{ type: 'url', url: 'http://img', isVideo: false, id: '1' }]
        
        const mockResponse = {
            ok: true,
            json: async () => ({
                options: [{ caption: 'AI caption', hashtags: ['#a'] }],
                analysis: { some: 'data' }
            }),
            blob: async () => new Blob([''], { type: 'image/jpeg' })
        }
        ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

        await act(async () => {
            await result.current.generateCaption(mediaItems)
        })

        expect(result.current.caption).toBe('AI caption\n\n#a')
        expect(result.current.analysisResults).toEqual({ some: 'data' })
        expect(result.current.isGeneratingAI).toBe(false)
    })

    it('should deduplicate hashtags with projectHashtags', async () => {
        const { result } = renderHook(() => usePostGeneration())
        const mediaItems: any = [{ type: 'url', url: 'http://img', isVideo: false, id: '1' }]
        
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                caption: 'Base',
                hashtags: ['#food']
            }),
            blob: async () => new Blob([''], { type: 'image/jpeg' })
        })

        await act(async () => {
            await result.current.generateCaption(mediaItems, 'p-1', ['#food', '#travel'])
        })

        expect(result.current.caption).toContain('#food')
        expect(result.current.caption).toContain('#travel')
    })

    it('should set generationError when API returns an error', async () => {
        const { result } = renderHook(() => usePostGeneration())
        const mediaItems: any = [{ type: 'url', url: 'http://img', isVideo: false, id: '1' }]
        
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Server error' }),
            blob: async () => new Blob([''], { type: 'image/jpeg' })
        })

        await act(async () => {
            await result.current.generateCaption(mediaItems)
        })

        expect(result.current.generationError).toBe('Server error')
        expect(result.current.isGeneratingAI).toBe(false)
    })
})

describe('useSettings', () => {
    it('should set success message on successful save', async () => {
        mockUpdateAiUsageOption.mockResolvedValue({ success: true })
        const { result } = renderHook(() => useSettings('Normal AI Use'))

        await act(async () => {
            await result.current.handleSaveAiOption()
        })

        expect(result.current.message).toBe('設定を保存しました。')
        expect(result.current.isSaving).toBe(false)
    })

    it('should set error message on failed save', async () => {
        mockUpdateAiUsageOption.mockResolvedValue({ error: 'fail' })
        const { result } = renderHook(() => useSettings('Normal AI Use'))

        await act(async () => {
            await result.current.handleSaveAiOption()
        })

        expect(result.current.error).toBe('設定の保存に失敗しました。もう一度お試しください。')
        expect(result.current.isSaving).toBe(false)
    })
})
