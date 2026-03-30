import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { geminiFastModel } from "@/lib/gemini";
import { v4 as uuidv4 } from "uuid";

// Map app language to edge-tts lang code
const LANG_CODE: Record<string, string> = {
  ENGLISH: "en",
  TELUGU:  "te",
  HINDI:   "hi",
};

export async function POST(req: Request) {
  try {
    const { video_id, duration = 2, language = "ENGLISH" } = await req.json();
    const supabase = await createClient();

    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", video_id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.podcast_audio_url) {
      return NextResponse.json({ audio_url: video.podcast_audio_url });
    }

    const targetChars = duration * 1000;
    const lang = language.toUpperCase();

    // 1. Generate podcast script via Gemini in the selected language
    const scriptPrompt = `
You are writing a script for a real podcast episode. The ENTIRE script must be written in ${lang} language only.

Two speakers:
- Host: female, warm and curious, asks sharp questions
- Expert: male, knowledgeable and clear, explains with real-world examples

STRICT RULES — follow every one:
1. Every single line must start with exactly "Host:" or "Expert:" — nothing else before it.
2. Each turn is 1 to 3 short sentences only. Keep it punchy and conversational.
3. Do NOT write any intro like "Welcome", "Hello everyone", "Thanks for joining" — start directly on the topic.
4. Do NOT write any outro like "Thanks for listening", "See you next time".
5. Do NOT use asterisks (*), hashtags (#), underscores (_), brackets [], parentheses (), or any markdown.
6. Do NOT write stage directions, emotions, or actions like (laughs), [music], *pauses*, etc.
7. Do NOT use the words "asterisks", "ashtaros", or any meta-commentary about formatting.
8. Write ONLY plain spoken words — exactly what the speaker says out loud.
9. The entire conversation must be in ${lang} language.
10. Target approximately ${targetChars} characters total.

Summary to convert:
${video.summary}
`.trim();

    let podcastScript = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await geminiFastModel.generateContent(scriptPrompt);
        podcastScript = result.response.text();
        break;
      } catch (err: any) {
        const isRetryable = err?.status === 503 || err?.status === 429 ||
          err?.message?.includes("503") || err?.message?.includes("429");
        if (isRetryable && attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }
        throw err;
      }
    }

    if (podcastScript.length > targetChars + 500) {
      podcastScript = podcastScript.substring(0, targetChars + 500);
    }

    // 2. Send to Python TTS service with correct language code
    const baseUrl = process.env.TTS_SERVICE_URL || "http://localhost:5001";
    const ttsUrl = `${baseUrl.replace(/\/$/, "")}/generate-podcast`;
    const langCode = LANG_CODE[lang] ?? "en";

    const ttsResponse = await fetch(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: podcastScript, lang: langCode }),
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate audio from TTS service");
    }

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());

    // 3. Upload to Supabase Storage
    const fileName = `podcast-${video_id}-${uuidv4()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("podcasts")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message.includes("not found") || (uploadError as any).status === 404) {
        throw new Error("Supabase Storage bucket 'podcasts' not found. Please create it in your Supabase dashboard.");
      }
      throw new Error(`Failed to upload podcast: ${uploadError.message}`);
    }

    // 4. Get public URL & update DB
    const { data: { publicUrl } } = supabase.storage.from("podcasts").getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("videos")
      .update({ podcast_audio_url: publicUrl })
      .eq("id", video_id);

    if (updateError) throw updateError;

    return NextResponse.json({ audio_url: publicUrl });
  } catch (error: any) {
    console.error("Generate Podcast Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate podcast" }, { status: 500 });
  }
}
