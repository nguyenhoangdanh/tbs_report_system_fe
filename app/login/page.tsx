'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/auth-layout'
import { FormField } from '@/components/ui/form-field'
import { AnimatedButton } from '@/components/ui/animated-button'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import Link from 'next/link'

export default function LoginPage() {
  const { login, isLoginLoading } = useAuth()
  const router = useRouter()

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
      router.push('/dashboard')
    } catch (error) {
      // Error is handled by the auth provider
    }
  }

  return (
    <AuthLayout
      title="Đăng nhập"
      description="Hệ thống báo cáo công việc hàng tuần"
      icon="🔐"
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
          <AnimatedButton
            type="submit"
            variant="gradient"
            className="w-full h-12 text-lg font-semibold"
            loading={isLoginLoading}
          >
            {isLoginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </AnimatedButton>
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
        Demo: CEO001/123456 hoặc EMP001/123456
      </motion.div>
    </AuthLayout>
  )
}
