import { requireAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api.utils'
export async function GET(req: Request) {
    try {
        const userId = await requireAuth()

        const { searchParams } = new URL(req.url)
        const accountId = searchParams.get('accountId')

        const whereClause: any = { userId: userId }
        if (accountId) {
            whereClause.accountId = accountId
        }

        const projects = await prisma.project.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' }
        })

        return apiSuccess(projects)
    } catch (error: any) {
        if (error?.isAuthError) return apiError("Unauthorized", 401)
        console.error('[GET /api/projects]', error)
        return apiError('Internal Error')
    }
}

export async function POST(req: Request) {
    try {
        const userId = await requireAuth()

        const body = await req.json()
        const { 
            name, description, objective, accountId,
            ageRange, gender, location, profession,
            toneStyle, writingStyleNotes, exampleCaptions,
            postingFrequency, preferredTimeSlots, campaignDuration,
            preferredCtaTypes, wordsToAvoid, toneRestrictions,
            customPromptNotes, campaignSpecificInstructions,
            defaultHashtags
        } = body
        
        if (!name) return apiError('Name is required', 400)

        const project = await prisma.project.create({
            data: {
                userId,
                accountId,
                name,
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
                defaultHashtags: Array.isArray(defaultHashtags) ? defaultHashtags : [],
            }
        })

        return apiSuccess(project)
    } catch (error: any) {
        if (error?.isAuthError) return apiError("Unauthorized", 401)
        console.error('[POST /api/projects]', error)
        return apiError('Internal Error')
    }
}
