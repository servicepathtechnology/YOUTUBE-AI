import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy")
  try {
    const { summary } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prompt = `Convert the following summary into a conversational podcast explanation between a teacher and a student. Keep it engaging but concise (under 2 minutes spoken length).
    
    Summary: ${summary}`

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        maxOutputTokens: 1024, 
      }
    })

    const result = await model.generateContent(prompt)
    const podcastScript = result.response.text() || 'Podcast script generation failed.'

    // Note: Gemini doesn't have a standard text-to-speech option to synthesize audio directly.
    // For this build, we are omitting the MP3 generation to let the application fall back gracefully and avoid crashing, 
    // unless another valid TTS service like Google Cloud Text-to-Speech is explicitly added.

    return NextResponse.json({ podcastAudioUrl: null, podcastScript })
  } catch (error: any) {
    console.error("Gemini API Error in Podcast Route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
