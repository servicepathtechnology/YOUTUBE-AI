import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { extractYoutubeId, isYoutubeUrl } from "@/utils/extractYoutubeId";
import { fetchTranscript } from "@/utils/transcriptFetcher";
import { fetchArticleContent } from "@/utils/articleFetcher";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Support both field names for backward compat
    const inputUrl: string = body.youtube_url || body.url || "";

    if (!inputUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── YouTube path ──────────────────────────────────────────────────────────
    if (isYoutubeUrl(inputUrl)) {
      const videoId = extractYoutubeId(inputUrl);
      if (!videoId) {
        return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
      }

      const { data: existingVideo } = await supabase
        .from("videos")
        .select("*")
        .eq("video_id", videoId)
        .eq("user_id", user.id)
        .single();

      if (existingVideo?.transcript) {
        return NextResponse.json({ message: "Video already processed", video: existingVideo, status: "cached" });
      }

      let title = "YouTube Video";
      let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          title = oembedData.title;
        }
      } catch (e) {
        console.error("oEmbed error:", e);
      }

      const transcript = await fetchTranscript(videoId);

      const { data: newVideo, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          video_url: inputUrl,
          video_id: videoId,
          title,
          thumbnail,
          transcript,
          language: "MULTILANG",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({ message: "Transcript fetched and stored", video: newVideo, status: "new" });
    }

    // ── Article path ──────────────────────────────────────────────────────────
    // Use URL as a stable identifier (hashed to a short slug)
    const articleSlug = Buffer.from(inputUrl).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);

    const { data: existingArticle } = await supabase
      .from("videos")
      .select("*")
      .eq("video_id", articleSlug)
      .eq("user_id", user.id)
      .single();

    if (existingArticle?.transcript) {
      return NextResponse.json({ message: "Article already processed", video: existingArticle, status: "cached" });
    }

    const { title, content, thumbnail } = await fetchArticleContent(inputUrl);

    const { data: newArticle, error: insertError } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        video_url: inputUrl,
        video_id: articleSlug,
        title,
        thumbnail: thumbnail || null,
        transcript: content,
        language: "MULTILANG",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ message: "Article content fetched and stored", video: newArticle, status: "new" });

  } catch (error: any) {
    console.error("Analyze Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze URL" }, { status: 500 });
  }
}
