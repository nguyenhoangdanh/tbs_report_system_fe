"use client";

import { UserNav } from "./user-nav";
import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useAuth } from "@/components/providers/auth-provider";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({
  title = "Dashboard",
  subtitle,
}: AppHeaderProps) {
  const { user } = useAuth();

  // Get role-appropriate home link
  const getHomeLink = () => {
    if (!user) return "/dashboard";

    const userRole = user.role;

    switch (userRole) {
      case "SUPERADMIN":
      case "ADMIN":
        return "/admin/hierarchy";
      case "OFFICE_MANAGER":
        const officeId = user.office?.id || user.officeId;
        return officeId ? `/admin/hierarchy/office/${officeId}` : "/dashboard";
      case "OFFICE_ADMIN":
        const departmentId =
          user.jobPosition?.department?.id ||
          user.jobPosition?.departmentId;
        return departmentId
          ? `/admin/hierarchy/department/${departmentId}`
          : "/dashboard";
      default:
        return "/dashboard";
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo + Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link
              href={getHomeLink()}
              className="flex-shrink-0 flex items-center gap-1 sm:gap-2 group"
            >
              <Logo size={32} className="sm:w-10 sm:h-10" />
              <span className="text-lg sm:text-xl font-bold text-green-700 group-hover:text-green-800 transition-colors hidden xs:block">
                WeeklyReport
              </span>
            </Link>
            {title && (
              <div className="ml-2 sm:ml-4 min-w-0 hidden sm:block">
                <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right side - User Navigation or Auth Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <ThemeToggle />
            {!user && (
              <>
                <Link href="/login">
                  <AnimatedButton
                    variant="gradient"
                    size="sm"
                    className="px-3 sm:px-6 py-2 text-sm"
                  >
                    Đăng nhập
                  </AnimatedButton>
                </Link>
                {/* <Link href="/register">
                  <AnimatedButton
                    variant="gradient"
                    size="sm"
                    className="px-3 sm:px-6 py-2 text-sm"
                  >
                    Đăng ký
                  </AnimatedButton>
                </Link> */}
              </>
            )}
            <UserNav />
          </div>
        </div>

        {/* Mobile Title */}
        {title && (
          <div className="mt-2 sm:hidden">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
