"use client"

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Search, RefreshCw, Users, Building, Calendar, Download, Filter, X } from 'lucide-react'
import { AppLoading } from '@/components/ui/app-loading'
import { motion } from 'framer-motion'
import { toast } from 'react-toast-kit'
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
  const [showFilters, setShowFilters] = useState(false)
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

  // Simplified filtering with proper null checks
  const processedEmployees = useMemo(() => {
    if (!data?.employees || !Array.isArray(data.employees)) return []
    
    let filtered = [...data.employees]
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(employee => 
        employee?.fullName?.toLowerCase().includes(term) ||
        employee?.employeeCode?.toLowerCase().includes(term) ||
        employee?.jobPosition?.department?.name?.toLowerCase().includes(term) ||
        employee?.office?.name?.toLowerCase().includes(term) ||
        (employee?.email && employee.email.toLowerCase().includes(term))
      )
    }
    
    return filtered
  }, [data?.employees, searchTerm])

  // Get unique offices and departments for filters with null checks
  const { offices, departments } = useMemo(() => {
    if (!data?.employees || !Array.isArray(data.employees)) {
      return { offices: [], departments: [] }
    }
    
    const officesMap = new Map()
    const departmentsMap = new Map()
    
    data.employees.forEach(employee => {
      if (employee?.office?.id && employee.office.name) {
        officesMap.set(employee.office.id, employee.office)
      }
      if (employee?.jobPosition?.department?.id && employee.jobPosition.department.name) {
        departmentsMap.set(employee.jobPosition.department.id, employee.jobPosition.department)
      }
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

  // Simplified export with null checks
  const handleExport = useCallback(() => {
    if (!processedEmployees.length) {
      toast.error('Không có dữ liệu để xuất')
      return
    }
    
    try {
      const csvData = processedEmployees.map(emp => ({
        'Mã NV': emp?.employeeCode || '',
        'Tên nhân viên': emp?.fullName || '',
        'Email': emp?.email || '',
        'Phòng ban': emp?.jobPosition?.department?.name || '',
        'Văn phòng': emp?.office?.name || '',
        'Chức vụ': emp?.jobPosition?.jobName || '',
        'Ngày quá hạn': emp?.daysOverdue || 0,
        'Tuần': `${weekNumber}/${year}`
      }))
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(','))
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
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Có lỗi khi xuất dữ liệu')
    }
  }, [processedEmployees, weekNumber, year])

  if (isLoading) {
    return <AppLoading text="Đang tải danh sách nhân viên chưa nộp báo cáo..." />
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 sm:p-8 text-center">
          <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-red-800 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-sm sm:text-base text-red-600 mb-4">{(error as any)?.message || 'Có lỗi xảy ra'}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Thử lại
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Safe access to summary data
  const summary = data?.summary || {
    totalActiveUsers: 0,
    usersWithReports: 0,
    usersWithoutReports: 0,
    submissionRate: 0
  }

  // Safe access to pagination data
  const pagination = data?.pagination || {
    totalPages: 1,
    currentPage: 1
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Mobile-Optimized Header */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                <span className="truncate">Nhân viên chưa nộp báo cáo</span>
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Tuần {weekNumber}/{year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </Button>
              {processedEmployees.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Xuất CSV</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mobile-Optimized Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{summary.totalActiveUsers}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Tổng nhân viên</div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 text-green-600" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{summary.usersWithReports}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Đã nộp BC</div>
          </CardContent>
        </Card> */}

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 text-red-600" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{summary.usersWithoutReports}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Chưa nộp BC</div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Building className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 text-purple-600" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{summary.submissionRate}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Tỷ lệ nộp</div>
          </CardContent>
        </Card> */}
      </div>

      {/* Mobile-Optimized Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 sm:pl-10 text-xs sm:text-sm"
            />
          </div>

          {/* Mobile Filter Toggle */}
          <div className="flex items-center justify-between mb-3 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs"
            >
              <Filter className="w-3 h-3" />
              Bộ lọc
              {(selectedOffice !== 'all' || selectedDepartment !== 'all') && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {[selectedOffice !== 'all' ? 1 : 0, selectedDepartment !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {processedEmployees.length} nhân viên
            </span>
          </div>

          {/* Filter Controls - Collapsible on mobile */}
          <div className={`${showFilters ? 'block' : 'hidden sm:block'} space-y-3 sm:space-y-0`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <Select value={selectedOffice} onValueChange={handleOfficeChange}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Tất cả văn phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả văn phòng</SelectItem>
                  {offices.map(office => (
                    <SelectItem key={office.id} value={office.id}>
                      <span className="truncate">{office.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Tất cả phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng ban</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      <span className="truncate">{dept.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters} size="sm" className="text-xs sm:text-sm">
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Xóa bộ lọc
              </Button>
            </div>

            {/* Active Filters Display on Mobile */}
            {(selectedOffice !== 'all' || selectedDepartment !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-3 sm:hidden">
                {selectedOffice !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    VP: {offices.find(o => o.id === selectedOffice)?.name}
                    <button 
                      onClick={() => handleOfficeChange('all')}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedDepartment !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    PB: {departments.find(d => d.id === selectedDepartment)?.name}
                    <button 
                      onClick={() => handleDepartmentChange('all')}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Desktop summary */}
          <div className="hidden sm:flex items-center justify-between mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">
              Hiển thị {processedEmployees.length} / {summary.usersWithoutReports} nhân viên
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="text-xs sm:text-sm"
              >
                Trước
              </Button>
              <span className="px-2 py-1 text-xs sm:text-sm">
                {page}/{pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="text-xs sm:text-sm"
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      {processedEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
              Không có nhân viên nào chưa nộp báo cáo
            </h3>
            <p className="text-sm text-muted-foreground">
              Tất cả nhân viên đã nộp báo cáo cho tuần {weekNumber}/{year}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Danh sách nhân viên chưa nộp báo cáo ({processedEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {processedEmployees.map((employee, index) => (
                <motion.div
                  key={employee.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm sm:text-base truncate">
                          {employee.fullName || 'N/A'}
                        </h4>
                        <Badge variant="destructive" className="text-xs">
                          Chưa nộp
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs sm:text-sm text-muted-foreground">
                        <div className="truncate">
                          <span className="font-medium">Mã NV:</span> {employee.employeeCode || 'N/A'}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Email:</span> {employee.email || 'N/A'}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Phòng ban:</span> {employee.jobPosition?.department?.name || 'N/A'}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Văn phòng:</span> {employee.office?.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {employee.daysOverdue && employee.daysOverdue > 0 && (
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-semibold text-red-600">
                          {employee.daysOverdue} ngày
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Quá hạn
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile Pagination */}
            <div className="flex items-center justify-center gap-2 mt-4 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="text-xs"
              >
                Trước
              </Button>
              <span className="px-3 py-1 text-xs bg-muted rounded">
                {page}/{pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="text-xs"
              >
                Sau
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
