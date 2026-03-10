import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReportStatus } from '@/types/database'

const VALID_STATUSES: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Must be admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { status, admin_notes } = body

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (status) update.status = status
  if (typeof admin_notes === 'string') update.admin_notes = admin_notes

  const { error } = await supabase
    .from('reports')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
