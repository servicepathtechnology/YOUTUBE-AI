import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Used for summaries — best quality
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Used for podcast scripts & chat — faster, separate quota pool
export const geminiFastModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Retry with exponential backoff on 429 quota errors
export async function generateWithRetry(
  model: GenerativeModel,
  prompt: string,
  maxRetries = 6
): Promise<string> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      const is429 = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("Too Many Requests");
      if (!is429) throw err;
      lastError = err;
      // Extract retryDelay from error if available, else exponential backoff
      const retryMatch = err?.message?.match(/"retryDelay":"(\d+)s"/);
      const waitSec = retryMatch ? parseInt(retryMatch[1]) : Math.pow(2, attempt) * 5;
      console.warn(`Gemini quota hit, retrying in ${waitSec}s (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
    }
  }
  throw lastError;
}
