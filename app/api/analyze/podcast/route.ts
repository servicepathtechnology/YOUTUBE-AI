import { NextResponse } from 'next/server'
import { geminiModel } from '@/lib/gemini'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { summary } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prompt = `Convert the following summary into a conversational podcast explanation between a Host (female) and an Expert (male). Keep it engaging but concise (under 2 minutes spoken length). Format each line as "Host: ..." or "Expert: ...". Use plain text only.

Summary: ${summary}`

    const result = await geminiModel.generateContent(prompt)
    const podcastScript = result.response.text() || 'Podcast script generation failed.'

    return NextResponse.json({ podcastAudioUrl: null, podcastScript })
  } catch (error: any) {
    console.error("Gemini API Error in Podcast Route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
