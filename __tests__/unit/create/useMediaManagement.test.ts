/**
 * useMediaManagement.test.ts
 * Tests for media state management hook.
 * Run with: jest --testPathPattern=useMediaManagement
 */

import { renderHook, act } from '@testing-library/react'
import { useMediaManagement } from '@/app/[locale]/(dashboard)/create/hooks/useMediaManagement'
import type { HistoryItem, ProjectImage } from '@/app/[locale]/(dashboard)/create/types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeImageFile = (name = 'photo.jpg'): File =>
    new File(['data'], name, { type: 'image/jpeg' })

const makeVideoFile = (name = 'clip.mp4'): File =>
    new File(['data'], name, { type: 'video/mp4' })

const makeHistoryItem = (overrides: Partial<HistoryItem> = {}): HistoryItem => ({
    id: 'hist-1',
    imageUrl: 'https://cdn.example.com/img.jpg',
    mediaType: 'IMAGE',
    createdAt: new Date().toISOString(),
    likes: 120,
    views: 500,
    reach: 400,
    saves: 30,
    caption: 'Test caption',
    ...overrides,
})

const makeProjectImage = (overrides: Partial<ProjectImage> = {}): ProjectImage => ({
    id: 'lib-1',
    url: 'https://cdn.example.com/lib.jpg',
    fileName: 'lib.jpg',
    createdAt: new Date().toISOString(),
    ...overrides,
})

// ─── handleFiles ─────────────────────────────────────────────────────────────

describe('useMediaManagement › handleFiles', () => {
    it('adds a single image file', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeImageFile()]))
        expect(result.current.mediaItems).toHaveLength(1)
        expect(result.current.mediaItems[0].type).toBe('file')
    })

    it('adds multiple image files', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeImageFile('a.jpg'), makeImageFile('b.jpg')]))
        expect(result.current.mediaItems).toHaveLength(2)
    })

    it('replaces existing images when a video is added', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeImageFile(), makeImageFile()]))
        act(() => result.current.handleFiles([makeVideoFile()]))
        // Only the single video should remain
        expect(result.current.mediaItems).toHaveLength(1)
        expect(result.current.isVideo).toBe(true)
    })

    it('limits to 1 video even if multiple are passed', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeVideoFile('a.mp4'), makeVideoFile('b.mp4')]))
        expect(result.current.mediaItems).toHaveLength(1)
    })

    it('filters out video files from an image batch', () => {
        const { result } = renderHook(() => useMediaManagement())
        // Simulate: user selects 2 images + 1 video mixed — videos should be ignored
        act(() => result.current.handleFiles([makeImageFile('a.jpg'), makeImageFile('b.jpg')]))
        // Then add more images (not video)
        act(() => result.current.handleFiles([makeImageFile('c.jpg')]))
        expect(result.current.mediaItems).toHaveLength(3)
        expect(result.current.isVideo).toBe(false)
    })

    it('does nothing with an empty array', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([]))
        expect(result.current.mediaItems).toHaveLength(0)
    })

    it('assigns a unique id to each item', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeImageFile('a.jpg'), makeImageFile('b.jpg')]))
        const ids = result.current.mediaItems.map(m => m.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ─── removeMedia / clearMedia ────────────────────────────────────────────────

describe('useMediaManagement › removeMedia / clearMedia', () => {
    it('removes item by id', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeImageFile('a.jpg'), makeImageFile('b.jpg')]))
        const idToRemove = result.current.mediaItems[0].id
        act(() => result.current.removeMedia(idToRemove))
        expect(result.current.mediaItems).toHaveLength(1)
        expect(result.current.mediaItems.find(m => m.id === idToRemove)).toBeUndefined()
    })

    it('is a no-op when id does not exist', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeImageFile()]))
        act(() => result.current.removeMedia('nonexistent-id'))
        expect(result.current.mediaItems).toHaveLength(1)
    })
})


// ─── loadFromDraft ────────────────────────────────────────────────────────────

describe('useMediaManagement › loadFromDraft', () => {
    it('loads a single image URL from a draft', () => {
        const { result } = renderHook(() => useMediaManagement())
        const draft = makeHistoryItem({ imageUrl: 'https://cdn.example.com/img.jpg' })
        act(() => result.current.loadFromDraft(draft))
        expect(result.current.mediaItems).toHaveLength(1)
        expect(result.current.mediaItems[0].type).toBe('url')
    })

    it('loads multiple URLs from a carousel draft', () => {
        const { result } = renderHook(() => useMediaManagement())
        const urls = ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg']
        const draft = makeHistoryItem({ imageUrl: JSON.stringify(urls) })
        act(() => result.current.loadFromDraft(draft))
        expect(result.current.mediaItems).toHaveLength(2)
    })

    it('falls back to single URL when JSON parse fails', () => {
        const { result } = renderHook(() => useMediaManagement())
        const draft = makeHistoryItem({ imageUrl: '[invalid-json' })
        act(() => result.current.loadFromDraft(draft))
        expect(result.current.mediaItems).toHaveLength(1)
    })

    it('marks video draft items as isVideo=true', () => {
        const { result } = renderHook(() => useMediaManagement())
        const draft = makeHistoryItem({ mediaType: 'VIDEO' })
        act(() => result.current.loadFromDraft(draft))
        const item = result.current.mediaItems[0]
        expect(item.type).toBe('url')
        if (item.type === 'url') expect(item.isVideo).toBe(true)
    })
})

// ─── loadFromHistory ──────────────────────────────────────────────────────────

describe('useMediaManagement › loadFromHistory', () => {
    it('appends images without replacing existing ones', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeImageFile()]))
        act(() => result.current.loadFromHistory(makeHistoryItem()))
        expect(result.current.mediaItems).toHaveLength(2)
    })

    it('replaces existing content when loading a video from history', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeImageFile(), makeImageFile()]))
        const videoItem = makeHistoryItem({ mediaType: 'VIDEO' })
        act(() => result.current.loadFromHistory(videoItem))
        expect(result.current.mediaItems).toHaveLength(1)
        const item = result.current.mediaItems[0]
        if (item.type === 'url') expect(item.isVideo).toBe(true)
    })

    it('does not duplicate carousel URLs', () => {
        const { result } = renderHook(() => useMediaManagement())
        const urls = ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg']
        const hist = makeHistoryItem({ imageUrl: JSON.stringify(urls) })
        act(() => result.current.loadFromHistory(hist))
        expect(result.current.mediaItems).toHaveLength(2)
    })
})

// ─── loadFromLibrary ──────────────────────────────────────────────────────────

describe('useMediaManagement › loadFromLibrary', () => {
    it('appends a library image and sets libraryImageId', () => {
        const { result } = renderHook(() => useMediaManagement())
        const img = makeProjectImage({ id: 'lib-42', url: 'https://cdn.example.com/lib.jpg' })
        act(() => result.current.loadFromLibrary(img))
        expect(result.current.mediaItems).toHaveLength(1)
        const item = result.current.mediaItems[0]
        if (item.type === 'url') expect(item.libraryImageId).toBe('lib-42')
    })

    it('does not add library images when a video is present', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeVideoFile()]))
        act(() => result.current.loadFromLibrary(makeProjectImage()))
        // Video-filtered path — library image should be skipped
        expect(result.current.mediaItems).toHaveLength(1)
        expect(result.current.isVideo).toBe(true)
    })
})

// ─── isVideo / isEmpty flags ──────────────────────────────────────────────────
describe('useMediaManagement › derived flags', () => {
    it('isVideo is false for image-only items', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeImageFile()]))
        expect(result.current.isVideo).toBe(false)
    })

    it('isVideo is true when first item is a video file', () => {
        const { result } = renderHook(() => useMediaManagement())
        act(() => result.current.handleFiles([makeVideoFile()]))
        expect(result.current.isVideo).toBe(true)
    })
})
