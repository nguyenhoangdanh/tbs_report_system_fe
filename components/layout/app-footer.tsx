"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Heart } from "lucide-react"
import { useAuth } from "../providers/auth-provider"

export function AppFooter() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const linkItems = [
    { href: user?.role === "USER" ? "/dashboard" : "/admin/hierarchy", label: "Trang chủ" },
    { href: "/profile", label: "Thông tin cá nhân" },
    { href: "/reports", label: "Báo cáo của tôi" },
  ];

  return (
    <motion.footer
      className="relative z-50 glass-green backdrop-blur-xl border-t border-green-500/20 mt-auto"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      {/* Use same container class as header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Main Content - Desktop Grid, Mobile Stack */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Logo and Description */}
          <motion.div className="space-y-3 md:space-y-4 text-center md:text-left" variants={itemVariants}>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400 }}>
                <Image
                  src="/images/logo.png"
                  alt="TBS Group Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain drop-shadow-lg"
                />
              </motion.div>
              <span className="text-base sm:text-lg font-bold text-green-gradient">WeeklyReport</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed mx-auto md:mx-0">
              Hệ thống báo cáo công việc hàng tuần hiện đại, giúp doanh nghiệp quản lý hiệu quả và minh bạch.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div className="space-y-3 md:space-y-4 text-center md:text-left" variants={itemVariants}>
            <h4 className="font-semibold text-sm sm:text-base text-green-gradient">Liên kết nhanh</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {linkItems.map((link) => (
                <motion.li
                  key={link.href}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex justify-center md:justify-start"
                >
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div className="space-y-3 md:space-y-4 text-center md:text-left" variants={itemVariants}>
            <h4 className="font-semibold text-sm sm:text-base text-green-gradient">Liên hệ</h4>
            <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {[
                { icon: Mail, text: "danhnh.developer@gmail.com", short: "Email" },
                { icon: Phone, text: "+(84) 38 593 0622", short: "Hotline" },
                { icon: MapPin, text: "Ấp Thanh niên, xã Phú Hòa, An Giang", short: "Địa chỉ" },
              ].map((contact, index) => (
                <motion.div
                  key={index}
                  className="flex items-start justify-center md:justify-start space-x-2 sm:space-x-3 group"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <contact.icon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mt-0.5 flex-shrink-0 group-hover:text-green-400 transition-colors" />
                  <div className="text-left">
                    {/* Mobile: Show short label + text */}
                    <div className="md:hidden">
                      <span className="font-medium">{contact.short}:</span> {contact.text}
                    </div>
                    {/* Desktop: Show full text */}
                    <span className="hidden md:inline group-hover:text-foreground transition-colors">
                      {contact.text}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Copyright Section */}
        <motion.div
          className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-green-500/20"
          variants={itemVariants}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col space-y-3 sm:space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
            {/* Copyright Text */}
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center md:justify-start">
              © {currentYear} WeeklyReport System. Made with{" "}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                className="mx-1"
              >
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-current" />
              </motion.span>{" "}
              by Hoang Danh
            </p>

            {/* Footer Links */}
            <div className="flex items-center justify-center md:justify-end space-x-4 sm:space-x-6 text-xs sm:text-sm">
              {[
                "Chính sách bảo mật",
                "Điều khoản sử dụng",
              ].map((label, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 cursor-pointer whitespace-nowrap">
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  )
}

