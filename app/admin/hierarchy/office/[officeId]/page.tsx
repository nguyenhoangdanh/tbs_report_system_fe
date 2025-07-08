"use client"

import { Suspense, useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useCurrentWeekFilters } from '@/hooks/use-hierarchy'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { ArrowLeft, Building2, RefreshCw, Calendar, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toast-kit'
import { HierarchyService } from '@/services/hierarchy.service'
import { getCurrentWeek } from '@/utils/week-utils'
import { RankingSummaryCard } from '@/components/hierarchy/ranking-summary-card'
import { getPerformanceBadge, getPerformanceColor } from '@/utils/performance-classification'
import { Progress } from '@/components/ui/progress'

function OfficeDetailsContent() {
  const { user } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get current week/year with guaranteed fallbacks
  const currentWeekData = useCurrentWeekFilters()
  const currentWeekInfo = getCurrentWeek()
  const currentWeek = currentWeekInfo.weekNumber
  const currentYear = currentWeekData.year ?? currentWeekInfo.year
  
  const officeId = params?.officeId as string
  
  // Get week/year from URL params with simple fallbacks
  const urlWeek = searchParams.get('weekNumber')
  const urlYear = searchParams.get('year')
  
  const [selectedWeek, setSelectedWeek] = useState<number>(
    urlWeek ? parseInt(urlWeek) || currentWeek : currentWeek
  )
  
  const [selectedYear, setSelectedYear] = useState<number>(
    urlYear ? parseInt(urlYear) || currentYear : currentYear
  )

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Mobile UI state
  const [showFilters, setShowFilters] = useState(false)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())

  // Update URL when week/year changes
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('weekNumber', selectedWeek.toString())
    params.set('year', selectedYear.toString())
    const newUrl = `/admin/hierarchy/office/${officeId}?${params.toString()}`
    router.replace(newUrl)
  }, [selectedWeek, selectedYear, officeId, router])

  // Update state when URL params change (from parent navigation)
  useEffect(() => {
    if (urlWeek && urlYear) {
      const parsedWeek = parseInt(urlWeek)
      const parsedYear = parseInt(urlYear)
      
      if (parsedWeek >= 1 && parsedWeek <= 53) {
        setSelectedWeek(parsedWeek)
      }
      if (parsedYear >= 2020 && parsedYear <= 2030) {
        setSelectedYear(parsedYear)
      }
    }
  }, [urlWeek, urlYear])

  const fetchOfficeDetails = async () => {
    if (!officeId) return
    
    try {
      setIsLoading(true)
      setError(null)

      const response = await HierarchyService.getOfficeDetails(officeId, {
        weekNumber: selectedWeek,
        year: selectedYear
      })

      console.log('[OFFICE DETAILS] API Response:', response)
      setData(response)
    } catch (err: any) {
      console.error('[OFFICE DETAILS] Error:', err)
      setError(err.message || 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch when filters change
  useEffect(() => {
    if (officeId && selectedWeek && selectedYear) {
      fetchOfficeDetails()
    }
  }, [officeId, selectedWeek, selectedYear])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ 
        queryKey: ['hierarchy', 'office-details', officeId] 
      })
      await fetchOfficeDetails()
      toast.success('Dữ liệu đã được cập nhật')
    } catch (error) {
      toast.error('Có lỗi khi cập nhật dữ liệu')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleWeekChange = (value: string) => {
    const week = parseInt(value)
    if (week >= 1 && week <= 53) {
      setSelectedWeek(week)
    }
  }

  const handleYearChange = (value: string) => {
    const year = parseInt(value)
    if (year >= 2020 && year <= 2030) {
      setSelectedYear(year)
    }
  }

  // Generate dynamic year options
  const generateYearOptions = () => {
    const years = []
    const startYear = currentYear - 2
    const endYear = currentYear + 2
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year)
    }
    return years
  }

  // Generate role-appropriate breadcrumb and back URL
  const getBreadcrumbItems = () => {
    const items = [];

    // if (user?.role && !['SUPERADMIN', 'ADMIN'].includes(user.role)) {
    //   items.push({ label: 'Dashboard', href: '/dashboard' })
    // }
    
    // // Only show Admin breadcrumb for roles that can access admin area
    // if (user?.role && ['SUPERADMIN', 'ADMIN'].includes(user.role)) {
    //   items.push({ label: 'Admin', href: '/admin/hierarchy' })
    // }
    
    items.push({ 
      label: 'Báo cáo KH & KQCV', 
      href: `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}` 
    })
    items.push({ 
      label: data?.office?.name || 'Chi tiết văn phòng',
      href: `/admin/hierarchy/office/${officeId}?weekNumber=${selectedWeek}&year=${selectedYear}`
    })
    
    return items
  }

  const getBackUrl = () => {
    const userRole = user?.role
    
    // OFFICE_MANAGER should only be able to access their own office
    // They shouldn't go back to general hierarchy page
    if (userRole === 'OFFICE_MANAGER') {
      return '/dashboard'
    }
    
    // ADMIN and SUPERADMIN can go back to hierarchy page
    if (userRole && ['SUPERADMIN', 'ADMIN'].includes(userRole)) {
      return `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}`
    }
    
    // Default fallback
    return '/dashboard'
  }

  const getBackButtonText = () => {
    const userRole = user?.role
    
    if (userRole === 'OFFICE_MANAGER') {
      return 'Về Dashboard'
    }
    return 'Quay lại báo cáo KH & KQCV'
  }

  // Mobile utility functions
  const toggleDepartmentExpansion = (deptId: string) => {
    const newExpanded = new Set(expandedDepts)
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId)
    } else {
      newExpanded.add(deptId)
    }
    setExpandedDepts(newExpanded)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <AppLoading text="Đang tải chi tiết văn phòng..." />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout
        title="Lỗi tải dữ liệu"
        showBreadcrumb
        breadcrumbItems={getBreadcrumbItems()}
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
              <Building2 className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-red-800 mb-2">Không thể tải dữ liệu</h2>
              <p className="text-sm sm:text-base text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      title={data?.office?.name || 'Chi tiết văn phòng'}
      subtitle={`${data?.office?.description || data?.office?.type || ''} - Tuần ${selectedWeek}/${selectedYear}`}
      showBreadcrumb
      breadcrumbItems={getBreadcrumbItems()}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
        {/* Mobile-Optimized Header Actions */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link href={getBackUrl()}>
              <Button variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">{getBackButtonText()}</span>
              </Button>
            </Link>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm">{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </Button>
          </div>
        </div>

        {/* Mobile-Optimized Week/Year Selector */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Chi tiết văn phòng - </span>
                  <span>Tuần {selectedWeek}/{selectedYear}</span>
                </CardTitle>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden flex items-center gap-1"
                >
                  <span className="text-xs">Chọn tuần</span>
                  {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              </div>

              {/* Mobile Collapsible Filters */}
              <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Tuần:</span>
                    <Select value={selectedWeek.toString()} onValueChange={handleWeekChange}>
                      <SelectTrigger className="w-full sm:w-20 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 53 }, (_, i) => i + 1).map(week => (
                          <SelectItem key={week} value={week.toString()}>
                            {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Năm:</span>
                    <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                      <SelectTrigger className="w-full sm:w-24 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {generateYearOptions().map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="col-span-2 sm:col-span-1 sm:w-auto flex items-center gap-2 justify-center text-xs sm:text-sm"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    Làm mới
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Mobile-Optimized Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{data?.summary?.totalDepartments || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Phòng ban</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{data?.summary?.totalUsers || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Nhân viên</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{data?.summary?.totalUsersWithReports || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Đã nộp BC</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{data?.summary?.averageSubmissionRate || 0}%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Tỷ lệ nộp TB</div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking Summary */}
        {data?.summary?.rankingDistribution && (
          <div className="mb-4 sm:mb-6">
            <RankingSummaryCard
              title="Xếp loại các phòng ban"
              data={{
                totalEntities: data.departments?.length || 0,
                averageCompletionRate: data.summary.averageCompletionRate,
                ranking: data.summary.rankingDistribution
              }}
              entityType="departments"
            />
          </div>
        )}

        {/* Mobile-Optimized Departments List */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base lg:text-lg">Chi tiết các phòng ban với xếp loại hiệu suất</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Hiệu suất được tính từ backend dựa trên tất cả nhân viên trong phòng ban
            </p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4">
              {data?.departments?.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">Không có phòng ban nào</p>
                </div>
              ) : (
                data?.departments?.map((dept: any, index: number) => {
                  const taskCompletionRate = dept.stats?.taskCompletionRate || 0
                  const performanceBadge = getPerformanceBadge(taskCompletionRate)
                  const performanceColor = getPerformanceColor(taskCompletionRate)
                  const isExpanded = expandedDepts.has(dept.id)

                  return (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border rounded-lg overflow-hidden"
                    >
                      {/* Mobile Header - Always visible */}
                      <div className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate">{dept.name}</h3>
                            <Badge className={`${performanceBadge.className} text-xs`}>
                              {performanceBadge.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-xs sm:text-sm font-medium" style={{ color: performanceColor.text }}>
                              {taskCompletionRate}%
                            </div>
                            
                            {/* Mobile Expand/Collapse */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleDepartmentExpansion(dept.id)}
                              className="sm:hidden w-8 h-8 p-0"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>

                        {/* Progress Bar - Always visible */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Hiệu suất phòng ban</span>
                            <span style={{ color: performanceColor.text }}>
                              {taskCompletionRate}%
                            </span>
                          </div>
                          <Progress value={taskCompletionRate} className="h-1.5 sm:h-2" />
                        </div>

                        {/* Quick Stats - Always visible on mobile in compact format */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm mb-3">
                          <div className="text-center sm:text-left">
                            <div className="font-semibold">{dept.stats?.totalUsers || 0}</div>
                            <div className="text-muted-foreground">Nhân viên</div>
                          </div>
                          <div className="text-center sm:text-left">
                            <div className="font-semibold text-green-600">{dept.stats?.usersWithReports || 0}</div>
                            <div className="text-muted-foreground">Đã nộp BC</div>
                          </div>
                          <div className="text-center sm:text-left">
                            <div className="font-semibold text-blue-600">{dept.stats?.usersWithCompletedReports || 0}</div>
                            <div className="text-muted-foreground">BC hoàn thành</div>
                          </div>
                          <div className="text-center sm:text-left">
                            <div className="font-semibold text-purple-600">{dept.stats?.reportSubmissionRate || 0}%</div>
                            <div className="text-muted-foreground">Tỷ lệ nộp</div>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <SimplePieChart
                              completedPercentage={dept.stats?.reportSubmissionRate || 0}
                              size={40}
                              strokeWidth={4}
                              className="sm:w-[60px] sm:h-[60px]"
                            />
                            
                            {/* Department description - desktop only or expanded mobile */}
                            {dept.description && (
                              <p className={`text-xs sm:text-sm text-muted-foreground ${
                                isExpanded ? 'block' : 'hidden sm:block'
                              } flex-1 min-w-0`}>
                                {dept.description}
                              </p>
                            )}
                          </div>
                          
                          <Link href={`/admin/hierarchy/department/${dept.id}?weekNumber=${selectedWeek}&year=${selectedYear}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm">
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">Chi tiết</span>
                              <span className="sm:hidden">Xem</span>
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Mobile Expanded Details */}
                      {isExpanded && (
                        <div className="border-t bg-muted/20 p-3 sm:hidden">
                          {dept.description && (
                            <div className="mb-3">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Mô tả:</div>
                              <p className="text-xs text-muted-foreground">{dept.description}</p>
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            <div>Nhân viên: <span className="font-medium">{dept.stats?.totalUsers || 0}</span></div>
                            <div>Đã nộp: <span className="font-medium text-green-600">{dept.stats?.usersWithReports || 0}</span></div>
                            <div>Hoàn thành: <span className="font-medium text-blue-600">{dept.stats?.usersWithCompletedReports || 0}</span></div>
                            <div>Tỷ lệ: <span className="font-medium text-purple-600">{dept.stats?.reportSubmissionRate || 0}%</span></div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function OfficeDetailsPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <AppLoading text="Đang tải chi tiết văn phòng..." />
        </div>
      </MainLayout>
    }>
      <OfficeDetailsContent />
    </Suspense>
  )
}
