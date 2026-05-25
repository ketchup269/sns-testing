import { requireAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma';
import { generateCaptions } from '@/lib/ai/pipeline/generateCaptions';
import type { PipelineInput, ImagePart, ProjectContext } from '@/lib/ai/types';
import { apiError, apiSuccess, toErrorMessage } from '@/lib/api.utils';

export const maxDuration = 120; // Allow up to 120s — multi-stage pipeline needs time

export async function POST(req: Request) {
    try {
        const userId = await requireAuth();
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return apiError('Gemini API Key is missing in environment.');

        const body = await req.json();
        const {
            // New multi-image format
            images: rawImages,
            // Legacy single-image format (backward compat)
            imageBase64,
            mimeType,
            // Common fields
            customPrompt,
            currentCaption,
            projectId,
            locale,
        } = body;

        // ── 1. Build image parts (support both new and legacy format) ────
        const imageParts: ImagePart[] = [];

        if (rawImages && Array.isArray(rawImages) && rawImages.length > 0) {
            // New format: images[] array
            for (const img of rawImages) {
                if (img.base64 && img.mimeType) {
                    const data = img.base64.includes(',')
                        ? img.base64.split(',')[1]
                        : img.base64;
                    imageParts.push({
                        inlineData: { data, mimeType: img.mimeType },
                    });
                }
            }
        } else if (imageBase64 && mimeType) {
            // Legacy format: single imageBase64 + mimeType
            const data = imageBase64.includes(',')
                ? imageBase64.split(',')[1]
                : imageBase64;
            imageParts.push({
                inlineData: { data, mimeType },
            });
        }

        // ── 2. Fetch project context + historical data ───────────────────
        // ── 2. Fetch user settings, project context + historical data ───────────────────
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { aiUsageOption: true }
        })
        const aiUsageOption = user?.aiUsageOption || 'Normal AI Use';

        let projectContext: ProjectContext | undefined;
        let pastCaptions: string[] = [];

        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId, userId: userId },
            })
            if (!project) return apiError("Project not found", 404);

            projectContext = {
                title: project.name,
                description: project.description || undefined,
                objective: project.objective || undefined,
                defaultHashtags: project.defaultHashtags,
                ageRange: project.ageRange || undefined,
                gender: project.gender || undefined,
                location: project.location || undefined,
                profession: project.profession || undefined,
                toneStyle: project.toneStyle || undefined,
                writingStyleNotes: project.writingStyleNotes || undefined,
                exampleCaptions: project.exampleCaptions || undefined,
                wordsToAvoid: project.wordsToAvoid || undefined,
                toneRestrictions: project.toneRestrictions || undefined,
                customPromptNotes: project.customPromptNotes || undefined,
                campaignSpecificInstructions: project.campaignSpecificInstructions || undefined,
                postingFrequency: project.postingFrequency || undefined,
                preferredTimeSlots: project.preferredTimeSlots || undefined,
                campaignDuration: project.campaignDuration || undefined,
                preferredCtaTypes: project.preferredCtaTypes || undefined,
            };

            // Fetch published posts for this project to extract past captions
            const topPosts = await prisma.post.findMany({
                where: {
                    projectId,
                    userId: userId,
                    caption: { not: null as string | null },
                    instagramMediaId: { not: null as string | null },
                },
                orderBy: [{ likes: 'desc' }, { views: 'desc' }],
                take: 10,
                select: { caption: true },
            });

            // Extract past captions for pattern analysis
            pastCaptions = topPosts
                .map(p => p.caption)
                .filter((c): c is string => c != null && c.trim().length > 0);
        }

        // ── 3. Build pipeline input and run ──────────────────────────────
        const pipelineInput: PipelineInput = {
            images: imageParts,
            projectContext,
            userPrompt: customPrompt || undefined,
            currentCaption: currentCaption || undefined,
            pastCaptions,
            apiKey,
            userId,
            projectId: projectId || undefined,
            aiUsageOption,
            locale,
        };

        const result = await generateCaptions(pipelineInput);

        // ── 4. Return response ───────────────────────────────────────────
        return apiSuccess({
            options: [{
                caption: result.caption.text,
                hashtags: result.caption.hashtags,
                rationale: result.caption.rationale,
            }],
            // flat structure for backward compat
            caption: result.caption.text,
            hashtags: result.caption.hashtags || [],
            analysis: result.analysis,
        });
    } catch (error: any) {
        if (error?.isAuthError) return apiError("Unauthorized", 401)
        const message = toErrorMessage(error)
        console.error('[/api/generate] Error:', message);
        return apiError(message);
    }
}