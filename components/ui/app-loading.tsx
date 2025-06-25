import React from 'react'

interface AppLoadingProps {
  text?: string
  size?: number
  minimal?: boolean
}

export function AppLoading({
  text = "Đang tải...",
  size = 40,
  minimal = false
}: AppLoadingProps) {
  if (minimal) {
    return (
      <div className="flex items-center justify-center p-4">
        <div
          className="animate-spin rounded-full border-2 border-green-600/20 border-t-green-600"
          style={{ width: size, height: size }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div
            className="animate-spin rounded-full border-2 border-green-600/20 border-t-green-600"
            style={{ width: size, height: size }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
