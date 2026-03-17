import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { LogoutButton } from './LogoutButton'

export default async function NavBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[64px] bg-[#0A0A0F]/80 backdrop-blur-[20px] saturate-[180%] border-b border-border-subtle">
      <div className="container mx-auto h-full flex items-center justify-between px-6 max-w-7xl">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <span className="font-headings font-bold text-xl text-text-primary tracking-tight">
            VideoTutor
          </span>
          <span className="ml-1.5 text-[10px] font-bold bg-accent-glow border border-accent text-accent rounded-[4px] px-1.5 py-0.5 transform transition-transform group-hover:scale-110">
            AI
          </span>
        </Link>

        {/* Nav Links - Center (hidden on mobile) */}
        {!user && (
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              How it Works
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Pricing
            </Link>
          </nav>
        )}

        {/* CTA Buttons - Right */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard/my-videos">
                <Button variant="ghost" size="sm">My Videos</Button>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="px-4">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm" className="px-5">Get Started Free</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
