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

export function AppHeader({ title = "Dashboard", subtitle }: AppHeaderProps) {
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo + Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link href={getHomeLink()} className="flex-shrink-0 flex items-center gap-1 sm:gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Image
                  src="/images/logo.png"
                  alt="TBS Group Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 sm:w-12 sm:h-12 object-contain drop-shadow-lg"
                />
              </motion.div>
              <motion.span
                className="text-lg sm:text-xl font-bold text-green-gradient hidden xs:block"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                WeeklyReport
              </motion.span>
            </Link>

            {title && (
              <motion.div
                className="ml-2 sm:ml-4 min-w-0 hidden sm:block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
              </motion.div>
            )}
          </div>

          {/* Right side - User Navigation or Auth Buttons */}
          <motion.div
            className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ThemeToggle />
            {!user && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button asChild className="bg-green-gradient hover:shadow-green-glow transition-all duration-300">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
              </motion.div>
            )}
            <UserNav />
          </motion.div>
        </div>

        {/* Mobile Title */}
        {title && (
          <motion.div
            className="mt-2 sm:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
