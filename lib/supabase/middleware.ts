import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Define protected routes
    const protectedRoutes = [
        '/dashboard',
        '/pelanggan',
        '/input-meteran',
        '/pembayaran',
        '/setoran',
        '/laporan',
        '/riwayat',
        '/wilayah',
        '/tarif',
    ]

    const pathname = request.nextUrl.pathname

    // Check if the current path matches any protected route
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    )

    if (isProtectedRoute && !user) {
        // Redirect to login page
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is logged in and trying to access login page, redirect to dashboard
    if (pathname === '/login' && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
