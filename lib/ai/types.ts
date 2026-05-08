// ─── Pipeline Input / Output ──────────────────────────────────────────────────

export interface ImagePart {
    inlineData: {
        data: string;
        mimeType: string;
    };
}

export interface ProjectContext {
    title: string;
    description?: string;
    objective?: string;
    defaultHashtags?: string[];
    ageRange?: string;
    gender?: string;
    location?: string;
    profession?: string;
    toneStyle?: string;
    writingStyleNotes?: string;
    exampleCaptions?: string;
    wordsToAvoid?: string;
    toneRestrictions?: string;
    customPromptNotes?: string;
    campaignSpecificInstructions?: string;
    postingFrequency?: string;
    preferredTimeSlots?: string;
    campaignDuration?: string;
    preferredCtaTypes?: string;
}

export interface PipelineInput {
    /** Base64 encoded images with mimeType */
    images: ImagePart[];
    /** Project-level context (demographics, brand voice, strategy) */
    projectContext?: ProjectContext;
    /** User's free-text prompt — highest priority override */
    userPrompt?: string;
    /** Existing draft caption to enhance */
    currentCaption?: string;
    /** Past captions from published posts — used for pattern learning */
    pastCaptions?: string[];
    /** Gemini API key */
    apiKey: string;
    /** User ID for pattern caching */
    userId?: string;
    /** Project ID for pattern caching */
    projectId?: string;
    /** AI usage mode (Normal AI Use, Slight AI, etc) */
    aiUsageOption?: string;
}

export type PostType = 'single' | 'small-carousel' | 'story-carousel';

// ─── Vision Analysis ──────────────────────────────────────────────────────────

export interface ImageAnalysis {
    objects: string[];
    scene: string;
    mood: string;
    actions: string[];
    primary_subject: string;
    confidence: number;
}

// ─── Sequence Interpretation ──────────────────────────────────────────────────

export interface SequenceInterpretation {
    theme: string;
    progression: string[];
    emotional_arc: string[];
    dominant_elements: string[];
    anchor_focus: string;
}

// ─── Pattern Analysis ─────────────────────────────────────────────────────────

export interface PatternAnalysis {
    avg_length: string;
    emoji_usage: string;
    hook_style: string;
    tone: string;
    CTA_style: string;
    pattern_summary: string;
}

// ─── Caption Draft ────────────────────────────────────────────────────────────

export interface CaptionDraft {
    caption: string;
    hashtags: string[];
}

// ─── Pipeline Output ──────────────────────────────────────────────────────────

export interface CaptionResult {
    text: string;
    hashtags: string[];
    rationale: string;
}

export interface PipelineOutput {
    caption: CaptionResult;
    analysis?: {
        imageAnalysis?: ImageAnalysis;
        patternAnalysis?: PatternAnalysis;
        pastCaptionsUsed?: string[];
    };
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_IMAGES = 10;
export const MODEL_NAME = 'gemini-2.5-flash-lite';
