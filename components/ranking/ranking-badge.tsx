import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Trophy, Award, Medal, Target, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export enum EmployeeRanking {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD', 
  AVERAGE = 'AVERAGE',
  BELOW_AVERAGE = 'BELOW_AVERAGE',
  POOR = 'POOR'
}

interface RankingBadgeProps {
  ranking: EmployeeRanking
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export const RankingBadge = memo(function RankingBadge({
  ranking,
  size = 'md',
  showIcon = false,
  className
}: RankingBadgeProps) {
  
  const getRankingConfig = (ranking: EmployeeRanking) => {
    switch (ranking) {
      case EmployeeRanking.EXCELLENT:
        return {
          label: 'GIỎI',
          icon: <Trophy className="w-4 h-4" />,
          className: 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
        }
      case EmployeeRanking.GOOD:
        return {
          label: 'KHÁ',
          icon: <Award className="w-4 h-4" />,
          className: 'bg-green-500 text-white border-green-500 hover:bg-green-600'
        }
      case EmployeeRanking.AVERAGE:
        return {
          label: 'TB',
          icon: <Medal className="w-4 h-4" />,
          className: 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600'
        }
      case EmployeeRanking.BELOW_AVERAGE:
        return {
          label: 'YẾU',
          icon: <Target className="w-4 h-4" />,
          className: 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
        }
      case EmployeeRanking.POOR:
        return {
          label: 'KÉM',
          icon: <AlertTriangle className="w-4 h-4" />,
          className: 'bg-red-600 text-white border-red-600 hover:bg-red-700'
        }
      default:
        return {
          label: 'N/A',
          icon: <Target className="w-4 h-4" />,
          className: 'bg-gray-100 text-gray-800 border-gray-400'
        }
    }
  }

  const config = getRankingConfig(ranking)
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm', 
    lg: 'px-4 py-2 text-base'
  }

  return (
    <Badge
      className={cn(
        'font-semibold flex items-center gap-1',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </Badge>
  )
})
