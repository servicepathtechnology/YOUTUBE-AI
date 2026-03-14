"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export function AnalyzeVideoForm() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<string>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcriptLen, setTranscriptLen] = useState<number>(0)
  const router = useRouter()

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    setStatus('fetching_transcript')
    setError(null)

    try {
      // 1. Fetch Transcript and Basic Info
      setStatus('fetching_transcript');
      const analyzeRes = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: url })
      });
      
      if (!analyzeRes.ok) {
        const errorData = await analyzeRes.json();
        throw new Error(errorData.error || "Failed to analyze video");
      }
      
      const { video, status: videoStatus } = await analyzeRes.json();
      const videoId = video.id;

      if (videoStatus === 'cached' && video.podcast_audio_url) {
        setStatus('done');
        router.push(`/video/${videoId}`);
        return;
      }

      // 2. Generate Summary
      setStatus('generating_summary');
      const summaryRes = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId })
      });

      if (!summaryRes.ok) throw new Error("Failed to generate summary");

      // 3. Create Podcast
      setStatus('creating_podcast');
      const podcastRes = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId })
      });

      if (!podcastRes.ok) throw new Error("Failed to create podcast");

      setStatus('done');
      router.push(`/video/${videoId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
      setStatus('idle');
    }
  }

  return (
    <Card className="shadow-lg border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
          <Input 
            type="url" 
            placeholder="Paste YouTube Video URL here..." 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 text-lg py-6"
            required
            disabled={status !== 'idle' && status !== 'error'}
          />
          <Button type="submit" size="lg" className="h-[52px] px-8" disabled={status !== 'idle' && status !== 'error'}>
            {status !== 'idle' && status !== 'error' && status !== 'done' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Analyze Video
          </Button>
        </form>

        {status !== 'idle' && status !== 'done' && status !== 'error' && (
          <div className="mt-6 space-y-4 bg-muted/40 p-5 rounded-xl border">
            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider mb-3">Processing Steps</h3>
            
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${status === 'fetching_transcript' ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-green-500'}`}></div>
              <span className={status === 'fetching_transcript' ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                Fetching transcript {transcriptLen > 0 && `(${transcriptLen} chars)`}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${status === 'generating_summary' ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]' : (status === 'creating_podcast' || status === 'saving' ? 'bg-green-500' : 'bg-muted-foreground/30')}`}></div>
              <span className={status === 'generating_summary' ? 'font-medium text-foreground' : (status === 'creating_podcast' || status === 'saving' ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
                Generating AI summary & concepts
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${status === 'creating_podcast' ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]' : (status === 'saving' ? 'bg-green-500' : 'bg-muted-foreground/30')}`}></div>
              <span className={status === 'creating_podcast' ? 'font-medium text-foreground' : (status === 'saving' ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
                Creating AI podcast & voiceover
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${status === 'saving' ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-muted-foreground/30'}`}></div>
              <span className={status === 'saving' ? 'font-medium text-foreground' : 'text-muted-foreground/50'}>
                Preparing tutor & saving...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg">
            Error: {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
