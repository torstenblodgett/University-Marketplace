'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  otherPartyInitial?: string
}

const MAX_MESSAGE_LENGTH = 2000

export function MessageThread({ conversationId, currentUserId, initialMessages, otherPartyInitial }: Props) {
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

  const initial = otherPartyInitial ?? '?'

  return (
    <div className="flex h-full flex-col">

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-2">👋</p>
              <p className="text-sm text-gray-500">Say hello!</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {messages.map((msg, i) => {
              const isOwn = msg.sender_id === currentUserId
              // Show avatar only on the last consecutive received message
              const nextMsg = messages[i + 1]
              const showAvatar = !isOwn && (
                !nextMsg || nextMsg.sender_id === currentUserId
              )

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar placeholder for spacing on received messages */}
                  {!isOwn && (
                    <div className="w-6 shrink-0 flex items-end">
                      {showAvatar && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-700 text-white text-[10px] font-semibold">
                          {initial}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={[
                      'max-w-[72%] rounded-3xl px-4 py-2.5 text-sm',
                      isOwn
                        ? 'bg-[#ED1B2F] text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none',
                    ].join(' ')}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="px-4 pb-1 text-xs text-red-600">{error}</p>
      )}

      {/* ── Input bar — Instagram style ── */}
      <div className="border-t border-[#E5E5E5] px-3 py-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e as unknown as React.FormEvent)
              }
            }}
            placeholder="Message..."
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={sending}
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#ED1B2F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ED1B2F] text-white transition-colors hover:bg-[#C41525] disabled:opacity-30"
          >
            {/* Paper-plane icon */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 -mr-0.5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>

    </div>
  )
}
