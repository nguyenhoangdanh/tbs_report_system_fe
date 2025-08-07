/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tối ưu cho production
  reactStrictMode: true,
  swcMinify: true,
  
  // Thêm transpile packages cho iOS compatibility
  transpilePackages: ['pdfjs-dist'],

  // Tối ưu images - production ready
  images: {
    remotePatterns: [
      // Cloudflare R2 domain
      {
        protocol: 'https',
        hostname: 'pub-f7d08fc103f64cd0b3851f92368c01fb.r2.dev',
        port: '',
        pathname: '/**',
      },
      // Generic R2.dev pattern for other buckets
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
      // Cloudflare R2 custom domains (if using custom domain later)
      {
        protocol: 'https',
        hostname: '*.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      // Local development server (for local avatar fallback)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8080',
        pathname: '/uploads/**',
      }
    ],
    // Optional: Configure image optimization
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
      // Add CORS headers for PDF worker files
      {
        source: '/pdf.worker.min.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/pdf.worker.min.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
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
  experimental: {
    esmExternals: 'loose',
  },

  // Compiler options - đơn giản hóa
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output config cho static export nếu cần
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  
  // Webpack config - cải thiện cho iOS và handle missing PDF.js files
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Fix PDF.js worker for all environments
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?(js|mjs)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]'
      }
    })

    // Handle pdfjs-dist imports - better CDN support
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use jsDelivr instead of unpkg for better CORS support
        'pdfjs-dist/build/pdf.worker.min.js': dev 
          ? require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')
          : `https://cdn.jsdelivr.net/npm/pdfjs-dist@${require('pdfjs-dist/package.json').version}/build/pdf.worker.min.js`,
      }
    }

    return config
  },
}

module.exports = nextConfig
