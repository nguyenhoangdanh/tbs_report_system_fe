"use client"

import { UserNav } from "./user-nav"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { motion } from "framer-motion"

interface AppHeaderProps {
  title?: string
  subtitle?: string
}

export function AppHeader({ title = "Weekly Report", subtitle }: AppHeaderProps) {
  const { user } = useAuth()

  const getHomeLink = () => {
    if (!user) return "/dashboard"
    const userRole = user.role
    switch (userRole) {
      case "SUPERADMIN":
      case "ADMIN":
        return "/admin/hierarchy"
      default:
        return "/dashboard"
    }
  }

  return (
    <motion.header
      className="sticky top-0 z-[100] glass-green backdrop-blur-xl border-b border-green-500/20 shadow-green-glow"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Brand Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link 
              href={getHomeLink()} 
              className="flex items-center gap-2 group min-w-0"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="flex-shrink-0"
              >
                <Image
                  src="/images/logo.png"
                  alt="TBS Group Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain drop-shadow-lg"
                />
              </motion.div>
              
              {/* Brand name - always visible but responsive */}
              <motion.div
                className="flex flex-col min-w-0"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span className="text-sm sm:text-lg font-bold text-green-gradient truncate">
                  WeeklyReport
                </span>
                {/* Page title on mobile - smaller and under brand */}
                {title && title !== "Weekly Report" && (
                  <span className="text-xs text-muted-foreground truncate sm:hidden">
                    {title}
                  </span>
                )}
              </motion.div>
            </Link>

            {/* Page title on desktop */}
            {title && title !== "Weekly Report" && (
              <motion.div
                className="ml-2 sm:ml-4 min-w-0 hidden sm:block flex-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {subtitle}
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Right side controls */}
          <motion.div
            className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Theme toggle - smaller on mobile */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            
            {/* Login button for guests */}
            {!user && (
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  asChild 
                  size="sm"
                  className="bg-green-gradient hover:shadow-green-glow transition-all duration-300 text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Link href="/login">
                    <span className="hidden sm:inline">Đăng nhập</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                </Button>
              </motion.div>
            )}
            
            {/* User navigation */}
            <UserNav />
          </motion.div>
        </div>

        {/* Desktop subtitle */}
        {subtitle && (
          <motion.div
            className="mt-1 hidden sm:block"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
