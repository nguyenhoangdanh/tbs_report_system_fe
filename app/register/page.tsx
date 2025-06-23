"use client";

import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Đăng ký tài khoản"
      description="Tạo tài khoản mới để sử dụng hệ thống báo cáo"
      icon="📝"
    >
      <RegisterForm />
      
      <motion.div
        className="mt-6 text-center text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors">
          Đăng nhập ngay
        </Link>
      </motion.div>
    </AuthLayout>
  );
}
