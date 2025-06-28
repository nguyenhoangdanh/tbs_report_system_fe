import { Role } from '@/types'
import { z } from 'zod'

export const loginSchema = z.object({
  employeeCode: z.string().min(1, 'Mã nhân viên không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

export const registerSchema = z.object({
  employeeCode: z.string().min(1, 'Mã nhân viên không được để trống'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  firstName: z.string().min(1, 'Họ không được để trống'),
  lastName: z.string().min(1, 'Tên không được để trống'),
  phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 ký tự').max(12, 'Số điện thoại không được quá 12 ký tự').optional(),
  officeId: z.string().min(1, 'Vui lòng chọn văn phòng'),
  departmentId: z.string().min(1, 'Vui lòng chọn phòng ban'),
  jobPositionId: z.string().min(1, 'Vui lòng chọn vị trí công việc'),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Vai trò không hợp lệ' }),
  }),
}).refine(data => data.password === data.confirmPassword, {
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
