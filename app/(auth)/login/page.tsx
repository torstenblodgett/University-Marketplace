'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validators/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type FieldErrors = Partial<Record<'email' | 'password', string>>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError('')
    setFieldErrors({})

    const form = new FormData(e.currentTarget)
    const raw = {
      email: (form.get('email') as string).trim().toLowerCase(),
      password: form.get('password') as string,
    }

    const result = loginSchema.safeParse(raw)
    if (!result.success) {
      const errors: FieldErrors = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof FieldErrors
        if (!errors[field]) errors[field] = issue.message
      })
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      })

      if (error) {
        // Intentionally vague — don't reveal whether email exists
        setServerError('Invalid email or password.')
        return
      }

      router.refresh()
      router.push('/')
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500">Log in with your McGill email</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="McGill email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="jane.smith@mail.mcgill.ca"
          error={fieldErrors.email}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          error={fieldErrors.password}
          required
        />

        {serverError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Log in
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-red-700 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
