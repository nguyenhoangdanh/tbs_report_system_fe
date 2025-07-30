declare global {
  interface Window {
    adminOverviewRefetch?: () => void
    queryClient?: any
  }
}

export {}
