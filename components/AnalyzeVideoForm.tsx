"use client"
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, AlertCircle, Upload, Link2, Mic } from 'lucide-react'
import { ProcessingScreen } from '@/components/ProcessingScreen'

type InputMode = 'url' | 'podcast'

function isYoutubeUrl(url: string) {
  return /(?:youtube\.com|youtu\.be)/i.test(url)
}

function getSourceType(url: string): 'youtube' | 'article' {
  return isYoutubeUrl(url) ? 'youtube' : 'article'
}

export function AnalyzeVideoForm() {
  const [mode, setMode] = useState<InputMode>('url')
  const [url, setUrl] = useState('')
  const [podcastUrl, setPodcastUrl] = useState('')
  const [podcastFile, setPodcastFile] = useState<File | null>(null)
  const [podcastInputType, setPodcastInputType] = useState<'url' | 'file'>('url')
  const [status, setStatus] = useState<string>('idle')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const isProcessing = status !== 'idle' && status !== 'done' && status !== 'error'

  const sourceType = mode === 'podcast' ? 'podcast' : getSourceType(url)

  const currentStep = status === 'fetching_transcript' ? 0
    : status === 'generating_summary' ? 1
    : status === 'creating_podcast' ? 2
    : status === 'building_tutor' ? 3 : 0

  const handleUrlAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    setError(null)
    setStatus('fetching_transcript')

    try {
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

      if (videoStatus === 'cached' && video.multilang_content && video.podcast_urls) {
        setStatus('done')
        router.push(`/video/${videoId}`)
        return
      }

      setStatus('generating_summary')
      const summaryRes = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId }),
      })
      if (!summaryRes.ok) throw new Error('Failed to generate summary')

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

  const handlePodcastAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus('fetching_transcript')

    try {
      let analyzeRes: Response

      if (podcastInputType === 'file' && podcastFile) {
        const formData = new FormData()
        formData.append('file', podcastFile)
        formData.append('title', podcastFile.name.replace(/\.[^.]+$/, ''))
        analyzeRes = await fetch('/api/analyze-podcast', {
          method: 'POST',
          body: formData,
        })
      } else {
        if (!podcastUrl) return
        analyzeRes = await fetch('/api/analyze-podcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: podcastUrl }),
        })
      }

      if (!analyzeRes.ok) {
        const d = await analyzeRes.json()
        throw new Error(d.error || 'Failed to analyze podcast')
      }
      const { video, status: videoStatus } = await analyzeRes.json()
      const videoId = video.id

      if (videoStatus === 'cached' && video.multilang_content) {
        setStatus('done')
        router.push(`/video/${videoId}`)
        return
      }

      setStatus('generating_summary')
      const summaryRes = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId }),
      })
      if (!summaryRes.ok) throw new Error('Failed to generate summary')

      // No podcast generation for podcast source type
      setStatus('done')
      router.push(`/video/${videoId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.')
      setStatus('idle')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPodcastFile(file)
  }

  if (isProcessing) {
    return (
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-elevated">
        <ProcessingScreen
          currentStep={currentStep}
          stepProgress={50}
          videoUrl={mode === 'podcast' ? (podcastInputType === 'file' ? podcastFile?.name : podcastUrl) : url}
          sourceType={sourceType}
        />
      </div>
    )
  }

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-elevated">
      {/* Mode tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setMode('url')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors font-sans ${
            mode === 'url'
              ? 'text-accent border-b-2 border-accent bg-accent/5'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Link2 className="w-4 h-4" />
          YouTube / Article
        </button>
        <button
          onClick={() => setMode('podcast')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors font-sans ${
            mode === 'podcast'
              ? 'text-accent border-b-2 border-accent bg-accent/5'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Mic className="w-4 h-4" />
          Podcast
        </button>
      </div>

      {mode === 'url' ? (
        <form onSubmit={handleUrlAnalyze} className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Paste YouTube or article URL..."
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
          {error && (
            <div className="p-3 text-error bg-error/10 border border-error/20 rounded-lg text-sm flex items-center gap-2 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </form>
      ) : (
        <form onSubmit={handlePodcastAnalyze} className="p-6 space-y-4">
          {/* Sub-toggle: URL vs File */}
          <div className="flex gap-2 p-1 bg-bg-secondary rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setPodcastInputType('url')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all font-sans ${
                podcastInputType === 'url'
                  ? 'bg-accent text-white shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setPodcastInputType('file')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all font-sans ${
                podcastInputType === 'file'
                  ? 'bg-accent text-white shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Upload File
            </button>
          </div>

          {podcastInputType === 'url' ? (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Paste podcast audio URL (.mp3, .wav, ...)"
                value={podcastUrl}
                onChange={e => setPodcastUrl(e.target.value)}
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
          ) : (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all"
              >
                <Upload className="w-6 h-6 text-text-muted" />
                {podcastFile ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text-primary font-sans">{podcastFile.name}</p>
                    <p className="text-xs text-text-muted font-sans">{(podcastFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-text-secondary font-sans">Click to upload podcast audio</p>
                    <p className="text-xs text-text-muted font-sans">MP3, WAV, M4A, OGG supported</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="submit"
                disabled={!podcastFile}
                className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-bold disabled:opacity-50"
              >
                <Zap className="w-4 h-4 mr-1.5 fill-white" />
                Analyze Podcast
              </Button>
            </div>
          )}

          {error && (
            <div className="p-3 text-error bg-error/10 border border-error/20 rounded-lg text-sm flex items-center gap-2 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </form>
      )}
    </div>
  )
}
