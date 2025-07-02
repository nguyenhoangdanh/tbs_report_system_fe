"use client"

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Search, RefreshCw, Users, Building, Calendar, Download, Mail, CheckCircle } from 'lucide-react'
import { AppLoading } from '@/components/ui/app-loading'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useEmployeesWithoutReports } from '@/hooks/use-hierarchy'

interface EmployeesWithoutReportsProps {
  weekNumber: number
  year: number
}

export function EmployeesWithoutReports({ 
  weekNumber, 
  year
}: EmployeesWithoutReportsProps) {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOffice, setSelectedOffice] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const limit = 20

  // Simplified query - chỉ week và year
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useEmployeesWithoutReports({
    weekNumber,
    year,
    officeId: selectedOffice === 'all' ? undefined : selectedOffice,
    departmentId: selectedDepartment === 'all' ? undefined : selectedDepartment,
    page,
    limit,
  })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [weekNumber, year, selectedOffice, selectedDepartment, searchTerm])

  // Simplified filtering
  const processedEmployees = useMemo(() => {
    if (!data?.employees) return []
    
    let filtered = [...data.employees]
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(employee => 
        employee.fullName.toLowerCase().includes(term) ||
        employee.employeeCode.toLowerCase().includes(term) ||
        employee.jobPosition.department.name.toLowerCase().includes(term) ||
        employee.office.name.toLowerCase().includes(term) ||
        (employee.email && employee.email.toLowerCase().includes(term))
      )
    }
    
    return filtered
  }, [data?.employees, searchTerm])

  // Get unique offices and departments for filters
  const { offices, departments } = useMemo(() => {
    if (!data?.employees) return { offices: [], departments: [] }
    
    const officesMap = new Map()
    const departmentsMap = new Map()
    
    data.employees.forEach(employee => {
      officesMap.set(employee.office.id, employee.office)
      departmentsMap.set(employee.jobPosition.department.id, employee.jobPosition.department)
    })
    
    return {
      offices: Array.from(officesMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      departments: Array.from(departmentsMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    }
  }, [data?.employees])

  // Simplified handlers
  const handleOfficeChange = useCallback((value: string) => {
    setSelectedOffice(value)
    setPage(1)
  }, [])

  const handleDepartmentChange = useCallback((value: string) => {
    setSelectedDepartment(value)
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleRefresh = () => {
    refetch()
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedOffice('all')
    setSelectedDepartment('all')
    setPage(1)
  }

  // Simplified export
  const handleExport = useCallback(() => {
    if (!processedEmployees.length) return
    
    const csvData = processedEmployees.map(emp => ({
      'Mã NV': emp.employeeCode,
      'Tên nhân viên': emp.fullName,
      'Email': emp.email || '',
      'Phòng ban': emp.jobPosition.department.name,
      'Văn phòng': emp.office.name,
      'Chức vụ': emp.jobPosition.jobName,
      'Ngày quá hạn': emp.daysOverdue || 0,
      'Tuần': `${weekNumber}/${year}`
    }))
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `nhan-vien-chua-nop-bao-cao-tuan-${weekNumber}-${year}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Đã xuất dữ liệu thành công')
  }, [processedEmployees, weekNumber, year])

  if (isLoading) {
    return <AppLoading text="Đang tải danh sách nhân viên chưa nộp báo cáo..." />
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-red-600 mb-4">{(error as any)?.message || 'Có lỗi xảy ra'}</p>
          <Button onClick={handleRefresh} variant="outline">
            Thử lại
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Simplified Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Nhân viên chưa nộp báo cáo
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Tuần {weekNumber}/{year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!processedEmployees.length}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Xuất CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Simplified Summary Stats */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{data.summary.totalActiveUsers}</div>
              <div className="text-sm text-muted-foreground">Tổng nhân viên</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{data.summary.usersWithReports}</div>
              <div className="text-sm text-muted-foreground">Đã nộp báo cáo</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">{data.summary.usersWithoutReports}</div>
              <div className="text-sm text-muted-foreground">Chưa nộp báo cáo</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{data.summary.submissionRate}%</div>
              <div className="text-sm text-muted-foreground">Tỷ lệ nộp</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Simplified Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm nhân viên..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedOffice} onValueChange={handleOfficeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả văn phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả văn phòng</SelectItem>
                {offices.map(office => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={resetFilters} className="w-full">
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simplified Employees List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách nhân viên ({data?.summary.usersWithoutReports})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processedEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedOffice !== 'all' || selectedDepartment !== 'all' ? (
                <div>
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Không tìm thấy nhân viên nào phù hợp với bộ lọc</p>
                </div>
              ) : (
                <div>
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>Tuyệt vời! Tất cả nhân viên đã nộp báo cáo</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {processedEmployees.map((employee, index) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{employee.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.employeeCode} • {employee.jobPosition.jobName}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {employee.jobPosition.department.name} - {employee.office.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="mb-1">
                      {employee.daysOverdue > 0 ? `Trễ ${employee.daysOverdue} ngày` : 'Chưa nộp'}
                    </Badge>
                    {employee.email && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simplified Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Trang {data.pagination.page} / {data.pagination.totalPages}
                ({data.pagination.total} nhân viên)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
