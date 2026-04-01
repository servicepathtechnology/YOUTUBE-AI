"use client"
import { useState } from 'react'
import { ChatTutor } from '@/components/ChatTutor'
import { PodcastPlayer } from '@/components/PodcastPlayer'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Square, Globe } from 'lucide-react'

type Tab = 'summary' | 'insights' | 'action' | 'mistakes' | 'chat'
type Lang = 'ENGLISH' | 'HINDI' | 'TELUGU'

interface VideoResultsProps {
  video: any
}

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: 'ENGLISH', label: 'English', flag: '🇺🇸' },
  { value: 'HINDI',   label: 'Hindi',   flag: '🇮🇳' },
  { value: 'TELUGU',  label: 'Telugu',  flag: '🇮🇳' },
]

function parseItems(arr: any[] | null): any[] {
  if (!arr) return []
  return arr.map(item => {
    if (typeof item === 'string') {
      try { return JSON.parse(item) } catch { return item }
    }
    return item
  })
}

export function VideoResults({ video }: VideoResultsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [summaryLength, setSummaryLength] = useState<'2' | '5' | '10'>('2')
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())
  const [language, setLanguage] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('actify_language') as Lang) || 'ENGLISH'
    }
    return 'ENGLISH'
  })

  // Pull content for the selected language from multilang_content,
  // falling back to legacy single-language fields
  const multilang = video.multilang_content || {}
  const langData = multilang[language] || {}

  const summary: string       = langData.summary       || video.summary       || ''
  const bulletPoints: string[] = langData.bullet_points || video.bullet_points || []
  const keyConcepts: string[]  = langData.key_concepts  || video.key_concepts  || []
  const keyInsights: any[]     = parseItems(langData.key_insights  || video.key_insights  || [])
  const actionPlan: any[]      = parseItems(langData.action_plan   || video.action_plan   || [])
  const mistakesToAvoid: any[] = parseItems(langData.mistakes_to_avoid || video.mistakes_to_avoid || [])

  // Podcast URL for selected language
  const podcastUrls = video.podcast_urls || {}
  const podcastUrl: string | null =
    podcastUrls[language] || video.podcast_audio_url || null

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'summary',  label: 'Summary',     icon: '📄' },
    { id: 'insights', label: 'Insights',    icon: '💡' },
    { id: 'action',   label: 'Action Plan', icon: '🗺️' },
    { id: 'mistakes', label: 'Mistakes',    icon: '⚠️' },
    { id: 'chat',     label: 'Ask AI',      icon: '🤖' },
  ]

  const getSummaryContent = () => {
    if (summaryLength === '2') return summary
    if (summaryLength === '5') {
      const pts = bulletPoints.slice(0, 5)
      return summary + (pts.length ? '\n\n' + pts.map(p => `• ${p}`).join('\n') : '')
    }
    return summary + (bulletPoints.length ? '\n\n' + bulletPoints.map(p => `• ${p}`).join('\n') : '')
  }

  const toggleStep = (i: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleLangChange = (lang: Lang) => {
    setLanguage(lang)
    setCheckedSteps(new Set()) // reset checkboxes on language switch
    if (typeof window !== 'undefined') localStorage.setItem('actify_language', lang)
  }

  const hasMultilang = !!video.multilang_content
  const isYoutube = /(?:youtube\.com|youtu\.be)/i.test(video.video_url || '')

  return (
    <div className="min-h-screen bg-bg-primary pt-[64px]">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6 font-sans">
          <ArrowLeft className="w-4 h-4" />
          Back to Actify
        </Link>

        {/* Video header card */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-5">
          <img
            src={video.thumbnail || (isYoutube ? `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg` : undefined)}
            alt={video.title}
            className="w-full sm:w-44 h-26 object-cover rounded-xl shrink-0"
          />
          <div className="flex flex-col justify-center gap-3 min-w-0">
            <h1 className="font-headings text-xl font-bold text-text-primary leading-tight">{video.title}</h1>

            {/* Language switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              <Globe className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <div className="flex gap-1.5">
                {LANG_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleLangChange(opt.value)}
                    title={hasMultilang ? opt.label : `${opt.label} (re-analyze to enable)`}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border ${
                      language === opt.value
                        ? 'bg-accent text-white border-accent shadow-glow'
                        : hasMultilang
                          ? 'bg-bg-secondary border-border text-text-secondary hover:border-accent/40 hover:text-text-primary'
                          : 'bg-bg-secondary border-border text-text-muted opacity-50 cursor-not-allowed'
                    }`}
                    disabled={!hasMultilang && opt.value !== 'ENGLISH'}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
              {!hasMultilang && (
                <span className="text-[11px] text-text-muted font-sans italic">
                  Re-analyze to unlock all languages
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT: tabs + content ── */}
          <div className="flex-1 min-w-0">

            {/* Tab bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 font-sans shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-accent text-white shadow-glow'
                      : 'bg-bg-card border border-border text-text-secondary hover:text-text-primary hover:border-accent/30'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="bg-bg-card border border-border rounded-2xl p-6 min-h-[420px]">

              {/* ── SUMMARY ── */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="font-headings text-lg font-bold text-text-primary">📄 Summary</h2>
                    <div className="flex gap-2">
                      {(['2', '5', '10'] as const).map(len => (
                        <button
                          key={len}
                          onClick={() => setSummaryLength(len)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            summaryLength === len
                              ? 'bg-accent text-white'
                              : 'bg-bg-secondary border border-border text-text-muted hover:border-accent/30'
                          }`}
                        >
                          {len} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-text-secondary font-sans text-[15px] leading-relaxed whitespace-pre-wrap">
                    {getSummaryContent() || 'Summary not available yet.'}
                  </p>

                  {keyConcepts.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Key Concepts</p>
                      <div className="flex flex-wrap gap-2">
                        {keyConcepts.map((c, i) => (
                          <span key={i} className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent text-xs font-semibold rounded-full font-sans">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── INSIGHTS ── */}
              {activeTab === 'insights' && (
                <div className="space-y-4">
                  <h2 className="font-headings text-lg font-bold text-text-primary mb-4">💡 Key Insights</h2>
                  {keyInsights.length > 0 ? (
                    keyInsights.map((insight: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4 bg-bg-secondary rounded-xl border border-border hover:border-accent/20 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-headings font-bold text-text-primary text-sm mb-1">
                            💡 {typeof insight === 'object' ? insight.headline : insight}
                          </p>
                          {typeof insight === 'object' && insight.explanation && (
                            <p className="text-text-secondary text-sm font-sans leading-relaxed">{insight.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : bulletPoints.length > 0 ? (
                    bulletPoints.map((point, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-bg-secondary rounded-xl border border-border">
                        <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-text-secondary text-sm font-sans leading-relaxed">💡 {point}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-muted text-sm font-sans">No insights available.</p>
                  )}
                </div>
              )}

              {/* ── ACTION PLAN ── */}
              {activeTab === 'action' && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h2 className="font-headings text-lg font-bold text-text-primary">🗺️ Action Plan</h2>
                    <p className="text-text-muted text-sm font-sans mt-1">Here's exactly what to do next:</p>
                  </div>
                  {actionPlan.length > 0 ? (
                    actionPlan.map((step: any, i: number) => (
                      <div
                        key={i}
                        onClick={() => toggleStep(i)}
                        className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          checkedSteps.has(i)
                            ? 'bg-success/5 border-success/20 opacity-60'
                            : 'bg-bg-secondary border-border hover:border-accent/30'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {checkedSteps.has(i)
                            ? <CheckSquare className="w-5 h-5 text-success" />
                            : <Square className="w-5 h-5 text-text-muted" />
                          }
                        </div>
                        <div>
                          <p className={`font-headings font-bold text-sm mb-1 ${checkedSteps.has(i) ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                            Step {i + 1}: {typeof step === 'object' ? step.step : step}
                          </p>
                          {typeof step === 'object' && step.description && (
                            <p className="text-text-secondary text-sm font-sans leading-relaxed">{step.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-muted text-sm font-sans">Action plan not available.</p>
                  )}
                </div>
              )}

              {/* ── MISTAKES ── */}
              {activeTab === 'mistakes' && (
                <div className="space-y-4">
                  <h2 className="font-headings text-lg font-bold text-text-primary mb-4">⚠️ Mistakes to Avoid</h2>
                  {mistakesToAvoid.length > 0 ? (
                    mistakesToAvoid.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-error/5 border border-error/20 rounded-xl hover:border-error/30 transition-colors">
                        <div className="flex gap-3">
                          <span className="text-lg shrink-0">⚠️</span>
                          <div>
                            <p className="font-headings font-bold text-text-primary text-sm mb-1">
                              {typeof item === 'object' ? item.mistake : item}
                            </p>
                            {typeof item === 'object' && item.why && (
                              <p className="text-text-secondary text-sm font-sans leading-relaxed">{item.why}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-muted text-sm font-sans">Mistakes analysis not available.</p>
                  )}
                </div>
              )}

              {/* ── ASK AI ── */}
              {activeTab === 'chat' && (
                <div className="h-[500px] -m-6">
                  <ChatTutor videoId={video.id} transcript={video.transcript} language={language} />
                </div>
              )}
            </div>

            {/* Podcast player — switches with language */}
            {podcastUrl && (
              <div className="mt-5">
                <PodcastPlayer
                  key={language}
                  audioUrl={podcastUrl}
                  language={language === 'ENGLISH' ? 'en' : language === 'HINDI' ? 'hi' : 'te'}
                />
              </div>
            )}
          </div>

          {/* ── RIGHT: video embed (YouTube only) ── */}
          {isYoutube && (
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black shadow-elevated">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${video.video_id}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
          )}

        </div>
      </div>
    </div>
  )
}