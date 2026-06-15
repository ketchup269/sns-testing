import { apiError } from '@/lib/api.utils'
import { requireAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params
        const userId = await requireAuth()

        const body = await req.json()
        const { 
            name, description, objective,
            ageRange, gender, location, profession,
            toneStyle, writingStyleNotes, exampleCaptions,
            postingFrequency, preferredTimeSlots, campaignDuration,
            preferredCtaTypes, wordsToAvoid, toneRestrictions,
            customPromptNotes, campaignSpecificInstructions,
            defaultHashtags, accountId
        } = body

        if (!name) return new NextResponse('Name is required', { status: 400 })

        const project = await prisma.project.update({
            where: { id: params.id, userId: userId },
            data: { 
                name, 
                accountId,
                description,
                objective,
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
                defaultHashtags: Array.isArray(defaultHashtags) ? defaultHashtags : undefined,
            }
        })

        return NextResponse.json(project)
    } catch (error: any) {
        if (error?.isAuthError) return apiError("Unauthorized", 401)
        console.error('[PUT /api/projects/[id]]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params
        const userId = await requireAuth()

        await prisma.project.delete({
            where: { id: params.id, userId: userId }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        if (error?.isAuthError) return apiError("Unauthorized", 401)
        console.error('[DELETE /api/projects/[id]]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
