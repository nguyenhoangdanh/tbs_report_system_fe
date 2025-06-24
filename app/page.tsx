'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AnimatedButton } from '@/components/ui/animated-button'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'

const StatCard = ({ number, label, delay }: { number: string; label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="text-center p-6"
  >
    <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{number}</div>
    <div className="text-muted-foreground text-sm md:text-base">{label}</div>
  </motion.div>
)

const FeatureCard = ({ icon, title, description, delay }: {
  icon: string
  title: string
  description: string
  delay: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="relative"
  >
    <div className="relative p-8 bg-card rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-card-foreground mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </motion.div>
)

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <AppLoading />
  }

  return (
    <MainLayout title={undefined} subtitle={undefined} showBreadcrumb={false}>
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-background to-emerald-50/30 dark:from-green-950/20 dark:via-background dark:to-emerald-950/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Hệ thống báo cáo{' '}
              <span className="text-gradient-green">
                công việc hàng tuần
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Quản lý tiến độ công việc thông minh, tăng năng suất và minh bạch cho doanh nghiệp
            </motion.p>
            
            {/* <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link href="/register">
                <AnimatedButton variant="gradient" size="lg" className="px-8 py-4 text-lg font-semibold w-full sm:w-auto">
                  Bắt đầu miễn phí
                </AnimatedButton>
              </Link>
              <Link href="/login">
                <button className="px-8 py-4 text-lg font-semibold text-foreground bg-background border-2 border-border rounded-lg hover:bg-accent transition-colors w-full sm:w-auto">
                  Đăng nhập
                </button>
              </Link>
            </motion.div> */}
          </div>

          {/* Stats Section */}
          <motion.div 
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <StatCard number="99%" label="Độ chính xác" delay={0.1} />
            <StatCard number="50%" label="Tiết kiệm thời gian" delay={0.2} />
            <StatCard number="24/7" label="Hỗ trợ" delay={0.3} />
            <StatCard number="100+" label="Khách hàng" delay={0.4} />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl md:text-5xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Tính năng vượt trội
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Được thiết kế đặc biệt cho doanh nghiệp sản xuất với cấu trúc tổ chức phức tạp
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="📝"
              title="Báo cáo thông minh"
              description="Tạo báo cáo hàng tuần với giao diện trực quan, dễ sử dụng và tự động lưu trữ"
              delay={0.1}
            />
            <FeatureCard
              icon="📊"
              title="Phân tích dữ liệu"
              description="Thống kê chi tiết với biểu đồ trực quan giúp lãnh đạo đưa ra quyết định chính xác"
              delay={0.2}
            />
            <FeatureCard
              icon="🔒"
              title="Bảo mật cao"
              description="Phân quyền 3 cấp độ với mã hóa dữ liệu, đảm bảo thông tin an toàn tuyệt đối"
              delay={0.3}
            />
            <FeatureCard
              icon="⚡"
              title="Hiệu suất cao"
              description="Xử lý nhanh chóng, hỗ trợ hàng nghìn người dùng đồng thời mà không bị chậm"
              delay={0.4}
            />
            <FeatureCard
              icon="📱"
              title="Đa nền tảng"
              description="Hoạt động mượt mà trên mọi thiết bị: máy tính, tablet, điện thoại"
              delay={0.5}
            />
            <FeatureCard
              icon="🎯"
              title="Tự động hóa"
              description="Tự động khóa báo cáo sau deadline, nhắc nhở và thông báo qua email"
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8">
                Tại sao chọn{' '}
                <span className="text-green-600">WeeklyReport?</span>
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Tiết kiệm 80% thời gian</h3>
                    <p className="text-gray-600">Từ 2 giờ xuống còn 20 phút để hoàn thành báo cáo tuần</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Tăng minh bạch 100%</h3>
                    <p className="text-gray-600">Mọi hoạt động được ghi nhận và theo dõi chi tiết</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-purple-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Giảm 70% sai sót</h3>
                    <p className="text-gray-600">Tự động kiểm tra và cảnh báo các thiếu sót trong báo cáo</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white">
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full" />
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-6">Dashboard Demo</h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm opacity-80">Tỷ lệ hoàn thành</span>
                        <span className="font-bold">95%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-white rounded-full h-2 w-[95%]" />
                      </div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-sm opacity-80 mb-2">Báo cáo tuần này</div>
                      <div className="text-2xl font-bold">127/130</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-800 dark:to-emerald-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl md:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Sẵn sàng tăng hiệu quả làm việc?
          </motion.h2>
          <motion.p 
            className="text-xl text-green-100 mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Bắt đầu miễn phí ngay hôm nay và trải nghiệm sự khác biệt
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/register">
              <button className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors">
                Bắt đầu ngay
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  )
}
