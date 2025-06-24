"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordFormData, type ResetPasswordFormData } from "@/lib/validations/auth";
import type { ForgotPasswordResponse } from "@/types";
import { AppLoading } from '@/components/ui/app-loading'
import { SubmitButton } from '@/components/ui/submit-button'
import { KeyRound, KeySquare } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<ForgotPasswordResponse['user'] | null>(null);
  const [verifyData, setVerifyData] = useState<ForgotPasswordFormData>({ employeeCode: '', cardId: '' });
  
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
      const response = await AuthService.forgotPassword(data);
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
      await AuthService.resetPassword({
        employeeCode: verifyData.employeeCode,
        cardId: verifyData.cardId,
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
    <AuthLayout
      title="Quên mật khẩu"
      description={step === 'verify' ? 'Nhập thông tin để xác thực danh tính' : 'Đặt mật khẩu mới cho tài khoản'}
      icon={<KeyRound className="w-8 h-8 text-yellow-300" />}
      // icon="🔑"
      // gradientFrom="blue-50"
      // gradientTo="indigo-50"
    >
      {step === 'verify' ? (
        <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FormField
              id="employeeCode"
              label="Mã nhân viên"
              placeholder="EMP001"
              required
              {...verifyForm.register('employeeCode')}
              error={verifyForm.formState.errors.employeeCode?.message}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <FormField
              id="cardId"
              label="Số căn cước công dân"
              placeholder="012345678901"
              maxLength={12}
              required
              {...verifyForm.register('cardId')}
              error={verifyForm.formState.errors.cardId?.message}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <SubmitButton
              loading={isLoading}
              text={isLoading ? 'Đang xác thực...' : 'Xác thực thông tin'}
              size="lg"
              className="w-full"
            />
          </motion.div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* User Info Display */}
          <motion.div
            className="bg-muted/50 p-4 rounded-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-semibold text-card-foreground mb-2">Thông tin tài khoản:</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Họ tên:</span> {userInfo?.firstName} {userInfo?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Mã NV:</span> {userInfo?.employeeCode}
            </p>
            {userInfo?.email && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Email:</span> {userInfo.email}
              </p>
            )}
          </motion.div>

          <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <FormField
                id="newPassword"
                type="password"
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                required
                {...resetForm.register('newPassword')}
                error={resetForm.formState.errors.newPassword?.message}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <FormField
                id="confirmPassword"
                type="password"
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                required
                {...resetForm.register('confirmPassword')}
                error={resetForm.formState.errors.confirmPassword?.message}
              />
            </motion.div>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <SubmitButton
                loading={isLoading}
                text={isLoading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                size="lg"
                className="w-full"
              />

              <button
                type="button"
                onClick={resetFlow}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Quay lại xác thực thông tin
              </button>
            </motion.div>
          </form>
        </div>
      )}
      
      <motion.div
        className="mt-6 text-center text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Nhớ mật khẩu?{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
          Đăng nhập ngay
        </Link>
      </motion.div>
    </AuthLayout>
  );
}
