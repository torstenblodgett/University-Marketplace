'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signupSchema } from '@/lib/validators/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type FieldErrors = Partial<Record<'email' | 'password' | 'displayName', string>>

export default function SignupPage() {
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
      displayName: (form.get('displayName') as string).trim(),
    }

    // Client-side validation (server also validates)
    const result = signupSchema.safeParse(raw)
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

      const { error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: { display_name: result.data.displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setServerError('An account with this email already exists. Try logging in.')
        } else {
          setServerError(error.message)
        }
        return
      }

      router.push('/verify-email')
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500">McGill email required</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          name="displayName"
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          error={fieldErrors.displayName}
          required
        />
        <Input
          label="McGill email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="jane.smith@mail.mcgill.ca"
          error={fieldErrors.email}
          hint="@mail.mcgill.ca or @mcgill.ca only"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={fieldErrors.password}
          required
        />

        {serverError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-red-700 hover:underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  )
}
