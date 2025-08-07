"use client"
import { memo } from 'react'

type TabType = 'info' | 'password'

interface SidebarNavProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export const SidebarNav = memo(({ activeTab, setActiveTab }: SidebarNavProps) => (
  <nav className="space-y-2">
    <button
      onClick={() => setActiveTab('info')}
      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
        activeTab === 'info'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      👤 Thông tin cá nhân
    </button>
    <button
      onClick={() => setActiveTab('password')}
      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
        activeTab === 'password'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      🔒 Đổi mật khẩu
    </button>
  </nav>
))

SidebarNav.displayName = 'SidebarNav'
