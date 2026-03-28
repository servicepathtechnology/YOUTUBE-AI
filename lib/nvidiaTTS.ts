/**
 * NVIDIA Riva TTS integration using the Sofia voice.
 * API docs: https://build.nvidia.com/nvidia/tts-sofia
 */

const NVIDIA_TTS_URL = "https://integrate.api.nvidia.com/v1/audio/speech";
const NVIDIA_API_KEY = process.env.NVIDIA_TTS_API_KEY;

export async function textToSpeech(text: string): Promise<Buffer> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_TTS_API_KEY is not configured.");
  }

  const response = await fetch(NVIDIA_TTS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/tts-sofia",
      input: text,
      voice: "Sofia",
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NVIDIA TTS failed (${response.status}): ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
