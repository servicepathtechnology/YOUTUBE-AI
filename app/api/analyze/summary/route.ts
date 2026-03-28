import { NextResponse } from 'next/server'
import { geminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json()

    const prompt = `Summarize the following YouTube transcript into:
1) short summary
2) 10 bullet points
3) key learning concepts

Format the output strictly as JSON with this exact structure:
{
  "summary": "String value of short summary",
  "bullet_points": ["point 1", "point 2"],
  "key_concepts": ["concept 1", "concept 2"]
}

Transcript:
${transcript.substring(0, 15000)}`

    const result = await geminiModel.generateContent(prompt)
    let rawContent = result.response.text()

    let data: any
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON found in response")
      data = JSON.parse(jsonMatch[0])
    } catch {
      const cleaned = rawContent.replace(/\n/g, "\\n").match(/\{[\s\S]*\}/)
      if (cleaned) data = JSON.parse(cleaned[0])
      else throw new Error("Failed to parse JSON response from Gemini.")
    }

    return NextResponse.json({
      summary: data.summary || "",
      bullet_points: data.bullet_points || data.bulletPoints || [],
      key_concepts: data.key_concepts || data.keyConcepts || [],
    })
  } catch (error: any) {
    console.error("Gemini API Error in Summary Route:", error)
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 })
  }
}
