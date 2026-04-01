import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Zap, ArrowRight, Clock, Waves, HelpCircle, CheckCircle2 } from 'lucide-react'
import { AnalyzeVideoForm } from '@/components/AnalyzeVideoForm'
import { VideoCard } from '@/components/VideoCard'
import { ClearHistoryButton } from '@/components/ClearHistoryButton'
import { GuestUrlInput } from '@/components/GuestUrlInput'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let videos: any[] = []
  if (user) {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
    videos = data || []
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary pt-[64px]">

      {/* ── HERO ── */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden px-6">
        {/* Grid bg */}
        <div className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        {/* Glow */}
        <div className="absolute inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,92,0,0.12), transparent)' }} />

        <div className="relative z-10 w-full max-w-[860px] mx-auto text-center">
          {user ? (
            /* ── LOGGED IN ── */
            <div className="space-y-10 py-12">
              <div className="space-y-4 animate-fade-up">
                <h1 className="font-headings text-[clamp(32px,4vw,52px)] leading-[1.1] font-extrabold text-text-primary">
                  Welcome back, <span className="text-accent">{user.email?.split('@')[0]}</span>
                </h1>
                <p className="font-sans text-base text-text-secondary max-w-[520px] mx-auto leading-relaxed">
                  Paste a link below. Actify will extract everything worth knowing.
                </p>
              </div>
              <div className="max-w-[640px] mx-auto text-left animate-fade-up animate-fade-up-delay-1">
                <AnalyzeVideoForm />
              </div>
              {videos.length > 0 && (
                <div className="space-y-6 pt-10 text-left animate-fade-up animate-fade-up-delay-2">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                      <h3 className="font-headings text-lg font-bold text-text-primary">Recent Analyses</h3>
                      <ClearHistoryButton />
                    </div>
                    <Link href="/dashboard/my-videos" className="text-xs text-accent font-bold hover:underline flex items-center gap-1 group">
                      View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                  <div className="flex flex-col gap-3">
                    {videos.map((video: any) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── GUEST ── */
            <>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-glow border border-accent/30 text-accent text-[12px] font-semibold mb-8 animate-fade-up">
                <Zap className="w-3.5 h-3.5 fill-current" />
                AI-Powered Action Engine
              </div>

              <h1 className="font-headings text-[clamp(40px,6vw,72px)] leading-[1.05] font-extrabold text-text-primary mb-6 animate-fade-up animate-fade-up-delay-1">
                Stop Watching.<br />
                <span className="text-accent">Start Doing.</span>
              </h1>

              <p className="font-sans text-lg text-text-secondary max-w-[580px] mx-auto mb-10 leading-relaxed animate-fade-up animate-fade-up-delay-2">
                Paste any YouTube video, podcast, or article — Actify instantly converts it into a summary, key insights, action plan, and AI Q&A. In minutes, not hours.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-10 animate-fade-up animate-fade-up-delay-3">
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-8 text-[15px] font-bold bg-accent hover:bg-accent-hover text-white shadow-glow">
                    Convert Content Free →
                  </Button>
                </Link>
                <Button variant="ghost" size="lg" className="h-14 px-8 text-[15px] font-semibold border border-border hover:border-accent/40">
                  Watch Demo
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-3 mb-12 animate-fade-up animate-fade-up-delay-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-bg-primary flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: `hsl(${i * 40 + 10}, 75%, 55%)` }}>
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-[13px] text-text-muted font-medium">Trusted by 2,000+ developers, students & creators</span>
              </div>

              {/* URL Input */}
              <GuestUrlInput />
            </>
          )}
        </div>
      </section>

      {/* ── PROBLEM SECTION ── */}
      {!user && (
        <section className="py-24 px-6 bg-bg-secondary border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-headings text-3xl md:text-4xl font-bold text-text-primary">Sound familiar?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: '⏱️', text: 'You watch 2-hour videos and forget everything by tomorrow' },
                { icon: '🌊', text: "You're drowning in content but starving for clarity" },
                { icon: '🤷', text: "You finish a video but still don't know what to do next" },
              ].map((item, i) => (
                <div key={i} className="bg-bg-card border border-border rounded-2xl p-8 text-center hover:border-accent/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <p className="text-text-secondary text-[15px] leading-relaxed font-sans">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      {!user && (
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <p className="text-accent text-[12px] font-bold uppercase tracking-[0.15em] mb-3">Everything You Get</p>
            <h2 className="font-headings text-3xl md:text-4xl font-bold text-text-primary">One input. Five powerful outputs.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Quick Summary', desc: '2, 5, or 10-minute read. The full video compressed to what matters.' },
              { icon: '💡', title: 'Key Insights', desc: 'Filtered highlights — only the ideas worth remembering.' },
              { icon: '🗺️', title: 'Action Plan', desc: 'Step-by-step instructions. Know exactly what to do next.' },
              { icon: '⚠️', title: 'Mistakes to Avoid', desc: "Learn from others' errors without making them yourself." },
              { icon: '🤖', title: 'Ask AI', desc: 'Chat with an AI that has watched the entire video for you.' },
            ].map((f, i) => (
              <div key={i} className={`group relative bg-bg-card rounded-2xl p-8 border border-border hover:border-accent/40 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 ${i === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-headings text-lg font-bold text-text-primary mb-2">{f.title}</h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      {!user && (
        <section id="how-it-works" className="py-24 px-6 bg-bg-secondary border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headings text-3xl md:text-4xl font-bold text-text-primary">Up and running in 3 steps</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
              {[
                { num: '01', icon: '📎', title: 'Paste Your Link', desc: 'YouTube video, podcast, article — any content URL' },
                { num: '02', icon: '🤖', title: 'Actify Processes It', desc: 'AI extracts, structures, and analyzes the full content' },
                { num: '03', icon: '✅', title: 'Act on What Matters', desc: 'Read the summary, follow the plan, ask doubts — done' },
              ].map((step, i) => (
                <div key={i} className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-6 text-2xl">
                    {step.icon}
                  </div>
                  <div className="text-accent text-[11px] font-bold tracking-widest mb-2">{step.num}</div>
                  <h4 className="font-headings text-lg font-bold text-text-primary mb-2">{step.title}</h4>
                  <p className="text-sm text-text-secondary font-sans">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PERSONAS ── */}
      {!user && (
        <section className="py-24 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="font-headings text-3xl md:text-4xl font-bold text-text-primary">Built for people who value their time</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '👨‍💻', role: 'Developers', desc: 'Extract code steps and implementation guides from tutorials' },
              { icon: '🎓', role: 'Students', desc: 'Turn lectures into exam notes and project roadmaps' },
              { icon: '💼', role: 'Professionals', desc: 'Get business insights from podcasts in 5 minutes' },
              { icon: '🎨', role: 'Creators', desc: 'Mine ideas from long-form content to repurpose fast' },
            ].map((p, i) => (
              <div key={i} className="bg-bg-card border border-border rounded-2xl p-7 text-center hover:border-accent/30 hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="font-headings text-base font-bold text-text-primary mb-2">{p.role}</h3>
                <p className="text-sm text-text-secondary font-sans leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── WHY ACTIFY ── */}
      {!user && (
        <section className="py-24 px-6 bg-bg-secondary border-y border-border">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-accent text-[12px] font-bold uppercase tracking-[0.15em] mb-4">Why Actify</p>
              <h2 className="font-headings text-3xl md:text-4xl font-bold text-text-primary mb-6">Not just another summarizer</h2>
              <p className="text-text-secondary font-sans leading-relaxed mb-8">
                Competitors give you random AI text. Actify gives you structured, outcome-based outputs designed for YOUR role.
              </p>
              <div className="space-y-5">
                {[
                  { title: 'Outcome-Based Outputs', desc: 'Developer gets code steps. Student gets exam notes. Founder gets business insights.' },
                  { title: 'Consistent Structured Format', desc: 'Fixed output template every time. No surprises.' },
                  { title: 'Action-First Philosophy', desc: 'Every output ends with "what to do next." Always.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-headings font-bold text-text-primary text-sm">{item.title}</p>
                      <p className="text-text-secondary text-sm font-sans mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-8 space-y-4">
              {['Extracting transcript...', 'Identifying key insights...', 'Building your action plan...', 'Almost ready...'].map((msg, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${i === 2 ? 'border-accent/40 bg-accent/5' : 'border-border bg-bg-secondary'}`}>
                  <div className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-accent animate-pulse' : i < 2 ? 'bg-success' : 'bg-border'}`} />
                  <span className={`text-sm font-sans ${i === 2 ? 'text-text-primary font-medium' : i < 2 ? 'text-text-secondary line-through' : 'text-text-muted'}`}>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRICING ── */}
      {!user && (
        <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="font-headings text-3xl md:text-4xl font-bold text-text-primary mb-3">Simple, transparent pricing</h2>
            <p className="text-text-secondary font-sans">Pay only for what you use</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Summary Only',
                price: '₹49',
                per: '/use',
                features: ['Quick Summary (2/5/10 min)', 'Key Insights'],
                cta: 'Get Summary',
                popular: false,
              },
              {
                name: 'Summary + Action',
                price: '₹99',
                per: '/use',
                features: ['Everything in Tier 1', 'Action Plan', 'Mistakes to Avoid'],
                cta: 'Get Action Plan',
                popular: true,
              },
              {
                name: 'Full Breakdown',
                price: '₹199',
                per: '/use',
                features: ['Everything in Tier 2', 'Ask AI (full Q&A chat)'],
                cta: 'Get Full Access',
                popular: false,
              },
            ].map((tier, i) => (
              <div key={i} className={`relative rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${tier.popular ? 'border-accent bg-accent/5 shadow-glow' : 'border-border bg-bg-card hover:border-accent/30'}`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-headings text-lg font-bold text-text-primary mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-headings text-4xl font-extrabold text-text-primary">{tier.price}</span>
                  <span className="text-text-muted text-sm">{tier.per}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-text-secondary font-sans">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button className={`w-full font-bold ${tier.popular ? 'bg-accent hover:bg-accent-hover text-white' : 'bg-bg-secondary hover:bg-bg-card-hover text-text-primary border border-border'}`}>
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-text-muted text-sm mt-8 font-sans">
            Subscription plans coming soon — ₹299/month unlimited
          </p>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-border-subtle bg-bg-primary mt-auto">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                <Zap className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="font-headings font-bold text-base text-text-primary">Actify</span>
            </div>
            <p className="text-[13px] text-text-muted font-sans">Don't consume content. Extract value and act.</p>
          </div>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-[13px] text-text-muted hover:text-text-primary transition-colors">Privacy</Link>
            <Link href="#" className="text-[13px] text-text-muted hover:text-text-primary transition-colors">Terms</Link>
            <Link href="#" className="text-[13px] text-text-muted hover:text-text-primary transition-colors">Contact</Link>
          </div>
          <div className="text-[13px] text-text-muted">© 2025 Actify</div>
        </div>
      </footer>
    </div>
  )
}