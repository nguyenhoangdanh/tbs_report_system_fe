import { z } from 'zod'
import { EvaluationType } from '@/types'

export const evaluationFormSchema = z.object({
  evaluatedIsCompleted: z.boolean({
    required_error: 'Vui lòng chọn trạng thái hoàn thành',
  }),
  evaluatedReasonNotDone: z.string().optional(),
  evaluatorComment: z.string().optional(),
  evaluationType: z.nativeEnum(EvaluationType, {
    required_error: 'Vui lòng chọn loại đánh giá',
  }),
}).refine((data) => {
  // If not completed, reason should be provided
  if (!data.evaluatedIsCompleted && !data.evaluatedReasonNotDone?.trim()) {
    return false
  }
  return true
}, {
  message: 'Vui lòng nhập nguyên nhân khi công việc chưa hoàn thành',
  path: ['evaluatedReasonNotDone'],
})

export type EvaluationFormData = z.infer<typeof evaluationFormSchema>
