"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion";
import { AuthService } from "@/services/auth.service";
import Link from "next/link";
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordFormData, type ResetPasswordFormData } from "@/lib/validations/auth";
import type { ForgotPasswordResponse } from "@/types";
import { AppLoading } from '@/components/ui/app-loading'
import { KeyRound, Shield, Sparkles, Leaf, Zap, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toast-kit";

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

function ForgotPasswordContent() {
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<ForgotPasswordResponse['user'] | null>(null);
  const [verifyData, setVerifyData] = useState<ForgotPasswordFormData>({ employeeCode: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const shouldReduceMotion = useReducedMotion()

  const router = useRouter();

  const verifyForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const handleVerify = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      // Use the AuthService directly since useForgotPassword expects different params
      const response = await AuthService.forgotPassword({
        employeeCode: data.employeeCode,
        phone: data.phone
      });
      setUserInfo(response.user);
      setVerifyData(data);
      setStep('reset');
      toast.success(response.message);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      // Use the AuthService directly
      await AuthService.resetPassword({
        employeeCode: verifyData.employeeCode,
        phone: verifyData.phone,
        newPassword: data.newPassword,
      });
      
      toast.success('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('verify');
    setUserInfo(null);
    verifyForm.reset();
    resetForm.reset();
  };

  if (isLoading) {
    return <AppLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-green-950/20 dark:via-emerald-950/10 dark:to-teal-950/5 relative overflow-hidden">
      {/* Enhanced animated background elements - same as LoginPage */}
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
                className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-400 dark:to-orange-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-yellow-500/25 relative overflow-hidden"
              >
                <KeyRound className="w-10 h-10 text-white relative z-10" />
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
                  className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-3xl"
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
                className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Quên mật khẩu
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {step === 'verify' ? 'Nhập thông tin để xác thực danh tính' : 'Đặt mật khẩu mới cho tài khoản'}
            </p>
          </motion.div>

          {/* Enhanced Form Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/20 dark:border-gray-700/50 p-8 relative overflow-hidden"
          >
            {/* Enhanced card background animation */}
            <motion.div
              animate={shouldReduceMotion ? {} : {
                background: [
                  "radial-gradient(circle at 20% 80%, rgba(234, 179, 8, 0.03) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.03) 0%, transparent 50%)",
                  "radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 80%, rgba(234, 179, 8, 0.03) 0%, transparent 50%)",
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 pointer-events-none"
            />

            <div className="relative z-10">
              {step === 'verify' ? (
                <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-6">
                  {/* Employee Code Field */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="employeeCode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Mã nhân viên
                    </label>
                    <div className="relative group">
                      <input
                        id="employeeCode"
                        type="text"
                        placeholder="EMP001"
                        {...verifyForm.register("employeeCode")}
                        className={`w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-700/50 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 ${verifyForm.formState.errors.employeeCode
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 dark:border-gray-600 focus:border-yellow-500 focus:bg-white dark:focus:bg-gray-800"
                          }`}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 to-orange-500/0 group-focus-within:from-yellow-500/5 group-focus-within:to-orange-500/5 transition-all duration-300 pointer-events-none" />
                    </div>
                    <AnimatePresence mode="wait">
                      {verifyForm.formState.errors.employeeCode && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-red-500 text-sm mt-1 font-medium"
                        >
                          {verifyForm.formState.errors.employeeCode.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Phone Field */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Số điện thoại
                    </label>
                    <div className="relative group">
                      <input
                        id="phone"
                        type="text"
                        placeholder="0123456789"
                        maxLength={10}
                        {...verifyForm.register("phone")}
                        className={`w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-700/50 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 ${verifyForm.formState.errors.phone
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 dark:border-gray-600 focus:border-yellow-500 focus:bg-white dark:focus:bg-gray-800"
                          }`}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 to-orange-500/0 group-focus-within:from-yellow-500/5 group-focus-within:to-orange-500/5 transition-all duration-300 pointer-events-none" />
                    </div>
                    <AnimatePresence mode="wait">
                      {verifyForm.formState.errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-red-500 text-sm mt-1 font-medium"
                        >
                          {verifyForm.formState.errors.phone.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div variants={itemVariants}>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={shouldReduceMotion ? {} : { scale: isLoading ? 1 : 1.02 }}
                      whileTap={shouldReduceMotion ? {} : { scale: isLoading ? 1 : 0.98 }}
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden ${
                        isLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30"
                      }`}
                    >
                      {!isLoading && (
                        <motion.div
                          animate={shouldReduceMotion ? {} : {
                            x: [-100, 100],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                        />
                      )}
                      <div className="flex items-center justify-center space-x-2 relative z-10">
                        {isLoading && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                        )}
                        <span>{isLoading ? 'Đang xác thực...' : 'Xác thực thông tin'}</span>
                        {!isLoading && <KeyRound className="w-5 h-5" />}
                      </div>
                    </motion.button>
                  </motion.div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* User Info Display */}
                  <motion.div
                    className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200/50 dark:border-yellow-800/50 relative overflow-hidden"
                    variants={itemVariants}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-500 rounded-full"
                    />
                    <div className="ml-4">
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Thông tin tài khoản:</h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        <span className="font-medium">Họ tên:</span> {userInfo?.firstName} {userInfo?.lastName}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        <span className="font-medium">Mã NV:</span> {userInfo?.employeeCode}
                      </p>
                      {userInfo?.phone && (
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          <span className="font-medium">Số điện thoại:</span> {userInfo.phone}
                        </p>
                      )}
                    </div>
                  </motion.div>

                  <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-6">
                    {/* New Password Field */}
                    <motion.div variants={itemVariants}>
                      <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Mật khẩu mới
                      </label>
                      <div className="relative group">
                        <input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                          {...resetForm.register("newPassword")}
                          className={`w-full px-4 py-3 pr-12 bg-gray-50/50 dark:bg-gray-700/50 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 ${resetForm.formState.errors.newPassword
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-600 focus:border-yellow-500 focus:bg-white dark:focus:bg-gray-800"
                            }`}
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 to-orange-500/0 group-focus-within:from-yellow-500/5 group-focus-within:to-orange-500/5 transition-all duration-300 pointer-events-none" />
                      </div>
                      <AnimatePresence mode="wait">
                        {resetForm.formState.errors.newPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-red-500 text-sm mt-1 font-medium"
                          >
                            {resetForm.formState.errors.newPassword.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Confirm Password Field */}
                    <motion.div variants={itemVariants}>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative group">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu mới"
                          {...resetForm.register("confirmPassword")}
                          className={`w-full px-4 py-3 pr-12 bg-gray-50/50 dark:bg-gray-700/50 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 ${resetForm.formState.errors.confirmPassword
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-600 focus:border-yellow-500 focus:bg-white dark:focus:bg-gray-800"
                            }`}
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 to-orange-500/0 group-focus-within:from-yellow-500/5 group-focus-within:to-orange-500/5 transition-all duration-300 pointer-events-none" />
                      </div>
                      <AnimatePresence mode="wait">
                        {resetForm.formState.errors.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-red-500 text-sm mt-1 font-medium"
                          >
                            {resetForm.formState.errors.confirmPassword.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Submit and Reset Buttons */}
                    <motion.div className="space-y-3" variants={itemVariants}>
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={shouldReduceMotion ? {} : { scale: isLoading ? 1 : 1.02 }}
                        whileTap={shouldReduceMotion ? {} : { scale: isLoading ? 1 : 0.98 }}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden ${
                          isLoading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30"
                        }`}
                      >
                        {!isLoading && (
                          <motion.div
                            animate={shouldReduceMotion ? {} : {
                              x: [-100, 100],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                          />
                        )}
                        <div className="flex items-center justify-center space-x-2 relative z-10">
                          {isLoading && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                          )}
                          <span>{isLoading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</span>
                          {!isLoading && <Shield className="w-5 h-5" />}
                        </div>
                      </motion.button>

                      <button
                        type="button"
                        onClick={resetFlow}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors py-2"
                      >
                        Quay lại xác thực thông tin
                      </button>
                    </motion.div>
                  </form>
                </div>
              )}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center mt-6 space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nhớ mật khẩu?{' '}
              <Link href="/login" className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 font-semibold hover:underline transition-colors">
                Đăng nhập ngay
              </Link>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">© 2024 Weekly Report System. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <motion.div 
            className="w-12 h-12 border-4 border-yellow-600/30 border-t-yellow-600 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}
