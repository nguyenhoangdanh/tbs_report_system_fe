export interface CreateWeeklyReportDto {
  weekNumber: number
  year: number
  tasks: CreateTaskReportDto[]
}

export interface CreateTaskReportDto {
  taskName: string
  monday?: boolean
  tuesday?: boolean
  wednesday?: boolean
  thursday?: boolean
  friday?: boolean
  saturday?: boolean
  isCompleted?: boolean
  reasonNotDone?: string
}
