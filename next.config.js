/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tối ưu cho production
  reactStrictMode: true,
  swcMinify: true,
  
  // Remove experimental appDir as it's now stable
  
  // Tối ưu images - production ready
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },
  
  // ESLint configuration for v9 compatibility
  eslint: {
    dirs: ['pages', 'components', 'lib', 'src', 'app'],
  },
  
  // Rewrites để proxy API calls đến backend trong quá trình phát triển
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/:path*`,
      },
    ]
  },

  // Biến môi trường
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Headers bảo mật
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Redirects nếu cần
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },

  // Compiler options - đơn giản hóa
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output config cho static export nếu cần
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  
  // Webpack config để tránh module resolution issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
