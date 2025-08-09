import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthGuard } from '@/components/providers/auth-guard'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import './globals.css'
import { ClientToastProvider } from '@/components/providers/client-toast-provider'
import { DeviceInitializer } from '@/components/providers/device-initializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Weekly Work Report System',
  description: 'Hệ thống báo cáo công việc hàng tuần',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Weekly Report'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* iOS-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Weekly Report" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#16a34a" />
        
        {/* Prevent iOS zoom on form focus */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        {/* Disable automatic telephone number detection */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ClientToastProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <DeviceInitializer />
              <AuthGuard>
                <div className="min-h-screen bg-background flex flex-col">
                  <AppHeader />
                  <main className="flex-1">
                    {children}
                  </main>
                  <AppFooter />
                </div>
              </AuthGuard>
            </QueryProvider>
          </ThemeProvider>
        </ClientToastProvider>
      </body>
    </html>
  )
}
