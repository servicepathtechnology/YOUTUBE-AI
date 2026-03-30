import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { geminiFastModel, geminiModel } from "@/lib/gemini";
import { chunkText } from "@/utils/textChunker";

export async function POST(req: Request) {
  try {
    const { video_id, language = 'ENGLISH' } = await req.json();
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
    const title = video.title || "this video";
    
    console.log(`Processing summary for video: ${video_id}. Title: "${title}". Transcript length: ${transcript.length}`);

    let prompt = "";
    if (transcript && transcript.length > 0) {
      // Standard transcript-based prompt
      const limitedTranscript = transcript.split(" ").slice(0, 10000).join(" ");
      prompt = `
        You are an expert content analyzer. Summarize the provided YouTube transcript into a structured format.
        
        CRITICAL: The entire response (summary, bullet points, and key concepts) MUST be in ${language} language.
        
        Output MUST be a valid JSON object with the following structure:
        {
          "summary": "A concise 2-3 sentence narrative overview of the video in ${language}.",
          "bullet_points": ["Point 1 in ${language}", "Point 2 in ${language}", ... "Point 10 in ${language}"],
          "key_concepts": ["Concept 1 in ${language}", "Concept 2 in ${language}", ... "Concept 5 in ${language}"]
        }

        Requirements:
        1. Narrative summary must be accurate to the video content and in ${language}.
        2. Provide EXACTLY 10 bullet points for key takeaways in ${language}.
        3. Provide EXACTLY 5 short key learning concepts in ${language}.
        4. Do not include any text before or after the JSON.
        
        Transcript:
        ${limitedTranscript}
      `;
    } else {
      // Fallback prompt when transcript is missing
      prompt = `
        You are an expert content analyzer. I don't have the full transcript for this YouTube video, but I have the title: "${title}".
        
        CRITICAL: The entire response (summary, bullet points, and key concepts) MUST be in ${language} language.
        
        Using your knowledge and the context of the title, provide a highly probable summary of what this video covers. 
        If it's a popular topic (like AI, business, tech), use your training data to be as specific as possible.
        
        Output MUST be a valid JSON object with the following structure:
        {
          "summary": "A concise 2-3 sentence overview based on the title and likely content in ${language}.",
          "bullet_points": ["Point 1 in ${language}", "Point 2 in ${language}", ... "Point 10 in ${language}"],
          "key_concepts": ["Concept 1 in ${language}", "Concept 2 in ${language}", ... "Concept 5 in ${language}"]
        }

        Requirements:
        1. Create a professional and convincing summary in ${language}.
        2. Provide EXACTLY 10 bullet points for likely takeaways in ${language}.
        3. Provide EXACTLY 5 short key learning concepts in ${language}.
        4. Do not include any text before or after the JSON.
        5. Acknowledge the topic is "${title}" in ${language}.
      `;
    }

    // Try primary model first, fall back to lite if quota exceeded
    let result;
    try {
      result = await geminiModel.generateContent(prompt);
    } catch (err: any) {
      const isQuota = err?.status === 429 || err?.message?.includes("429");
      if (isQuota) {
        console.warn("gemini-2.5-flash quota hit, falling back to gemini-2.5-flash-lite");
        result = await geminiFastModel.generateContent(prompt);
      } else {
        throw err;
      }
    }
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
