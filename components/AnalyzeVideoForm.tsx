"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, AlertCircle } from 'lucide-react'
import { ProcessingScreen } from '@/components/ProcessingScreen'

export function AnalyzeVideoForm() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<string>('idle')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isProcessing = status !== 'idle' && status !== 'done' && status !== 'error'

  const currentStep = status === 'fetching_transcript' ? 0
    : status === 'generating_summary' ? 1
    : status === 'creating_podcast' ? 2
    : status === 'building_tutor' ? 3 : 0

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    setError(null)
    setStatus('fetching_transcript')

    try {
      // Step 1: fetch transcript (language-agnostic)
      const analyzeRes = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: url }),
      })
      if (!analyzeRes.ok) {
        const d = await analyzeRes.json()
        throw new Error(d.error || 'Failed to analyze video')
      }
      const { video, status: videoStatus } = await analyzeRes.json()
      const videoId = video.id

      // If fully cached (all 3 languages already done), skip straight to results
      if (videoStatus === 'cached' && video.multilang_content && video.podcast_urls) {
        setStatus('done')
        router.push(`/video/${videoId}`)
        return
      }

      // Step 2: generate summary in all 3 languages in parallel
      setStatus('generating_summary')
      const summaryRes = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId }),
      })
      if (!summaryRes.ok) throw new Error('Failed to generate summary')

      // Step 3: generate podcasts in all 3 languages in parallel
      setStatus('creating_podcast')
      const podcastRes = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, duration: 2 }),
      })
      if (!podcastRes.ok) throw new Error('Failed to create podcast')

      setStatus('done')
      router.push(`/video/${videoId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.')
      setStatus('idle')
    }
  }

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-elevated">
      {!isProcessing ? (
        <form onSubmit={handleAnalyze} className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Paste YouTube URL..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="flex-1 h-12 bg-bg-secondary border-border text-text-primary placeholder:text-text-muted font-sans"
              required
            />
            <Button
              type="submit"
              className="h-12 px-6 bg-accent hover:bg-accent-hover text-white font-bold shrink-0"
            >
              <Zap className="w-4 h-4 mr-1.5 fill-white" />
              Analyze
            </Button>
          </div>
          <p className="text-xs text-text-muted font-sans">
            Actify generates summary, insights, action plan & podcast in English, Hindi and Telugu automatically.
          </p>
          {error && (
            <div className="p-3 text-error bg-error/10 border border-error/20 rounded-lg text-sm flex items-center gap-2 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </form>
      ) : (
        <ProcessingScreen currentStep={currentStep} stepProgress={50} videoUrl={url} />
      )}
    </div>
  )
}