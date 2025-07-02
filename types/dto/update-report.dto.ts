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
  sunday?: boolean
  isCompleted?: boolean
  reasonNotDone?: string
}
