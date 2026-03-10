'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

const YEAR_OPTIONS = ['U1', 'U2', 'U3', 'U4+', 'Graduate', 'PhD', 'Other']

interface Props {
  userId: string
  initialDisplayName: string
  initialBio: string | null
  initialProgram: string | null
  initialYear: string | null
}

export function ProfileEditForm({
  userId,
  initialDisplayName,
  initialBio,
  initialProgram,
  initialYear,
}: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [bio, setBio] = useState(initialBio ?? '')
  const [program, setProgram] = useState(initialProgram ?? '')
  const [year, setYear] = useState(initialYear ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const displayNameTrimmed = displayName.trim()
  const bioTrimmed = bio.trim()
  const programTrimmed = program.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (displayNameTrimmed.length < 2) {
      setError('Display name must be at least 2 characters.')
      return
    }
    if (displayNameTrimmed.length > 50) {
      setError('Display name must be 50 characters or fewer.')
      return
    }
    if (bioTrimmed.length > 300) {
      setError('Bio must be 300 characters or fewer.')
      return
    }
    if (programTrimmed.length > 100) {
      setError('Program must be 100 characters or fewer.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayNameTrimmed,
          bio: bioTrimmed || null,
          program: programTrimmed || null,
          year: year || null,
        })
        .eq('id', userId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      router.push('/profile/me')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Display name"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        maxLength={50}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Program"
          value={program}
          onChange={e => setProgram(e.target.value)}
          placeholder="e.g. Computer Science"
          maxLength={100}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[#1A1A1A]">Year</label>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#ED1B2F] focus:outline-none focus:ring-1 focus:ring-[#ED1B2F]"
          >
            <option value="">Select year</option>
            {YEAR_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Textarea
          label="Bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell other students a bit about yourself (optional)"
          maxLength={300}
        />
        <p className="text-xs text-gray-400 text-right">{bioTrimmed.length}/300</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={saving} className="flex-1">
          Save changes
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
