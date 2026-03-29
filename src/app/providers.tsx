'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { DepartmentProvider } from '@/components/department/DepartmentProvider'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,           // 30s — data considered fresh
            gcTime: 5 * 60 * 1000,          // 5min — garbage collect
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
        },
      })
  )

  return (
    <ThemeProvider>
      <SessionProvider>
        <DepartmentProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </DepartmentProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
