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

  if (!user) return null

  const userInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
  const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  console.log('UserNav rendered for:', user)

  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        {/* User Menu Trigger */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {userInitials}
            </span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-foreground">
              {userFullName || user.employeeCode}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.jobPosition.position.description || 'Chưa xác định'}
            </p>
          </div>
          <svg 
            className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
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
              className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50"
            >
              {/* User Info Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {userInitials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {userFullName || 'Người dùng'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.employeeCode || user.phone}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                      user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {user.jobPosition.position.description || 'Chưa xác định'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 w-full p-2 text-left rounded-md hover:bg-accent transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="text-lg">👤</span>
                  <span className="text-sm font-medium">Thông tin cá nhân</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 w-full p-2 text-left rounded-md hover:bg-accent transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="text-lg">📊</span>
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>

                <Link
                  href="/reports"
                  className="flex items-center space-x-3 w-full p-2 text-left rounded-md hover:bg-accent transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="text-lg">📝</span>
                  <span className="text-sm font-medium">Báo cáo của tôi</span>
                </Link>

                {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-3 w-full p-2 text-left rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span className="text-lg">⚙️</span>
                    <span className="text-sm font-medium">Quản trị</span>
                  </Link>
                )}

                {user.role === 'SUPERADMIN' && (
                  <Link
                    href="/admin/users"
                    className="flex items-center space-x-3 w-full p-2 text-left rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span className="text-lg">👥</span>
                    <span className="text-sm font-medium">Quản lý Users</span>
                  </Link>
                )}
              </div>

              {/* Logout */}
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center space-x-3 w-full p-2 text-left rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <span className="text-lg">🚪</span>
                  <span className="text-sm font-medium">Đăng xuất</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
