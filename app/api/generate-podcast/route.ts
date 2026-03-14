import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { geminiModel } from "@/lib/gemini";
import { v4 as uuidv4 } from "uuid";

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

    if (video.podcast_audio_url) {
      return NextResponse.json({ audio_url: video.podcast_audio_url });
    }

    // 1. Generate Podcast Script using Gemini (Step 6)
    const scriptPrompt = `
      You are a professional podcast script writer. Convert the following summary into a high-quality "Deep Dive" podcast episode.
      
      Requirements:
      1. Use ONLY two speakers: "Host" and "Expert".
      2. The "Host" introduces the topic and asks insightul questions.
      3. The "Expert" explains the details from the summary using professional but accessible language.
      4. STICK STRICTLY to the information provided in the summary. Do not hallucinate external facts.
      5. Format the output as:
         Host: [speech]
         Expert: [speech]
      6. Keep it professional, informative, and exactly like a real-time expert podcast.
      7. Limit the script to approximately 1500 characters.

      Summary of the Video Content:
      ${video.summary}
    `;

    const scriptResult = await geminiModel.generateContent(scriptPrompt);
    let podcastScript = scriptResult.response.text();

    // Step 12: Limit podcast script length
    if (podcastScript.length > 1500) {
      podcastScript = podcastScript.substring(0, 1500);
    }

    // 2. Generate Audio with Python gTTS Service (Step 5 & 7)
    const pythonServiceUrl = "http://localhost:5001/generate-podcast";
    
    const ttsResponse = await fetch(pythonServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: podcastScript }),
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate audio from Python service");
    }

    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    // 3. Upload to Supabase Storage (Step 8)
    const fileName = `podcast-${video_id}-${uuidv4()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("podcasts")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      
      // Check if it's a "bucket not found" error to provide a better message
      if (uploadError.message.includes("not found") || (uploadError as any).status === 404) {
        throw new Error("Supabase Storage bucket 'podcasts' not found. Please create it in your Supabase dashboard.");
      }
      
      throw new Error(`Failed to upload podcast to storage: ${uploadError.message}`);
    }

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from("podcasts")
      .getPublicUrl(fileName);

    // 5. Update Database
    const { error: updateError } = await supabase
      .from("videos")
      .update({
        podcast_audio_url: publicUrl
      })
      .eq("id", video_id);

    if (updateError) throw updateError;

    return NextResponse.json({ audio_url: publicUrl });
  } catch (error: any) {
    console.error("Generate Podcast Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate podcast" }, { status: 500 });
  }
}
