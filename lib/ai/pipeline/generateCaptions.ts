import type {
    PipelineInput,
    PipelineOutput,
    ImageAnalysis,
    PatternAnalysis,
} from '../types';
import { MAX_IMAGES } from '../types';
import { analyzeImage } from '../vision/analyzeImage';
import { detectPostType, interpretSequence } from '../sequence/interpretSequence';
import { analyzePatterns } from '../pattern/analyzer';
import { runWriter } from '../writer/writer';
import { prisma } from '@/lib/prisma';

const PATTERN_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Simplified pipeline orchestrator.
 *
 * Flow (2-3 API calls total):
 *  1. Analyze anchor image only                     → 1 API call
 *  2. (Multi-image only) Sequence interpretation     → 1 API call (conditional)
 *  3. Load or generate pattern analysis (cached)     → 0 or 1 API call
 *  4. Build combined context
 *  5. Run writer — single call, no strategist        → 1 API call
 */
export async function generateCaptions(input: PipelineInput): Promise<PipelineOutput> {
    const startTime = Date.now();
    const { apiKey } = input;

    console.log('═══════════════════════════════════════');
    console.log('[Pipeline] Starting simplified caption generation');
    console.log(`[Pipeline] Images: ${input.images.length}, Project: ${input.projectContext?.title || 'none'}, Prompt: ${input.userPrompt ? 'yes' : 'no'}`);
    console.log('═══════════════════════════════════════');

    // ── 1. VISION ANALYSIS — analyze only the anchor image ──────────────
    const imagesToAnalyze = input.images.slice(0, MAX_IMAGES);
    let anchorAnalysis: ImageAnalysis;
    
    // Skip image analysis for Normal and Slight AI modes
    const skipImageAnalysis = input.aiUsageOption === 'Normal AI Use' || input.aiUsageOption === 'Slight AI' || input.aiUsageOption === 'Slight AI Use';

    if (!skipImageAnalysis && imagesToAnalyze.length > 0) {
        console.log('[Pipeline] Stage 1: Analyzing anchor image...');
        try {
            anchorAnalysis = await analyzeImage(imagesToAnalyze[0], apiKey);
        } catch (err: any) {
            console.warn('[Pipeline] Vision analysis failed — using fallback:', err.message);
            anchorAnalysis = {
                objects: [],
                scene: 'unknown',
                mood: 'neutral',
                actions: [],
                primary_subject: 'image content',
                confidence: 0.2,
            };
        }
    } else {
        console.log(`[Pipeline] Stage 1: Skipping image analysis (Mode: ${input.aiUsageOption || 'text-only'})`);
        anchorAnalysis = {
            objects: [],
            scene: 'no image provided',
            mood: 'neutral',
            actions: [],
            primary_subject: 'text-only post',
            confidence: 0.1,
        };
    }

    // ── 2. POST TYPE DETECTION (local, no API call) ─────────────────────
    const postType = detectPostType(imagesToAnalyze.length);
    console.log(`[Pipeline] Stage 2: Post type = "${postType}"`);

    // ── 3. SEQUENCE INTERPRETATION (multi-image only — 1 API call) ──────
    let sequenceSummary = '';
    if (!skipImageAnalysis && postType !== 'single' && imagesToAnalyze.length > 1) {
        console.log('[Pipeline] Stage 3: Running sequence interpreter...');
        try {
            // Build lightweight analyses for non-anchor images from the anchor data
            // This avoids analyzing every image but still gives the sequence context
            const lightweightAnalyses: ImageAnalysis[] = [anchorAnalysis];
            // For remaining images, create placeholder analyses to indicate they exist
            for (let i = 1; i < imagesToAnalyze.length; i++) {
                lightweightAnalyses.push({
                    objects: [],
                    scene: `image ${i + 1} in sequence`,
                    mood: anchorAnalysis.mood, // assume similar mood
                    actions: [],
                    primary_subject: `additional image ${i + 1}`,
                    confidence: 0.3,
                });
            }
            const seqData = await interpretSequence(lightweightAnalyses, apiKey);
            sequenceSummary = `Theme: ${seqData.theme}. Arc: ${seqData.emotional_arc.join(' → ')}. Focus: ${seqData.anchor_focus}`;
        } catch (err: any) {
            console.warn('[Pipeline] Sequence interpretation failed (non-fatal):', err.message);
        }
    }

    // ── 4. PATTERN ANALYSIS (cached — 0 or 1 API call) ──────────────────
    console.log('[Pipeline] Stage 4: Loading pattern analysis...');
    const pastCaptions = input.pastCaptions?.filter(c => c && c.trim().length > 0) || [];

    let patternData = await getCachedOrFreshPatterns(
        input.userId,
        input.projectId,
        pastCaptions,
        apiKey
    );
    
    // Explicitly update pattern_summary to act as the "What we learned from past posts" section.
    if (patternData && pastCaptions.length > 0) {
        patternData.pattern_summary = `We analyzed ${pastCaptions.length} of your past successful posts. We learned that your audience responds well to a ${patternData.tone} tone and ${patternData.avg_length} captions. We will apply this specific hook style (${patternData.hook_style}) to your new caption.`;
    }

    // Pass project context in every AI mode
    const activeProjectContext = input.projectContext;

    // ── 5. BUILD CONTEXT + WRITE CAPTION (1 API call) ───────────────────
    console.log('[Pipeline] Stage 5: Generating caption...');

    const result = await runWriter({
        anchorAnalysis: skipImageAnalysis ? undefined : anchorAnalysis,
        postType,
        sequenceSummary,
        patternData,
        projectContext: activeProjectContext,
        userPrompt: input.userPrompt,
        currentCaption: input.currentCaption,
        imageCount: imagesToAnalyze.length,
        aiUsageOption: input.aiUsageOption,
    }, apiKey);

    console.log('═══════════════════════════════════════');
    console.log(`[Pipeline] COMPLETE in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log(`[Pipeline] Caption length: ${result.caption.length} chars, ${result.hashtags.length} hashtags`);
    console.log('═══════════════════════════════════════');

    return {
        caption: {
            text: result.caption,
            hashtags: result.hashtags,
            rationale: `Generated from image analysis + ${patternData ? 'learned patterns' : 'baseline patterns'}${input.projectContext ? ' + project context' : ''}${input.userPrompt ? ' + user prompt' : ''}.`,
        },
        analysis: {
            imageAnalysis: anchorAnalysis,
            patternAnalysis: patternData,
            pastCaptionsUsed: input.pastCaptions || [],
        }
    };
}

/**
 * Check the DB for cached pattern analysis. If cache is fresh (<24h), return it.
 * Otherwise, run the AI analyzer and store the result.
 */
async function getCachedOrFreshPatterns(
    userId: string | undefined,
    projectId: string | undefined,
    pastCaptions: string[],
    apiKey: string
): Promise<PatternAnalysis | undefined> {
    // Try to load from cache if we have user + project context
    if (userId && projectId) {
        try {
            const cached = await prisma.patternCache.findUnique({
                where: { projectId_userId: { projectId, userId } },
            });

            if (cached) {
                const age = Date.now() - cached.updatedAt.getTime();
                if (age < PATTERN_CACHE_TTL_MS) {
                    console.log(`[Pattern] Using cached analysis (age: ${Math.round(age / 60000)}min)`);
                    return JSON.parse(cached.data) as PatternAnalysis;
                }
                console.log('[Pattern] Cache expired, regenerating...');
            }
        } catch (err: any) {
            console.warn('[Pattern] Cache lookup failed (non-fatal):', err.message);
        }
    }

    // No cache or stale — run the analyzer
    if (pastCaptions.length === 0) {
        console.log('[Pattern] No past captions — using baseline defaults');
        return {
            avg_length: 'no data',
            emoji_usage: 'no data',
            hook_style: 'no data',
            tone: 'no data',
            CTA_style: 'no data',
            pattern_summary: 'No past captions available. This is the first generation — establish a strong initial voice.',
        };
    }

    try {
        const result = await analyzePatterns(pastCaptions, apiKey);

        // Store in cache
        if (userId && projectId) {
            try {
                await prisma.patternCache.upsert({
                    where: { projectId_userId: { projectId, userId } },
                    create: {
                        projectId,
                        userId,
                        data: JSON.stringify(result),
                    },
                    update: {
                        data: JSON.stringify(result),
                    },
                });
                console.log('[Pattern] Cached analysis for future use');
            } catch (err: any) {
                console.warn('[Pattern] Failed to cache (non-fatal):', err.message);
            }
        }

        return result;
    } catch (err: any) {
        console.warn('[Pattern] Analysis failed (non-fatal):', err.message);
        return undefined;
    }
}
