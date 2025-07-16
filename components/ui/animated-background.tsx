"use client"

import { memo, useMemo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'

interface FloatingParticle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
  color: string
  shape: 'circle' | 'square' | 'diamond'
}

interface AnimatedBackgroundProps {
  particleCount?: number
  enableAnimation?: boolean
  children?: ReactNode
  variant?: 'default' | 'login' | 'forgot-password'
  className?: string
}

const AnimatedBackground = memo(({
  particleCount = 25,
  enableAnimation = true,
  children,
  variant = 'default',
  className = ''
}: AnimatedBackgroundProps) => {
  const { theme, resolvedTheme } = useTheme()
  const currentTheme = resolvedTheme || theme || 'dark'

  // Color schemes for different variants
  const variantColors = useMemo(() => {
    const schemes = {
      default: {
        light: [
          'rgba(59, 130, 246, 0.4)',   // Blue
          'rgba(34, 197, 94, 0.35)',   // Green  
          'rgba(168, 85, 247, 0.4)',   // Purple
          'rgba(251, 146, 60, 0.35)',  // Orange
          'rgba(236, 72, 153, 0.4)',   // Pink
          'rgba(6, 182, 212, 0.35)',   // Cyan
        ],
        dark: [
          'rgba(59, 130, 246, 0.6)',   // Blue
          'rgba(34, 197, 94, 0.5)',    // Green
          'rgba(168, 85, 247, 0.6)',   // Purple  
          'rgba(251, 146, 60, 0.5)',   // Orange
          'rgba(236, 72, 153, 0.6)',   // Pink
          'rgba(6, 182, 212, 0.5)',    // Cyan
        ],
        gradient: 'from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10'
      },
      login: {
        light: [
          'rgba(34, 197, 94, 0.4)',    // Green primary
          'rgba(16, 185, 129, 0.35)',  // Emerald
          'rgba(5, 150, 105, 0.4)',    // Green darker
          'rgba(59, 130, 246, 0.3)',   // Blue accent
          'rgba(6, 182, 212, 0.35)',   // Cyan
        ],
        dark: [
          'rgba(34, 197, 94, 0.6)',    // Green primary
          'rgba(16, 185, 129, 0.5)',   // Emerald
          'rgba(5, 150, 105, 0.6)',    // Green darker
          'rgba(59, 130, 246, 0.4)',   // Blue accent
          'rgba(6, 182, 212, 0.5)',    // Cyan
        ],
        gradient: 'from-green-500/8 via-emerald-500/6 to-teal-500/8 dark:from-green-500/15 dark:via-emerald-500/12 dark:to-teal-500/15'
      },
      'forgot-password': {
        light: [
          'rgba(251, 146, 60, 0.4)',   // Orange primary
          'rgba(245, 158, 11, 0.35)',  // Amber
          'rgba(234, 179, 8, 0.4)',    // Yellow
          'rgba(239, 68, 68, 0.3)',    // Red accent
          'rgba(236, 72, 153, 0.35)',  // Pink
        ],
        dark: [
          'rgba(251, 146, 60, 0.6)',   // Orange primary
          'rgba(245, 158, 11, 0.5)',   // Amber
          'rgba(234, 179, 8, 0.6)',    // Yellow
          'rgba(239, 68, 68, 0.4)',    // Red accent
          'rgba(236, 72, 153, 0.5)',   // Pink
        ],
        gradient: 'from-orange-500/8 via-yellow-500/6 to-red-500/8 dark:from-orange-500/15 dark:via-yellow-500/12 dark:to-red-500/15'
      }
    }
    return schemes[variant]
  }, [variant])

  const particles = useMemo(() => {
    const colors = currentTheme === 'dark' ? variantColors.dark : variantColors.light
    const shapes: Array<'circle' | 'square' | 'diamond'> = ['circle', 'square', 'diamond']
    
    return Array.from({ length: particleCount }, (_, i): FloatingParticle => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.8 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)]
    }))
  }, [particleCount, currentTheme, variantColors])

  if (!enableAnimation) return children ? <div className={className}>{children}</div> : null

  const getShapeStyles = (shape: string) => {
    switch (shape) {
      case 'square':
        return 'rounded-none'
      case 'diamond':
        return 'rounded-none rotate-45'
      default:
        return 'rounded-full'
    }
  }

  const Container = children ? 'div' : 'div'
  const containerProps = children 
    ? { className: `min-h-screen bg-gradient-to-br ${variantColors.gradient} relative overflow-hidden ${className}` }
    : { className: `absolute inset-0 pointer-events-none overflow-hidden ${className}` }

  return (
    <Container {...containerProps}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${variantColors.gradient}`} />
      
      {/* Enhanced floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute ${getShapeStyles(particle.shape)} shadow-lg pointer-events-none`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: currentTheme === 'dark' 
              ? `radial-gradient(circle, ${particle.color} 0%, ${particle.color}80 50%, transparent 100%)`
              : `linear-gradient(135deg, ${particle.color} 0%, ${particle.color}60 100%)`,
            boxShadow: currentTheme === 'dark'
              ? `0 0 ${particle.size * 2}px ${particle.color}40`
              : `0 2px ${particle.size}px ${particle.color}30`,
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 40 - 20, 0],
            scale: [1, 1.4, 1],
            opacity: [particle.opacity, particle.opacity * 0.4, particle.opacity],
            rotate: particle.shape === 'diamond' ? [45, 405, 45] : [0, 180, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Enhanced geometric shapes */}
      <motion.div
        className="absolute top-[160px] left-10 w-28 h-28 border-2 rounded-lg backdrop-blur-sm"
        style={{
          borderColor: currentTheme === 'dark' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
          boxShadow: currentTheme === 'dark' 
            ? '0 0 20px rgba(59, 130, 246, 0.2)' 
            : '0 4px 20px rgba(59, 130, 246, 0.15)',
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
          borderColor: currentTheme === 'dark' 
            ? ['rgba(59, 130, 246, 0.4)', 'rgba(168, 85, 247, 0.4)', 'rgba(59, 130, 246, 0.4)']
            : ['rgba(59, 130, 246, 0.3)', 'rgba(168, 85, 247, 0.3)', 'rgba(59, 130, 246, 0.3)']
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute bottom-1/3 right-16 w-24 h-24 border-2 rounded-full backdrop-blur-sm"
        style={{
          borderColor: currentTheme === 'dark' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.3)',
          boxShadow: currentTheme === 'dark' 
            ? '0 0 20px rgba(168, 85, 247, 0.2)' 
            : '0 4px 20px rgba(168, 85, 247, 0.15)',
        }}
        animate={{
          rotate: [360, 0],
          scale: [1, 0.8, 1],
          borderColor: currentTheme === 'dark'
            ? ['rgba(168, 85, 247, 0.4)', 'rgba(34, 197, 94, 0.4)', 'rgba(168, 85, 247, 0.4)']
            : ['rgba(168, 85, 247, 0.3)', 'rgba(34, 197, 94, 0.3)', 'rgba(168, 85, 247, 0.3)']
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="absolute bottom-40 left-16 w-20 h-20 border-2 rounded-md backdrop-blur-sm"
        style={{
          borderColor: currentTheme === 'dark' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)',
          boxShadow: currentTheme === 'dark' 
            ? '0 0 20px rgba(34, 197, 94, 0.2)' 
            : '0 4px 20px rgba(34, 197, 94, 0.15)',
        }}
        animate={{
          rotate: [0, -360],
          scale: [1, 1.1, 1],
          x: [0, 15, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Enhanced floating lines */}
      <motion.div
        className="absolute top-1/4 left-1/3 h-px backdrop-blur-sm"
        style={{
          width: '8rem',
          background: currentTheme === 'dark'
            ? 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.6), transparent)'
            : 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.4), transparent)',
          boxShadow: currentTheme === 'dark' 
            ? '0 0 10px rgba(59, 130, 246, 0.3)' 
            : '0 2px 10px rgba(59, 130, 246, 0.2)',
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
          scaleX: [1, 1.6, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-1/3 right-1/4 h-px backdrop-blur-sm"
        style={{
          width: '7rem',
          background: currentTheme === 'dark'
            ? 'linear-gradient(to right, transparent, rgba(168, 85, 247, 0.6), transparent)'
            : 'linear-gradient(to right, transparent, rgba(168, 85, 247, 0.4), transparent)',
          boxShadow: currentTheme === 'dark' 
            ? '0 0 10px rgba(168, 85, 247, 0.3)' 
            : '0 2px 10px rgba(168, 85, 247, 0.2)',
        }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scaleX: [1, 1.4, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />

      {/* Subtle animated grid pattern */}
      <motion.div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          backgroundImage: currentTheme === 'dark'
            ? `linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
               linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)`
            : `linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px),
               linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Corner accents */}
      <motion.div
        className="absolute top-10 right-10 w-32 h-32 rounded-full backdrop-blur-sm"
        style={{
          background: currentTheme === 'dark'
            ? 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(251, 146, 60, 0.08) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-10 left-10 w-28 h-28 rounded-full backdrop-blur-sm"
        style={{
          background: currentTheme === 'dark'
            ? 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Render children if provided */}
      {children && <div className="relative z-10">{children}</div>}
    </Container>
  )
})

AnimatedBackground.displayName = 'AnimatedBackground'

export { AnimatedBackground }
