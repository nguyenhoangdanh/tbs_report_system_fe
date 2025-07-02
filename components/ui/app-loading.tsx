import React from 'react'
import { Loader2 } from 'lucide-react'

interface AppLoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AppLoading({ 
  text = 'Đang tải...', 
  size = 'md',
  className = '' 
}: AppLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mb-2`} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
