import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Trang không tồn tại
        </h2>
        <p className="text-muted-foreground mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link 
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
