import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { geminiFastModel, geminiModel } from "@/lib/gemini";

const LANGUAGES = ['ENGLISH', 'HINDI', 'TELUGU'] as const;
type Lang = typeof LANGUAGES[number];

async function generateForLanguage(transcript: string, title: string, language: Lang) {
  const limitedTranscript = transcript.split(" ").slice(0, 10000).join(" ");
  const contentSource = transcript.length > 0
    ? `Content:\n${limitedTranscript}`
    : `Title: "${title}" (no content available — use your knowledge)`;

  const prompt = `
You are an expert content analyzer for Actify, an AI-powered action platform.
Analyze the provided content and generate structured outputs in ${language} language.

CRITICAL: ALL text in the response MUST be in ${language} language.

Output MUST be a valid JSON object with this exact structure:
{
  "summary": "A concise 2-3 sentence narrative overview in ${language}.",
  "bullet_points": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5", "Takeaway 6", "Takeaway 7", "Takeaway 8", "Takeaway 9", "Takeaway 10"],
  "key_concepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4", "Concept 5"],
  "key_insights": [
    {"headline": "Insight title", "explanation": "1-2 sentence explanation"},
    {"headline": "Insight title", "explanation": "1-2 sentence explanation"},
    {"headline": "Insight title", "explanation": "1-2 sentence explanation"},
    {"headline": "Insight title", "explanation": "1-2 sentence explanation"},
    {"headline": "Insight title", "explanation": "1-2 sentence explanation"},
    {"headline": "Insight title", "explanation": "1-2 sentence explanation"},
    {"headline": "Insight title", "explanation": "1-2 sentence explanation"}
  ],
  "action_plan": [
    {"step": "Step title", "description": "Brief description of what to do"},
    {"step": "Step title", "description": "Brief description of what to do"},
    {"step": "Step title", "description": "Brief description of what to do"},
    {"step": "Step title", "description": "Brief description of what to do"},
    {"step": "Step title", "description": "Brief description of what to do"}
  ],
  "mistakes_to_avoid": [
    {"mistake": "Mistake title", "why": "Why this matters / consequence"},
    {"mistake": "Mistake title", "why": "Why this matters / consequence"},
    {"mistake": "Mistake title", "why": "Why this matters / consequence"},
    {"mistake": "Mistake title", "why": "Why this matters / consequence"}
  ]
}

Requirements:
1. summary: 2-3 sentences in ${language}
2. bullet_points: EXACTLY 10 key takeaways in ${language}
3. key_concepts: EXACTLY 5 short concepts in ${language}
4. key_insights: 5-7 insights with headline + explanation in ${language}
5. action_plan: 4-6 actionable steps with title + description in ${language}
6. mistakes_to_avoid: 3-5 common mistakes with title + why it matters in ${language}
7. Do NOT include any text before or after the JSON.

${contentSource}
`;

  let result;
  try {
    result = await geminiModel.generateContent(prompt);
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.message?.includes("429");
    if (isQuota) {
      result = await geminiFastModel.generateContent(prompt);
    } else {
      throw err;
    }
  }

  const responseText = result.response.text();
  try {
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    return JSON.parse(responseText.substring(jsonStart, jsonEnd));
  } catch {
    return {
      summary: responseText.substring(0, 300) + "...",
      bullet_points: [],
      key_concepts: [],
      key_insights: [],
      action_plan: [],
      mistakes_to_avoid: [],
    };
  }
}

export async function POST(req: Request) {
  try {
    const { video_id } = await req.json();
    const supabase = await createClient();

    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", video_id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Return cached multilang data if already generated
    if (video.multilang_content) {
      return NextResponse.json({ multilang_content: video.multilang_content });
    }

    const transcript = video.transcript || "";
    const title = video.title || "this video";

    // Generate all 3 languages in parallel
    const [english, hindi, telugu] = await Promise.all([
      generateForLanguage(transcript, title, 'ENGLISH'),
      generateForLanguage(transcript, title, 'HINDI'),
      generateForLanguage(transcript, title, 'TELUGU'),
    ]);

    const multilangContent = { ENGLISH: english, HINDI: hindi, TELUGU: telugu };

    // Also keep legacy single-language fields for backward compat (use ENGLISH as default)
    await supabase
      .from("videos")
      .update({
        multilang_content: multilangContent,
        summary: english.summary,
        bullet_points: english.bullet_points,
        key_concepts: english.key_concepts,
        key_insights: english.key_insights?.map((i: any) => JSON.stringify(i)),
        action_plan: english.action_plan?.map((i: any) => JSON.stringify(i)),
        mistakes_to_avoid: english.mistakes_to_avoid?.map((i: any) => JSON.stringify(i)),
      })
      .eq("id", video_id);

    return NextResponse.json({ multilang_content: multilangContent });
  } catch (error: any) {
    console.error("Generate Summary Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
  }
}