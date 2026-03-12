import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatTutor } from '@/components/ChatTutor'
import Link from 'next/link'

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl flex flex-col lg:flex-row gap-8">
      {/* Left Column: Video, Podcast, Summary */}
      <div className="w-full lg:w-2/3 space-y-6">
        <div>
           <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
             &larr; Back to Dashboard
           </Link>
           <h1 className="text-3xl font-bold">{video.title}</h1>
        </div>

        {/* Video Player */}
        <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg border bg-black">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${video.video_id}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* Podcast Player */}
        {video.podcast_audio_url && (
          <Card className="shadow-md border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">🎧</span> AI Masterclass Podcast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <audio controls className="w-full outline-none" src={video.podcast_audio_url}>
                Your browser does not support the audio element.
              </audio>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="shadow-md">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <span className="text-xl">📝</span> Summary & Key Concepts
             </CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-[15px] leading-relaxed">
             {video.summary}
          </CardContent>
        </Card>

        {/* Bullet Points */}
        {video.bullet_points && video.bullet_points.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">✨</span> Key Takeaways
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {video.bullet_points.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Right Column: Chat Tutor */}
      <div className="w-full lg:w-1/3 lg:h-[calc(100vh-8rem)] lg:sticky lg:top-20 h-[600px]">
         <ChatTutor videoId={video.id} transcript={video.transcript} />
      </div>
    </div>
  )
}
