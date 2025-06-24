"use client";

import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import { AppLoading } from "@/components/ui/app-loading";
import { useAuth } from "@/components/providers/auth-provider";
import { NotepadText } from "lucide-react";

export default function RegisterPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  return (
    <AuthLayout
      title="Đăng ký tài khoản"
      description="Tạo tài khoản mới để sử dụng hệ thống báo cáo"
      icon={<NotepadText className="w-8 h-8" />}
      maxWidth="max-w-2xl" // <-- tăng độ rộng cho form đăng ký
    >
      <RegisterForm />

      <motion.div
        className="mt-6 text-center text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </motion.div>
    </AuthLayout>
  );
}
