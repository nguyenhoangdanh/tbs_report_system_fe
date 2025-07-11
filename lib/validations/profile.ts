import { z } from 'zod'

export const updateProfileSchema = z.object({
  employeeCode: z
    .string()
    .min(1, 'Mã nhân viên là bắt buộc')
    .min(3, 'Mã nhân viên phải có ít nhất 3 ký tự')
    .max(20, 'Mã nhân viên không được quá 20 ký tự')
    .regex(/^[A-Z0-9]+$/, 'Mã nhân viên chỉ được chứa chữ cái viết hoa và số'),
  firstName: z
    .string()
    .min(1, 'Họ là bắt buộc')
    .min(2, 'Họ phải có ít nhất 2 ký tự')
    .max(50, 'Họ không được quá 50 ký tự'),
  lastName: z
    .string()
    .min(1, 'Tên là bắt buộc')
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên không được quá 50 ký tự'),
  email: z
    .string()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'Số điện thoại phải có đúng 10 chữ số')
    .or(z.literal('')),
  jobPositionId: z
    .string()
    .min(1, 'Vị trí công việc là bắt buộc'),
  officeId: z
    .string()
    .min(1, 'Văn phòng là bắt buộc'),
  role: z
    .enum(['USER', 'ADMIN', 'SUPERADMIN'])
    .optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z
    .string()
    .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
    .max(50, 'Mật khẩu không được quá 50 ký tự'),
  confirmPassword: z
    .string()
    .min(1, 'Xác nhận mật khẩu là bắt buộc'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
