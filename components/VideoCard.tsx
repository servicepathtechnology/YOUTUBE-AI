"use client"
import Link from 'next/link'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface VideoCardProps {
  video: {
    id: string;
    video_id: string;
    title: string;
    created_at: string;
  }
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-shadow">
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
        <div className="grid grid-cols-1 gap-2 mt-4">
          <Link href={`/video/${video.id}`} className="w-full">
             <Button className="w-full justify-start gap-2" variant="outline" size="sm">
               <span>📝</span> View Summary
             </Button>
          </Link>
          <Link href={`/video/${video.id}`} className="w-full">
             <Button className="w-full justify-start gap-2" variant="outline" size="sm">
               <span>🤖</span> Open Tutor Chat
             </Button>
          </Link>
          <Link href={`/video/${video.id}`} className="w-full">
             <Button className="w-full justify-start gap-2" variant="outline" size="sm">
               <span>🎧</span> Play Podcast
             </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
