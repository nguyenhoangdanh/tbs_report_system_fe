'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  className?: string
  loading?: boolean
}

export function AnimatedButton({ 
  children, 
  variant = 'default', 
  className = '',
  loading = false,
  ...props 
}: AnimatedButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-700 hover:via-green-800 hover:to-emerald-800 text-white border-0 shadow-lg hover:shadow-xl'
      default:
        return ''
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        variant={variant === 'gradient' ? 'default' : variant}
        className={`${getVariantClasses()} ${className} transition-all duration-300 relative overflow-hidden`}
        disabled={loading}
        {...props}
      >
        {loading && (
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        )}
        <span className="relative flex items-center gap-2">
          {loading && (
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
          {children}
        </span>
      </Button>
    </motion.div>
  )
}
