'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Đơn giản hóa caching cho production
            staleTime: 2 * 60 * 1000, // 2 minutes
            gcTime: 5 * 60 * 1000, // 5 minutes  
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            
            // Đơn giản hóa retry strategy
            retry: (failureCount, error: any) => {
              if (error?.status >= 400 && error?.status < 500) return false
              return failureCount < 1
            },
            
            retryDelay: 1000,
            networkMode: 'online',
          },
          mutations: {
            retry: false,
            networkMode: 'online',
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  )
}
