import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReportForm } from '@/components/report/ReportForm'

interface Props {
  searchParams: Promise<{ listing?: string; user?: string }>
}

export default async function ReportPage({ searchParams }: Props) {
  const { listing: listingId, user: userId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/report')
  if (!user.email_confirmed_at) redirect('/verify-email')

  // At least one target required
  if (!listingId && !userId) redirect('/')

  // Can't report yourself
  if (userId === user.id) redirect('/')

  // Fetch context for display
  let listingTitle: string | null = null
  let reportedUserName: string | null = null

  if (listingId) {
    const { data } = await supabase
      .from('listings')
      .select('title, seller_id')
      .eq('id', listingId)
      .single()
    listingTitle = data?.title ?? null
    // Also can't report your own listing
    if (data?.seller_id === user.id) redirect('/')
  }

  if (userId) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()
    reportedUserName = data?.display_name ?? null
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your report is anonymous and will be reviewed by our team.
          </p>
        </div>

        {listingTitle && (
          <div className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-gray-700">
            Reporting listing: <span className="font-medium">{listingTitle}</span>
          </div>
        )}
        {reportedUserName && (
          <div className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-gray-700">
            Reporting user: <span className="font-medium">{reportedUserName}</span>
          </div>
        )}

        <ReportForm listingId={listingId ?? null} reportedUserId={userId ?? null} />
      </div>
    </div>
  )
}
