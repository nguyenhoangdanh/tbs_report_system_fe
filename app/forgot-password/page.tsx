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
import { KeyRound, Shield, Sparkles } from "lucide-react";
import { toast } from "react-toast-kit";
import { FormField } from "@/components/ui/form-field";
import { ModernAnimatedBackground } from "@/components/layout/modern-animated-background";
import { useThemeBackground } from "@/hooks/use-theme-background";
import { ScreenLoading } from "@/components/loading/screen-loading";

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
      // setUserInfo(response?.data.user);
      if (response.success && response.data) {
        setUserInfo(response.data.user);
        toast.success(response.data.message || 'Xác thực thông tin thành công!');
      }
      setVerifyData(data);
      setStep('reset');
      // toast.success(response?.data?.message);
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
  }
  const { enableAnimation, particleCount, canAnimate, performanceMode } = useThemeBackground();

  if (isLoading) {
    return <ScreenLoading size="lg" variant="corner-squares" fullScreen backdrop />
  }

  return (
      <ModernAnimatedBackground
        enableAnimation={enableAnimation}
        particleCount={particleCount}
        variant="login"
        performanceMode={performanceMode}
        intensity="subtle"
      >
      <div className="flex items-center justify-center min-h-screen p-4">
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
                        <FormField
                          id="newPassword"
                          label="Mật khẩu mới"
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                          required
                          {...resetForm.register("newPassword")}
                          error={resetForm.formState.errors.newPassword?.message}
                        />
                    </motion.div>

                    {/* Confirm Password Field */}
                    <motion.div variants={itemVariants}>
                      <FormField
                        id="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        {...resetForm.register("confirmPassword")}
                        error={resetForm.formState.errors.confirmPassword?.message}
                      />
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
            <p className="text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Weekly Report System. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </div>
    </ModernAnimatedBackground>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <ScreenLoading size="lg" variant="corner-squares" fullScreen backdrop />
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}
