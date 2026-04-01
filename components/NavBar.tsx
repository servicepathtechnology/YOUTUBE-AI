"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Menu, X, Zap } from "lucide-react"

export default function NavBar() {
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  // Dashboard has its own sidebar — hide global navbar there
  if (pathname?.startsWith("/dashboard")) return null

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-[64px] transition-all duration-300 ${scrolled ? "bg-[#0A0F1E]/90 backdrop-blur-[20px] border-b border-border-subtle shadow-elevated" : "bg-transparent"}`}>
      <div className="container mx-auto h-full flex items-center justify-between px-6 max-w-7xl">

        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-headings font-bold text-xl text-text-primary tracking-tight">Actify</span>
        </Link>

        {!user && (
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Features</Link>
            <Link href="/#how-it-works" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">How it Works</Link>
            <Link href="/#pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Pricing</Link>
          </nav>
        )}

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">Dashboard</Button>
              </Link>
              <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary" onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm" className="px-4">Log in</Button></Link>
              <Link href="/signup"><Button size="sm" className="px-5 bg-accent hover:bg-accent-hover text-white font-semibold">Get Started Free</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-text-secondary hover:text-text-primary" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-bg-card border-b border-border px-6 py-4 space-y-3">
          {!user ? (
            <>
              <Link href="/#features" className="block text-sm text-text-secondary hover:text-text-primary py-2" onClick={() => setMenuOpen(false)}>Features</Link>
              <Link href="/#how-it-works" className="block text-sm text-text-secondary hover:text-text-primary py-2" onClick={() => setMenuOpen(false)}>How it Works</Link>
              <Link href="/#pricing" className="block text-sm text-text-secondary hover:text-text-primary py-2" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="flex-1" onClick={() => setMenuOpen(false)}><Button variant="ghost" size="sm" className="w-full">Log in</Button></Link>
                <Link href="/signup" className="flex-1" onClick={() => setMenuOpen(false)}><Button size="sm" className="w-full bg-accent hover:bg-accent-hover text-white">Get Started</Button></Link>
              </div>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="block text-sm text-text-secondary hover:text-text-primary py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="block text-sm text-text-secondary hover:text-text-primary py-2 w-full text-left">Log out</button>
            </>
          )}
        </div>
      )}
    </header>
  )
}