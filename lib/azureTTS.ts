import * as sdk from "microsoft-cognitiveservices-speech-sdk";

const speechKey = process.env.AZURE_TTS_KEY;
const speechRegion = process.env.AZURE_TTS_REGION;

export async function textToSpeech(text: string): Promise<Buffer> {
  if (!speechKey || !speechRegion) {
    throw new Error("Azure TTS keys are not configured.");
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16khz32kBitrateMonoMp3;
  
  // Choose a conversational voice
  speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(Buffer.from(result.audioData));
        } else {
          reject(new Error(`Speech synthesis failed: ${result.errorDetails}`));
        }
        synthesizer.close();
      },
      (err) => {
        synthesizer.close();
        reject(err);
      }
    );
  });
}
