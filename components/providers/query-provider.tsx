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
            // Aggressive caching cho production
            staleTime: process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 2 * 60 * 1000,
            gcTime: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            
            // Đơn giản hóa retry strategy
            retry: (failureCount, error: any) => {
              // Không retry với 4xx errors
              if (error?.status >= 400 && error?.status < 500) return false
              // Chỉ retry tối đa 2 lần
              return failureCount < 2
            },
            
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
            networkMode: 'online',
          },
          mutations: {
            retry: (failureCount, error: any) => {
              if (error?.status >= 400 && error?.status < 500) return false
              return failureCount < 1
            },
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
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
