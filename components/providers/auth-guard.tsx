"use client";

import { AuthProvider, useAuth } from "./auth-provider";
import { useEffect, useState, useCallback, useRef } from "react";
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
    "/admin/hierarchy/office",
    "/dashboard",
    "/reports",
    "/profile",
  ],
  OFFICE_ADMIN: [
    "/admin/hierarchy",
    "/admin/hierarchy/department",
    "/dashboard",
    "/reports", 
    "/profile",
  ],
  USER: ["/dashboard", "/reports", "/profile"],
};

// Function to get default route based on user role and profile data
const getDefaultRouteForUser = (user: any): string => {
  if (!user) return "/dashboard";

  const userRole = user.role as string;

  switch (userRole) {
    case "SUPERADMIN":
    case "ADMIN":
      return "/admin/hierarchy";

    // case "OFFICE_MANAGER":
    //   const officeId = user.office?.id || user.officeId;
    //   return officeId
    //     ? `/admin/hierarchy/office/${officeId}`
    //     : "/admin/hierarchy";

    // case "OFFICE_ADMIN":
    //   const departmentId =
    //     user.jobPosition?.department?.id ||
    //     user.jobPosition?.departmentId;
    //   return departmentId
    //     ? `/admin/hierarchy/department/${departmentId}`
    //     : "/dashboard";

    case "USER":
    default:
      return "/dashboard";
  }
};

// Check if user has access to current route
const hasAccess = (user: any, path: string): boolean => {
  if (!user) return false;

  const userRole = user.role as string;
  const allowedRoutes = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || [];

  // Superadmin has access to everything
  if (allowedRoutes.includes("*")) return true;

  // Check exact match first
  if (allowedRoutes.includes(path)) return true;

  // Check role-specific dynamic routes
  if (userRole === "OFFICE_MANAGER") {
    const officeId = user.office?.id || user.officeId;
    if (officeId && path.startsWith(`/admin/hierarchy/office/${officeId}`)) {
      return true;
    }
  }

  if (userRole === "OFFICE_ADMIN") {
    const departmentId =
      user.jobPosition?.department?.id || user.jobPosition?.departmentId;
    if (departmentId && path.startsWith(`/admin/hierarchy/department/${departmentId}`)) {
      return true;
    }
  }

  // Check if user has access to this specific path or parent path
  return allowedRoutes.some((route) => {
    return path === route || path.startsWith(route + "/");
  });
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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Safe navigation function with debouncing
  const safeNavigate = useCallback((path: string, reason: string) => {
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);

    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Use replace for auth redirects to prevent back button issues
    router.replace(path);

    // Reset navigation state after delay
    navigationTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
    }, 1500);
  }, [router, isNavigating]);

  // Handle initial load completion
  useEffect(() => {
    if (!isLoading && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [isLoading, initialLoadComplete]);

  // Main navigation logic
  useEffect(() => {
    // Don't do anything during initial load or if already navigating
    if (isLoading || !initialLoadComplete || isNavigating) {
      return;
    }


    // Case 1: Unauthenticated user trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      const returnUrl = encodeURIComponent(pathname);
      safeNavigate(`/login?returnUrl=${returnUrl}`, 'Unauthenticated access to protected route');
      return;
    }

    // Case 2: Authenticated user trying to access auth pages
    if (isAuthenticated && user && (pathname === "/login" || pathname === "/register")) {
      const defaultRoute = getDefaultRouteForUser(user);
      safeNavigate(defaultRoute, 'Authenticated user on auth page');
      return;
    }

    // Case 3: Authenticated user on root path - redirect to default
    if (isAuthenticated && user && pathname === "/") {
      const defaultRoute = getDefaultRouteForUser(user);
      safeNavigate(defaultRoute, 'Authenticated user on root path');
      return;
    }

    // Case 4: Authenticated user - check permissions for protected routes
    if (isAuthenticated && user && !isPublicRoute) {
      const hasRouteAccess = hasAccess(user, pathname);
      
      if (!hasRouteAccess) {
        // Don't redirect, show access denied screen
        return;
      }
    }

  }, [
    isLoading, 
    initialLoadComplete, 
    isAuthenticated, 
    pathname, 
    user, 
    isPublicRoute, 
    isNavigating,
    safeNavigate
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Show loading screen during initial load or navigation
  if (isLoading || !initialLoadComplete || isNavigating) {
    return <LoadingScreen user={user} pathname={pathname} isNavigating={isNavigating} />;
  }

  // Unauthenticated user on public route - allow access
  if (!isAuthenticated && isPublicRoute) {
    return <>{children}</>;
  }

  // Unauthenticated user on protected route - show loading while redirecting
  if (!isAuthenticated && !isPublicRoute) {
    return <LoadingScreen user={user} pathname={pathname} isNavigating={true} />;
  }

  // Authenticated user - check permissions
  if (isAuthenticated && user) {
    // Public routes - allow access
    if (isPublicRoute) {
      return <>{children}</>;
    }

    // Protected routes - check permissions
    if (!hasAccess(user, pathname)) {
      return (
        <AccessDeniedScreen
          user={user}
          pathname={pathname}
          onNavigateHome={() => {
            const defaultRoute = getDefaultRouteForUser(user);
            safeNavigate(defaultRoute, 'Navigate to home from access denied');
          }}
        />
      );
    }

    // Has access - render children
    return <>{children}</>;
  }

  // Fallback loading screen
  return <LoadingScreen user={user} pathname={pathname} isNavigating={false} />;
}

// Main component that provides auth context
export function AuthGuard({ children }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <AuthProvider>
      <AuthGuardLogic>{children}</AuthGuardLogic>
    </AuthProvider>
  );
}

// Enhanced loading screen
function LoadingScreen({
  user,
  pathname,
  isNavigating,
}: {
  user: any;
  pathname: string;
  isNavigating: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold">
                {isNavigating ? 'Đang chuyển hướng...' : 'Đang tải...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isNavigating ? 'Vui lòng đợi' : 'Đang xác thực người dùng'}
              </p>
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
                  {isNavigating ? 'Đang chuyển từ: ' : 'Đang truy cập: '}{pathname}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Access Denied screen component
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
  const defaultRoute = getDefaultRouteForUser(user);

  // Generate dynamic routes based on user data
  const getUserSpecificRoutes = () => {
    const routes = [...allowedRoutes];

    if (userRole === "OFFICE_MANAGER") {
      const officeId = user.office?.id || user.officeId;
      if (officeId) {
        routes.push(`/admin/hierarchy/office/${officeId}`);
      }
    }

    if (userRole === "OFFICE_ADMIN") {
      const departmentId =
        user.jobPosition?.department?.id || user.jobPosition?.departmentId;
      if (departmentId) {
        routes.push(`/admin/hierarchy/department/${departmentId}`);
      }
    }

    return routes.filter((route) => route !== "*");
  };

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
                {user?.jobPosition?.department && (
                  <div>Phòng ban: {user.jobPosition.department.name}</div>
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Đường dẫn được phép:</h3>
              <div className="text-sm text-muted-foreground">
                {getUserSpecificRoutes().length > 0
                  ? getUserSpecificRoutes().join(", ")
                  : "Không có quyền truy cập admin"}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={onNavigateHome} className="flex-1">
                Về trang chủ ({defaultRoute})
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

export const canAccessRoute = (user: any, pathname: string): boolean => {
  return hasAccess(user, pathname);
};

export const getDefaultRouteForRole = (user: any): string => {
  return getDefaultRouteForUser(user);
};
