'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  delay?: number
  className?: string
  hover?: boolean
}

export function AnimatedCard({ children, delay = 0, className = '', hover = true }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={hover ? { 
        y: -5,
        transition: { duration: 0.2 }
      } : {}}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedCardWithContentProps {
  title: string
  description?: string
  children: ReactNode
  delay?: number
  className?: string
  icon?: ReactNode
  gradient?: boolean
}

export function AnimatedCardWithContent({ 
  title, 
  description, 
  children, 
  delay = 0, 
  className = '',
  icon,
  gradient = false
}: AnimatedCardWithContentProps) {
  return (
    <AnimatedCard delay={delay} className={className}>
      <Card className={`h-full transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${
        gradient ? 'bg-gradient-to-br from-white via-blue-50 to-indigo-50' : 'bg-white'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            {icon && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, type: "spring" }}
                className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white"
              >
                {icon}
              </motion.div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-gray-600 mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </AnimatedCard>
  )
}
