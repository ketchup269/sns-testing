/**
 * modals.test.tsx
 * Rendering and interaction tests for DraftSelectionModal,
 * HistorySelectionModal, and MobilePreviewModal.
 * Run with: jest --testPathPattern=modals.test
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DraftSelectionModal } from '@/app/[locale]/(dashboard)/create/components/DraftSelectionModal'
import { HistorySelectionModal } from '@/app/[locale]/(dashboard)/create/components/HistorySelectionModal'
import { MobilePreviewModal } from '@/app/[locale]/(dashboard)/create/components/MobilePreviewModal'
import type { HistoryItem, ConnectedAccount, MediaItem } from '@/app/[locale]/(dashboard)/create/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeDraft = (overrides: Partial<HistoryItem> = {}): HistoryItem => ({
    id: 'draft-1',
    imageUrl: 'https://cdn.example.com/img.jpg',
    mediaType: 'IMAGE',
    createdAt: new Date().toISOString(),
    likes: 0, views: 0, reach: 0, saves: 0,
    caption: 'My draft caption',
    ...overrides,
})

const makeHistoryItem = (overrides: Partial<HistoryItem> = {}): HistoryItem => ({
    id: 'hist-1',
    imageUrl: 'https://cdn.example.com/top.jpg',
    mediaType: 'IMAGE',
    createdAt: new Date().toISOString(),
    likes: 250, views: 900, reach: 700, saves: 50,
    caption: 'Top performing post',
    ...overrides,
})

const mockAccount: ConnectedAccount = {
    id: 'acc-1',
    username: 'my_brand',
    pageId: 'page-123',
}

const makeUrlMediaItem = (): MediaItem => ({
    type: 'url',
    url: 'https://cdn.example.com/img.jpg',
    isVideo: false,
    id: 'media-1',
})

// ─── DraftSelectionModal ──────────────────────────────────────────────────────

describe('DraftSelectionModal', () => {
    const defaultProps = {
        show: true,
        onClose: jest.fn(),
        selectedProjectId: 'proj-1',
        drafts: [],
        isLoadingDrafts: false,
        handleSelectDraft: jest.fn(),
    }

    it('renders nothing when show=false', () => {
        const { container } = render(<DraftSelectionModal {...defaultProps} show={false} />)
        expect(container.firstChild).toBeNull()
    })

    it('shows loading spinner when isLoadingDrafts=true', () => {
        render(<DraftSelectionModal {...defaultProps} isLoadingDrafts={true} />)
        // Loader2 icon renders inside a spinner container
        expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows empty-state when project selected but no drafts', () => {
        render(<DraftSelectionModal {...defaultProps} />)
        expect(screen.getByText(/下書きがありません/)).toBeInTheDocument()
    })

    it('shows no-project prompt when selectedProjectId is null', () => {
        render(<DraftSelectionModal {...defaultProps} selectedProjectId={null} />)
        expect(screen.getByText(/プロジェクトが選択されていません/)).toBeInTheDocument()
    })

    it('renders each draft item with caption', () => {
        const drafts = [
            makeDraft({ id: 'a', caption: 'Caption Alpha' }),
            makeDraft({ id: 'b', caption: 'Caption Beta' }),
        ]
        render(<DraftSelectionModal {...defaultProps} drafts={drafts} />)
        expect(screen.getByText('Caption Alpha')).toBeInTheDocument()
        expect(screen.getByText('Caption Beta')).toBeInTheDocument()
    })

    it('shows fallback text for drafts with no caption', () => {
        render(<DraftSelectionModal {...defaultProps} drafts={[makeDraft({ caption: null })]} />)
        expect(screen.getByText(/キャプションなし/)).toBeInTheDocument()
    })

    it('calls handleSelectDraft and onClose when a draft is clicked', () => {
        const handleSelectDraft = jest.fn()
        const onClose = jest.fn()
        const draft = makeDraft()
        render(<DraftSelectionModal {...defaultProps} drafts={[draft]} handleSelectDraft={handleSelectDraft} onClose={onClose} />)
        fireEvent.click(screen.getByText('My draft caption'))
        expect(handleSelectDraft).toHaveBeenCalledWith(draft)
        expect(onClose).toHaveBeenCalled()
    })

    it('calls onClose when backdrop is clicked', () => {
        const onClose = jest.fn()
        const { container } = render(<DraftSelectionModal {...defaultProps} onClose={onClose} />)
        // The first fixed overlay div is the backdrop
        fireEvent.click(container.firstChild as Element)
        expect(onClose).toHaveBeenCalled()
    })

    it('does not propagate click from modal body to backdrop', () => {
        const onClose = jest.fn()
        render(<DraftSelectionModal {...defaultProps} onClose={onClose} />)
        // Click inside the modal card (title text)
        fireEvent.click(screen.getByText('下書き'))
        expect(onClose).not.toHaveBeenCalled()
    })

    it('renders carousel badge when imageUrl is a JSON array', () => {
        const draft = makeDraft({
            imageUrl: JSON.stringify(['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg']),
        })
        render(<DraftSelectionModal {...defaultProps} drafts={[draft]} />)
        // The Images icon renders for carousel drafts — check for the SVG element via aria
        const modal = screen.getByText('My draft caption').closest('div')
        expect(modal).toBeInTheDocument()
        // The overlay badge icon container should be present in the thumbnail
        expect(document.querySelector('[data-testid="carousel-badge"]') ?? document.querySelector('.absolute.bottom-1')).toBeTruthy()
    })
})

// ─── HistorySelectionModal ────────────────────────────────────────────────────

describe('HistorySelectionModal', () => {
    const defaultProps = {
        show: true,
        onClose: jest.fn(),
        selectedProjectId: 'proj-1',
        historyItems: [],
        isLoadingHistory: false,
        handleSelectHistory: jest.fn(),
    }

    it('renders nothing when show=false', () => {
        const { container } = render(<HistorySelectionModal {...defaultProps} show={false} />)
        expect(container.firstChild).toBeNull()
    })

    it('shows loading indicator when isLoadingHistory=true', () => {
        render(<HistorySelectionModal {...defaultProps} isLoadingHistory={true} />)
        expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows empty state when no history items', () => {
        render(<HistorySelectionModal {...defaultProps} />)
        expect(screen.getByText(/履歴データが見つかりません/)).toBeInTheDocument()
    })

    it('shows no-project state when selectedProjectId is null', () => {
        render(<HistorySelectionModal {...defaultProps} selectedProjectId={null} />)
        expect(screen.getByText(/プロジェクトが選択されていません/)).toBeInTheDocument()
    })

    it('renders history items as a grid', () => {
        const items = [makeHistoryItem({ id: 'h1' }), makeHistoryItem({ id: 'h2' })]
        render(<HistorySelectionModal {...defaultProps} historyItems={items} />)
        const images = document.querySelectorAll('img')
        expect(images.length).toBeGreaterThanOrEqual(2)
    })

    it('shows rank badge for top 5 posts', () => {
        const items = Array.from({ length: 5 }, (_, i) =>
            makeHistoryItem({ id: `h${i}` })
        )
        render(<HistorySelectionModal {...defaultProps} historyItems={items} />)
        expect(screen.getByText('🥇')).toBeInTheDocument()
        expect(screen.getByText('🥈')).toBeInTheDocument()
        expect(screen.getByText('🥉')).toBeInTheDocument()
    })

    it('calls handleSelectHistory and onClose on item click', () => {
        const handleSelectHistory = jest.fn()
        const onClose = jest.fn()
        const items = [makeHistoryItem()]
        render(
            <HistorySelectionModal
                {...defaultProps}
                historyItems={items}
                handleSelectHistory={handleSelectHistory}
                onClose={onClose}
            />
        )
        fireEvent.click(document.querySelector('img')!)
        expect(handleSelectHistory).toHaveBeenCalledWith(items[0])
        expect(onClose).toHaveBeenCalled()
    })

    it('closes on X button click', () => {
        const onClose = jest.fn()
        render(<HistorySelectionModal {...defaultProps} onClose={onClose} />)
        // The X button
        fireEvent.click(document.querySelector('button[type="button"]')!)
        expect(onClose).toHaveBeenCalled()
    })
})

// ─── MobilePreviewModal ───────────────────────────────────────────────────────

describe('MobilePreviewModal', () => {
    const setPreviewIndex = jest.fn()
    const defaultProps = {
        show: true,
        onClose: jest.fn(),
        mediaItems: [makeUrlMediaItem()],
        caption: 'Preview caption',
        previewIndex: 0,
        setPreviewIndex,
        account: mockAccount,
    }

    it('renders nothing when show=false', () => {
        const { container } = render(<MobilePreviewModal {...defaultProps} show={false} />)
        expect(container.firstChild).toBeNull()
    })

    it('renders the username from account', () => {
        render(<MobilePreviewModal {...defaultProps} />)
        // Username appears multiple times in the mock preview
        expect(screen.getAllByText('my_brand').length).toBeGreaterThan(0)
    })

    it('renders the caption text', () => {
        render(<MobilePreviewModal {...defaultProps} />)
        expect(screen.getByText('Preview caption')).toBeInTheDocument()
    })

    it('shows placeholder caption when none provided', () => {
        render(<MobilePreviewModal {...defaultProps} caption="" />)
        expect(screen.getByText(/キャプションがここに表示されます/)).toBeInTheDocument()
    })

    it('falls back to pageId when username is null', () => {
        const account = { ...mockAccount, username: null }
        render(<MobilePreviewModal {...defaultProps} account={account} />)
        expect(screen.getAllByText('page-123').length).toBeGreaterThan(0)
    })

    it('shows carousel controls when multiple mediaItems present', () => {
        const items: MediaItem[] = [
            { type: 'url', url: 'https://cdn.example.com/1.jpg', isVideo: false, id: 'm1' },
            { type: 'url', url: 'https://cdn.example.com/2.jpg', isVideo: false, id: 'm2' },
        ]
        render(<MobilePreviewModal {...defaultProps} mediaItems={items} />)
        // Should render counter "1/2"
        expect(screen.getByText('1/2')).toBeInTheDocument()
    })

    it('does not show carousel counter for single item', () => {
        render(<MobilePreviewModal {...defaultProps} />)
        expect(screen.queryByText('1/1')).not.toBeInTheDocument()
    })

    it('calls setPreviewIndex when next arrow clicked', () => {
        const items: MediaItem[] = [
            { type: 'url', url: 'https://cdn.example.com/1.jpg', isVideo: false, id: 'm1' },
            { type: 'url', url: 'https://cdn.example.com/2.jpg', isVideo: false, id: 'm2' },
        ]
        render(<MobilePreviewModal {...defaultProps} mediaItems={items} previewIndex={0} />)
        // ChevronRight button
        const buttons = document.querySelectorAll('button[type="button"]')
        // Find the right arrow (ChevronRight) — it's the last navigation button
        const nextBtn = Array.from(buttons).find(b => b.querySelector('.lucide-chevron-right'))
        if (nextBtn) fireEvent.click(nextBtn)
        expect(setPreviewIndex).toHaveBeenCalled()
    })

    it('does not show prev arrow when previewIndex is 0', () => {
        const items: MediaItem[] = [
            { type: 'url', url: 'https://cdn.example.com/1.jpg', isVideo: false, id: 'm1' },
            { type: 'url', url: 'https://cdn.example.com/2.jpg', isVideo: false, id: 'm2' },
        ]
        render(<MobilePreviewModal {...defaultProps} mediaItems={items} previewIndex={0} />)
        const prevBtn = document.querySelector('.lucide-chevron-left')
        expect(prevBtn).not.toBeInTheDocument()
    })

    it('calls onClose when backdrop clicked', () => {
        const onClose = jest.fn()
        const { container } = render(<MobilePreviewModal {...defaultProps} onClose={onClose} />)
        fireEvent.click(container.firstChild as Element)
        expect(onClose).toHaveBeenCalled()
    })
})
