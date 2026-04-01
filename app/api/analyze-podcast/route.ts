import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function transcribeAudioFromUrl(audioUrl: string): Promise<string> {
  // Fetch the audio file and convert to base64 for Gemini
  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error(`Failed to fetch audio: HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "audio/mpeg";
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const result = await geminiModel.generateContent([
    {
      inlineData: {
        mimeType: contentType.split(";")[0] as any,
        data: base64,
      },
    },
    {
      text: "Please transcribe this audio accurately. Return only the transcribed text, no timestamps or speaker labels.",
    },
  ]);
  return result.response.text().trim();
}

async function transcribeAudioFromBase64(base64: string, mimeType: string): Promise<string> {
  const result = await geminiModel.generateContent([
    {
      inlineData: {
        mimeType: mimeType as any,
        data: base64,
      },
    },
    {
      text: "Please transcribe this audio accurately. Return only the transcribed text, no timestamps or speaker labels.",
    },
  ]);
  return result.response.text().trim();
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    let title = "Podcast";
    let transcript = "";
    let podcastSlug = "";
    let inputUrl = "";

    if (contentType.includes("multipart/form-data")) {
      // File upload path
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const customTitle = formData.get("title") as string | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      title = customTitle || file.name.replace(/\.[^.]+$/, "") || "Podcast";
      podcastSlug = `podcast_file_${uuidv4().replace(/-/g, "").slice(0, 20)}`;
      inputUrl = `file://${file.name}`;

      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type || "audio/mpeg";

      transcript = await transcribeAudioFromBase64(base64, mimeType);
    } else {
      // URL path
      const body = await req.json();
      inputUrl = body.url || "";
      const customTitle = body.title || "";

      if (!inputUrl) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
      }

      title = customTitle || new URL(inputUrl).hostname + " Podcast";
      podcastSlug = Buffer.from(inputUrl).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);

      // Check cache
      const { data: existing } = await supabase
        .from("videos")
        .select("*")
        .eq("video_id", podcastSlug)
        .eq("user_id", user.id)
        .single();

      if (existing?.transcript) {
        return NextResponse.json({ message: "Podcast already processed", video: existing, status: "cached" });
      }

      transcript = await transcribeAudioFromUrl(inputUrl);
    }

    // Check cache for file uploads too (by slug)
    if (!contentType.includes("multipart/form-data")) {
      // already checked above
    }

    // Try inserting with source_type first; fall back without it if column doesn't exist yet
    let newRecord: any = null;
    let insertError: any = null;

    const withSourceType = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        video_url: inputUrl,
        video_id: podcastSlug,
        title,
        thumbnail: null,
        transcript,
        language: "PODCAST",
        source_type: "podcast",
      })
      .select()
      .single();

    if (withSourceType.error?.code === "PGRST204") {
      // Column not yet in schema cache — insert without it, use language field as marker
      const fallback = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          video_url: inputUrl,
          video_id: podcastSlug,
          title,
          thumbnail: null,
          transcript,
          language: "PODCAST",
        })
        .select()
        .single();
      newRecord = fallback.data;
      insertError = fallback.error;
    } else {
      newRecord = withSourceType.data;
      insertError = withSourceType.error;
    }

    if (insertError) throw insertError;

    return NextResponse.json({
      message: "Podcast transcribed and stored",
      video: newRecord,
      status: "new",
    });
  } catch (error: any) {
    console.error("Analyze Podcast Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze podcast" }, { status: 500 });
  }
}
