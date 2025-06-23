import { useQuery } from '@tanstack/react-query'
import { UserService } from '@/services/user.service'

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: UserService.getDepartments,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: UserService.getPositions,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
