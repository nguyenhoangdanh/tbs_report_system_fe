import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { safeString, safeNumber, safeArray } from '@/utils/type-guards'

interface IncompleteReasonsProps {
  reasons: any[]
}

export const IncompleteReasons = memo(function IncompleteReasons({ reasons }: IncompleteReasonsProps) {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return null
  }

  return (
    <div className="mt-4">
      <h6 className="flex items-center gap-2 text-sm font-medium mb-3">
        <Clock className="w-4 h-4 text-orange-600" />
        Lý do chưa hoàn thành
      </h6>
      <div className="space-y-2">
        {reasons.map((reason: any, index: number) => {
          const reasonText = safeString(reason?.reason, 'Không có lý do')
          const reasonCount = safeNumber(reason?.count, 0)
          const reasonTasks = safeArray(reason?.tasks, [])
          
          return (
            <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-xs dark:bg-orange-950/20 dark:border-orange-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-orange-800 dark:text-orange-300">{reasonText}</span>
                <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs">
                  {reasonCount} task
                </Badge>
              </div>
              <div className="text-orange-700 dark:text-orange-400">
                <strong>Tasks:</strong> {reasonTasks.join(', ') || 'Không có task'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
