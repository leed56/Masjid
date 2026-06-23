import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']
const SUPER_ADMIN  = '/super-admin'
const SETUP_PATH   = '/setup'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Not logged in → /login
  if (!user && !PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in — if profile not complete, force /setup
  // (skip check when already on /setup, /super-admin, /login, or API routes)
  if (
    user &&
    !pathname.startsWith(SUPER_ADMIN) &&
    !pathname.startsWith(SETUP_PATH) &&
    !pathname.startsWith('/api') &&
    !PUBLIC_PATHS.some(p => pathname.startsWith(p))
  ) {
    const { data: mu } = await supabase
      .from('masjid_users')
      .select('masjid_id')
      .eq('user_id', user.id)
      .eq('role', 'masjid_admin')
      .maybeSingle()

    if (mu) {
      const { data: masjid } = await supabase
        .from('masjids')
        .select('profile_complete')
        .eq('id', mu.masjid_id)
        .single()

      if (masjid && !masjid.profile_complete) {
        const url = request.nextUrl.clone()
        url.pathname = SETUP_PATH
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
