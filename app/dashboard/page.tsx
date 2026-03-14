import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyzeVideoForm } from '@/components/AnalyzeVideoForm'
import { VideoCard } from '@/components/VideoCard'

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <AnalyzeVideoForm />

      <h2 className="text-2xl font-bold mt-12 mb-6">Your Videos</h2>
      
      {videos && videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video: any) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
          You haven't analyzed any videos yet. Paste a YouTube link above to get started.
        </div>
      )}
    </div>
  )
}
