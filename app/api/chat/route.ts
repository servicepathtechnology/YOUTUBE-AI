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
      .select("transcript")
      .eq("id", video_id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Prepare prompt
    const prompt = `
      You are an AI tutor specialized in this video content.
      Answer the user's question ONLY using the information provided in the following transcript.
      If the answer is not in the transcript, say "I'm sorry, but that information is not covered in this video."
      
      Transcript:
      ${video.transcript}
      
      User Question:
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
