import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.email_confirmed_at) return NextResponse.json({ error: 'Email not verified' }, { status: 403 })

  const body = await request.json()
  const { listing_id, reported_user_id, reason, details } = body

  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
  }

  // At least one target required
  if (!listing_id && !reported_user_id) {
    return NextResponse.json({ error: 'Must report a listing or a user' }, { status: 400 })
  }

  // Can't report yourself
  if (reported_user_id === user.id) {
    return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
  }

  // Can't report your own listing
  if (listing_id) {
    const { data: listing } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', listing_id)
      .single()
    if (listing?.seller_id === user.id) {
      return NextResponse.json({ error: 'Cannot report your own listing' }, { status: 400 })
    }
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    listing_id: listing_id ?? null,
    reported_user_id: reported_user_id ?? null,
    reason: reason.trim(),
    admin_notes: details?.trim() || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
