import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export interface Project {
    id: string
    accountId?: string | null
    name: string
    description?: string | null
    objective?: string | null
    defaultHashtags: string[]
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

import { useAccount } from '@/app/components/AccountContext'

export function useProjects(initialProjects: Project[]) {
    const router = useRouter()
    const { activeAccount } = useAccount()
    
    const { data: swrProjects, mutate: mutateProjects } = useSWR('/api/projects', fetcher, { fallbackData: initialProjects })
    
    const projects = activeAccount 
        ? swrProjects.filter((p: Project) => !p.accountId || p.accountId === activeAccount.id)
        : swrProjects.filter((p: Project) => !p.accountId)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [viewingProject, setViewingProject] = useState<Project | null>(null)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    // Form fields
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [objective, setObjective] = useState('')
    const [hashtags, setHashtags] = useState('')
    const [ageRange, setAgeRange] = useState('')
    const [gender, setGender] = useState('')
    const [location, setLocation] = useState('')
    const [profession, setProfession] = useState('')
    const [toneStyle, setToneStyle] = useState('')
    const [writingStyleNotes, setWritingStyleNotes] = useState('')
    const [exampleCaptions, setExampleCaptions] = useState('')
    const [postingFrequency, setPostingFrequency] = useState('')
    const [preferredTimeSlots, setPreferredTimeSlots] = useState('')
    const [campaignDuration, setCampaignDuration] = useState('')
    const [preferredCtaTypes, setPreferredCtaTypes] = useState('')
    const [wordsToAvoid, setWordsToAvoid] = useState('')
    const [toneRestrictions, setToneRestrictions] = useState('')
    const [customPromptNotes, setCustomPromptNotes] = useState('')
    const [campaignSpecificInstructions, setCampaignSpecificInstructions] = useState('')

    const openModal = (proj?: Project) => {
        setError('')
        if (proj) {
            setEditingProject(proj)
            setName(proj.name)
            setDescription(proj.description || '')
            setObjective(proj.objective || '')
            setHashtags(proj.defaultHashtags?.join(' ') || '')
            setAgeRange(proj.ageRange || '')
            setGender(proj.gender || '')
            setLocation(proj.location || '')
            setProfession(proj.profession || '')
            setToneStyle(proj.toneStyle || '')
            setWritingStyleNotes(proj.writingStyleNotes || '')
            setExampleCaptions(proj.exampleCaptions || '')
            setPostingFrequency(proj.postingFrequency || '')
            setPreferredTimeSlots(proj.preferredTimeSlots || '')
            setCampaignDuration(proj.campaignDuration || '')
            setPreferredCtaTypes(proj.preferredCtaTypes || '')
            setWordsToAvoid(proj.wordsToAvoid || '')
            setToneRestrictions(proj.toneRestrictions || '')
            setCustomPromptNotes(proj.customPromptNotes || '')
            setCampaignSpecificInstructions(proj.campaignSpecificInstructions || '')
        } else {
            setEditingProject(null)
            setName('')
            setDescription('')
            setObjective('')
            setHashtags('')
            setAgeRange('')
            setGender('')
            setLocation('')
            setProfession('')
            setToneStyle('')
            setWritingStyleNotes('')
            setExampleCaptions('')
            setPostingFrequency('')
            setPreferredTimeSlots('')
            setCampaignDuration('')
            setPreferredCtaTypes('')
            setWordsToAvoid('')
            setToneRestrictions('')
            setCustomPromptNotes('')
            setCampaignSpecificInstructions('')
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
    }

    const openViewModal = (proj: Project) => {
        setViewingProject(proj)
    }

    const closeViewModal = () => {
        setViewingProject(null)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSaving(true)

        const parsedTags = hashtags
            .split(/[\s,]+/)
            .map(t => t.trim())
            .filter(t => t.length > 0)
            .map(t => t.startsWith('#') ? t : `#${t}`)

        try {
            const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects'
            const method = editingProject ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: activeAccount?.id,
                    name,
                    description,
                    objective,
                    defaultHashtags: parsedTags,
                    ageRange,
                    gender,
                    location,
                    profession,
                    toneStyle,
                    writingStyleNotes,
                    exampleCaptions,
                    postingFrequency,
                    preferredTimeSlots,
                    campaignDuration,
                    preferredCtaTypes,
                    wordsToAvoid,
                    toneRestrictions,
                    customPromptNotes,
                    campaignSpecificInstructions,
                })
            })

            if (!res.ok) throw new Error('プロジェクトの保存に失敗しました。')
            const savedProject = await res.json()

            if (editingProject) {
                mutateProjects(swrProjects.map((p: Project) => p.id === savedProject.id ? savedProject : p), { revalidate: false })
            } else {
                mutateProjects([savedProject, ...swrProjects], { revalidate: false })
            }
            closeModal()
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()

        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('削除に失敗しました。')
            mutateProjects(swrProjects.filter((p: Project) => p.id !== id), { revalidate: false })
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        }
    }

    return {
        projects, isModalOpen, viewingProject, editingProject, isSaving, error,
        name, setName,
        description, setDescription,
        objective, setObjective,
        hashtags, setHashtags,
        ageRange, setAgeRange,
        gender, setGender,
        location, setLocation,
        profession, setProfession,
        toneStyle, setToneStyle,
        writingStyleNotes, setWritingStyleNotes,
        exampleCaptions, setExampleCaptions,
        postingFrequency, setPostingFrequency,
        preferredTimeSlots, setPreferredTimeSlots,
        campaignDuration, setCampaignDuration,
        preferredCtaTypes, setPreferredCtaTypes,
        wordsToAvoid, setWordsToAvoid,
        toneRestrictions, setToneRestrictions,
        customPromptNotes, setCustomPromptNotes,
        campaignSpecificInstructions, setCampaignSpecificInstructions,
        openModal, closeModal, openViewModal, closeViewModal, handleSave, handleDelete
    }
}
