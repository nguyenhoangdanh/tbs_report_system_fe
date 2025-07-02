import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'

interface ErrorDisplayProps {
  title?: string
  message?: string
  onRetry?: () => void
  showRetryButton?: boolean
  className?: string
}

export function ErrorDisplay({
  title = "Đã xảy ra lỗi",
  message = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  showRetryButton = true,
  className = ""
}: ErrorDisplayProps) {
  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {title}
        </h3>
        <p className="text-red-600 mb-4">
          {message}
        </p>
        {showRetryButton && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
