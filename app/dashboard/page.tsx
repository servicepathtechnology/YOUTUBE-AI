import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyzeVideoForm } from '@/components/AnalyzeVideoForm'

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
            <Card key={video.id} className="overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-shadow">
              <img 
                src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`} 
                alt={video.title} 
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <CardTitle className="line-clamp-2 text-lg mb-2" title={video.title}>{video.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mb-4">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <Link href={`/video/${video.id}`}>
                     <Button className="w-full" variant="default">View Details & Chat</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
