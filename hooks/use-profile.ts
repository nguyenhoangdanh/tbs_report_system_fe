import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserService } from '@/services/user.service'
import type { UpdateProfileDto } from '@/types'
import { toast } from 'react-hot-toast'

export function useProfile() {
  const queryClient = useQueryClient()

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileDto) => UserService.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update the cached user data
      queryClient.setQueryData(['auth', 'profile'], updatedUser)
      toast.success('Cập nhật thông tin thành công!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Cập nhật thất bại')
    }
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      UserService.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Đổi mật khẩu thất bại')
    }
  })

  return {
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
  }
}
