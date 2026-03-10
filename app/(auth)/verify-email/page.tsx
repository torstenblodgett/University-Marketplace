'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleResend() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setError('No email found. Please sign up again.')
        return
      }
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (resendError) {
        setError(resendError.message)
        return
      }
      setResent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm text-center space-y-6">
      <div className="text-5xl">📬</div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          We sent a verification link to your McGill email address.
          Click it to activate your account.
        </p>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-4 text-sm text-amber-800 space-y-1">
        <p className="font-medium">Didn&apos;t receive it?</p>
        <p className="text-amber-700">Check your spam folder, or resend the email below.</p>
      </div>

      {resent ? (
        <p className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
          Verification email resent. Check your inbox.
        </p>
      ) : (
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleResend}
          loading={loading}
        >
          Resend verification email
        </Button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-400">
        Only verified McGill students can post listings or message others.
      </p>
    </div>
  )
}
