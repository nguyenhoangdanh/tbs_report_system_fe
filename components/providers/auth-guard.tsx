"use client";

import { AuthProvider, useAuth } from "./auth-provider";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Shield, User, Building } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// Role-based route permissions
const ROLE_ROUTES = {
  SUPERADMIN: ["*"], // Access to everything
  ADMIN: [
    "/admin",
    "/admin/hierarchy",
    "/admin/users",
    "/admin/reports",
    "/admin/statistics",
    "/dashboard",
    "/reports",
    "/profile",
  ],
  OFFICE_MANAGER: [
    "/admin/hierarchy",
    "/admin/reports",
    "/dashboard",
    "/reports",
    "/profile",
  ],
  OFFICE_ADMIN: [
    "/admin/hierarchy",
    "/dashboard",
    "/reports",
    "/profile",
  ],
  USER: ["/dashboard", "/reports", "/profile"],
};

// Default routes for each role
const DEFAULT_ROUTES = {
  SUPERADMIN: "/admin/hierarchy",
  ADMIN: "/admin/hierarchy",
  OFFICE_MANAGER: "/admin/hierarchy",
  OFFICE_ADMIN: "/dashboard",
  USER: "/dashboard",
};

interface AuthGuardProps {
  children: React.ReactNode;
}

// Internal component that uses auth context
function AuthGuardLogic({ children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Check if user has access to current route
  const hasAccess = (userRole: string, path: string): boolean => {
    if (isPublicRoute) return true;

    const allowedRoutes = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || [];

    // Superadmin has access to everything
    if (allowedRoutes.includes("*")) return true;

    // Check if user has access to this specific path or parent path
    return allowedRoutes.some((route) => {
      return path === route || path.startsWith(route + "/");
    });
  };

  const navigateToDefault = () => {
    if (isNavigating) return;
    setIsNavigating(true);

    const userRole = user?.role;
    const defaultRoute =
      userRole && DEFAULT_ROUTES[userRole as keyof typeof DEFAULT_ROUTES]
        ? DEFAULT_ROUTES[userRole as keyof typeof DEFAULT_ROUTES]
        : "/dashboard";

    router.replace(defaultRoute);

    // Reset navigation state after a delay
    setTimeout(() => setIsNavigating(false), 1000);
  };

  useEffect(() => {
    if (isLoading || isNavigating) return;

    // Case 1: Unauthenticated user trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // Case 2: Authenticated user trying to access auth pages
    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      navigateToDefault();
      return;
    }

    // Case 3: Authenticated user - check permissions
    if (isAuthenticated && user && !isPublicRoute) {
      if (!hasAccess(user.role, pathname)) {
        // Don't redirect immediately, show access denied screen
        return;
      }
    }
  }, [isLoading, isAuthenticated, pathname, user, router, isNavigating]);

  // Show loading screen
  if (isLoading || isNavigating) {
    return <LoadingScreen user={user} pathname={pathname} />;
  }

  // Unauthenticated user on public route - allow access
  if (!isAuthenticated && isPublicRoute) {
    return <>{children}</>;
  }

  // Unauthenticated user on protected route - will be redirected by useEffect
  if (!isAuthenticated && !isPublicRoute) {
    return <LoadingScreen user={user} pathname={pathname} />;
  }

  // Authenticated user - check permissions
  if (isAuthenticated && user) {
    // Public routes - allow access
    if (isPublicRoute) {
      return <>{children}</>;
    }

    // Protected routes - check permissions
    if (!hasAccess(user.role, pathname)) {
      return (
        <AccessDeniedScreen
          user={user}
          pathname={pathname}
          onNavigateHome={navigateToDefault}
        />
      );
    }

    // Has access - render children
    return <>{children}</>;
  }

  // Fallback loading screen
  return <LoadingScreen user={user} pathname={pathname} />;
}

// Main component that provides auth context
export function AuthGuard({ children }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AuthProvider>
      <AuthGuardLogic>{children}</AuthGuardLogic>
    </AuthProvider>
  );
}

// Helper components remain the same...
function LoadingScreen({
  user,
  pathname,
}: {
  user: any;
  pathname: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
            <div className="text-center space-y-2">
              <Skeleton className="h-4 w-48 mx-auto" />
              <Skeleton className="h-3 w-32 mx-auto" />
            </div>
            {user && (
              <div className="w-full space-y-2 mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Người dùng:</span>
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Vai trò:</span>
                  <span>{user.role}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">Văn phòng:</span>
                  <span>{user.office?.name || "N/A"}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Đang truy cập: {pathname}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessDeniedScreen({
  user,
  pathname,
  onNavigateHome,
}: {
  user: any;
  pathname: string;
  onNavigateHome: () => void;
}) {
  const userRole = user?.role || "UNKNOWN";
  const allowedRoutes = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || [];
  const defaultRoute =
    DEFAULT_ROUTES[userRole as keyof typeof DEFAULT_ROUTES] || "/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Không có quyền truy cập</AlertTitle>
            <AlertDescription className="mt-2">
              Bạn không có quyền truy cập trang này với vai trò{" "}
              <strong>{userRole}</strong>.
            </AlertDescription>
          </Alert>

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Thông tin tài khoản:</h3>
              <div className="space-y-1 text-sm">
                <div>
                  Tên: {user?.firstName} {user?.lastName}
                </div>
                <div>Mã NV: {user?.employeeCode}</div>
                <div>Vai trò: {userRole}</div>
                <div>Văn phòng: {user?.office?.name || "N/A"}</div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Đường dẫn được phép:</h3>
              <div className="text-sm text-muted-foreground">
                {allowedRoutes.includes("*")
                  ? "Tất cả các trang"
                  : allowedRoutes.length > 0
                  ? allowedRoutes.join(", ")
                  : "Không có quyền truy cập admin"}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={onNavigateHome} className="flex-1">
                Về trang chủ
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Quay lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export utility functions
export const getPermissionConfig = (role: string) =>
  ROLE_ROUTES[role as keyof typeof ROLE_ROUTES] || ROLE_ROUTES["USER"];
export const canAccessRoute = (role: string, pathname: string): boolean => {
  const routes = getPermissionConfig(role);
  if (routes.includes("*")) return true;
  return routes.some((route) => pathname === route || pathname.startsWith(route + "/"));
};
export const getDefaultRouteForRole = (role: string): string => {
  return DEFAULT_ROUTES[role as keyof typeof DEFAULT_ROUTES] || "/dashboard";
};
