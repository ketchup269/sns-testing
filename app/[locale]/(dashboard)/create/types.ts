// types.ts — shared domain types for the Create Content feature

// ─── Domain Models ────────────────────────────────────────────────────────────

export interface ConnectedAccount {
    id: string
    username: string | null
    pageId: string
    profilePictureUrl?: string | null
}

export interface Project {
    id: string
    name: string
    description: string | null
    defaultHashtags: string[]
    objective?: string | null
    ageRange?: string | null
    gender?: string | null
    location?: string | null
    profession?: string | null
    toneStyle?: string | null
    writingStyleNotes?: string | null
    exampleCaptions?: string | null
    postingFrequency?: string | null
    preferredTimeSlots?: string | null
    campaignDuration?: string | null
    preferredCtaTypes?: string | null
    wordsToAvoid?: string | null
    toneRestrictions?: string | null
    customPromptNotes?: string | null
    campaignSpecificInstructions?: string | null
}

export interface HistoryItem {
    id: string
    imageUrl: string
    mediaType: 'IMAGE' | 'VIDEO'    // ← was `string`; narrowed for safety
    createdAt: string
    likes: number
    views: number
    reach: number
    saves: number
    caption: string | null
}

export interface ProjectImage {
    id: string
    url: string
    fileName: string
    createdAt: string
}

// ─── Media Items ──────────────────────────────────────────────────────────────

export type FileMediaItem = {
    type: 'file'
    file: File
    id: string
}

export type UrlMediaItem = {
    type: 'url'
    url: string
    isVideo: boolean
    id: string
    /** Set when this URL originated from the project image library */
    libraryImageId?: string
}

export type MediaItem = FileMediaItem | UrlMediaItem

// ─── Type Guards ──────────────────────────────────────────────────────────────

export function isFileItem(item: MediaItem): item is FileMediaItem {
    return item.type === 'file'
}

export function isUrlItem(item: MediaItem): item is UrlMediaItem {
    return item.type === 'url'
}

export function isVideoFile(item: MediaItem): boolean {
    return isFileItem(item) && item.file.type.startsWith('video/')
}

export function isVideoUrl(item: MediaItem): boolean {
    return isUrlItem(item) && item.isVideo
}

export function isVideoItem(item: MediaItem): boolean {
    return isVideoFile(item) || isVideoUrl(item)
}

// ─── Image URL Parsing ────────────────────────────────────────────────────────

/**
 * Safely parse a `HistoryItem.imageUrl` that may be either:
 * - A JSON array string: `'["url1","url2"]'`
 * - A plain URL string: `'https://...'`
 *
 * Always returns a non-empty array.
 */
import { parseImageUrls as _parse, serializeImageUrls as _serialize } from '@/lib/utils'

export const parseImageUrls = _parse
export const serializeImageUrls = _serialize
