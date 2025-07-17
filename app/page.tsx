'use client'

import { Suspense, memo } from 'react'
import { motion, useScroll, useTransform, useSpring, useReducedMotion, Variants } from 'framer-motion'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { ScreenLoading } from '@/components/loading/screen-loading'

// Optimized StatCard component
const StatCard = memo(({ number, label, delay }: { number: string; label: string; delay: number }) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : delay }}
      whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
      className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/70 transition-colors duration-300"
    >
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-muted-foreground text-sm md:text-base">{label}</div>
    </motion.div>
  )
})

StatCard.displayName = 'StatCard'

// Optimized FeatureCard component  
const FeatureCard = memo(({ icon, title, description, delay }: {
  icon: string
  title: string
  description: string
  delay: number
}) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : delay }}
      whileHover={{ y: shouldReduceMotion ? 0 : -5 }}
      className="group relative"
    >
      <div className="relative p-8 bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 hover:shadow-xl hover:border-green-500/20 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10">
          <motion.div
            className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 rounded-xl flex items-center justify-center mb-6 shadow-lg"
            whileHover={{ rotate: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <span className="text-2xl">{icon}</span>
          </motion.div>
          <h3 className="text-xl font-semibold text-card-foreground mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  )
})

FeatureCard.displayName = 'FeatureCard'

// Simplified floating element component
const FloatingElement = memo(({ children, delay = 0, className = "" }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : {
        y: [-10, 10, -10],
        rotate: [-1, 1, -1],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
      className={`absolute opacity-20 dark:opacity-10 ${className}`}
    >
      {children}
    </motion.div>
  )
})

FloatingElement.displayName = 'FloatingElement'

// Optimized animated particle component
const AnimatedParticle = memo(({
  size = 'w-2 h-2',
  color = 'bg-green-400',
  delay = 0,
  className = ''
}: {
  size?: string
  color?: string
  delay?: number
  className?: string
}) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={`absolute ${size} ${color} rounded-full opacity-40 dark:opacity-20 ${className}`}
      animate={shouldReduceMotion ? {} : {
        x: [-20, 20, -20],
        y: [-15, 15, -15],
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.8, 0.4]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    />
  )
})

AnimatedParticle.displayName = 'AnimatedParticle'

// Background decoration component
const BackgroundDecorations = memo(() => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating background blobs */}
      <FloatingElement delay={0} className="top-20 left-10">
        <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-3xl" />
      </FloatingElement>
      <FloatingElement delay={2} className="top-40 right-20">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full blur-2xl" />
      </FloatingElement>
      <FloatingElement delay={4} className="bottom-40 left-1/3">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-2xl" />
      </FloatingElement>

      {/* Animated particles */}
      <AnimatedParticle size="w-3 h-3" color="bg-green-400" delay={0} className="top-32 left-20" />
      <AnimatedParticle size="w-2 h-2" color="bg-blue-400" delay={1} className="top-48 right-32" />
      <AnimatedParticle size="w-4 h-4" color="bg-emerald-400" delay={2} className="top-64 left-1/4" />
      <AnimatedParticle size="w-2 h-2" color="bg-cyan-400" delay={3} className="bottom-48 right-1/4" />

      {/* Floating icons */}
      {!shouldReduceMotion && [
        { icon: "📊", delay: 0.5, className: "top-40 left-12 text-3xl" },
        { icon: "📈", delay: 1.5, className: "top-56 right-24 text-2xl" },
        { icon: "⚡", delay: 2.5, className: "bottom-56 left-24 text-2xl" },
        { icon: "🎯", delay: 3.5, className: "bottom-40 right-16 text-3xl" },
      ].map((item, index) => (
        <motion.div
          key={index}
          className={`absolute opacity-30 dark:opacity-20 ${item.className}`}
          animate={{
            y: [-15, 15, -15],
            rotate: [-5, 5, -5],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: item.delay
          }}
        >
          {item.icon}
        </motion.div>
      ))}

      {/* Geometric shapes */}
      {!shouldReduceMotion && [
        { size: "w-6 h-6", color: "border-green-400", delay: 0, className: "top-36 left-32" },
        { size: "w-5 h-5", color: "border-blue-400", delay: 1, className: "top-52 right-40" },
        { size: "w-4 h-4", color: "border-emerald-400", delay: 2, className: "bottom-52 left-20" },
      ].map((shape, index) => (
        <motion.div
          key={index}
          className={`absolute ${shape.size} ${shape.color} rounded-full border-2 opacity-30 dark:opacity-15 ${shape.className}`}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
            delay: shape.delay
          }}
        />
      ))}
    </div>
  )
})

BackgroundDecorations.displayName = 'BackgroundDecorations'

export default function HomePage() {
  const { scrollYProgress } = useScroll()
  const shouldReduceMotion = useReducedMotion()
  const y = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -50])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])
  const springY = useSpring(y, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // Optimized animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
        delayChildren: shouldReduceMotion ? 0 : 0.2
      }
    }
  }

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <Suspense fallback={
      <ScreenLoading size="lg" variant="dual-ring" fullScreen backdrop />
    }>
      <MainLayout title={undefined} subtitle={undefined} showBreadcrumb={false}>
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-background to-emerald-50/30 dark:from-green-950/20 dark:via-background dark:to-emerald-950/10" />

          <BackgroundDecorations />

          <motion.div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ y: springY, opacity }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="text-center max-w-4xl mx-auto">
              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
                variants={itemVariants}
              >
                Hệ thống báo cáo <br />
                <motion.span
                  className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-400 dark:via-emerald-400 dark:to-green-400 bg-clip-text text-transparent bg-300%"
                  animate={shouldReduceMotion ? {} : {
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  công việc hàng tuần
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed"
                variants={itemVariants}
              >
                Quản lý tiến độ công việc thông minh, tăng năng suất và minh bạch cho doanh nghiệp
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={itemVariants}
              >
                <Link href="/login">
                  <motion.button
                    className="px-8 py-4 text-lg font-semibold text-foreground bg-card/80 backdrop-blur-sm border-2 border-border/50 rounded-lg hover:bg-accent hover:border-green-500/50 transition-all duration-300 w-full sm:w-auto shadow-lg"
                    whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                    whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                  >
                    Đăng nhập
                  </motion.button>
                </Link>
              </motion.div>
            </div>

            {/* Stats Section */}
            <motion.div
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
              variants={itemVariants}
            >
              <StatCard number="99%" label="Độ chính xác" delay={0.1} />
              <StatCard number="50%" label="Tiết kiệm thời gian" delay={0.2} />
              <StatCard number="24/7" label="Hỗ trợ" delay={0.3} />
              <StatCard number="100+" label="Khách hàng" delay={0.4} />
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32 bg-muted/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 dark:opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.h2
                className="text-3xl md:text-5xl font-bold text-foreground mb-6"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
              >
                Tính năng{' '}
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  vượt trội
                </span>
              </motion.h2>
              <motion.p
                className="text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.2 }}
              >
                Được thiết kế đặc biệt cho doanh nghiệp sản xuất với cấu trúc tổ chức phức tạp
              </motion.p>
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6, staggerChildren: shouldReduceMotion ? 0 : 0.1 }}
            >
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
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 md:py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
              >
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
                  Tại sao chọn{' '}
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    WeeklyReport?
                  </span>
                </h2>

                <div className="space-y-6">
                  {[
                    {
                      icon: "✓",
                      title: "Tiết kiệm 80% thời gian",
                      description: "Từ 2 giờ xuống còn 20 phút để hoàn thành báo cáo tuần"
                    },
                    {
                      icon: "✓",
                      title: "Tăng minh bạch 100%",
                      description: "Mọi hoạt động được ghi nhận và theo dõi chi tiết"
                    },
                    {
                      icon: "✓",
                      title: "Giảm 70% sai sót",
                      description: "Tự động kiểm tra và cảnh báo các thiếu sót trong báo cáo"
                    }
                  ].map((benefit, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start space-x-4 group"
                      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : index * 0.1 }}
                      whileHover={{ x: shouldReduceMotion ? 0 : 10 }}
                    >
                      <motion.div
                        className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: shouldReduceMotion ? 0 : 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {benefit.icon}
                        </span>
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {benefit.title}
                        </h3>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
              >
                <motion.div
                  className="relative bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-2xl p-8 text-white shadow-2xl"
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.02 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {!shouldReduceMotion && (
                    <>
                      <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full animate-pulse" />
                      <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
                    </>
                  )}

                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-6">Dashboard Demo</h3>
                    <div className="space-y-4">
                      <motion.div
                        className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm opacity-80">Tỷ lệ hoàn thành</span>
                          <span className="font-bold">95%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <motion.div
                            className="bg-white rounded-full h-2"
                            initial={{ width: 0 }}
                            whileInView={{ width: "95%" }}
                            viewport={{ once: true }}
                            transition={{ duration: shouldReduceMotion ? 0 : 1.5, delay: shouldReduceMotion ? 0 : 0.5 }}
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                      >
                        <div className="text-sm opacity-80 mb-2">Báo cáo tuần này</div>
                        <motion.div
                          className="text-2xl font-bold"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ type: "spring", stiffness: 200, delay: shouldReduceMotion ? 0 : 0.8 }}
                        >
                          127/130
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-800 dark:to-emerald-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <FloatingElement delay={0}>
              <div className="w-64 h-64 bg-white/5 rounded-full blur-3xl top-0 left-0" />
            </FloatingElement>
            <FloatingElement delay={3}>
              <div className="w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl bottom-0 right-0" />
            </FloatingElement>
          </div>

          <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.h2
              className="text-3xl md:text-5xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
            >
              Sẵn sàng tăng hiệu quả làm việc?
            </motion.h2>
            <motion.p
              className="text-xl text-green-100 mb-10"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.2 }}
            >
              Bắt đầu miễn phí ngay hôm nay và trải nghiệm sự khác biệt
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.4 }}
            >
              <Link href="/register">
                <motion.button
                  className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors shadow-lg"
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                >
                  Bắt đầu ngay
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>
      </MainLayout>
    </Suspense>
  )
}
