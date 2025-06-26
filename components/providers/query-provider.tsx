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
            staleTime: process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 2 * 60 * 1000, // 5 min in prod
            gcTime: process.env.NODE_ENV === 'production' ? 10 * 60 * 1000 : 5 * 60 * 1000, // 10 min in prod
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: 'always', // Always refetch on mount for fresh data
            retry: (failureCount, error: any) => {
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // More retries in production for reliability
              return process.env.NODE_ENV === 'development' ? failureCount < 1 : failureCount < 2
            },
            networkMode: 'online',
            structuralSharing: true,
            meta: {
              timeout: 10000, // 10 seconds for production reliability
            },
          },
          mutations: {
            retry: process.env.NODE_ENV === 'development' ? 1 : 2, // More retries in production
            networkMode: 'online',
            meta: {
              timeout: 8000, // 8 seconds for mutations
            },
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
