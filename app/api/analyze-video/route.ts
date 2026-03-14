import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { extractYoutubeId } from "@/utils/extractYoutubeId";
import { fetchTranscript } from "@/utils/transcriptFetcher";

export async function POST(req: Request) {
  try {
    const { youtube_url } = await req.json();
    const videoId = extractYoutubeId(youtube_url);

    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if video already exists for this user
    const { data: existingVideo } = await supabase
      .from("videos")
      .select("*")
      .eq("video_id", videoId)
      .eq("user_id", user.id)
      .single();

    if (existingVideo && existingVideo.transcript) {
      return NextResponse.json({ 
        message: "Video already processed", 
        video: existingVideo,
        status: "cached" 
      });
    }

    // Fetch video info (title, thumbnail) using oembed
    let title = "YouTube Video";
    let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title;
      }
    } catch (e) {
      console.error("Error fetching oembed:", e);
    }

    // Fetch transcript
    const transcript = await fetchTranscript(videoId);

    // Store in database
    const { data: newVideo, error: insertError } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        video_url: youtube_url,
        video_id: videoId,
        title,
        thumbnail,
        transcript,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ 
      message: "Transcript fetched and stored", 
      video: newVideo,
      status: "new"
    });
  } catch (error: any) {
    console.error("Analyze Video Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze video" }, { status: 500 });
  }
}
