"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "./auth-provider";

const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/",
];

export function AuthRedirectProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Reset redirect flag when auth state changes
    hasRedirectedRef.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    // Đợi auth loading hoàn thành
    if (isLoading || hasRedirectedRef.current) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (isAuthenticated) {
      // User đã đăng nhập và đang ở trang login/register
      if (pathname === "/login" || pathname === "/register") {
        hasRedirectedRef.current = true;
        const returnUrl = searchParams.get("returnUrl");
        const targetUrl =
          returnUrl && returnUrl !== "/login" ? returnUrl : "/dashboard";

        // Delay redirect để user thấy success message
        setTimeout(() => {
          router.replace(targetUrl);
        }, 1500);
      }
    } else {
      // User chưa đăng nhập và đang ở trang protected
      if (!isPublicRoute) {
        hasRedirectedRef.current = true;
        const loginUrl = `/login?returnUrl=${encodeURIComponent(pathname)}`;
        router.replace(loginUrl);
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  return <>{children}</>;
}
