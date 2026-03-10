# Supabase Setup

## 1. Create a Supabase project

Go to https://supabase.com → New project. Choose a region close to Montreal.

## 2. Run the migration

In the Supabase Dashboard → **SQL Editor**, paste and run the contents of:

```
supabase/migrations/0001_initial_schema.sql
```

## 3. Enable Realtime for messages

Dashboard → **Database → Replication** → under "Source", find the `messages` table and toggle it on.

## 4. Configure Auth

Dashboard → **Authentication → Providers**:
- Email provider: enabled ✓
- "Confirm email": enabled ✓ (required — this is how we verify McGill emails)
- "Secure email change": enabled ✓

Dashboard → **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (dev) / your production URL
- Redirect URLs: add `http://localhost:3000/auth/callback`

## 5. Add credentials to .env.local

Dashboard → **Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## 6. Test the flow

1. `npm run dev`
2. Sign up with a `@mail.mcgill.ca` or `@mcgill.ca` email
3. Check your email for the verification link
4. Click the link → lands on `/auth/callback` → profile created → redirected to `/`

## Schema overview

| Table           | Purpose                                      |
|-----------------|----------------------------------------------|
| `profiles`      | Public user data (mirrors auth.users)        |
| `listings`      | Goods and services posted by verified users  |
| `conversations` | One per (listing, buyer) pair                |
| `messages`      | Messages within a conversation               |
| `reviews`       | Buyer reviews seller (1–5 stars)             |
| `reports`       | Flagged listings, reviewed by admins         |

## RLS summary

- **Profiles**: public read, own update only
- **Listings**: public read (active only), verified-only create, owner/admin update, no deletes (use `status = 'removed'`)
- **Conversations**: participant-only read/create, no updates/deletes
- **Messages**: participant-only read/create, recipient can mark read, no deletes
- **Reviews**: public read, verified-only create, no updates/deletes
- **Reports**: admin-only read/update, verified-only create
