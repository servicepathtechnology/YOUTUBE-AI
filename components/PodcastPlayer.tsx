"use client"
import { useRef, useState, useEffect } from "react"

interface Props {
  audioUrl: string
  language?: string
}

const LANG_LABEL: Record<string, string> = {
  ENGLISH: "English", en: "English",
  TELUGU: "తెలుగు", te: "తెలుగు",
  HINDI: "हिन्दी", hi: "हिन्दी",
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2]

export function PodcastPlayer({ audioUrl, language = "en" }: Props) {
  const audioRef      = useRef<HTMLAudioElement>(null)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [speed,       setSpeed]       = useState(1.25)

  const langLabel = LANG_LABEL[language] ?? LANG_LABEL[language.toUpperCase()] ?? language

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    audio.addEventListener("timeupdate", onTime)
    return () => audio.removeEventListener("timeupdate", onTime)
  }, [])

  // Apply playback rate whenever speed changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    isPlaying ? a.pause() : a.play()
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Number(e.target.value)
  }

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed)
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length])
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d1a] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#0a0a16]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg">
            <span className="text-base">🎧</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">AI Masterclass Podcast</p>
            <p className="text-[11px] text-white/40 mt-0.5 uppercase tracking-widest">{langLabel} · 2 Speakers</p>
          </div>
        </div>
        <a href={audioUrl} download="podcast.mp3"
          className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 font-medium transition-colors px-3 py-1.5 rounded-lg border border-violet-500/30 hover:border-violet-400/50">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l-6-6h4V4h4v6h4l-6 6zm-7 4h14v-2H5v2z"/></svg>
          MP3
        </a>
      </div>

      {/* Player controls */}
      <div className="px-5 py-4 bg-[#0d0d1a]">
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            const a = audioRef.current
            if (!a) return
            setDuration(a.duration)
            a.playbackRate = speed
          }}
        />
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform flex-shrink-0">
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          {/* Seek bar */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-[width]"
                style={{ width: `${progress}%` }} />
              <input type="range" min={0} max={duration || 100} step={0.1} value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" aria-label="Seek" />
            </div>
            <div className="flex justify-between text-[10px] text-white/30 font-mono">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Speed control */}
          <button
            onClick={cycleSpeed}
            aria-label="Change playback speed"
            title="Playback speed"
            className="flex-shrink-0 text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors px-2.5 py-1.5 rounded-lg border border-violet-500/30 hover:border-violet-400/50 min-w-[46px] text-center"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  )
}
