import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatTutor } from '@/components/ChatTutor'
import { PodcastPlayer } from '@/components/PodcastPlayer'
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
          <PodcastPlayer audioUrl={video.podcast_audio_url} />
        )}

        {/* Summary */}
        <Card className="shadow-md">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <span className="text-xl">📝</span> Summary
             </CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-[15px] leading-relaxed">
             {video.summary}
          </CardContent>
        </Card>

        {/* Key Concepts */}
        {video.key_concepts && video.key_concepts.length > 0 && (
          <Card className="shadow-md border-blue-100 bg-blue-50/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">💡</span> Key Learning Concepts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {video.key_concepts.map((concept: string, i: number) => (
                  <div key={i} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800">
                    {concept}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
