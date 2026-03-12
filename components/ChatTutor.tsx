"use client"
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send } from 'lucide-react'

export function ChatTutor({ videoId, transcript }: { videoId: string, transcript: string }) {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollable = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollable) {
         scrollable.scrollTop = scrollable.scrollHeight
      }
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          transcript,
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!res.ok) {
         const d = await res.json()
         throw new Error(d.error || "Failed to get answer")
      }
      const data = await res.json()
      
      setMessages([...newMessages, { role: 'assistant', content: data.answer }])
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error: ' + err.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-full shadow-lg border-primary/20 bg-card/90 backdrop-blur-md">
      <CardHeader className="bg-muted/50 pb-4 border-b shrink-0">
        <CardTitle className="flex items-center gap-2">
           <span className="text-xl">🤖</span> AI Tutor
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden relative" ref={scrollRef}>
        <ScrollArea className="h-full px-4 py-4 w-full h-[300px] lg:h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8 min-h-[50vh]">
               <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-3xl">🧩</div>
               <p className="font-medium text-foreground">Ask me anything!</p>
               <p className="text-sm mt-2">I know the entire transcript of this video. Try asking for an explanation of a specific concept.</p>
            </div>
          ) : (
             <div className="space-y-4 px-2">
               {messages.map((m, i) => (
                 <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none text-foreground'}`}>
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{m.content}</p>
                   </div>
                 </div>
               ))}
               {loading && (
                 <div className="flex justify-start w-full px-2">
                   <div className="max-w-[85%] bg-muted rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-2 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                 </div>
               )}
             </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-4 bg-muted/30 border-t shrink-0">
        <form onSubmit={handleSend} className="w-full relative flex items-center">
          <Input 
             placeholder="Type your question..." 
             className="pr-12 bg-background border-primary/20 focus-visible:ring-primary/40 rounded-full h-12 shadow-inner"
             value={input}
             onChange={e => setInput(e.target.value)}
             disabled={loading}
          />
          <Button 
             type="submit" 
             size="icon" 
             className="absolute right-1 w-10 h-10 rounded-full shadow-md"
             disabled={!input.trim() || loading}
          >
             {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-[-2px] mt-[1px]" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
