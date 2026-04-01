import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { VideoResults } from '@/components/VideoResults'

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await params
  const { id } = resolvedParams

  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !video || video.user_id !== user.id) {
    notFound()
  }

  return <VideoResults video={video} />
}