"use client"
import { createClient } from '@/utils/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { LayoutDashboard, Library, Zap, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/my-videos': 'My Videos',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
    })
  }, [])

  if (!user) return null

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : '??'
  const pageTitle = PAGE_TITLES[pathname] || 'Dashboard'

  const navItems = [
    { href: '/dashboard',           label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/my-videos', label: 'My Videos', icon: Library },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">

      {/* ── Sidebar ── */}
      <aside className="w-[220px] shrink-0 border-r border-border bg-bg-secondary hidden lg:flex flex-col sticky top-0 h-screen">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shadow-glow">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-headings font-bold text-lg text-text-primary tracking-tight">Actify</span>
          </Link>
        </div>

        {/* User profile */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-card border border-border">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[11px] font-bold text-accent shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-text-primary truncate">{user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-text-muted truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] px-2 mb-3">Menu</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-accent/10 border border-accent/20 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout at bottom */}
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-error hover:bg-error/5 transition-all w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-[56px] shrink-0 bg-bg-primary/90 backdrop-blur-md border-b border-border sticky top-0 z-40 flex items-center justify-between px-6 lg:px-8">
          <h1 className="font-headings font-bold text-base text-text-primary">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[11px] font-bold text-accent">
              {initials}
            </div>
            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              className="lg:hidden text-xs text-text-muted hover:text-text-primary font-sans"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
