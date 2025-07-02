import { z } from 'zod'
import { UserRole } from '@/types'

export const loginSchema = z.object({
  employeeCode: z.string().min(1, 'Mã nhân viên không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
  rememberMe: z.boolean().optional(),
})

export const registerSchema = z.object({
  employeeCode: z.string().min(1, 'Mã nhân viên là bắt buộc'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Họ là bắt buộc'),
  lastName: z.string().min(1, 'Tên là bắt buộc'),
  phone: z.string().optional().or(z.literal('')),
  officeId: z.string().min(1, 'Văn phòng là bắt buộc'),
  departmentId: z.string().min(1, 'Phòng ban là bắt buộc'),
  jobPositionId: z.string().min(1, 'Vị trí công việc là bắt buộc'),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN', 'USER'] as const)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  employeeCode: z.string().min(1, 'Mã nhân viên không được để trống'),
  phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 ký tự').max(12, 'Số điện thoại không được quá 12 ký tự'),
})

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
