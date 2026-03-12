import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy")
  try {
    const { transcript } = await req.json()

    const prompt = `Summarize the following YouTube transcript into:
1) short summary
2) 10 bullet points
3) key learning concepts

Format the output strictly as JSON with this exact structure:
{
  "summary": "String value of short summary",
  "bulletPoints": ["point 1", "point 2"],
  "keyConcepts": "String value explaining key learning concepts"
}

Transcript:
${transcript.substring(0, 15000)}`

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        maxOutputTokens: 1024,
      }
    })

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
      }
    })

    let rawContent = result.response.text()
    console.log("Gemini Raw Response length:", rawContent.length)

    // Robust JSON extraction: look for the first { and last }
    let data;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON found in response")
      data = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON. Raw content:", rawContent)
      // Fallback: try to fix common JSON issues like unescaped newlines in strings
      try {
          const cleaned = rawContent.replace(/\n/g, "\\n").match(/\{[\s\S]*\}/)
          if (cleaned) data = JSON.parse(cleaned[0])
          else throw parseError
      } catch (e) {
          throw new Error("Failed to parse the JSON response from Gemini model.")
      }
    }

    return NextResponse.json({ 
      summary: (data.summary || "") + "\n\nKey Concepts:\n" + (data.keyConcepts || ""), 
      bulletPoints: data.bulletPoints || []
    })
  } catch (error: any) {
    console.error("Gemini API Error in Summary Route:", error)
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 })
  }
}
