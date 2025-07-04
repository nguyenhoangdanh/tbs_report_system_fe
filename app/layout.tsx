import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthGuard } from '@/components/providers/auth-guard'
import './globals.css'
import { ClientToastProvider } from '@/components/providers/client-toast-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Weekly Work Report System',
  description: 'Hệ thống báo cáo công việc hàng tuần',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* <link rel="icon" href="/favicon.ico" /> */}
        {/* <link rel="icon" href="/icon?<generated>" type="image/png" sizes="32x32" /> */}
      </head>
      <body className={inter.className}>
        <ClientToastProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
            </QueryProvider>
          </ThemeProvider>
        </ClientToastProvider>
      </body>
    </html>
  )
}
