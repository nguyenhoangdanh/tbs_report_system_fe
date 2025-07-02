"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RankingBadge } from "./ranking-badge"
import { EmployeeRankingData } from "@/services/ranking.service"

interface EmployeeRankingTableProps {
  employees: EmployeeRankingData[]
  showDepartment?: boolean
  showOffice?: boolean
  className?: string
}

export function EmployeeRankingTable({ 
  employees, 
  showDepartment = true,
  showOffice = false,
  className = ""
}: EmployeeRankingTableProps) {
  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có dữ liệu nhân viên
      </div>
    )
  }

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">#</TableHead>
            <TableHead>Nhân viên</TableHead>
            <TableHead>Mã NV</TableHead>
            {showDepartment && <TableHead>Phòng ban</TableHead>}
            {showOffice && <TableHead>Văn phòng</TableHead>}
            <TableHead>Công việc</TableHead>
            <TableHead>Tỷ lệ hoàn thành</TableHead>
            <TableHead>Xếp loại</TableHead>
            <TableHead>Báo cáo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((item, index) => (
            <TableRow key={item.employee.id}>
              <TableCell className="font-medium">
                {index + 1}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {item.employee.fullName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.employee.jobPosition.positionName}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {item.employee.employeeCode}
                </Badge>
              </TableCell>
              {showDepartment && (
                <TableCell>
                  <div className="text-sm">
                    {item.employee.jobPosition.department.name}
                  </div>
                </TableCell>
              )}
              {showOffice && (
                <TableCell>
                  <div className="text-sm">
                    {item.employee.office.name}
                  </div>
                </TableCell>
              )}
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">
                    {item.performance.completedTasks}/{item.performance.totalTasks} hoàn thành
                  </div>
                  <Progress 
                    value={item.performance.completionRate} 
                    className="h-2" 
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="text-right">
                  <div className="font-medium text-lg">
                    {item.performance.completionRate}%
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <RankingBadge 
                  ranking={item.performance.ranking}
                  size="sm"
                />
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {item.performance.totalReports} báo cáo
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
