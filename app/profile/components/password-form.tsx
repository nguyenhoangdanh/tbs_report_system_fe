"use client"
import { memo, useCallback, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validations/profile'

interface PasswordFormProps {
  onSubmit: (data: ChangePasswordFormData) => Promise<void>
  isChangingPassword: boolean
}

export const PasswordForm = memo(({ onSubmit, isChangingPassword }: PasswordFormProps) => {
  const submitSuccessRef = useRef(false)
  
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const handleSubmit = useCallback(async (data: ChangePasswordFormData) => {
    try {
      submitSuccessRef.current = false
      await onSubmit(data)
      submitSuccessRef.current = true
      
      // Only reset if submission was successful
      setTimeout(() => {
        if (submitSuccessRef.current) {
          form.reset()
        }
      }, 100)
    } catch (error) {
      // Don't reset form on error
      console.error('Password form submission error:', error)
    }
  }, [onSubmit, form])

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Controller
        name="currentPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <FormField
            label="Mật khẩu hiện tại"
            type="password"
            placeholder="Nhập mật khẩu hiện tại"
            required
            showPasswordToggle
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="newPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <FormField
            label="Mật khẩu mới"
            type="password"
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            required
            showPasswordToggle
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="confirmPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <FormField
            label="Xác nhận mật khẩu mới"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            required
            showPasswordToggle
            {...field}
            error={fieldState.error?.message}
          />
        )}
      />

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg dark:bg-blue-950/30 dark:border-blue-800">
        <h4 className="font-medium text-sm mb-2 text-blue-800 dark:text-blue-300">Yêu cầu mật khẩu:</h4>
        <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
          <li>• Tối thiểu 6 ký tự</li>
          <li>• Nên kết hợp chữ cái, số và ký tự đặc biệt</li>
          <li>• Không sử dụng thông tin cá nhân dễ đoán</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isChangingPassword || !form.formState.isValid}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </Button>
      </div>
    </form>
  )
})

PasswordForm.displayName = 'PasswordForm'
