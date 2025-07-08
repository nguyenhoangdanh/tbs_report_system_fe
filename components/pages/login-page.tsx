"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/components/providers/auth-provider"
import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import Link from "next/link"
import { LockIcon as UserLock, Eye, EyeOff, Shield, Sparkles, Leaf, Zap } from "lucide-react"
import { useState } from "react"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
import { FormField } from "../ui/form-field"
import { SubmitButton } from "../ui/submit-button"

// Fixed animation variants with proper TypeScript types
const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: "easeOut",
    },
  },
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export function LoginPage() {
  const { login, isLoading } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeCode: "",
      password: "",
      rememberMe: false,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.employeeCode, data.password, data.rememberMe)
    } catch (error) {
      console.error("[LoginPage] Login error:", error)
    }
  }

  console.log("[LoginPage] Rendered with reduced motion:", errors)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-green-950/20 dark:via-emerald-950/10 dark:to-teal-950/5 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs with better motion */}
        <motion.div
          animate={shouldReduceMotion ? {} : {
            y: [-10, 10, -10],
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-24 h-24 bg-green-200/30 dark:bg-green-400/20 rounded-full blur-xl"
        />
        <motion.div
          animate={shouldReduceMotion ? {} : {
            y: [-15, 15, -15],
            rotate: [0, -5, 5, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-40 right-20 w-32 h-32 bg-emerald-200/20 dark:bg-emerald-400/15 rounded-full blur-xl"
        />
        <motion.div
          animate={shouldReduceMotion ? {} : {
            y: [-8, 12, -8],
            rotate: [0, 3, -3, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute bottom-20 left-1/4 w-28 h-28 bg-teal-200/25 dark:bg-teal-400/20 rounded-full blur-xl"
        />

        {/* Additional floating elements */}
        <motion.div
          animate={shouldReduceMotion ? {} : {
            y: [-12, 12, -12],
            x: [-8, 8, -8],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-32 right-32 w-20 h-20 bg-blue-200/25 dark:bg-blue-400/20 rounded-full blur-lg"
        />

        {/* Pulsing rings with better animations */}
        <motion.div
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 right-1/4 w-40 h-40 border border-green-300/20 dark:border-green-400/30 rounded-full"
        />
        <motion.div
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
          className="absolute bottom-1/3 left-1/3 w-32 h-32 border border-emerald-300/15 dark:border-emerald-400/25 rounded-full"
        />

        {/* Enhanced orbiting elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={shouldReduceMotion ? {} : { rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="relative w-96 h-96"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-400/40 rounded-full blur-sm" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400/30 rounded-full blur-sm" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-teal-400/35 rounded-full blur-sm" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-300/25 rounded-full blur-sm" />
          </motion.div>
        </div>

        {/* Enhanced floating icons */}
        <motion.div
          animate={shouldReduceMotion ? {} : {
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/6 text-green-300/20 dark:text-green-400/30"
        >
          <Leaf className="w-8 h-8" />
        </motion.div>
        <motion.div
          animate={shouldReduceMotion ? {} : {
            y: [20, -20, 20],
            x: [10, -10, 10],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 right-1/6 text-emerald-300/15 dark:text-emerald-400/25"
        >
          <Zap className="w-6 h-6" />
        </motion.div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="w-full max-w-md"
        >
          {/* Enhanced Header Section */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="relative inline-block">
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-500/25 relative overflow-hidden"
              >
                <UserLock className="w-10 h-10 text-white relative z-10" />
                {/* Enhanced animated background */}
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Đăng nhập
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Hệ thống báo cáo công việc hàng tuần
            </p>
          </motion.div>

          {/* Enhanced Login Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/20 dark:border-gray-700/50 p-8 relative overflow-hidden"
          >
            {/* Enhanced card background animation */}
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
              {/* Employee Code Field */}
              <motion.div variants={itemVariants}>
                <FormField
                  id="employeeCode"
                  label="Mã nhân viên"
                  type="text"
                  placeholder="OOP001"
                  required
                  {...register('employeeCode')}
                  error={errors.employeeCode?.message}
                />
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants}>
                <FormField
                  id="password"
                  type="password"
                  label="Mật khẩu"
                  placeholder="••••••"
                  required
                  showPasswordToggle={true}
                  {...register('password')}
                  error={errors.password?.message}
                />
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                variants={itemVariants}
                className="flex items-center space-x-3"
              >
                <div className="flex items-center space-x-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    {...register('rememberMe')}
                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 h-4 w-4"
                  />
                  <label htmlFor="rememberMe" className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                    Ghi nhớ đăng nhập
                  </label>
                </div> 
              </motion.div>


              {/* Enhanced Submit Button */}
              <motion.div variants={itemVariants}>
                <SubmitButton
                  loading={isLoading}
                  text={isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  size="lg"
                  className="w-full"
                />
              </motion.div>

              {/* Forgot password? */}
              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </form>

          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center mt-6 text-sm text-gray-500">
            <p>© 2024 Weekly Report System. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
