"use client"

import { UserNav } from "./user-nav"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { link } from "fs"

export function AppHeader() {
  const { user } = useAuth()
  const pathname = usePathname()

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

  // Get navigation links based on user role
  const getNavigationLinks = () => {
    if (!user) return []

    const links = []
    const userRole = user.role

    // Role-specific links
    if (userRole === 'USER' && !user.isManager) {
      links.push(
        {
          href: '/dashboard',
          label: 'Dashboard',
          icon: '🏠'
        },
        {
          href: '/reports',
          label: 'Báo cáo của tôi',
          icon: '📝'
        }
      )
    }

    // Admin links
    if (['SUPERADMIN', 'ADMIN'].includes(userRole) || (userRole === 'USER' && user.isManager)) {
      links.push({
        href: userRole === 'USER' ? '/admin/overview' : '/admin/hierarchy',
        label: 'Báo cáo KH & KQCV',
        icon: '📊'
      })
    }

    if (userRole === 'SUPERADMIN') {
      links.push({
        href: '/admin/users',
        label: 'Quản lý Users',
        icon: '👥'
      })
    }

    links.push({
      href: '/dashboard',
      label: 'Trang chủ cá nhân',
      icon: '🏠'
    })

    links.push({
      href: '/reports',
      label: 'Báo cáo của tôi',
      icon: '📝'
    })

    // Common links for all users
    links.push({
      href: '/profile',
      label: 'Thông tin cá nhân',
      icon: '👤'
    })

    return links
  }

  const navigationLinks = getNavigationLinks()

  return (
    <motion.header
      className="sticky top-0 z-[100] glass-green backdrop-blur-xl border-b border-green-500/20 shadow-green-glow"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Left side: Logo + Brand + Navigation */}
          <div className="flex items-center gap-4 lg:gap-6 flex-1">
            {/* Logo + Brand Name */}
            <Link 
              href={getHomeLink()} 
              className="flex items-center gap-2 group flex-shrink-0"
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
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span className="text-sm sm:text-lg font-bold text-green-gradient whitespace-nowrap">
                  WeeklyReport
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation Menu - Next to Logo */}
            {user && (
              <motion.nav
                className="hidden lg:flex items-center space-x-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {navigationLinks.map((link, index) => {
                  const isActive = pathname === link.href || 
                    (link.href === '/admin/hierarchy' && pathname.startsWith('/admin/hierarchy')) ||
                    (link.href === '/admin/overview' && pathname.startsWith('/admin/overview')) ||
                    (link.href === '/reports' && pathname.startsWith('/reports'))
                  
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        className={`
                          relative flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group whitespace-nowrap
                          ${isActive 
                            ? 'bg-green-500/15 text-green-700 dark:text-green-300 shadow-lg ring-1 ring-green-500/20' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-green-50 dark:hover:bg-green-950/20'
                          }
                        `}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg"
                            layoutId="activeTab"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        
                        {/* Icon with hover effect */}
                        <motion.span 
                          className={`text-base relative z-10 ${isActive ? 'scale-110' : ''}`}
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          {link.icon}
                        </motion.span>
                        
                        {/* Label */}
                        <span className="relative z-10 group-hover:translate-x-0.5 transition-transform duration-200">
                          {link.label}
                        </span>

                        {/* Active bottom border */}
                        {isActive && (
                          <motion.div
                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-green-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: 32 }}
                            transition={{ delay: 0.1 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.nav>
            )}
          </div>

          {/* Right side controls */}
          <motion.div
            className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Theme toggle */}
              <ThemeToggle />
            
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
      </div>
    </motion.header>
  )
}
