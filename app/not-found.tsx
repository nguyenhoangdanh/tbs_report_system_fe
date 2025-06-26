import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
        <Button asChild>
          <Link href="/dashboard">
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  )
}
