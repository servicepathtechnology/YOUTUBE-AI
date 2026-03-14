"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PodcastPlayer({ audioUrl }: { audioUrl: string }) {
  return (
    <Card className="shadow-md border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">🎧</span> AI Masterclass Podcast
        </CardTitle>
        <a 
          href={audioUrl} 
          download="podcast.mp3" 
          className="text-xs text-primary hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download MP3
        </a>
      </CardHeader>
      <CardContent>
        <audio controls className="w-full outline-none" src={audioUrl}>
          Your browser does not support the audio element.
        </audio>
      </CardContent>
    </Card>
  )
}
