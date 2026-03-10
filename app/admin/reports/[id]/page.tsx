import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { AdminReportActions } from '@/components/admin/AdminReportActions'
import type { ReportStatus } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminReportDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(id, display_name, email),
      listing:listings(id, title, status),
      reported_user:profiles!reports_reported_user_id_fkey(id, display_name, email)
    `)
    .eq('id', id)
    .single()

  if (!report) notFound()

  const reporter = report.reporter as { id: string; display_name: string; email: string } | null
  const listing = report.listing as { id: string; title: string; status: string } | null
  const reportedUser = report.reported_user as { id: string; display_name: string; email: string } | null

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/reports" className="text-sm text-gray-500 hover:text-gray-900">
          ← Reports
        </Link>
        <Badge variant={report.status === 'pending' ? 'status' : report.status === 'resolved' ? 'verified' : 'neutral'}>
          {report.status}
        </Badge>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Reason</p>
          <p className="text-sm font-semibold text-gray-900">{report.reason}</p>
        </div>

        {report.admin_notes && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Details</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{report.admin_notes}</p>
          </div>
        )}

        <hr className="border-gray-100" />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Reporter</p>
            <p className="font-medium text-gray-900">{reporter?.display_name ?? '—'}</p>
            <p className="text-gray-500 text-xs">{reporter?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
            <p className="font-medium text-gray-900">
              {new Date(report.created_at).toLocaleDateString('en-CA', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {listing && (
          <>
            <hr className="border-gray-100" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Reported listing</p>
              <Link
                href={`/listings/${listing.id}`}
                className="text-sm font-medium text-red-700 hover:underline"
              >
                {listing.title}
              </Link>
              <span className="ml-2 text-xs text-gray-400">({listing.status})</span>
            </div>
          </>
        )}

        {reportedUser && (
          <>
            <hr className="border-gray-100" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Reported user</p>
              <Link
                href={`/profile/${reportedUser.id}`}
                className="text-sm font-medium text-red-700 hover:underline"
              >
                {reportedUser.display_name}
              </Link>
              <p className="text-xs text-gray-400">{reportedUser.email}</p>
            </div>
          </>
        )}
      </div>

      <AdminReportActions reportId={report.id} currentStatus={report.status as ReportStatus} currentNotes={report.admin_notes ?? ''} />
    </div>
  )
}
