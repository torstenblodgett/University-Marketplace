'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

interface Props {
  conversationId: string
  currentUserId: string
  initialMessages: Message[]
}

const MAX_MESSAGE_LENGTH = 2000

export function MessageThread({ conversationId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || sending) return
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`)
      return
    }

    setSending(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: sendError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: trimmed,
      })

      if (sendError) {
        setError('Failed to send message. Please try again.')
        return
      }

      // Also update last_message_at on the conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)

      setContent('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Message list */}
      <div className="flex flex-col gap-3 min-h-64 max-h-[60vh] overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-20 text-center">
            <div>
              <p className="text-3xl mb-2">👋</p>
              <p className="text-sm text-gray-500">Start the conversation below.</p>
            </div>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={[
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    isOwn
                      ? 'bg-red-700 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm',
                  ].join(' ')}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`mt-1 text-xs ${isOwn ? 'text-red-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-CA', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 pt-4 space-y-2">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e as unknown as React.FormEvent)
              }
            }}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            rows={2}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={sending}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
          <Button type="submit" loading={sending} disabled={!content.trim()}>
            Send
          </Button>
        </div>
        <p className="text-xs text-right text-gray-400">
          {content.length}/{MAX_MESSAGE_LENGTH}
        </p>
      </form>
    </div>
  )
}
