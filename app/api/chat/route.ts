import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy")
  try {
    const { videoId, transcript, message, history } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const systemInstruction = `You are an AI tutor for a specific YouTube video. 
Only answer based on the YouTube transcript provided below.
If the question is unrelated to the transcript, politely remind the user that you are an AI tutor for this video.
Limit your response output format to be concise and conversational.

Transcript:
${transcript.substring(0, 15000)}`

    // Map `history` from existing format to Gemini's format 
    // `user` -> `user`, `assistant` -> `model`
    const mappedHistory = history.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }))

    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
      generationConfig: {
        maxOutputTokens: 600, // Implements the token limit request
      }
    })

    const chat = chatModel.startChat({
       history: mappedHistory
    })

    const result = await chat.sendMessage(message)
    const answer = result.response.text()

    // Save chat history to supabase
    await supabase.from('chats').insert([
       { video_id: videoId, user_id: user.id, role: 'user', message: message },
       { video_id: videoId, user_id: user.id, role: 'assistant', message: answer }
    ])

    return NextResponse.json({ answer })
  } catch (error: any) {
    console.error("Gemini API Error in Chat Route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
