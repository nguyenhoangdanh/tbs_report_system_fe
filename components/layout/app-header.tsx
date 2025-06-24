'use client'

import { UserNav } from './user-nav'
import Link from 'next/link'
import { Logo } from './logo'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AnimatedButton } from '@/components/ui/animated-button'
import { useAuth } from '@/components/providers/auth-provider'

interface AppHeaderProps {
  title?: string
  subtitle?: string
}

export function AppHeader({ 
  title = "Dashboard", 
  subtitle,
}: AppHeaderProps) {
  const { user } = useAuth()
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Title */}
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center gap-2 group">
              <Logo size={40} />
              <span className="text-xl font-bold text-green-700 group-hover:text-green-800 transition-colors">
                WeeklyReport
              </span>
            </Link>
            {title && (
              <span className="ml-4 text-xl font-semibold text-foreground truncate hidden sm:block">
                {title}
              </span>
            )}
            {subtitle && (
              <span className="ml-2 text-sm text-muted-foreground truncate hidden sm:block">
                {subtitle}
              </span>
            )}
          </div>
          {/* Right side - User Navigation or Auth Buttons */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <ThemeToggle />
            {!user && (
              <>
                <Link href="/login">
                  <button className="text-muted-foreground hover:text-foreground font-medium transition-colors px-4 py-2">
                    Đăng nhập
                  </button>
                </Link>
                <Link href="/register">
                  <AnimatedButton variant="gradient" size="sm" className="px-6 py-2">
                    Đăng ký
                  </AnimatedButton>
                </Link>
              </>
            )}
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  )
}
