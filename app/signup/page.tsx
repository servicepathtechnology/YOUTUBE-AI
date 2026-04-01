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

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    
    if (error) {
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

  const getPasswordStrength = () => {
    if (password.length === 0) return 0
    if (password.length < 6) return 1
    if (password.length < 10) return 2
    return 3
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
             background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255, 92, 0, 0.12), transparent)'
           }}></div>

      <Card className="relative z-10 w-full max-w-[420px] bg-bg-card border-border shadow-elevated p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white fill-white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h2 className="font-headings font-bold text-2xl text-text-primary tracking-tight">Actify</h2>
          </Link>
          <p className="text-sm text-text-secondary">Create your account</p>
        </div>

        <div className="h-px bg-border w-full mb-8"></div>

        <form onSubmit={handleSignup} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-md bg-error/10 border border-error/20 flex items-center gap-3 text-error text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input 
              id="fullName" 
              placeholder="Alex Johnson" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            
            {/* Password Strength Bar */}
            <div className="flex gap-1.5 mt-2">
              <div className={`h-1 flex-1 rounded-full transition-colors ${getPasswordStrength() >= 1 ? 'bg-error' : 'bg-border'}`}></div>
              <div className={`h-1 flex-1 rounded-full transition-colors ${getPasswordStrength() >= 2 ? 'bg-yellow-500' : 'bg-border'}`}></div>
              <div className={`h-1 flex-1 rounded-full transition-colors ${getPasswordStrength() >= 3 ? 'bg-success' : 'bg-border'}`}></div>
            </div>
            <p className="text-[10px] text-text-muted mt-1.5">
              Use 8+ characters with a mix of letters and numbers
            </p>
          </div>

          <Button className="w-full h-11 text-[15px] font-semibold mt-2 bg-accent hover:bg-accent-hover text-white" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
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

        <p className="mt-8 text-[11px] text-text-muted text-center px-4 leading-relaxed">
          By signing up, you agree to our <Link href="#" className="text-text-secondary hover:text-text-primary underline">Terms of Service</Link> and <Link href="#" className="text-text-secondary hover:text-text-primary underline">Privacy Policy</Link>
        </p>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted">
            Already have an account? <Link href="/login" className="text-accent font-semibold hover:underline">Sign in →</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
