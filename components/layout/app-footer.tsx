'use client'

import Link from 'next/link'
import { Logo } from './logo'

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {/* <Logo size={32} /> */}
              <img
                src="/images/logo.png"
                alt="TBS Group Logo"
                className="w-12 h-12 sm:w-12 sm:h-12 object-contain"
                onError={(e) => {
                  // Fallback to text if image doesn't load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling!.textContent = 'TBS';
                }}
              />
              <span className="text-lg font-bold text-foreground text-gradient-green">WeeklyReport</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Hệ thống báo cáo công việc hàng tuần hiện đại, giúp doanh nghiệp quản lý hiệu quả và minh bạch.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  Thông tin cá nhân
                </Link>
              </li>
              <li>
                <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
                  Báo cáo của tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Liên hệ</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📧 danhnh.developer@gmail.com</p>
              <p>📞 +(84) 38 593 0622</p>
              <p>🏢 994C+2J2, Ấp Thanh niên, TT. Phú Hòa, Thoại Sơn, An Giang, Việt Nam</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} WeeklyReport System. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Chính sách bảo mật
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
