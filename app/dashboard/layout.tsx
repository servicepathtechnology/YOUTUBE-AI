"use client"
import { createClient } from '@/utils/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/LogoutButton'
import { 
  LayoutDashboard, 
  Library, 
  PlusCircle, 
  Settings, 
  Bell,
  ArrowUpRight
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    getUser()
  }, [])

  if (!user) {
    return null // or a loading spinner
  }

  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : '??'

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 border-r border-border bg-bg-secondary hidden lg:flex flex-col sticky top-0 h-screen p-6">
        {/* Top: Logo */}
        <Link href="/" className="flex items-center group mb-10">
          <span className="font-headings font-bold text-xl text-text-primary tracking-tight">
            VideoTutor
          </span>
          <span className="ml-1.5 text-[10px] font-bold bg-accent-glow border border-accent text-accent rounded-[4px] px-1.5 py-0.5">
            AI
          </span>
        </Link>

        {/* User Compact Profile */}
        <div className="flex items-center gap-3 mb-10 p-2.5 rounded-lg bg-bg-card/40 border border-border-subtle">
          <div className="w-8 h-8 rounded-full bg-accent-glow border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-text-primary truncate">{user.email?.split('@')[0]}</p>
            <p className="text-[10px] text-text-muted truncate">{user.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-8">
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-4 px-2">Menu</p>
            <nav className="space-y-1">
              <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-all ${pathname === '/dashboard' ? 'bg-accent-glow border border-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'}`}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/dashboard/my-videos" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-all ${pathname === '/dashboard/my-videos' ? 'bg-accent-glow border border-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'}`}>
                <Library className="w-4 h-4" />
                My Videos
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all text-sm font-medium">
                <PlusCircle className="w-4 h-4" />
                New Video
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-[56px] shrink-0 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-border-subtle sticky top-0 z-40 flex items-center justify-between px-8">
          <h2 className="font-headings font-bold text-lg text-text-primary">Dashboard</h2>
          
          <div className="flex items-center gap-5">
            <button className="text-text-muted hover:text-text-primary transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-accent-glow border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
              {userInitials}
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-8 lg:p-10 max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
