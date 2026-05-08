import type { ImageAnalysis, PatternAnalysis, ProjectContext, CaptionDraft, PostType } from '../types';
import { callModel } from '../utils/callModel';
import { validateCaptionDraft } from '../utils/validators';

/**
 * Input context for the writer — everything it needs in a single object.
 */
export interface WriterContext {
    anchorAnalysis?: ImageAnalysis;
    postType: PostType;
    sequenceSummary: string;
    patternData?: PatternAnalysis;
    projectContext?: ProjectContext;
    userPrompt?: string;
    currentCaption?: string;
    imageCount: number;
    aiUsageOption?: string;
}

/**
 * Build the full context block for the writer prompt.
 * Priority order: userPrompt > projectContext > imageAnalysis > patterns
 */
function buildContextBlock(ctx: WriterContext): string {
    let text = '';

    // 1. User Prompt (Highest Priority)
    if (ctx.userPrompt) {
        text += `[最優先 — ユーザーの指示]\n`;
        text += `${ctx.userPrompt}\n\n`;
    }

    // 2. Existing Draft to Enhance
    if (ctx.currentCaption) {
        text += `[既存のキャプション（改善対象）]\n${ctx.currentCaption}\n\n`;
    }

    // 3. Project Context
    if (ctx.projectContext) {
        text += `[プロジェクト情報]\n`;
        text += `プロジェクト名: ${ctx.projectContext.title}\n`;
        if (ctx.projectContext.description) text += `説明: ${ctx.projectContext.description}\n`;
        if (ctx.projectContext.objective) text += `目的: ${ctx.projectContext.objective}\n`;

        const details = [
            ctx.projectContext.ageRange && `年齢層: ${ctx.projectContext.ageRange}`,
            ctx.projectContext.gender && `性別: ${ctx.projectContext.gender}`,
            ctx.projectContext.location && `地域: ${ctx.projectContext.location}`,
            ctx.projectContext.profession && `職業: ${ctx.projectContext.profession}`
        ].filter(Boolean).join(', ');
        if (details) text += `ターゲット層: ${details}\n`;

        // Brand voice — core to caption generation
        if (ctx.projectContext.toneStyle) text += `ブランドトーン: ${ctx.projectContext.toneStyle}\n`;
        if (ctx.projectContext.writingStyleNotes) text += `執筆スタイルのルール: ${ctx.projectContext.writingStyleNotes}\n`;

        // Constraints — must be respected
        if (ctx.projectContext.wordsToAvoid) text += `【使用禁止ワード】: ${ctx.projectContext.wordsToAvoid}\n`;
        if (ctx.projectContext.toneRestrictions) text += `【トーン制限】: ${ctx.projectContext.toneRestrictions}\n`;

        // CTA — explicitly instruct the model
        if (ctx.projectContext.preferredCtaTypes) text += `【CTA — 必ず含めること】: ${ctx.projectContext.preferredCtaTypes}\n`;

        // Additional instructions
        if (ctx.projectContext.customPromptNotes) text += `カスタム指示: ${ctx.projectContext.customPromptNotes}\n`;
        if (ctx.projectContext.campaignSpecificInstructions) text += `キャンペーン指示: ${ctx.projectContext.campaignSpecificInstructions}\n`;

        // Example captions — show the model what style to emulate
        if (ctx.projectContext.exampleCaptions) {
            text += `\n[参考キャプション — このスタイルを参考にすること]\n${ctx.projectContext.exampleCaptions}\n`;
        }

        if (ctx.projectContext.defaultHashtags && ctx.projectContext.defaultHashtags.length > 0) {
            text += `デフォルトタグ（必ず含める）: ${ctx.projectContext.defaultHashtags.join(' ')}\n`;
        }

        text += '\n';
    }

    // 4. Image Analysis
    if (ctx.anchorAnalysis) {
        text += `[画像分析]\n`;
        text += `投稿タイプ: ${ctx.postType} (${ctx.imageCount}枚)\n`;
        text += `主題: ${ctx.anchorAnalysis.primary_subject}\n`;
        text += `シーン: ${ctx.anchorAnalysis.scene}\n`;
        text += `雰囲気: ${ctx.anchorAnalysis.mood}\n`;
        if (ctx.anchorAnalysis.objects.length > 0) {
            text += `オブジェクト: ${ctx.anchorAnalysis.objects.join(', ')}\n`;
        }
        if (ctx.anchorAnalysis.actions.length > 0) {
            text += `アクション: ${ctx.anchorAnalysis.actions.join(', ')}\n`;
        }
        text += '\n';
    }

    // 5. Sequence Summary (carousels)
    if (ctx.sequenceSummary) {
        text += `[カルーセル構成]\n${ctx.sequenceSummary}\n\n`;
    }

    // 6. Past Caption Patterns
    if (ctx.patternData) {
        text += `[過去の投稿パターン — スタイルを維持すること]\n`;
        text += `平均的な長さ: ${ctx.patternData.avg_length}\n`;
        text += `絵文字の使い方: ${ctx.patternData.emoji_usage}\n`;
        text += `フックスタイル: ${ctx.patternData.hook_style}\n`;
        text += `トーン: ${ctx.patternData.tone}\n`;
        text += `CTA: ${ctx.patternData.CTA_style}\n`;
        text += `まとめ: ${ctx.patternData.pattern_summary}\n\n`;
    }

    return text;
}

/**
 * Generate a single, high-quality Instagram caption.
 * Combines strategist + writer into a single API call.
 *
 * ALL OUTPUT IS IN JAPANESE — this is a Japanese-market Instagram platform.
 */
export async function runWriter(
    ctx: WriterContext,
    apiKey: string
): Promise<CaptionDraft> {
    const contextBlock = buildContextBlock(ctx);

    const isSlightAI = ctx.aiUsageOption === 'Slight AI' || ctx.aiUsageOption === 'Slight AI Use';
    const isNormalAI = ctx.aiUsageOption === 'Normal AI Use';

    const systemInstruction = isSlightAI
        ? "あなたは過去の投稿データのみに基づき、ユーザーの指示に沿って軽く調整を行うだけのアシスタントです。過度な創造性は控え、シンプルにまとめてください。"
        : isNormalAI
        ? "あなたはInstagramのコピーライターです。過度な装飾は避け、過去の分析データとプロジェクト設定を元に、自然で読みやすいキャプションを作成してください。"
        : "あなたはInstagramの日本市場に特化したプロのコピーライターです。以下のコンテキストを元に、エンゲージメント率の高い魅力的なキャプションを作成してください。";

    const prompt = `${systemInstruction}
以下のコンテキストを元に、キャプションを1つ作成してください。

出力はすべて日本語で書いてください。

═══════════════════════════════════════
${contextBlock}
═══════════════════════════════════════

【キャプション作成ルール】
1. 最初の1行（フック）は40文字以内で、読者の注意を引くこと
2. 画像をただ説明するのではなく、ストーリーや感情を伝えること
3. ${ctx.projectContext?.preferredCtaTypes ? `【CTA必須】プロジェクトで指定されたCTAを自然な形で必ず含めること: ${ctx.projectContext.preferredCtaTypes}` : 'CTAは自然に組み込むこと（強引にならないように）'}
4. AIっぽい定型文やマーケティングテンプレートは避けること
5. ${ctx.projectContext?.wordsToAvoid ? `【厳守】以下のワードは絶対に使用しないこと: ${ctx.projectContext.wordsToAvoid}` : 'ありきたりな言葉や使い古したフレーズは避けること'}
6. ${ctx.projectContext?.toneStyle ? `ブランドトーンを厳守すること: ${ctx.projectContext.toneStyle}` : 'ターゲット読者に合ったトーンで書くこと'}
7. ハッシュタグは日本語と英語を混ぜ、広いものとニッチなものを8〜15個${ctx.projectContext?.defaultHashtags?.length ? '（プロジェクトのデフォルトタグを必ず含める）' : ''}
${ctx.projectContext?.exampleCaptions ? '8. 参考キャプションのスタイル・リズム・言い回しを参考にして、同じトーンで書くこと' : ''}
${ctx.patternData ? `${ctx.projectContext?.exampleCaptions ? '9' : '8'}. 過去の投稿パターンに合わせて一貫性を保つこと` : ''}
${ctx.userPrompt ? `${ctx.patternData ? '10' : ctx.projectContext?.exampleCaptions ? '9' : '8'}. ユーザーの指示を最優先で反映すること` : ''}
${isSlightAI ? '※ 画像の分析データが提供されていないため、過去のパターンのトーンとユーザーのプロンプトだけに集中すること。' : ''}

出力形式（JSON）:
{
  "caption": "完成したキャプション（日本語）",
  "hashtags": ["#ハッシュタグ1", "#ハッシュタグ2", "..."]
}`;

    console.log('[Writer] Generating caption...');

    const raw = await callModel(apiKey, prompt, {
        label: 'Writer/generateCaption',
    });

    const draft = validateCaptionDraft(raw);
    console.log(`[Writer] Caption ready — ${draft.caption.length} chars, ${draft.hashtags.length} hashtags`);

    return draft;
}
