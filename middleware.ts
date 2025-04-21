import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/signup", "/reset-password"]
    const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

    // If user is not signed in and trying to access a protected route,
    // redirect to login
    if (!session && !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // If user is signed in and trying to access a public route (login/signup),
    // redirect to dashboard
    if (session && isPublicRoute) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  } catch (error: any) {
    // Handle refresh token errors by redirecting to login
    if (error?.name === "AuthApiError" && error?.status === 400 && error?.message?.includes("refresh_token")) {
      // Clear any existing session cookies
      const response = NextResponse.redirect(new URL("/login", req.url))

      // Attempt to clear the supabase cookie
      response.cookies.delete("sb-refresh-token")
      response.cookies.delete("sb-access-token")

      return response
    }

    // For other errors, continue but log them
    console.error("Auth error in middleware:", error)
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
