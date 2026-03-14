import { YoutubeTranscript } from "youtube-transcript";

export async function fetchTranscript(videoId: string) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((item) => item.text).join(" ");
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw new Error("Could not fetch transcript for this video. It might be disabled or unavailable.");
  }
}
