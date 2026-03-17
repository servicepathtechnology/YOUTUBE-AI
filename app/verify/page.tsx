"use client"
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

function VerifyContent() {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: email!,
      token: otp,
      type: 'signup',
    })
    
    if (error) {
       setError(error.message)
       setLoading(false)
    } else {
       router.push('/dashboard')
       router.refresh()
    }
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
          <h2 className="font-headings font-bold text-2xl text-text-primary tracking-tight">
            Verify your email
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            We've sent a 6-digit code to <span className="font-bold text-accent">{email}</span>. Please enter it below.
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-md bg-error/10 border border-error/20 flex items-center gap-3 text-error text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp">One-Time Password</Label>
            <Input 
              id="otp" 
              type="text" 
              placeholder="123456"
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              required 
              className="font-mono text-center text-lg tracking-[0.5em]"
            />
          </div>

          <Button className="w-full h-11 text-[15px] font-semibold" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
