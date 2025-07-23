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
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <div className="flex items-center space-x-3">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400 }}>
                <Image
                  src="/images/logo.png"
                  alt="TBS Group Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain drop-shadow-lg"
                />
              </motion.div>
              <span className="text-lg font-bold text-green-gradient">WeeklyReport</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Hệ thống báo cáo công việc hàng tuần hiện đại, giúp doanh nghiệp quản lý hiệu quả và minh bạch với công
              nghệ tiên tiến.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <h4 className="font-semibold text-foreground text-green-gradient">Liên kết nhanh</h4>
            <ul className="space-y-3 text-sm">
              {(user?.role === "USER" ? linkItems : linkItems.slice(0, 2)).map((link) => (
                <motion.li
                  key={link.href}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <h4 className="font-semibold text-foreground text-green-gradient">Liên hệ</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              {[
                { icon: Mail, text: "danhnh.developer@gmail.com" },
                { icon: Phone, text: "+(84) 38 593 0622" },
                {
                  icon: MapPin,
                  text: "Ấp Thanh niên, xã Phú Hòa, An Giang",
                },
              ].map((contact, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-3 group"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <contact.icon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0 group-hover:text-green-400 transition-colors" />
                  <span className="group-hover:text-foreground transition-colors">{contact.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Copyright */}
        <motion.div
          className="mt-8 pt-6 border-t border-green-500/20"
          variants={itemVariants}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground flex items-center">
              © {currentYear} WeeklyReport System. Made with{" "}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                className="mx-1"
              >
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              </motion.span>{" "}
              in Vietnam
            </p>
            <div className="flex items-center space-x-6 text-sm">
              {[
                { href: "/privacy", label: "Chính sách bảo mật" },
                { href: "/terms", label: "Điều khoản sử dụng" },
              ].map((link) => (
                <motion.div key={link.href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  )
}

