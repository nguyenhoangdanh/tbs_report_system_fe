'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  details?: string
  onRetry?: () => void
}

export const ErrorMessage = memo(({ message, details, onRetry }: ErrorMessageProps) => {
  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
              {message}
            </h3>
            {details && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                {details}
              </p>
            )}
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

ErrorMessage.displayName = 'ErrorMessage'
