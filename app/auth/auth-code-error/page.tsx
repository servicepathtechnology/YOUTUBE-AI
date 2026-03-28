import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">Authentication Error</h1>
        <p className="text-text-secondary text-sm">Something went wrong during sign in. Please try again.</p>
        <Link href="/login" className="inline-block mt-4 px-6 py-2.5 bg-accent text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
