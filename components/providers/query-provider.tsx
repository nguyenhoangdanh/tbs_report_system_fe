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
            staleTime: 2 * 60 * 1000, // 2 minutes - giảm từ 5 phút để data fresh hơn
            gcTime: 5 * 60 * 1000, // 5 minutes - giảm từ 10 phút để tiết kiệm memory
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true, // Enable lại để đảm bảo data fresh khi mount
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Giảm retry xuống 0 cho production để response nhanh hơn
              return process.env.NODE_ENV === 'development' ? failureCount < 1 : false
            },
            networkMode: 'online',
            structuralSharing: true,
            // Thêm timeout cho queries
            meta: {
              timeout: 8000, // 8 giây thay vì 10 giây
            },
          },
          mutations: {
            retry: process.env.NODE_ENV === 'development' ? 1 : 0, // Không retry mutation trong production
            networkMode: 'online',
            // Timeout cho mutations ngắn hơn
            meta: {
              timeout: 5000, // 5 giây cho mutations
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
