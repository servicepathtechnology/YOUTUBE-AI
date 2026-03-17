import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { geminiModel } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { video_id, question } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("transcript, summary, title")
      .eq("id", video_id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Fetch previous chat history for context (limit to last 10 messages)
    const { data: history } = await supabase
      .from("chats")
      .select("role, message")
      .eq("video_id", video_id)
      .order("created_at", { ascending: true })
      .limit(10);

    const historyText = history?.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.message}`).join('\n') || '';

    // Prepare prompt
    const prompt = `
      You are an AI tutor specialized in the following video content.
      Your goal is to help the user understand the video better by answering their questions accurately and concisely.

      Video Title: ${video.title}
      Video Summary: ${video.summary}

      Transcript Context:
      ${video.transcript.substring(0, 15000)} // Limiting to stay within typical token bounds while being comprehensive

      Previous Conversation History:
      ${historyText}

      Instructions:
      1. Answer the user's question based on the transcript and summary provided.
      2. If the answer is not explicitly in the transcript but can be reasonably inferred from the context of the video, provide a helpful response.
      3. If the user asks for a general explanation or overview, use the summary to provide a high-level answer.
      4. If the question is completely unrelated to the video, politely state that you are specialized in this specific video's content.
      5. Keep your tone encouraging, educational, and professional.

      Current User Question:
      ${question}
    `;

    // Save user message
    await supabase.from("chats").insert({
      video_id,
      user_id: user.id,
      role: "user",
      message: question
    });

    // Get response from Gemini
    const result = await geminiModel.generateContent(prompt);
    const answer = result.response.text();

    // Save assistant message
    const { data: chatEntry, error: chatError } = await supabase
      .from("chats")
      .insert({
        video_id,
        user_id: user.id,
        role: "assistant",
        message: answer
      })
      .select()
      .single();

    if (chatError) throw chatError;

    return NextResponse.json({ answer, chat: chatEntry });
  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message || "Failed to get response from AI tutor" }, { status: 500 });
  }
}
