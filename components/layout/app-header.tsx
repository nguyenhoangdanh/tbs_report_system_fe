"use client"

import { UserNav } from "./user-nav"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { toast } from "react-toast-kit"
import { HelpCircle, Menu } from "lucide-react"
import { useState, memo } from "react"
import dynamic from "next/dynamic"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Dynamic import PDF viewer with better error handling
const PDFViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => <div>Loading...</div>
})

export const AppHeader = memo(function AppHeader() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [showGuideDialog, setShowGuideDialog] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  const handleDownloadGuide = () => {
    try {
      setShowGuideDialog(true)
      toast.success('Đang mở hướng dẫn sử dụng...')
    } catch (error) {
      console.error('Error opening guide:', error)
      toast.error('Không thể mở hướng dẫn')
      // Fallback to direct download
      try {
        const link = document.createElement('a')
        link.href = '/huong_dan.pdf'
        link.download = 'huong_dan.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (downloadError) {
        console.error('Fallback download failed:', downloadError)
      }
    }
  }

  // Get navigation links based on user role
  const getNavigationLinks = () => {
    if (!user) return []

    const links = []
    const userRole = user.role

    // Admin links
    if (['SUPERADMIN', 'ADMIN'].includes(userRole) || (userRole === 'USER' && user.isManager)) {
      links.push({
        href: userRole === 'USER' ? '/admin/overview' : '/admin/hierarchy',
        label: 'Báo cáo KH & KQCV',
        shortLabel: 'Báo cáo',
        icon: '📊'
      })
    }

    if (userRole === 'SUPERADMIN') {
      links.push({
        href: '/admin/users',
        label: 'Quản lý Users',
        shortLabel: 'Users',
        icon: '👥'
      })
    }

    if (userRole === 'USER') {
      links.push({
        href: '/dashboard',
        label: 'Trang chủ cá nhân',
        shortLabel: 'Dashboard',
        icon: '🏠'
      })

      links.push({
        href: '/reports',
        label: 'Báo cáo của tôi',
        shortLabel: 'Reports',
        icon: '📝'
      })
    }

    // Common links for all users
    links.push({
      href: '/profile',
      label: 'Thông tin cá nhân',
      shortLabel: 'Profile',
      icon: '👤'
    })

    return links
  }

  const navigationLinks = getNavigationLinks()

  return (
    <>
      <motion.header
        className="sticky top-0 z-[100] glass-green backdrop-blur-xl border-b border-green-500/20 shadow-green-glow"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Left side: Logo + Brand */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href={getHomeLink()}
                className="flex items-center gap-2 group"
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
            </div>

            {/* Center: Desktop Navigation - Only show on larger screens */}
            {user && (
              <motion.nav
                className="hidden xl:flex items-center space-x-1 flex-1 justify-center max-w-2xl mx-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {navigationLinks.slice(0, 4).map((link, index) => {
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
                          relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 group whitespace-nowrap
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

                        {/* Label - responsive text */}
                        <span className="relative z-10 group-hover:translate-x-0.5 transition-transform duration-200">
                          <span className="hidden 2xl:inline">{link.label}</span>
                          <span className="2xl:hidden">{link.shortLabel || link.label}</span>
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

            {/* Right side controls */}
            <motion.div
              className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Mobile Menu Button - Show on smaller screens */}
              {/* {user && navigationLinks.length > 0 && (
                <div className="xl:hidden">
                  <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-full hover:bg-green-500/10 hover:text-green-600"
                      >
                        <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-56 mt-3"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      {navigationLinks.map((link, index) => {
                        const isActive = pathname === link.href ||
                          (link.href === '/admin/hierarchy' && pathname.startsWith('/admin/hierarchy')) ||
                          (link.href === '/admin/overview' && pathname.startsWith('/admin/overview')) ||
                          (link.href === '/reports' && pathname.startsWith('/reports'))

                        return (
                          <DropdownMenuItem key={link.href} asChild>
                            <Link
                              href={link.href}
                              className={`flex items-center space-x-3 w-full ${
                                isActive ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300' : ''
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <span>{link.icon}</span>
                              <span>{link.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )} */}

              {/* Help/Guide button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={handleDownloadGuide}
                  variant="ghost"
                  size="sm"
                  className="relative w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-full hover:bg-green-500/10 hover:text-green-600 transition-all duration-200 group"
                  title="Xem hướng dẫn sử dụng"
                >
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />

                  {/* Pulse effect on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-green-500/20"
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  />
                </Button>
              </motion.div>

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

      {/* PDF Viewer Dialog */}
      <PDFViewer 
        isOpen={showGuideDialog} 
        onClose={() => setShowGuideDialog(false)} 
      />
    </>
  )
})
