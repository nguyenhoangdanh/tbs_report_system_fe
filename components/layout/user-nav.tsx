'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function UserNav() {
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Get role-specific admin links
  const getAdminLinks = () => {
    if (!user) return []

    const links = []
    const userRole = user.role

    // Common admin access for management roles
    if (['SUPERADMIN', 'ADMIN'].includes(userRole)) {
      links.push({
        href: '/admin/hierarchy',
        icon: '📊',
        label: 'Báo cáo KH & KQCV',
        description: 'Xem báo cáo theo cấu trúc tổ chức'
      })
    }

    // Role-specific links
    switch (userRole) {
      case 'SUPERADMIN':
        links.push(
          {
            href: '/admin/users',
            icon: '👥',
            label: 'Quản lý Users',
            description: 'Quản lý tất cả người dùng'
          },
          {
            href: '/admin/hierarchy',
            icon: '🏢',
            label: 'Quản trị hệ thống',
            description: 'Toàn quyền quản trị'
          }
        )

        break
      
      case 'USER':
        if (user.isManager) {
          links.push({
            href: '/admin/overview',
            icon: '📊',
            label: 'Báo cáo KH & KQCV',
            description: 'Xem báo cáo theo cấu trúc tổ chức'
          })
        }
        break

      // case 'ADMIN':
      //   links.push({
      //     href: '/admin/users',
      //     icon: '👥',
      //     label: 'Quản lý Users',
      //     description: 'Quản lý người dùng'
      //   })
      //   break

    }

    return links
  }

  if (!user) return null

  const userInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
  const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  const adminLinks = getAdminLinks()

  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        {/* User Menu Trigger */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 sm:space-x-3 p-1 sm:p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs sm:text-sm font-medium">
              {userInitials}
            </span>
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-medium text-foreground">
              {userFullName || user.employeeCode}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.jobPosition?.position?.description || user.role}
            </p>
          </div>
          <svg
            className={`w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[calc(100vh-120px)] overflow-y-auto"
            >

              {  /* User Info */}
              <div className="flex items-center p-3 border-b border-border">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm sm:text-base font-medium">
                    {userInitials}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">
                    {userFullName || user.employeeCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.jobPosition?.position?.description || user.role}
                  </p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {/* Personal Links */}
                <div className="mb-2">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 w-full p-2 sm:p-3 text-left rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span className="text-base sm:text-lg">👤</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">Thông tin cá nhân</div>
                      <div className="text-xs text-muted-foreground truncate">Cập nhật hồ sơ</div>
                    </div>
                  </Link>
                  {user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && (
                    <div>
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 w-full p-2 sm:p-3 text-left rounded-md hover:bg-accent transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="text-base sm:text-lg">🏠</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">Dashboard</div>
                          <div className="text-xs text-muted-foreground truncate">Trang chủ cá nhân</div>
                        </div>
                      </Link>

                      <Link
                        href="/reports"
                        className="flex items-center space-x-3 w-full p-2 sm:p-3 text-left rounded-md hover:bg-accent transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="text-base sm:text-lg">📝</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">Báo cáo của tôi</div>
                          <div className="text-xs text-muted-foreground truncate">Quản lý báo cáo cá nhân</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Admin Links */}
                {adminLinks.length > 0 && (
                  <>
                    <div className="border-t border-border my-2" />
                    <div className="px-2 py-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Quản trị
                      </div>
                    </div>
                    {adminLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center space-x-3 w-full p-2 sm:p-3 text-left rounded-md hover:bg-accent transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="text-base sm:text-lg">{link.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{link.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{link.description}</div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>

              {/* Logout */}
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center space-x-3 w-full p-2 sm:p-3 text-left rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <span className="text-base sm:text-lg">🚪</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">Đăng xuất</div>
                    <div className="text-xs text-red-500 truncate">Thoát khỏi hệ thống</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
