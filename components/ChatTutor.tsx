"use client"
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Zap } from 'lucide-react'

interface Props {
  videoId: string
  transcript: string
  language?: string
}

const PLACEHOLDER: Record<string, string> = {
  ENGLISH: 'Ask anything about this video...',
  HINDI:   'इस वीडियो के बारे में कुछ भी पूछें...',
  TELUGU:  'ఈ వీడియో గురించి ఏదైనా అడగండి...',
}

const EMPTY_LABEL: Record<string, string> = {
  ENGLISH: 'Actify AI knows this video. Ask anything.',
  HINDI:   'Actify AI इस वीडियो को जानता है। कुछ भी पूछें।',
  TELUGU:  'Actify AI ఈ వీడియోను తెలుసు. ఏదైనా అడగండి.',
}

export function ChatTutor({ videoId, transcript, language = 'ENGLISH' }: Props) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/chat/history?video_id=${videoId}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.history.map((m: any) => ({ role: m.role, content: m.message })))
        }
      } catch (err) {
        console.error('Failed to fetch history:', err)
      }
    }
    fetchHistory()
  }, [videoId])

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, question: userMessage, language }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to get answer')
      }
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.answer }])
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, error: ' + err.message }])
    } finally {
      setLoading(false)
    }
  }

  const placeholder = PLACEHOLDER[language] || PLACEHOLDER.ENGLISH
  const emptyLabel  = EMPTY_LABEL[language]  || EMPTY_LABEL.ENGLISH

  return (
    <div className="flex flex-col h-full bg-bg-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-accent fill-accent" />
        </div>
        <div>
          <p className="font-headings font-bold text-text-primary text-sm">Actify AI</p>
          <p className="text-[11px] text-text-muted font-sans truncate max-w-[200px]">{emptyLabel}</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden" ref={scrollRef}>
        <ScrollArea className="h-full px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[200px]">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 text-2xl">🤖</div>
              <p className="font-headings font-bold text-text-primary text-sm mb-2">Actify AI knows this video.</p>
              <p className="text-xs text-text-muted font-sans max-w-[220px]">{emptyLabel}</p>
            </div>
          ) : (
            <div className="space-y-4 px-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed font-sans ${
                    m.role === 'user'
                      ? 'bg-accent text-white rounded-br-none'
                      : 'bg-bg-secondary border border-border text-text-primary rounded-bl-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-bg-secondary border border-border rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="p-4 border-t border-border shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            placeholder={placeholder}
            className="flex-1 bg-bg-secondary border-border text-text-primary placeholder:text-text-muted rounded-xl h-11 font-sans"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="w-11 h-11 rounded-xl bg-accent hover:bg-accent-hover text-white shrink-0"
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
