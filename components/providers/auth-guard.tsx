"use client"

import type React from "react"

import { AuthProvider, useAuth } from "./auth-provider"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ScreenLoading } from "../loading/screen-loading"

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password"]

const ROLE_ROUTES = {
  SUPERADMIN: ["*"],
  ADMIN: [
    "/admin",
    "/admin/hierarchy",
    "/admin/users",
    "/admin/reports",
    "/admin/statistics",
    "/dashboard",
    "/reports",
    "/profile",
    "/images",
    "/loading",
    "/public"
  ],
  USER: ["/dashboard", "/reports", "/profile", "/images", "/admin/overview", "/loading"],
}

const getDefaultRouteForUser = (user: any): string => {
  if (!user) return "/"

  const userRole = user.role as string;


  switch (userRole) {
    case "SUPERADMIN":
    case "ADMIN":
      return "/admin/hierarchy"
    case "USER":
      return  user?.isManager ? "/admin/overview" : "/dashboard"
    default:
      return "/"
  }
}

const hasAccess = (user: any, path: string): boolean => {
  if (!user) return false

  const userRole = user.role as string
  const allowedRoutes = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || []

  if (allowedRoutes.includes("*")) return true
  if (allowedRoutes.includes(path)) return true

  return allowedRoutes.some((route) => {
    return path === route || path.startsWith(route + "/")
  })
}

interface AuthGuardProps {
  children: React.ReactNode
}

function AuthGuardLogic({ children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated, error, checkAuth, clearError } = useAuth()

  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [navigationAttempts, setNavigationAttempts] = useState(0)
  const navigationTimeoutRef = useRef<NodeJS.Timeout>()
  const maxNavigationAttempts = 2

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  const safeNavigate = useCallback(
    (path: string, reason: string) => {
      if (isNavigating || navigationAttempts >= maxNavigationAttempts) {
        return
      }

      setIsNavigating(true)
      setNavigationAttempts((prev) => prev + 1)

      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }

      router.replace(path)

      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false)
      }, 2000)
    },
    [router, isNavigating, navigationAttempts, maxNavigationAttempts],
  )

  const userId = user?.id
  const userRole = user?.role
  const isManager = user?.isManager

  useEffect(() => {
    if (!isLoading && !initialLoadComplete) {
      setInitialLoadComplete(true)
    }
  }, [isLoading, initialLoadComplete])

  useEffect(() => {
    setNavigationAttempts(0)
    setIsNavigating(false)
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }
  }, [pathname])

  useEffect(() => {
    if (isLoading || !initialLoadComplete || isNavigating) {
      return
    }

    if (error && !isPublicRoute) {
      return
    }

    if (!isAuthenticated && !isPublicRoute && !error) {
      const returnUrl = encodeURIComponent(pathname)
      safeNavigate(`/login?returnUrl=${returnUrl}`, "Unauthenticated access to protected route")
      return
    }

    if (isAuthenticated && userId && (pathname === "/login" || pathname === "/register")) {
      const defaultRoute = getDefaultRouteForUser(user)
      safeNavigate(defaultRoute, "Authenticated user on auth page")
      return
    }

    if (isAuthenticated && userId && pathname === "/") {
      const defaultRoute = getDefaultRouteForUser(user)
      safeNavigate(defaultRoute, "Authenticated user on root path")
      return
    }

    if (isAuthenticated && userId && !isPublicRoute) {
      const hasRouteAccess = hasAccess(user, pathname)

      if (!hasRouteAccess) {
        return
      }
    }
  }, [
    isLoading,
    initialLoadComplete,
    isAuthenticated,
    pathname,
    userId,
    userRole,
    isManager,
    isPublicRoute,
    isNavigating,
    error,
    safeNavigate,
  ])

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  if (error && !isLoading && initialLoadComplete && !isPublicRoute) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => {
          clearError()
          checkAuth()
        }}
        onGoToLogin={() => {
          clearError()
          router.push("/login")
        }}
      />
    )
  }

  if (isLoading || !initialLoadComplete || isNavigating || (isAuthenticated && !user && !error)) {
    return <ScreenLoading size="lg" variant="grid" fullScreen backdrop />
  }

  if (!isAuthenticated && isPublicRoute) {
    return <>{children}</>
  }

  // if (!isAuthenticated && !isPublicRoute && !error) {
  //   return <LoadingSpinner size="lg" variant="dots" />
  // }

  if (isAuthenticated && user) {
    if (isPublicRoute) {
      return <>{children}</>
    }

    if (!hasAccess(user, pathname)) {
      return (
        <AccessDeniedScreen
          user={user}
          pathname={pathname}
          onNavigateHome={() => {
            const defaultRoute = getDefaultRouteForUser(user)
            safeNavigate(defaultRoute, "Navigate to home from access denied")
          }}
        />
      )
    }

    return <>{children}</>
  }

  return <ScreenLoading size="lg" variant="grid" fullScreen backdrop />
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <AuthProvider>
      <AuthGuardLogic>{children}</AuthGuardLogic>
    </AuthProvider>
  )
}

function ErrorScreen({ error, onRetry, onGoToLogin }: { error: string; onRetry: () => void; onGoToLogin: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi xác thực</AlertTitle>
            <AlertDescription className="mt-2">{error}</AlertDescription>
          </Alert>

          <div className="flex gap-2 mt-4">
            <Button onClick={onRetry} variant="outline" className="flex-1 bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
            <Button onClick={onGoToLogin} className="flex-1">
              Đăng nhập
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// function LoadingScreen({ user, pathname, isNavigating }: { user: any; pathname: string; isNavigating: boolean }) {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background">
//       <Card className="w-full max-w-md mx-auto">
//         <CardContent className="p-6">
//           <div className="flex flex-col items-center space-y-4">
//             <LoadingSpinner size="lg" />
//             <div className="text-center space-y-2">
//               <h3 className="font-semibold">{isNavigating ? "Đang chuyển hướng..." : "Đang tải..."}</h3>
//               <p className="text-sm text-muted-foreground">
//                 {isNavigating ? "Vui lòng đợi" : "Đang xác thực người dùng"}
//               </p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

function AccessDeniedScreen({
  user,
  pathname,
  onNavigateHome,
}: {
  user: any
  pathname: string
  onNavigateHome: () => void
}) {
  const userRole = user?.role || "UNKNOWN"
  const allowedRoutes = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || []
  const defaultRoute = getDefaultRouteForUser(user)

  const getUserSpecificRoutes = () => {
    const routes = [...allowedRoutes]

    return routes.filter((route) => route !== "*")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Không có quyền truy cập</AlertTitle>
            <AlertDescription className="mt-2">
              Bạn không có quyền truy cập trang này với vai trò <strong>{userRole}</strong>.
            </AlertDescription>
          </Alert>

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <h3 className="font-medium mb-2">Thông tin tài khoản:</h3>
              <div className="space-y-1 text-sm">
                <div>
                  Tên: {user?.firstName} {user?.lastName}
                </div>
                <div>Mã NV: {user?.employeeCode}</div>
                <div>Vai trò: {userRole}</div>
                <div>Văn phòng: {user?.office?.name || "N/A"}</div>
                {user?.jobPosition?.department && <div>Phòng ban: {user.jobPosition.department.name}</div>}
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-medium mb-2">Đường dẫn được phép:</h3>
              <div className="text-sm text-muted-foreground">
                {getUserSpecificRoutes().length > 0
                  ? getUserSpecificRoutes().join(", ")
                  : "Không có quyền truy cập admin"}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={onNavigateHome} className="flex-1">
                Về trang chủ ({defaultRoute})
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
                Quay lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const getPermissionConfig = (role: string) =>
  ROLE_ROUTES[role as keyof typeof ROLE_ROUTES] || ROLE_ROUTES["USER"]

export const canAccessRoute = (user: any, pathname: string): boolean => {
  return hasAccess(user, pathname)
}

export const getDefaultRouteForRole = (user: any): string => {
  return getDefaultRouteForUser(user)
}
