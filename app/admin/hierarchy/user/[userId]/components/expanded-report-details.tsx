import { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReportDetailsForAdmin } from '@/hooks/use-hierarchy'
import { ReportTaskItem } from './report-task-item'
import { IncompleteReasons } from './incomplete-reasons'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ExpandedReportDetailsProps {
  userId: string
  reportId: string
}

export const ExpandedReportDetails = memo(function ExpandedReportDetails({
  userId,
  reportId,
}: ExpandedReportDetailsProps) {
  const { data: reportData, isLoading, error } = useReportDetailsForAdmin(userId, reportId)
  return (
    <div className="mt-4">
      <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 space-y-4"
          >
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            )}

            {error && (
              <div className="text-center py-4 text-red-600 text-sm">
                Không thể tải chi tiết báo cáo
              </div>
            )}

            {reportData && (
              <>
                {Array.isArray(reportData.report?.tasks) && reportData.report.tasks.length > 0 ? (
                  <div className="space-y-2">
                    <h6 className="text-sm font-medium">
                      Danh sách công việc ({reportData.report.tasks.length})
                    </h6>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {reportData.report.tasks.map((task: any, index: number) => (
                        <ReportTaskItem key={task?.id || index} task={task} index={index} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Không có công việc nào trong báo cáo này</p>
                  </div>
                )}

                <IncompleteReasons reasons={reportData.stats?.incompleteReasons || []} />
              </>
            )}
          </motion.div>
      </AnimatePresence>
    </div>
  )
})
