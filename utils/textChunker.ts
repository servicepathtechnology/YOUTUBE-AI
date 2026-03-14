export function chunkText(text: string, maxTokens: number = 3000): string[] {
  // Simple word-based chunking as a proxy for tokens
  const words = text.split(" ");
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const word of words) {
    if (currentWordCount + word.length / 4 > maxTokens) { // Very rough estimate: 1 token ~= 4 chars
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
      currentWordCount = 0;
    }
    currentChunk.push(word);
    currentWordCount += word.length / 4;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}
