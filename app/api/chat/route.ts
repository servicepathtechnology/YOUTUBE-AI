import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { geminiFastModel, generateWithRetry } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { video_id, question, language: clientLanguage } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("transcript, summary, title, language, multilang_content")
      .eq("id", video_id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Use language from client (user's current selection), fallback to stored
    const language = clientLanguage || video.language || 'ENGLISH';

    // Get the summary in the selected language if multilang available
    const multilang = video.multilang_content || {};
    const langSummary = multilang[language]?.summary || video.summary || '';

    const { data: history } = await supabase
      .from("chats")
      .select("role, message")
      .eq("video_id", video_id)
      .order("created_at", { ascending: true })
      .limit(10);

    const historyText = history
      ?.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.message}`)
      .join('\n') || '';

    const prompt = `
You are an AI tutor specialized in the following video content.
Your goal is to help the user understand the video better by answering their questions accurately and concisely.

CRITICAL: Your ENTIRE response MUST be in ${language} language only. Do not mix languages.

Video Title: ${video.title}
Video Summary: ${langSummary}

Transcript Context:
${(video.transcript || '').substring(0, 15000)}

Previous Conversation:
${historyText}

Instructions:
1. Answer based on the transcript and summary.
2. If not explicitly in the transcript but can be inferred, provide a helpful response.
3. If completely unrelated to the video, politely say you are specialized in this video's content.
4. Keep tone encouraging, educational, and professional.
5. ALL output must be in ${language} language.

User Question: ${question}
    `.trim();

    await supabase.from("chats").insert({
      video_id,
      user_id: user.id,
      role: "user",
      message: question,
    });

    const answer = await generateWithRetry(geminiFastModel, prompt);

    const { data: chatEntry, error: chatError } = await supabase
      .from("chats")
      .insert({
        video_id,
        user_id: user.id,
        role: "assistant",
        message: answer,
      })
      .select()
      .single();

    if (chatError) throw chatError;

    return NextResponse.json({ answer, chat: chatEntry });
  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message || "Failed to get response" }, { status: 500 });
  }
}