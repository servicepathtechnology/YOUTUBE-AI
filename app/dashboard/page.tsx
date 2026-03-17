import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { AnalyzeVideoForm } from '@/components/AnalyzeVideoForm'
import { VideoCard } from '@/components/VideoCard'
import { Video, FileText, Clock, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const videoCount = videos?.length || 0
  const summaryCount = videos?.filter(v => v.summary).length || 0
  // Mock learning hours
  const learningHours = Math.floor(videoCount * 0.5)

  return (
    <div className="space-y-12">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-bg-card border-border rounded-lg shadow-card group hover:border-accent/40 transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-accent-glow border border-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-headings text-3xl font-bold text-text-primary leading-none mb-1">{videoCount}</p>
              <p className="text-[13px] text-text-secondary font-medium">Videos Analyzed</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-bg-card border-border rounded-lg shadow-card group hover:border-accent/40 transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-accent-glow border border-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-headings text-3xl font-bold text-text-primary leading-none mb-1">{summaryCount}</p>
              <p className="text-[13px] text-text-secondary font-medium">Summaries Generated</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-bg-card border-border rounded-lg shadow-card group hover:border-accent/40 transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-accent-glow border border-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-headings text-3xl font-bold text-text-primary leading-none mb-1">{learningHours}h</p>
              <p className="text-[13px] text-text-secondary font-medium">Learning Hours</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Analyze New Video Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headings text-xl font-bold text-text-primary">Analyze a New Video</h3>
        </div>
        <AnalyzeVideoForm />
      </section>

      {/* Recent Videos Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headings text-xl font-bold text-text-primary">Recent Videos</h3>
          <Link href="#" className="text-xs text-accent font-bold hover:underline flex items-center gap-1 group">
            View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        
        {videos && videos.length > 0 ? (
          <div className="flex flex-col gap-4">
            {videos.map((video: any) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center p-20 bg-bg-secondary border border-dashed border-border rounded-xl">
            <Video className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
            <p className="text-sm text-text-muted font-medium">You haven't analyzed any videos yet.</p>
            <p className="text-xs text-text-muted mt-1">Paste a YouTube link above to get started.</p>
          </div>
        )}
      </section>
    </div>
  )
}
