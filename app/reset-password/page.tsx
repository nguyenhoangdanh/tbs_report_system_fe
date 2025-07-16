"use client"

import { useForm } from "react-hook-form"
import { useSearchParams } from "next/navigation"
import { useResetPassword } from "@/hooks/use-auth"
import { useState } from "react"
import { motion, useReducedMotion, Variants } from "framer-motion"
import Link from "next/link"
import { LockIcon, Sparkles } from "lucide-react"
import { FormField } from "@/components/ui/form-field"
import { useThemeBackground } from "@/hooks/use-theme-background"
import { ModernAnimatedBackground } from "@/components/layout/modern-animated-background"

// Animation variants (giống LoginPage)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, staggerChildren: 0.1, ease: "easeOut" },
  },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

type ResetForm = {
  employeeCode: string
  phone: string
  newPassword: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const resetPassword = useResetPassword()
  const shouldReduceMotion = useReducedMotion()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetForm>({
    defaultValues: {
      employeeCode: searchParams.get("employeeCode") || "",
      phone: searchParams.get("phone") || "",
      newPassword: "",
      confirmPassword: ""
    }
  })

  const onSubmit = async (data: ResetForm) => {
    setError(null)
    if (data.newPassword !== data.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }
    try {
      await resetPassword.mutateAsync({
        employeeCode: data.employeeCode,
        phone: data.phone,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      })
      // Success handled in hook (redirect)
    } catch (e: any) {
      setError(e?.message || "Đặt lại mật khẩu thất bại")
    }
  }

  const { enableAnimation, particleCount, canAnimate, performanceMode } = useThemeBackground()

  return (
    <ModernAnimatedBackground
    enableAnimation={enableAnimation}
    particleCount={particleCount}
    variant="hero"
    performanceMode={performanceMode}
    intensity="vibrant"
  >
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="relative inline-block">
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-500/25 relative overflow-hidden"
              >
                <LockIcon className="w-10 h-10 text-white relative z-10" />
                <motion.div
                  animate={shouldReduceMotion ? {} : {
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-3xl"
                />
                <motion.div
                  animate={shouldReduceMotion ? {} : {
                    x: [-100, 100],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </motion.div>
              <motion.div
                animate={shouldReduceMotion ? {} : { rotate: 360 }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Đặt lại mật khẩu
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Vui lòng nhập thông tin để đặt lại mật khẩu
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/20 dark:border-gray-700/50 p-8 relative overflow-hidden"
          >
            <motion.div
              animate={shouldReduceMotion ? {} : {
                background: [
                  "radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.03) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)",
                  "radial-gradient(circle at 40% 40%, rgba(5, 150, 105, 0.03) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.03) 0%, transparent 50%)",
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 pointer-events-none"
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              {/* Employee Code */}
              <motion.div variants={itemVariants} className="hidden">
                <label className="block mb-1 font-medium">Mã nhân viên</label>
                <input
                  {...register("employeeCode", { required: true })}
                  className="w-full border px-3 py-2 rounded"
                  disabled={!!searchParams.get("employeeCode")}
                  placeholder="Nhập mã nhân viên"
                />
                {errors.employeeCode && <p className="text-red-500 text-sm">Bắt buộc</p>}
              </motion.div>
              {/* Phone */}
              <motion.div variants={itemVariants} className="hidden">
                <label className="block mb-1 font-medium">Số điện thoại</label>
                <input
                  {...register("phone", { required: true })}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Nhập số điện thoại"
                />
                {errors.phone && <p className="text-red-500 text-sm">Bắt buộc</p>}
              </motion.div>
              {/* New Password */}
              <motion.div variants={itemVariants}>
                              <FormField
                                  id="newPassword"
                                  label="Mật khẩu mới"
                type="password"
                placeholder="Nhập mật khẩu mới"
                required
                {...register("newPassword", { required: true })}
                                  error={errors.newPassword?.message}
                              />
                {/* <label className="block mb-1 font-medium">Mật khẩu mới</label>
                <input
                  type="password"
                  {...register("newPassword", { required: true })}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Nhập mật khẩu mới"
                />
                {errors.newPassword && <p className="text-red-500 text-sm">Bắt buộc</p>} */}
              </motion.div>
              {/* Confirm Password */}
              <motion.div variants={itemVariants}>
                  <FormField
                      id="confirmPassword"
                      label="Xác nhận mật khẩu"
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      {...register("confirmPassword", { required: true })}
                      error={errors.confirmPassword?.message}
                  />
                {/* <label className="block mb-1 font-medium">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  {...register("confirmPassword", { required: true })}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Nhập lại mật khẩu mới"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm">Bắt buộc</p>} */}
              </motion.div>
              {/* Error */}
              {error && (
                <motion.div variants={itemVariants} className="text-red-500 text-sm text-center">
                  {error}
                </motion.div>
              )}
              {/* Submit */}
              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition"
                  disabled={isSubmitting || resetPassword.isPending}
                >
                  {resetPassword.isPending ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                </button>
              </motion.div>
              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors hover:underline"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </motion.div>
          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center mt-6 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Weekly Report System. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </div>
    </ModernAnimatedBackground>
  )
}
