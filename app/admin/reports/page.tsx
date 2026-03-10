import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import type { ReportStatus } from '@/types/database'

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
}

const STATUS_COLORS: Record<ReportStatus, 'status' | 'verified' | 'neutral' | 'category'> = {
  pending: 'status',
  reviewed: 'category',
  resolved: 'verified',
  dismissed: 'neutral',
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('reports')
    .select(`
      id, reason, status, created_at,
      reporter:profiles!reports_reporter_id_fkey(display_name),
      listing:listings(id, title),
      reported_user:profiles!reports_reported_user_id_fkey(id, display_name)
    `)
    .order('created_at', { ascending: false })

  if (status && ['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
    query = query.eq('status', status as ReportStatus)
  } else {
    // Default: show pending first
    query = query.in('status', ['pending', 'reviewed'])
  }

  const { data: reports } = await query

  const filterStatuses: Array<{ label: string; value: string }> = [
    { label: 'Open', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Dismissed', value: 'dismissed' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
        <div className="flex gap-2 text-sm">
          {filterStatuses.map(f => (
            <Link
              key={f.value}
              href={f.value ? `/admin/reports?status=${f.value}` : '/admin/reports'}
              className={[
                'rounded-lg px-3 py-1.5 border transition-colors',
                (!status && !f.value) || status === f.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {!reports || reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <p className="text-2xl mb-2">✓</p>
          <p className="font-medium text-gray-700">No reports</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {reports.map(report => {
            const reporter = report.reporter as { display_name: string } | null
            const listing = report.listing as { id: string; title: string } | null
            const reportedUser = report.reported_user as { id: string; display_name: string } | null

            return (
              <Link
                key={report.id}
                href={`/admin/reports/${report.id}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_COLORS[report.status as ReportStatus]}>
                      {STATUS_LABELS[report.status as ReportStatus]}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(report.created_at).toLocaleDateString('en-CA', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{report.reason}</p>
                  <p className="text-xs text-gray-500">
                    By {reporter?.display_name ?? 'Unknown'}
                    {listing && ` · Listing: ${listing.title}`}
                    {reportedUser && ` · User: ${reportedUser.display_name}`}
                  </p>
                </div>
                <span className="text-gray-400 text-sm">→</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
