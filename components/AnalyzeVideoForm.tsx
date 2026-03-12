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
      // 1. Fetch Transcript
      const tRes = await fetch('/api/analyze/transcript', {
        method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' }
      })
      if (!tRes.ok) {
        const errorData = await tRes.json().catch(() => ({ error: "Failed to fetch transcript" }))
        throw new Error(errorData.error || "Failed to fetch transcript")
      }
      const tData = await tRes.json()
      setTranscriptLen(tData.transcript.length)

      // 2. Generate Summary
      setStatus('generating_summary')
      const sRes = await fetch('/api/analyze/summary', {
        method: 'POST', body: JSON.stringify({ transcript: tData.transcript }), headers: { 'Content-Type': 'application/json' }
      })
      if (!sRes.ok) {
        const errorData = await sRes.json().catch(() => ({ error: "Failed to generate summary" }))
        throw new Error(errorData.error || "Failed to generate summary")
      }
      const sData = await sRes.json()

      // 3. Create Podcast
      setStatus('creating_podcast')
      const pRes = await fetch('/api/analyze/podcast', {
        method: 'POST', body: JSON.stringify({ summary: sData.summary }), headers: { 'Content-Type': 'application/json' }
      })
      if (!pRes.ok) {
        const errorData = await pRes.json().catch(() => ({ error: "Failed to create podcast" }))
        throw new Error(errorData.error || "Failed to create podcast")
      }
      const pData = await pRes.json()

      // 4. Save to DB
      setStatus('saving')
      const saveRes = await fetch('/api/analyze/save', {
        method: 'POST', 
        body: JSON.stringify({ 
          url,
          videoId: tData.videoId,
          title: tData.title,
          transcript: tData.transcript,
          summary: sData.summary,
          bulletPoints: sData.bulletPoints,
          podcastAudioUrl: pData.podcastAudioUrl
        }), 
        headers: { 'Content-Type': 'application/json' }
      })
      if (!saveRes.ok) throw new Error("Failed to save data")
      const saveData = await saveRes.json()

      setStatus('done')
      router.push(`/video/${saveData.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.')
      setStatus('idle')
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
