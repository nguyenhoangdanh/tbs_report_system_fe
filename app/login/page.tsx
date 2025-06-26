'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/components/providers/auth-provider'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/auth-layout'
import { FormField } from '@/components/ui/form-field'
import { SubmitButton } from '@/components/ui/submit-button'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import Link from 'next/link'
import { UserLock } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const { login, isLoginLoading } = useAuth()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.employeeCode, data.password)
      
      // Redirect tức thì sau khi login thành công
      setTimeout(() => {
        const returnUrl = searchParams.get('returnUrl')
        const targetUrl = returnUrl && returnUrl !== '/login' ? returnUrl : '/dashboard'
        window.location.href = targetUrl
      }, 500) // 500ms để user thấy success message
      
    } catch (error) {
      // Error đã được handle trong useAuth hook
    }
  }

  return (
    <AuthLayout
      title="Đăng nhập"
      description="Hệ thống báo cáo công việc hàng tuần"
      icon={<UserLock className="w-8 h-8" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FormField
            id="employeeCode"
            label="Mã nhân viên"
            placeholder="CEO001, EMP001..."
            required
            {...register('employeeCode')}
            error={errors.employeeCode?.message}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <FormField
            id="password"
            type="password"
            label="Mật khẩu"
            required
            {...register('password')}
            error={errors.password?.message}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <SubmitButton
            loading={isLoginLoading}
            text={isLoginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            size="lg"
            className="w-full"
          />
        </motion.div>
      </form>
      
      <motion.div
        className="mt-6 text-center text-sm space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div>
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors">
            Đăng ký ngay
          </Link>
        </div>
        <div>
          <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
            Quên mật khẩu?
          </Link>
        </div>
      </motion.div>
      
      <motion.div
        className="mt-4 text-center text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Demo: EMP001/123456
      </motion.div>
    </AuthLayout>
  )
}
