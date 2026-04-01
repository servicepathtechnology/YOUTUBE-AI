import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { geminiFastModel, generateWithRetry } from "@/lib/gemini";
import { v4 as uuidv4 } from "uuid";

const LANG_CODE: Record<string, string> = {
  ENGLISH: "en",
  TELUGU: "te",
  HINDI: "hi",
};

async function generatePodcastForLang(
  summary: string,
  lang: string,
  duration: number
): Promise<string> {
  const targetChars = duration * 1000;
  const scriptPrompt = `
You are writing a script for a real podcast episode. The ENTIRE script must be written in ${lang} language only.

Two speakers:
- Host: female, warm and curious, asks sharp questions
- Expert: male, knowledgeable and clear, explains with real-world examples

STRICT RULES:
1. Every single line must start with exactly "Host:" or "Expert:" — nothing else before it.
2. Each turn is 1 to 3 short sentences only. Keep it punchy and conversational.
3. Do NOT write any intro like "Welcome", "Hello everyone" — start directly on the topic.
4. Do NOT write any outro like "Thanks for listening", "See you next time".
5. Do NOT use asterisks (*), hashtags (#), underscores (_), brackets, parentheses, or any markdown.
6. Do NOT write stage directions, emotions, or actions like (laughs), [music], *pauses*, etc.
7. Write ONLY plain spoken words — exactly what the speaker says out loud.
8. The entire conversation must be in ${lang} language.
9. Target approximately ${targetChars} characters total.

Summary to convert:
${summary}
`.trim();

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      let script = await generateWithRetry(geminiFastModel, scriptPrompt);
      if (script.length > targetChars + 500) {
        script = script.substring(0, targetChars + 500);
      }
      return script;
    } catch (err: any) {
      const isRetryable = err?.status === 503 || err?.message?.includes("503");
      if (isRetryable && attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }
      throw err;
    }
  }
  return "";
}

async function uploadAudio(
  supabase: any,
  script: string,
  langCode: string,
  videoId: string
): Promise<string | null> {
  try {
    const baseUrl = process.env.TTS_SERVICE_URL || "http://localhost:5001";
    const ttsUrl = `${baseUrl.replace(/\/$/, "")}/generate-podcast`;

    const ttsResponse = await fetch(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: script, lang: langCode }),
    });

    if (!ttsResponse.ok) return null;

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    const fileName = `podcast-${videoId}-${langCode}-${uuidv4()}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from("podcasts")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) return null;

    const { data: { publicUrl } } = supabase.storage
      .from("podcasts")
      .getPublicUrl(fileName);

    return publicUrl;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { video_id, duration = 2 } = await req.json();
    const supabase = await createClient();

    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", video_id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Return cached if all 3 podcasts already exist
    if (video.podcast_urls?.ENGLISH && video.podcast_urls?.HINDI && video.podcast_urls?.TELUGU) {
      return NextResponse.json({ podcast_urls: video.podcast_urls });
    }

    // Get summaries from multilang_content
    const multilang = video.multilang_content || {};
    const enSummary = multilang.ENGLISH?.summary || video.summary || "";
    const hiSummary = multilang.HINDI?.summary || video.summary || "";
    const teSummary = multilang.TELUGU?.summary || video.summary || "";

    // Generate all 3 scripts in parallel
    const [enScript, hiScript, teScript] = await Promise.all([
      generatePodcastForLang(enSummary, "ENGLISH", duration),
      generatePodcastForLang(hiSummary, "HINDI", duration),
      generatePodcastForLang(teSummary, "TELUGU", duration),
    ]);

    // Upload all 3 audio files in parallel
    const [enUrl, hiUrl, teUrl] = await Promise.all([
      uploadAudio(supabase, enScript, "en", video_id),
      uploadAudio(supabase, hiScript, "hi", video_id),
      uploadAudio(supabase, teScript, "te", video_id),
    ]);

    const podcastUrls = {
      ENGLISH: enUrl,
      HINDI: hiUrl,
      TELUGU: teUrl,
    };

    const podcastScripts = {
      ENGLISH: enScript,
      HINDI: hiScript,
      TELUGU: teScript,
    };

    await supabase
      .from("videos")
      .update({
        podcast_urls: podcastUrls,
        podcast_scripts: podcastScripts,
        podcast_audio_url: enUrl,
        podcast_script: enScript,
      })
      .eq("id", video_id);

    // Insert rows into podcasts table for each generated language
    const { data: { user } } = await supabase.auth.getUser();
    const podcastRows = (
      [
        { language: "ENGLISH", url: enUrl, script: enScript },
        { language: "HINDI",   url: hiUrl, script: hiScript },
        { language: "TELUGU",  url: teUrl, script: teScript },
      ] as const
    )
      .filter(({ url }) => url)
      .map(({ language, url, script }) => ({
        video_id,
        user_id: user?.id,
        language,
        audio_url: url,
        script,
        duration_minutes: duration,
      }));

    if (podcastRows.length > 0) {
      await supabase.from("podcasts").insert(podcastRows);
    }

    return NextResponse.json({ podcast_urls: podcastUrls });
  } catch (error: any) {
    console.error("Generate Podcast Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate podcast" }, { status: 500 });
  }
}