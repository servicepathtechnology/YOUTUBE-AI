import { YoutubeTranscript } from "youtube-transcript";

export async function fetchTranscript(videoId: string) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      console.warn(`No transcript items found for video ID: ${videoId}`);
      return "";
    }
    return transcript.map((item) => item.text).join(" ");
  } catch (error) {
    console.error("Error fetching transcript:", error);
    // Return empty string instead of throwing, so the summary fallback can work
    return "";
  }
}
