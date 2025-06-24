import React from 'react'

interface AppLoadingProps {
  text?: string
  size?: number
  colorClass?: string
  bgClass?: string
}

export function AppLoading({
  text = "Đang tải dữ liệu, vui lòng chờ...",
  size = 50,
  colorClass = "border-t-green-600 border-b-green-300 dark:border-t-green-400 dark:border-b-green-700",
  bgClass = ""
}: AppLoadingProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-background py-24 ${bgClass}`}>
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center">
          <div
            className={`animate-spin rounded-full border-t-2 border-b-2 ${colorClass}`}
            style={{ width: size, height: size }}
          />
        </div>
        <p className="text-lg text-muted-foreground font-medium">{text}</p>
      </div>
    </div>
  )
}
