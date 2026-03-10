'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface Props {
  listingId: string
  sellerId: string
}

export function MessageSellerButton({ listingId, sellerId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, seller_id: sellerId }),
      })
      const data = await res.json() as { conversationId?: string; error?: string }

      if (!res.ok || !data.conversationId) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      router.push(`/messages/${data.conversationId}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleClick} loading={loading}>
        Message seller
      </Button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  )
}
