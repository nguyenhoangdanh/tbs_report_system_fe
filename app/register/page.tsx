"use client";

import { Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { NotepadText, UserPlus } from "lucide-react";

function RegisterContent() {
  return (
    <>
      <RegisterForm />

      <motion.div
        className="mt-6 text-center text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </motion.div>
    </>
  );
}

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Nếu đã đăng nhập, chuyển hướng đến trang chính hoặc trang mà bạn muốn
      window.location.href = "/";
    }
  }, [isAuthenticated]);

  return (
    <AuthLayout
      title="Đăng ký tài khoản"
      description="Tạo tài khoản mới để sử dụng hệ thống báo cáo"
      icon={<NotepadText className="w-8 h-8" />}
      maxWidth="max-w-2xl" // <-- tăng độ rộng cho form đăng ký
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        }
      >
        <RegisterContent />
      </Suspense>
    </AuthLayout>
  );
}
