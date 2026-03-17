"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message === 'Email not confirmed') {
        router.push(`/verify?email=${email}`)
        return
      }
      setError(error.message)
      setLoading(false)
    } else {
       router.push('/')
       router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-primary relative overflow-hidden px-4 py-12">
      {/* Background Patterns */}
      <div className="absolute inset-0 z-0 opacity-40" 
           style={{
             backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
             backgroundSize: '48px 48px'
           }}></div>
      <div className="absolute inset-0 z-0" 
           style={{
             background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.15), transparent)'
           }}></div>

      <Card className="relative z-10 w-full max-w-[420px] bg-bg-card border-border shadow-elevated p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h2 className="font-headings font-bold text-2xl text-text-primary tracking-tight">
              VideoTutor <span className="text-accent">AI</span>
            </h2>
          </Link>
          <p className="text-sm text-text-secondary">Welcome back</p>
        </div>

        <div className="h-px bg-border w-full mb-8"></div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-md bg-error/10 border border-error/20 flex items-center gap-3 text-error text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-[12px] text-accent hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <Button className="w-full h-11 text-[15px] font-semibold" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border"></div>
          <span className="text-[12px] text-text-muted font-medium uppercase tracking-widest">or continue with</span>
          <div className="h-px flex-1 bg-border"></div>
        </div>

        <Button 
          variant="ghost" 
          className="w-full h-11 flex items-center justify-center gap-3 bg-bg-secondary border-border hover:border-accent group"
          onClick={handleGoogleLogin}
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-text-primary">Continue with Google</span>
        </Button>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-muted">
            Don't have an account? <Link href="/signup" className="text-accent font-semibold hover:underline">Sign up →</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
