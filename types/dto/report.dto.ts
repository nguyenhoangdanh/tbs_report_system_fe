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

export interface UpdateReportDto {
  tasks?: UpdateTaskDto[]
  isCompleted?: boolean
}

export interface UpdateTaskDto {
  id?: string
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
