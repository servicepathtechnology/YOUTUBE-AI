import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Sparkles, Headphones, MessageSquare, FileText, Check, Video, Clock, ArrowRight } from 'lucide-react'
import { AnalyzeVideoForm } from '@/components/AnalyzeVideoForm'
import { VideoCard } from '@/components/VideoCard'
import { ClearHistoryButton } from '@/components/ClearHistoryButton'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let videos = []
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
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden px-6">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-40" 
             style={{
               backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
               backgroundSize: '48px 48px'
             }}></div>
        <div className="absolute inset-0 z-0" 
             style={{
               background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.15), transparent)'
             }}></div>

        <div className="relative z-10 w-full max-w-[800px] mx-auto text-center">
          {user ? (
            <div className="space-y-10 py-12">
              <div className="space-y-4">
                <h1 className="font-headings text-[clamp(32px,4vw,48px)] leading-[1.1] font-extrabold text-text-primary">
                  Welcome back, <span className="text-accent">{user.email?.split('@')[0]}</span>
                </h1>
                <p className="font-sans text-base text-text-secondary max-w-[520px] mx-auto leading-relaxed">
                  Ready to master another video today? Paste a link below to get started.
                </p>
              </div>
              
              <div className="max-w-[600px] mx-auto text-left">
                <AnalyzeVideoForm />
              </div>

              {videos.length > 0 && (
                <div className="space-y-6 pt-10 text-left">
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
            <>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-glow border border-accent/30 text-accent text-[12px] font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Learning
              </div>
              
              <h1 className="font-headings text-[clamp(36px,5vw,64px)] leading-[1.1] font-extrabold text-text-primary mb-6">
                Turn Any YouTube Video Into Your Personal <span className="bg-gradient-to-br from-accent to-accent-secondary bg-clip-text text-transparent">AI Tutor</span>
              </h1>
              
              <p className="font-sans text-lg text-text-secondary max-w-[520px] mx-auto mb-10 leading-relaxed">
                Paste any YouTube link and instantly get summaries, podcasts, and an AI tutor that answers your questions based on the video content.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-8 text-[15px] font-semibold">
                    Start Learning Free →
                  </Button>
                </Link>
                <Button variant="ghost" size="lg" className="h-14 px-8 text-[15px] font-semibold flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`w-6 h-6 rounded-full border-2 border-bg-primary flex items-center justify-center text-[8px] font-bold text-white shadow-sm`}
                         style={{ backgroundColor: `hsl(${i * 45}, 70%, 60%)` }}>
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-[13px] text-text-muted font-medium">
                  Trusted by 2,000+ learners
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <p className="text-accent text-[12px] font-bold uppercase tracking-[0.15em] mb-3">What You Get</p>
          <h2 className="font-headings text-4xl font-bold text-text-primary">Everything you need to learn faster</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 border-border bg-bg-card rounded-lg hover:border-accent/40 group transition-all duration-300">
            <div className="w-11 h-11 rounded-[10px] bg-accent-glow border border-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-headings text-lg font-bold text-text-primary mb-3">Instant Summaries</h3>
            <p className="font-sans text-sm text-text-secondary leading-relaxed">
              Get quick bullet points and key concept explanations without watching the whole video. Save hours of time.
            </p>
          </Card>

          <Card className="p-8 border-border bg-bg-card rounded-lg hover:border-accent/40 group transition-all duration-300">
            <div className="w-11 h-11 rounded-[10px] bg-accent-glow border border-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Headphones className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-headings text-lg font-bold text-text-primary mb-3">AI Podcast</h3>
            <p className="font-sans text-sm text-text-secondary leading-relaxed">
              Listen to conversational podcast-style explanations generated right from the video transcript. Learn on the go.
            </p>
          </Card>

          <Card className="p-8 border-border bg-bg-card rounded-lg hover:border-accent/40 group transition-all duration-300">
            <div className="w-11 h-11 rounded-[10px] bg-accent-glow border border-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-headings text-lg font-bold text-text-primary mb-3">Interactive Tutor</h3>
            <p className="font-sans text-sm text-text-secondary leading-relaxed">
              Chat with an AI that knows the video intimately. Ask questions, clarify doubts, and master any subject.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-bg-secondary border-y border-border">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="font-headings text-3xl font-bold text-text-primary text-center mb-16">Up and running in 3 steps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-6 left-[15%] right-[15%] h-px bg-border z-0"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold mx-auto mb-6 shadow-glow">1</div>
              <h4 className="font-headings text-lg font-bold text-text-primary mb-2">Paste YouTube URL</h4>
              <p className="text-sm text-text-secondary">Copy any video link from YouTube and paste it into our analyzer.</p>
            </div>

            <div className="relative z-10 text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold mx-auto mb-6 shadow-glow">2</div>
              <h4 className="font-headings text-lg font-bold text-text-primary mb-2">AI Processes Video</h4>
              <p className="text-sm text-text-secondary">Our AI analyzes the transcript to generate summaries and audio content.</p>
            </div>

            <div className="relative z-10 text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold mx-auto mb-6 shadow-glow">3</div>
              <h4 className="font-headings text-lg font-bold text-text-primary mb-2">Start Learning</h4>
              <p className="text-sm text-text-secondary">Read the summary, listen to the podcast, or chat with your new AI tutor.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border-subtle bg-bg-primary">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <Link href="/" className="font-headings font-bold text-lg text-text-primary">VideoTutor AI</Link>
            <p className="text-[13px] text-text-muted">Master any YouTube video in minutes.</p>
          </div>
          
          <div className="flex items-center gap-8">
            <Link href="#" className="text-[13px] text-text-muted hover:text-text-primary transition-colors">Privacy</Link>
            <Link href="#" className="text-[13px] text-text-muted hover:text-text-primary transition-colors">Terms</Link>
            <Link href="#" className="text-[13px] text-text-muted hover:text-text-primary transition-colors">Contact</Link>
          </div>

          <div className="text-[13px] text-text-muted">
            © 2025 VideoTutor AI
          </div>
        </div>
      </footer>
    </div>
  )
}
