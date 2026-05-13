'use server'

import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { serializeImageUrls } from './types'
import { requireAuth } from '@/lib/auth.utils'
import { ActionResult } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const IG_GRAPH_BASE = 'https://graph.facebook.com/v19.0'
const CONTAINER_POLL_INTERVAL_MS = 5_000
const CONTAINER_MAX_ATTEMPTS_IMAGE = 12   // ~60 s
const CONTAINER_MAX_ATTEMPTS_VIDEO = 60   // ~5 min
const PUBLISH_MAX_RETRIES = 3
const IG_SUBCODE_MEDIA_NOT_READY = 2207027

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely delete a library image without throwing on miss. */
async function consumeLibraryImage(libraryImageId: string | null): Promise<void> {
    if (!libraryImageId) return
    await prisma.projectImage.delete({ where: { id: libraryImageId } }).catch(() => {})
}

function sleep(ms: number) {
    if (process.env.NODE_ENV === 'test') return Promise.resolve()
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

/**
 * Poll the IG container status until FINISHED or timeout.
 * @returns `true` when the container is ready, `false` on error or timeout.
 */
async function waitForContainer(
    containerId: string,
    accessToken: string,
    isVideo = false
): Promise<boolean> {
    const maxAttempts = isVideo
        ? CONTAINER_MAX_ATTEMPTS_VIDEO
        : CONTAINER_MAX_ATTEMPTS_IMAGE

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await sleep(CONTAINER_POLL_INTERVAL_MS)

        const res = await fetch(
            `${IG_GRAPH_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
        )
        const data = await res.json()

        console.log(`[Container Poll] Attempt ${attempt + 1}: status_code = ${data.status_code}`)

        if (data.status_code === 'FINISHED') return true
        if (data.status_code === 'ERROR' || data.error) {
            console.error('[Container Poll] Error:', data)
            return false
        }
    }

    console.warn(`[Container Poll] Timed out for container ${containerId}`)
    return false
}

/** Extract FormData fields used by all three publishing actions. */
function extractPublishFields(formData: FormData) {
    const caption = (formData.get('caption') as string) || ''
    const connectedAccountId = formData.get('connectedAccountId') as string
    const mediaUrls = formData.getAll('mediaUrls[]') as string[]
    const mediaUrl = mediaUrls[0] ?? (formData.get('mediaUrl') as string)
    const isVideo = formData.get('isVideo') === 'true'
    const projectId = (formData.get('projectId') as string) || null
    const libraryImageId = (formData.get('libraryImageId') as string) || null
    return { caption, connectedAccountId, mediaUrls, mediaUrl, isVideo, projectId, libraryImageId }
}

// ─── Signed Upload URLs ───────────────────────────────────────────────────────

export async function getSignedUploadUrl(fileName: string, contentType: string) {
    try {
        await requireAuth()
        const { data, error } = await supabaseAdmin
            .storage
            .from('media-uploads')
            .createSignedUploadUrl(fileName)

        if (error) {
            console.error('[getSignedUploadUrl]', error)
            return { error: error.message }
        }
        return { signedUrl: data.signedUrl, token: data.token, path: data.path }
    } catch (e) {
        console.error('[getSignedUploadUrl]', e)
        return { error: e instanceof Error ? e.message : 'Unknown error' }
    }
}

/**
 * Returns a signed upload URL scoped to `projects/{projectId}/{uuid}_{fileName}`.
 * Also returns the storage path and public URL.
 */
export async function getProjectImageUploadUrl(projectId: string, fileName: string) {
    try {
        const userId = await requireAuth()

        const project = await prisma.project.findUnique({
            where: { id: projectId, userId },
            select: { id: true },
        })
        if (!project) return { error: 'Project not found' }

        const ext = fileName.split('.').pop() ?? 'jpg'
        const safeName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${ext}`
        const storagePath = `projects/${projectId}/${safeName}`

        const { data, error } = await supabaseAdmin
            .storage
            .from('media-uploads')
            .createSignedUploadUrl(storagePath)

        if (error) {
            console.error('[getProjectImageUploadUrl]', error)
            return { error: error.message }
        }

        const { data: urlData } = supabaseAdmin.storage.from('media-uploads').getPublicUrl(storagePath)

        return {
            signedUrl: data.signedUrl,
            token: data.token,
            path: data.path,
            storagePath,
            publicUrl: urlData.publicUrl,
        }
    } catch (e) {
        console.error('[getProjectImageUploadUrl]', e)
        return { error: e instanceof Error ? e.message : 'Unknown error' }
    }
}

/** Bulk-register ProjectImage rows after client uploads. */
export async function registerProjectImages(
    projectId: string,
    images: { url: string; storagePath: string; fileName: string }[]
) {
    try {
        const userId = await requireAuth()
        const result = await prisma.projectImage.createMany({
            data: images.map(img => ({
                projectId,
                userId,
                url: img.url,
                storagePath: img.storagePath,
                fileName: img.fileName,
            })),
        })
        return { count: result.count }
    } catch (e) {
        console.error('[registerProjectImages]', e)
        return { error: e instanceof Error ? e.message : 'Unknown error' }
    }
}

// ─── saveDraft ────────────────────────────────────────────────────────────────

/** Save a post as a draft without publishing or scheduling. */
export async function saveDraft(formData: FormData): Promise<ActionResult<{ postId: string }>> {
    try {
        const userId = await requireAuth()
        const { caption, connectedAccountId, mediaUrls, mediaUrl, isVideo, projectId, libraryImageId } =
            extractPublishFields(formData)

    if (!connectedAccountId) {
        return { error: 'Please select an Instagram account first.' }
    }
        const imageUrl = mediaUrls.length > 1
            ? serializeImageUrls(mediaUrls)
            : (mediaUrl || 'https://placeholder.co/1080x1080')

        const post = await prisma.post.create({
            data: {
                userId,
                connectedAccountId,
                caption,
                imageUrl,
                mediaType: isVideo ? 'VIDEO' : 'IMAGE',
                projectId,
            },
        })

        await consumeLibraryImage(libraryImageId)
        revalidatePath('/dashboard')
        revalidatePath('/workflow')
        return { success: true, data: { postId: post.id } }
    } catch (err: any) {
        if (err.isAuthError) return { error: 'Unauthorized' }
        console.error('[saveDraft]', err)
        return { error: err.message || 'Failed to save draft. Please try again.' }
    }
}

// ─── publishNow ───────────────────────────────────────────────────────────────

/** Publish a post immediately — supports single images, carousels, and Reels. */
export async function publishNow(formData: FormData): Promise<ActionResult<{ postId: string }>> {
    try {
        const userId = await requireAuth()
        const { caption, connectedAccountId, mediaUrls, mediaUrl, isVideo, projectId, libraryImageId } =
            extractPublishFields(formData)

    if (!connectedAccountId) return { error: 'Please select an Instagram account first.' }
    if (!mediaUrl) return { error: 'Please upload an image or video.' }
        const account = await prisma.connectedAccount.findUnique({
            where: { id: connectedAccountId, userId },
            select: { instagramBusinessId: true, pageAccessToken: true },
        })
        if (!account?.instagramBusinessId || !account?.pageAccessToken) {
            return { error: 'Instagram account not properly configured.' }
        }

        // ── Carousel path ───────────────────────────────────────────────────
        if (!isVideo && mediaUrls.length > 1) {
            // 1a. Create child containers
            const childContainerIds = await Promise.all(
                mediaUrls.map(async url => {
                    const res = await fetch(`${IG_GRAPH_BASE}/${account.instagramBusinessId}/media`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image_url: url,
                            is_carousel_item: true,
                            access_token: account.pageAccessToken,
                        }),
                    })
                    const data = await res.json()
                    if (!res.ok || data.error) throw new Error(`Child container error: ${data.error?.message}`)
                    return data.id as string
                })
            )

            // 1b. Create carousel container
            const carouselRes = await fetch(`${IG_GRAPH_BASE}/${account.instagramBusinessId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    media_type: 'CAROUSEL',
                    children: childContainerIds.join(','),
                    caption,
                    access_token: account.pageAccessToken,
                }),
            })
            const carouselData = await carouselRes.json()
            if (!carouselRes.ok || carouselData.error) {
                return { error: `IG Carousel Error: ${carouselData.error?.message ?? 'Unknown'}` }
            }
            const carouselCreationId = carouselData.id

            // 1c. Wait for processing
            const carouselReady = await waitForContainer(carouselCreationId, account.pageAccessToken)
            if (!carouselReady) {
                return { error: 'Instagram took too long to process your carousel. Please try again.' }
            }

            // 1d. Publish
            const publishRes = await fetch(`${IG_GRAPH_BASE}/${account.instagramBusinessId}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: carouselCreationId,
                    access_token: account.pageAccessToken,
                }),
            })
            const publishData = await publishRes.json()
            if (!publishRes.ok || publishData.error) {
                return { error: `IG Publish Error: ${publishData.error?.message ?? 'Unknown'}` }
            }

            const post = await prisma.post.create({
                data: {
                    userId,
                    connectedAccountId,
                    caption,
                    imageUrl: serializeImageUrls(mediaUrls),
                    mediaType: 'IMAGE',
                    instagramMediaId: publishData.id,
                    projectId,
                },
            })
            await prisma.schedule.create({
                data: { postId: post.id, scheduledFor: new Date(), status: 'PUBLISHED' },
            })
            await consumeLibraryImage(libraryImageId)
            revalidatePath('/dashboard')
            revalidatePath('/workflow')
            return { success: true, data: { postId: post.id } }
        }

        // ── Single image / Reels path ───────────────────────────────────────
        const containerBody = isVideo
            ? { video_url: mediaUrl, media_type: 'REELS', share_to_feed: true, caption, access_token: account.pageAccessToken }
            : { image_url: mediaUrl, caption, access_token: account.pageAccessToken }

        const containerRes = await fetch(`${IG_GRAPH_BASE}/${account.instagramBusinessId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(containerBody),
        })
        const containerData = await containerRes.json()
        if (!containerRes.ok || containerData.error) {
            return { error: `IG Container Error: ${containerData.error?.message ?? 'Unknown'}` }
        }

        const creationId = containerData.id
        console.log(`[publishNow] Container created: ${creationId}, isVideo: ${isVideo}`)

        const ready = await waitForContainer(creationId, account.pageAccessToken, isVideo)
        if (!ready) {
            return {
                error: `Instagram is taking too long to process your ${isVideo ? 'video' : 'image'}. Please try again.`,
            }
        }

        // Publish with retry for transient "not ready" errors
        let publishData: Record<string, any> | null = null
        for (let attempt = 1; attempt <= PUBLISH_MAX_RETRIES; attempt++) {
            const publishRes = await fetch(`${IG_GRAPH_BASE}/${account.instagramBusinessId}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creation_id: creationId, access_token: account.pageAccessToken }),
            })
            publishData = await publishRes.json()
            if (publishRes.ok && !publishData!.error) break

            const isTransient = publishData!.error?.error_subcode === IG_SUBCODE_MEDIA_NOT_READY
            if (!isTransient || attempt === PUBLISH_MAX_RETRIES) {
                console.error(`[publishNow] IG Publish Error (attempt ${attempt}):`, publishData!.error)
                return { error: `IG Publish Error: ${publishData!.error?.message ?? 'Unknown'}` }
            }

            console.warn(`[publishNow] Media not ready, retrying (attempt ${attempt}/${PUBLISH_MAX_RETRIES})…`)
            await sleep(5_000)
        }

        const post = await prisma.post.create({
            data: {
                userId,
                connectedAccountId,
                caption,
                imageUrl: mediaUrl,
                mediaType: isVideo ? 'VIDEO' : 'IMAGE',
                instagramMediaId: publishData!.id,
                projectId,
            },
        })
        await prisma.schedule.create({
            data: { postId: post.id, scheduledFor: new Date(), status: 'PUBLISHED' },
        })
        await consumeLibraryImage(libraryImageId)
        revalidatePath('/dashboard')
        revalidatePath('/workflow')
        return { success: true, data: { postId: post.id } }
    } catch (err: any) {
        if (err.isAuthError) return { error: 'Unauthorized' }
        console.error('[publishNow]', err)
        return { error: err.message || 'Failed to publish post. Please try again.' }
    }
}

// ─── schedulePost ─────────────────────────────────────────────────────────────

/** Schedule a post for a future date and time. */
export async function schedulePost(formData: FormData): Promise<ActionResult<{ postId: string }>> {
    try {
        const userId = await requireAuth()
        const { caption, connectedAccountId, mediaUrls, mediaUrl, isVideo, projectId, libraryImageId } =
            extractPublishFields(formData)
    const scheduledForStr = formData.get('scheduledFor') as string

    if (!connectedAccountId) return { error: 'Please select an Instagram account first.' }
    if (!scheduledForStr) return { error: 'Please select a date and time to schedule this post.' }
    if (!mediaUrl) return { error: 'Please upload an image or video to schedule a post.' }

    const scheduledFor = new Date(scheduledForStr)
    if (scheduledFor <= new Date()) {
        return { error: 'Scheduled time must be in the future.' }
    }
        const post = await prisma.post.create({
            data: {
                userId,
                connectedAccountId,
                caption,
                imageUrl: serializeImageUrls(mediaUrls.length > 1 ? mediaUrls : [mediaUrl]),
                mediaType: isVideo ? 'VIDEO' : 'IMAGE',
                projectId,
            },
        })

        await prisma.schedule.create({
            data: { postId: post.id, scheduledFor, status: 'PENDING' },
        })

        await consumeLibraryImage(libraryImageId)
        revalidatePath('/dashboard')
        revalidatePath('/calendar')
        revalidatePath('/workflow')
        return { success: true, data: { postId: post.id } }
    } catch (err: any) {
        if (err.isAuthError) return { error: 'Unauthorized' }
        console.error('[schedulePost]', err)
        return { error: err.message || 'Failed to schedule post. Please try again.' }
    }
}
