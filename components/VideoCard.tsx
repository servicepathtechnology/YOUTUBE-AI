"use client"
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Headphones, MessageSquare } from 'lucide-react'

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
    <Card className="bg-bg-card border-border rounded-lg p-4 transition-all duration-250 hover:bg-bg-card-hover hover:border-accent/30 group">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Left: Thumbnail */}
        <div className="relative w-24 h-14 sm:w-20 sm:h-14 shrink-0 rounded-[6px] bg-bg-secondary overflow-hidden border border-border group-hover:border-accent/20 transition-colors">
          <img 
            src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`} 
            alt={video.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Middle: Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-headings font-semibold text-[14px] text-text-primary truncate mb-1 group-hover:text-accent transition-colors" title={video.title}>
            {video.title}
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">YouTube Video</span>
            <div className="w-1 h-1 rounded-full bg-border"></div>
            <span className="text-[11px] text-text-muted">
              {new Date(video.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Right: Feature Badges & Action */}
        <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-accent-glow border border-accent/20 flex items-center justify-center" title="Summary">
              <FileText className="w-3 h-3 text-accent" />
            </div>
            <div className="w-6 h-6 rounded-full bg-accent-glow border border-accent/20 flex items-center justify-center" title="Podcast">
              <Headphones className="w-3 h-3 text-accent" />
            </div>
            <div className="w-6 h-6 rounded-full bg-accent-glow border border-accent/20 flex items-center justify-center" title="Chat Tutor">
              <MessageSquare className="w-3 h-3 text-accent" />
            </div>
          </div>
          
          <Link href={`/video/${video.id}`}>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-[12px] font-bold gap-1.5 border-transparent bg-transparent hover:bg-accent-glow hover:text-accent hover:border-accent/20 group/btn">
              Open
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
