"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Headphones, MessageSquare, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'

interface VideoCardProps {
  video: {
    id: string;
    video_id: string;
    video_url?: string;
    title: string;
    thumbnail?: string | null;
    source_type?: string;
    created_at: string;
  }
}

export function VideoCard({ video }: VideoCardProps) {
  const router = useRouter()
  const isYoutube = /(?:youtube\.com|youtu\.be)/i.test(video.video_url || '')
  const thumbnailSrc = video.thumbnail
    || (isYoutube ? `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg` : null)
    || '/file.svg'
  const sourceLabel = video.source_type === 'podcast' ? 'Podcast'
    : isYoutube ? 'YouTube Video' : 'Article'

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const skipDeleteConfirm = localStorage.getItem('skipDeleteConfirm') === 'true'

    if (skipDeleteConfirm) {
      performDelete()
      return
    }

    const result = await Swal.fire({
      title: 'Delete Video?',
      text: "This will permanently remove the video analysis and history.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Yes, delete it!',
      background: '#0a0a0c',
      color: '#f4f4f5',
      customClass: {
        popup: 'border border-border rounded-xl shadow-card',
        title: 'font-headings text-xl font-bold',
        htmlContainer: 'text-text-secondary text-sm',
        confirmButton: 'rounded-lg px-6 py-2.5 font-bold',
        cancelButton: 'rounded-lg px-6 py-2.5 font-bold'
      },
      footer: `
        <div class="flex items-center gap-2">
          <input type="checkbox" id="dont-show-again" class="w-4 h-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent">
          <label for="dont-show-again" class="text-xs text-text-muted font-medium cursor-pointer">Don't show again</label>
        </div>
      `,
      preConfirm: () => {
        const checkbox = document.getElementById('dont-show-again') as HTMLInputElement
        if (checkbox?.checked) {
          localStorage.setItem('skipDeleteConfirm', 'true')
        }
      }
    })

    if (result.isConfirmed) {
      performDelete()
    }
  }

  const performDelete = async () => {
    try {
      const res = await fetch('/api/delete-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.id })
      })

      if (res.ok) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Video deleted',
          showConfirmButton: false,
          timer: 2000,
          background: '#0a0a0c',
          color: '#f4f4f5',
        })
        router.refresh()
      } else {
        throw new Error('Failed to delete video')
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete the video.',
        background: '#0a0a0c',
        color: '#f4f4f5',
      })
    }
  }

  return (
    <Card className="bg-bg-card border-border rounded-lg p-4 transition-all duration-250 hover:bg-bg-card-hover hover:border-accent/30 group">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Left: Thumbnail */}
        <div className="relative w-24 h-14 sm:w-20 sm:h-14 shrink-0 rounded-[6px] bg-bg-secondary overflow-hidden border border-border group-hover:border-accent/20 transition-colors">
          <img 
            src={thumbnailSrc}
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
            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">{sourceLabel}</span>
            <div className="w-1 h-1 rounded-full bg-border"></div>
            <span className="text-[11px] text-text-muted">
              {new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 rounded-full text-text-muted hover:text-red-500 hover:bg-red-500/10"
              onClick={handleDelete}
              title="Delete Video"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <Link href={`/video/${video.id}`}>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-[12px] font-bold gap-1.5 border-transparent bg-transparent hover:bg-accent-glow hover:text-accent hover:border-accent/20 group/btn">
                Open
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
