"use client"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function GuestUrlInput() {
  const router = useRouter()
  return (
    <div className="max-w-[640px] mx-auto animate-fade-up animate-fade-up-delay-4">
      <div className="bg-bg-card border border-border rounded-2xl p-2 flex gap-2 shadow-elevated">
        <input
          type="url"
          placeholder="Paste YouTube URL, article link, or text..."
          className="flex-1 bg-transparent px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none font-sans cursor-pointer"
          readOnly
          onClick={() => router.push('/signup')}
        />
        <Link href="/signup">
          <Button className="h-12 px-6 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl">
            Analyze →
          </Button>
        </Link>
      </div>
      <p className="text-xs text-text-muted mt-3">Free to start. No credit card required.</p>
    </div>
  )
}
