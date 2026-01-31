import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, // 1 minute - shorter to ensure fresher data on navigation
      gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime in v5)
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Always refetch when component mounts
      retry: 1,
      onError: (error) => {
        console.error('Query error:', error)
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error)
      },
    },
  },
})
