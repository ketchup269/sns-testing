'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Project, HistoryItem, ProjectImage } from '../types'
import { createClient } from '@supabase/supabase-js'
import { getProjectImageUploadUrl, registerProjectImages } from '../actions'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useProjectData(initialProjects: Project[] = []) {
    // Projects
    const [projects, setProjects] = useState<Project[]>(initialProjects)
    const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjects.length > 0 ? initialProjects[0].id : '')

    // History & Drafts via SWR
    const { data: historyData, isLoading: isLoadingHistory } = useSWR(selectedProjectId ? `/api/projects/${selectedProjectId}/history` : null, fetcher)
    const history = historyData?.history || []

    const { data: draftsData, isLoading: isLoadingDrafts } = useSWR(selectedProjectId ? `/api/projects/${selectedProjectId}/drafts` : null, fetcher)
    const drafts = draftsData?.drafts || []

    // Image Library via SWR
    const { data: projectImagesData, isLoading: isLoadingProjectImages, mutate: mutateProjectImages } = useSWR(selectedProjectId ? `/api/projects/${selectedProjectId}/images` : null, fetcher)
    const projectImages = projectImagesData || []

    const [isLibraryExpanded, setIsLibraryExpanded] = useState(false)
    const [isLibraryUploading, setIsLibraryUploading] = useState(false)
    const [libraryUploadProgress, setLibraryUploadProgress] = useState(0)

    // Sync initial projects if they change
    useEffect(() => {
        setProjects(prev => {
            if (prev === initialProjects) return prev
            const isSame = prev.length === initialProjects.length && prev.every((p, i) => p.id === initialProjects[i].id)
            return isSame ? prev : initialProjects
        })
        if (initialProjects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(initialProjects[0].id)
        }
    }, [initialProjects, selectedProjectId])

    // Fetch project-scoped data whenever project changes
    useEffect(() => {
        if (!selectedProjectId) {
            setIsLibraryExpanded(false)
            return
        }
    }, [selectedProjectId])

    /** Upload files to the project image library via signed URLs */
    const handleLibraryUpload = async (files: File[]) => {
        if (files.length === 0 || !selectedProjectId) return
        setIsLibraryUploading(true)
        setLibraryUploadProgress(0)

        try {
            const uploadedUrls: { url: string; storagePath: string; fileName: string }[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const { token, path, storagePath, publicUrl, error: urlError } =
                    await getProjectImageUploadUrl(selectedProjectId, file.name)

                if (urlError || !token || !path || !storagePath || !publicUrl) {
                    console.error('[useProjectData] Failed to get signed URL for:', file.name)
                    continue
                }

                const { error: uploadError } = await supabase.storage
                    .from('media-uploads')
                    .uploadToSignedUrl(path, token, file, { cacheControl: '3600', upsert: false })

                if (!uploadError) {
                    uploadedUrls.push({ url: publicUrl, storagePath, fileName: file.name })
                }

                setLibraryUploadProgress(Math.round(((i + 1) / files.length) * 100))
            }

            if (uploadedUrls.length > 0) {
                const res = await registerProjectImages(selectedProjectId, uploadedUrls)
                if (res.count) {
                    // Refresh the library after successful upload
                    mutateProjectImages()
                } else {
                    console.error('[useProjectData] registerProjectImages failed:', res.error)
                }
            }
        } catch (e) {
            console.error('[useProjectData] Library upload error:', e)
        } finally {
            setIsLibraryUploading(false)
            setLibraryUploadProgress(0)
            setIsLibraryExpanded(true)
        }
    }

    /** Delete an image from the project library */
    const deleteProjectImage = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        try {
            const res = await fetch(`/api/projects/${selectedProjectId}/images/${id}`, { method: 'DELETE' })
            if (res && res.ok) {
                mutateProjectImages((prev: ProjectImage[] | undefined) => Array.isArray(prev) ? prev.filter((img: ProjectImage) => img.id !== id) : prev, { revalidate: false })
            }
        } catch (err) {
            console.error('[useProjectData] Delete image failed:', err)
        }
    }

    /** Get the currently selected project */
    const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null

    return {
        projects,
        selectedProjectId,
        setSelectedProjectId,
        selectedProject,
        history,
        isLoadingHistory,
        drafts,
        isLoadingDrafts,
        projectImages,
        isLoadingProjectImages,
        isLibraryExpanded,
        setIsLibraryExpanded,
        isLibraryUploading,
        libraryUploadProgress,
        handleLibraryUpload,
        deleteProjectImage
    }
}
