"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Check, FileText, Headphones, MessageSquare, AlertCircle } from 'lucide-react'

export function AnalyzeVideoForm() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<string>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcriptLen, setTranscriptLen] = useState<number>(0)
  const [features, setFeatures] = useState({
    summary: true,
    podcast: true,
    chat: true
  })
  const [podcastDuration, setPodcastDuration] = useState('2') // Default 2 minutes
  const [language, setLanguage] = useState('ENGLISH') // Default English
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
        body: JSON.stringify({ 
          youtube_url: url,
          language: language
        })
      });
      
      if (!analyzeRes.ok) {
        const errorData = await analyzeRes.json();
        throw new Error(errorData.error || "Failed to analyze video");
      }
      
      const { video, status: videoStatus } = await analyzeRes.json();
      const videoId = video.id;

      if (videoStatus === 'cached' && video.podcast_audio_url && video.language === language) {
        setStatus('done');
        router.push(`/video/${videoId}`);
        return;
      }

      // 2. Generate Summary
      setStatus('generating_summary');
      const summaryRes = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          video_id: videoId,
          language: language
        })
      });

      if (!summaryRes.ok) throw new Error("Failed to generate summary");

      // 3. Create Podcast
      setStatus('creating_podcast');
      const podcastRes = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          video_id: videoId,
          duration: parseInt(podcastDuration),
          language: language
        })
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

  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }))
  }

  return (
    <Card className="bg-bg-card border-border rounded-xl shadow-card overflow-hidden">
      <CardContent className="p-7 space-y-7">
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <Input 
              id="youtube-url"
              type="url" 
              placeholder="https://youtube.com/watch?v=..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-[52px] font-mono text-sm"
              required
              disabled={status !== 'idle' && status !== 'error'}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => toggleFeature('summary')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${
                features.summary 
                  ? 'bg-accent-glow border-accent text-accent' 
                  : 'bg-bg-secondary border-border text-text-muted hover:border-text-secondary'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${features.summary ? 'bg-accent border-accent text-white' : 'border-border'}`}>
                {features.summary && <Check className="w-2.5 h-2.5" />}
              </div>
              Summary
            </button>
            <button
              type="button"
              onClick={() => toggleFeature('podcast')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${
                features.podcast 
                  ? 'bg-accent-glow border-accent text-accent' 
                  : 'bg-bg-secondary border-border text-text-muted hover:border-text-secondary'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${features.podcast ? 'bg-accent border-accent text-white' : 'border-border'}`}>
                {features.podcast && <Check className="w-2.5 h-2.5" />}
              </div>
              Podcast
            </button>
            <button
              type="button"
              onClick={() => toggleFeature('chat')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${
                features.chat 
                  ? 'bg-accent-glow border-accent text-accent' 
                  : 'bg-bg-secondary border-border text-text-muted hover:border-text-secondary'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${features.chat ? 'bg-accent border-accent text-white' : 'border-border'}`}>
                {features.chat && <Check className="w-2.5 h-2.5" />}
              </div>
              Chat Tutor
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {features.podcast && (
              <div className="flex-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Podcast Duration</Label>
                <div className="flex gap-2">
                  {['2', '5', '10'].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setPodcastDuration(dur)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${
                        podcastDuration === dur
                          ? 'bg-accent text-white border-accent shadow-glow-sm'
                          : 'bg-bg-secondary border-border text-text-muted hover:border-text-secondary'
                      }`}
                    >
                      {dur} min
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 space-y-3">
              <Label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Select Language</Label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-[45px] bg-bg-secondary border border-border rounded-lg px-4 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem'
                }}
              >
                <option value="ENGLISH">ENGLISH</option>
                <option value="TELUGU">TELUGU</option>
                <option value="HINDI">HINDI</option>
              </select>
            </div>
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 bg-gradient-to-br from-accent to-accent-secondary text-white font-bold text-[15px] shadow-glow"
            disabled={status !== 'idle' && status !== 'error'}
          >
            {status !== 'idle' && status !== 'error' && status !== 'done' ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5 fill-current" />
            )}
            Analyze Video ✦
          </Button>
        </form>

        {status !== 'idle' && status !== 'done' && status !== 'error' && (
          <div className="pt-7 border-t border-border space-y-5">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em]">Processing Steps</h3>
            
            <div className="space-y-4">
              {[
                { id: 'fetching_transcript', label: 'Fetching transcript', active: status === 'fetching_transcript', done: ['generating_summary', 'creating_podcast', 'done'].includes(status) },
                { id: 'generating_summary', label: 'Generating AI summary & concepts', active: status === 'generating_summary', done: ['creating_podcast', 'done'].includes(status) },
                { id: 'creating_podcast', label: 'Creating AI podcast & voiceover', active: status === 'creating_podcast', done: status === 'done' },
                { id: 'saving', label: 'Preparing tutor & saving...', active: status === 'saving', done: status === 'done' }
              ].map((step) => (
                <div key={step.id} className="flex items-center gap-4">
                  <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                    step.active ? 'bg-accent border-accent animate-pulse shadow-glow' : 
                    step.done ? 'bg-success border-success' : 'bg-transparent border-border'
                  }`}>
                    {step.done && <Check className="w-2.5 h-2.5 text-white mx-auto mt-0.5" />}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${
                    step.active ? 'text-text-primary' : 
                    step.done ? 'text-text-secondary' : 'text-text-muted'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Pulsing Skeleton Loader */}
            <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden">
              <div className="shimmer h-full w-full"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 text-error bg-error/10 border border-error/20 rounded-lg text-sm flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
