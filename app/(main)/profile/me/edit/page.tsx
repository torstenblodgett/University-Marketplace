import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'

export default async function EditProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/profile/me/edit')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit profile</h1>
        <p className="text-sm text-gray-500 mt-1">Update how you appear to other students.</p>
      </div>

      <ProfileEditForm
        userId={user.id}
        initialDisplayName={profile.display_name}
        initialBio={profile.bio}
      />
    </div>
  )
}
