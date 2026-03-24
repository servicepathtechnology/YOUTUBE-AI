import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { VideoCard } from '@/components/VideoCard'
import { ClearHistoryButton } from '@/components/ClearHistoryButton'

export default async function MyVideosPage() {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headings text-3xl font-bold text-text-primary">My Videos</h1>
        {videos && videos.length > 0 && <ClearHistoryButton />}
      </div>
      
      {videos && videos.length > 0 ? (
        <div className="flex flex-col gap-4">
          {videos.map((video: any) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center p-20 bg-bg-secondary border border-dashed border-border rounded-xl">
          <p className="text-sm text-text-muted font-medium">You haven't analyzed any videos yet.</p>
        </div>
      )}
    </div>
  )
}
