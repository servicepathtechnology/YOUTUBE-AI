import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-background to-muted/50">
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 mt-10">
        Turn YouTube Videos Into Your <br className="hidden sm:block" />
        <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
          Personal AI Tutor
        </span>
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-10">
        Paste any YouTube link and instantly get summaries, podcasts, and an AI tutor that answers your questions based on the video content.
      </p>
      <Link href="/signup">
        <Button size="lg" className="h-12 px-8 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
          Start Learning
        </Button>
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-2xl">📝</div>
          <h3 className="font-bold text-xl mb-2">Instant Summaries</h3>
          <p className="text-muted-foreground">Get quick bullet points and key concept explanations without watching the whole video.</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-2xl">🎧</div>
          <h3 className="font-bold text-xl mb-2">AI Podcasts</h3>
          <p className="text-muted-foreground">Listen to conversational podcast-style explanations generated right from the video transcript.</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-2xl">💬</div>
          <h3 className="font-bold text-xl mb-2">Interactive Tutor</h3>
          <p className="text-muted-foreground">Chat with an AI that knows the video intimately. Ask questions, clarify doubts, and learn faster.</p>
        </div>
      </div>
    </div>
  )
}
