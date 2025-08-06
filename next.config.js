/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tối ưu cho production
  reactStrictMode: true,
  swcMinify: true,
  
  // Tối ưu images - production ready
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },
  
  // Headers bảo mật
  async headers() {
    return [
      {
        source: '/((?!api).*)',
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
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Add headers for PDF.js worker and assets
      {
        source: '/pdf.worker.min.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      {
        source: '/cmaps/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/standard_fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Redirects nếu cần
  // async redirects() {
  //   return [
  //     {
  //       source: '/home',
  //       destination: '/dashboard',
  //       permanent: true,
  //     },
  //   ]
  // },

  // Loại bỏ experimental features gây conflict
  // experimental: {
  //   optimizeCss: true,
  //   optimizePackageImports: ['@tanstack/react-query', 'framer-motion'],
  // },

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

    // Ignore PDF.js worker during build to avoid resolution issues
    config.externals = config.externals || []
    config.externals.push({
      'pdfjs-dist/build/pdf.worker.min.mjs': 'commonjs pdfjs-dist/build/pdf.worker.min.js'
    })

    return config
  },
}

module.exports = nextConfig
