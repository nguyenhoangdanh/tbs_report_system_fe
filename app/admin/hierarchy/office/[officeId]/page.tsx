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
import { ArrowLeft, Building2, RefreshCw, Calendar, Eye } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'
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

  return (
    <MainLayout
      title={data?.office?.name || 'Chi tiết văn phòng'}
      subtitle={`${data?.office?.description || data?.office?.type || ''} - Tuần ${selectedWeek}/${selectedYear}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'Báo cáo phân cấp', href: `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}` },
        { label: data?.office?.name || 'Chi tiết văn phòng' }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <Link href={`/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Quay lại báo cáo phân cấp</span>
                <span className="sm:hidden">Quay lại</span>
              </Button>
            </Link>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>
        </div>

        {/* Week/Year Selector */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Chi tiết văn phòng - Tuần {selectedWeek}/{selectedYear}
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium whitespace-nowrap">Tuần:</span>
                  <Select value={selectedWeek.toString()} onValueChange={handleWeekChange}>
                    <SelectTrigger className="w-20">
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
                  <span className="text-sm font-medium whitespace-nowrap">Năm:</span>
                  <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-24">
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
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Làm mới
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Office Summary - use backend calculated data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center p-6">
            <div className="text-2xl font-bold">{data?.summary?.totalDepartments || 0}</div>
            <div className="text-sm text-muted-foreground">Phòng ban</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-2xl font-bold">{data?.summary?.totalUsers || 0}</div>
            <div className="text-sm text-muted-foreground">Nhân viên</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-2xl font-bold text-green-600">{data?.summary?.totalUsersWithReports || 0}</div>
            <div className="text-sm text-muted-foreground">Đã nộp BC</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-2xl font-bold text-blue-600">{data?.summary?.averageSubmissionRate || 0}%</div>
            <div className="text-sm text-muted-foreground">Tỷ lệ nộp TB</div>
          </Card>
        </div>

        {/* Ranking Summary - use backend ranking data if available */}
        {data?.summary?.rankingDistribution && (
          <div className="mb-6">
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

        {/* Enhanced Departments List - use backend task completion rates */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết các phòng ban với xếp loại hiệu suất</CardTitle>
            <p className="text-sm text-muted-foreground">
              Hiệu suất được tính từ backend dựa trên tất cả nhân viên trong phòng ban
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {data?.departments?.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có phòng ban nào</p>
                </div>
              ) : (
                data?.departments?.map((dept: any, index: number) => {
                  // Use backend calculated taskCompletionRate directly
                  const taskCompletionRate = dept.stats?.taskCompletionRate || 0
                  const performanceBadge = getPerformanceBadge(taskCompletionRate)
                  const performanceColor = getPerformanceColor(taskCompletionRate)

                  return (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{dept.name}</h3>
                            <Badge className={performanceBadge.className}>
                              {performanceBadge.label}
                            </Badge>
                            <div className="text-sm font-medium" style={{ color: performanceColor.text }}>
                              {taskCompletionRate}%
                            </div>
                          </div>
                          {dept.description && (
                            <p className="text-sm text-muted-foreground mb-3">{dept.description}</p>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-semibold">{dept.stats?.totalUsers || 0}</div>
                              <div className="text-muted-foreground">Nhân viên</div>
                            </div>
                            <div>
                              <div className="font-semibold text-green-600">{dept.stats?.usersWithReports || 0}</div>
                              <div className="text-muted-foreground">Đã nộp BC</div>
                            </div>
                            <div>
                              <div className="font-semibold text-blue-600">{dept.stats?.usersWithCompletedReports || 0}</div>
                              <div className="text-muted-foreground">BC hoàn thành</div>
                            </div>
                            <div>
                              <div className="font-semibold text-purple-600">{dept.stats?.reportSubmissionRate || 0}%</div>
                              <div className="text-muted-foreground">Tỷ lệ nộp</div>
                            </div>
                          </div>

                          {/* Progress Bar - use backend calculated rate */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Hiệu suất phòng ban</span>
                              <span style={{ color: performanceColor.text }}>
                                {taskCompletionRate}%
                              </span>
                            </div>
                            <Progress value={taskCompletionRate} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 ml-4">
                          <SimplePieChart
                            completed={dept.stats?.usersWithReports || 0}
                            incomplete={(dept.stats?.totalUsers || 0) - (dept.stats?.usersWithReports || 0)}
                            size={60}
                            strokeWidth={6}
                          />
                          
                          <Link href={`/admin/hierarchy/department/${dept.id}?weekNumber=${selectedWeek}&year=${selectedYear}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">Chi tiết</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải chi tiết văn phòng..." />
        </div>
      </MainLayout>
    }>
      <OfficeDetailsContent />
    </Suspense>
  )
}
