"use client";

import { useAuth } from "./auth-provider";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const AUTH_ROUTES = ["/login", "/register"];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Chỉ chạy khi auth loading hoàn thành
    if (!isLoading && !isRedirecting) {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
      const isAuthRoute = AUTH_ROUTES.includes(pathname);

      // Case 1: Đã login nhưng ở auth pages -> redirect đến dashboard
      if (isAuthenticated && isAuthRoute) {
        setIsRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      // Case 2: Chưa login và ở protected route -> redirect đến login
      if (!isAuthenticated && !isPublicRoute) {
        setIsRedirecting(true);
        const loginUrl = `/login?returnUrl=${encodeURIComponent(pathname)}`;
        window.location.href = loginUrl;
        return;
      }
    }
  }, [isAuthenticated, isLoading, pathname, isRedirecting]);

  // Show loading khi đang check auth hoặc redirecting
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isRedirecting
              ? "Đang chuyển hướng..."
              : "Đang kiểm tra quyền truy cập..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
