"use client"
import { memo, useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AvatarDisplayProps {
  src?: string
  fallbackText: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
  onClick?: () => void
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg', 
  xl: 'w-20 h-20 text-2xl'
}

const sizePixels = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80
}

export const AvatarDisplay = memo(({ 
  src, 
  fallbackText, 
  size = 'md', 
  className,
  alt = 'Avatar',
  onClick
}: AvatarDisplayProps) => {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  // Reset error state when src changes
  useEffect(() => {
    setImageError(false)
    setImageSrc(src)
  }, [src])

  const hasImage = !!imageSrc && !imageError

  const handleImageError = () => {
    setImageError(true)
    console.warn('Avatar image failed to load:', imageSrc)
  }

  const shouldUseUnoptimized = () => {
    if (!imageSrc) return false
    
    // Use unoptimized for local development or known problematic domains
    return (
      imageSrc.includes('localhost') ||
      imageSrc.includes('127.0.0.1') ||
      imageError
    )
  }

  return (
    <div 
      className={cn(
        'rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 relative',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {hasImage ? (
        <Image
          src={imageSrc!}
          alt={alt}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="w-full h-full object-cover"
          onError={handleImageError}
          onLoad={() => setImageError(false)}
          unoptimized={shouldUseUnoptimized()}
          priority={size === 'xl'} // Prioritize larger avatars
        />
      ) : (
        <span className="text-white font-bold absolute inset-0 flex items-center justify-center">
          {fallbackText}
        </span>
      )}
      
      {/* Optional loading indicator for large avatars */}
      {hasImage && size === 'xl' && (
        <div className="absolute inset-0 bg-green-500/10 rounded-full animate-pulse opacity-0" />
      )}
    </div>
  )
})

AvatarDisplay.displayName = 'AvatarDisplay'
