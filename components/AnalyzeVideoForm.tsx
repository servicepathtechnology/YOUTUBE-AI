"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Check, AlertCircle } from 'lucide-react'
import { ProcessingScreen } from '@/components/ProcessingScreen'

export function AnalyzeVideoForm() {
  const [url, setUrl]                         = useState('')
  const [status, setStatus]                   = useState<string>('idle')
  const [error, setError]                     = useState<string | null>(null)
  const [features, setFeatures]               = useState({ summary: true, podcast: true, chat: true })
  const [podcastDuration, setPodcastDuration] = useState('2')
  const [language, setLanguage]               = useState('ENGLISH')
  const router = useRouter()

  const isProcessing = status !== 'idle' && status !== 'done' && status !== 'error'

  const currentStep = status === 'fetching_transcript' ? 0
    : status === 'generating_summary' ? 1
    : status === 'creating_podcast'   ? 2
    : status === 'building_tutor'     ? 3 : 0

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    setError(null)
    setStatus('fetching_transcript')

    try {
      const analyzeRes = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: url, language }),
      })
      if (!analyzeRes.ok) {
        const d = await analyzeRes.json()
        throw new Error(d.error || 'Failed to analyze video')
      }
      const { video, status: videoStatus } = await analyzeRes.json()
      const videoId = video.id

      if (videoStatus === 'cached' && video.podcast_audio_url && video.language === language) {
        setStatus('done')
        router.push(`/video/${videoId}`)
        return
      }

      setStatus('generating_summary')
      const summaryRes = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, language }),
      })
      if (!summaryRes.ok) throw new Error('Failed to generate summary')

      setStatus('creating_podcast')
      const podcastRes = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, duration: parseInt(podcastDuration), language }),
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

  const toggleFeature = (f: keyof typeof features) =>
    setFeatures(prev => ({ ...prev, [f]: !prev[f] }))

  return (
    <Card className="bg-bg-card border-border rounded-xl shadow-card overflow-hidden">
      <CardContent className="p-7">

        {/* ── FORM ── */}
        {!isProcessing && (
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="h-[52px] font-mono text-sm"
                required
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {(['summary', 'podcast', 'chat'] as const).map(f => (
                <button key={f} type="button" onClick={() => toggleFeature(f)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${
                    features[f]
                      ? 'bg-accent-glow border-accent text-accent'
                      : 'bg-bg-secondary border-border text-text-muted hover:border-text-secondary'
                  }`}>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${features[f] ? 'bg-accent border-accent text-white' : 'border-border'}`}>
                    {features[f] && <Check className="w-2.5 h-2.5" />}
                  </div>
                  {f === 'summary' ? 'Summary' : f === 'podcast' ? 'Podcast' : 'Chat Tutor'}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {features.podcast && (
                <div className="flex-1 space-y-3">
                  <Label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Podcast Duration</Label>
                  <div className="flex gap-2">
                    {['2', '5', '10'].map(dur => (
                      <button key={dur} type="button" onClick={() => setPodcastDuration(dur)}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${
                          podcastDuration === dur
                            ? 'bg-accent text-white border-accent'
                            : 'bg-bg-secondary border-border text-text-muted hover:border-text-secondary'
                        }`}>
                        {dur} min
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-1 space-y-3">
                <Label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Select Language</Label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full h-[45px] bg-bg-secondary border border-border rounded-lg px-4 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem',
                  }}>
                  <option value="ENGLISH">ENGLISH</option>
                  <option value="TELUGU">TELUGU</option>
                  <option value="HINDI">HINDI</option>
                </select>
              </div>
            </div>

            <Button type="submit" size="lg"
              className="w-full h-14 bg-gradient-to-br from-accent to-accent-secondary text-white font-bold text-[15px] shadow-glow">
              <Sparkles className="mr-2 h-5 w-5 fill-current" />
              Analyze Video ✦
            </Button>
          </form>
        )}

        {/* ── PROCESSING ── */}
        {isProcessing && (
          <ProcessingScreen
            currentStep={currentStep}
            stepProgress={50}
            videoUrl={url}
          />
        )}

        {/* ── ERROR ── */}
        {error && (
          <div className="mt-6 p-4 text-error bg-error/10 border border-error/20 rounded-lg text-sm flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

      </CardContent>
    </Card>
  )
}
