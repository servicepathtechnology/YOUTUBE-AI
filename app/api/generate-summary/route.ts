import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { geminiModel } from "@/lib/gemini";
import { chunkText } from "@/utils/textChunker";

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

    if (video.summary) {
      return NextResponse.json({ summary: video.summary, bullet_points: video.bullet_points, key_concepts: video.key_concepts });
    }

    const transcript = video.transcript || "";
    if (!transcript) {
      throw new Error("Transcript is empty. Cannot generate summary.");
    }

    console.log(`Generating summary for video: ${video_id}. Transcript length: ${transcript.length}`);

    // Limit transcript to avoid token issues, but keep it substantial
    const limitedTranscript = transcript.split(" ").slice(0, 10000).join(" ");
    
    const prompt = `
      You are an expert content analyzer. Summarize the provided YouTube transcript into a structured format.
      
      Output MUST be a valid JSON object with the following structure:
      {
        "summary": "A concise 2-3 sentence narrative overview of the video.",
        "bullet_points": ["Point 1", "Point 2", ... "Point 10"],
        "key_concepts": ["Concept 1", "Concept 2", ... "Concept 5"]
      }

      Requirements:
      1. Narrative summary must be accurate to the video content.
      2. Provide EXACTLY 10 bullet points for key takeaways.
      3. Provide EXACTLY 5 short key learning concepts.
      4. Do not include any text before or after the JSON.
      
      Transcript:
      ${limitedTranscript}
    `;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    
    let summary = "";
    let bulletPoints: string[] = [];
    let keyConcepts: string[] = [];

    try {
      // Clean up response text to find JSON
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const jsonStr = responseText.substring(jsonStart, jsonEnd);
      
      const data = JSON.parse(jsonStr);
      summary = data.summary || "Summary generation failed.";
      bulletPoints = data.bullet_points || [];
      keyConcepts = data.key_concepts || [];
      
      console.log("Successfully parsed summary JSON.");
    } catch (parseError) {
      console.error("JSON Parse Error directly from Gemini:", parseError);
      console.log("Raw response text:", responseText);
      
      // Attempt fallback if JSON is truly broken but text exists
      summary = responseText.substring(0, 300) + "...";
      bulletPoints = ["Could not parse detailed points."];
      keyConcepts = ["Analysis Error"];
    }

    // Update database
    const { error: updateError } = await supabase
      .from("videos")
      .update({
        summary,
        bullet_points: bulletPoints,
        key_concepts: keyConcepts
      })
      .eq("id", video_id);

    if (updateError) {
      console.error("Supabase Update Error:", updateError);
      throw updateError;
    }

    return NextResponse.json({ summary, bullet_points: bulletPoints, key_concepts: keyConcepts });
  } catch (error: any) {
    console.error("Generate Summary Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
  }
}
