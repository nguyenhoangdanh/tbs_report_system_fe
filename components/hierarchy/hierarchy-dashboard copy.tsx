"use client"

import { memo, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/providers/auth-provider'
import { useMyHierarchyView } from '@/hooks/use-hierarchy'
import { getCurrentWeek } from '@/utils/week-utils'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { ResponsiveGrid } from '@/components/ui/responsive-grid'
import { PerformanceContainer } from '@/components/ui/performance-container'
import { ErrorMessage } from '@/components/ui/error-message'
import { HierarchySummaryCards } from './hierarchy-summary-cards'
import { PositionGroupsList } from './position-groups-list'
import { 
  Calendar, 
  Filter, 
  RefreshCw, 
  Users, 
  Building, 
  Award,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Eye
} from 'lucide-react'

// WeekFilters component
const WeekFilters = memo(({ 
  weekNumber, 
  year, 
  onWeekChange, 
  onYearChange 
}: {
  weekNumber: number
  year: number
  onWeekChange: (week: number) => void
  onYearChange: (year: number) => void
}) => {
  const currentWeek = getCurrentWeek()
  
  const yearOptions = useMemo(() => [
    currentWeek.year - 1,
    currentWeek.year,
    currentWeek.year + 1
  ], [currentWeek.year])

  const weekOptions = useMemo(() => 
    Array.from({ length: 53 }, (_, i) => i + 1)
  , [])

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium hidden sm:inline">Bộ lọc:</span>
      </div>
      
      <Select value={weekNumber.toString()} onValueChange={(value) => onWeekChange(parseInt(value))}>
        <SelectTrigger className="w-20 sm:w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {weekOptions.map(week => (
            <SelectItem key={week} value={week.toString()}>
              T{week}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
        <SelectTrigger className="w-20 sm:w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map(year => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
})

WeekFilters.displayName = 'WeekFilters'

// Main hierarchy dashboard component
const HierarchyDashboard = memo(() => {
  const { user } = useAuth()
  const currentWeekInfo = useMemo(() => getCurrentWeek(), [])
  
  const [selectedWeek, setSelectedWeek] = useState(currentWeekInfo.weekNumber)
  const [selectedYear, setSelectedYear] = useState(currentWeekInfo.year)
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'ranking'>('overview')

  // Data hooks - FIX: Always call hooks in the same order
  const { 
    data: hierarchyData, 
    isLoading: hierarchyLoading, 
    error: hierarchyError,
    refetch: refetchHierarchy
  } = useMyHierarchyView({ 
    weekNumber: selectedWeek, 
    year: selectedYear 
  })

  // Memoized user permissions
  const userPermissions = useMemo(() => {
    const isManager = user && ['ADMIN', 'SUPERADMIN', 'OFFICE_MANAGER'].includes(user.role)
    const isAdmin = user && ['ADMIN', 'SUPERADMIN'].includes(user.role)
    const canViewRanking = user && ['ADMIN', 'SUPERADMIN', 'OFFICE_MANAGER'].includes(user.role)
    
    return { isManager, isAdmin, canViewRanking }
  }, [user?.role])

  // Event handlers
  const handleWeekChange = useCallback((week: number) => {
    setSelectedWeek(week)
  }, [])

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year)
  }, [])

  const handleRefresh = useCallback(() => {
    refetchHierarchy()
  }, [refetchHierarchy])

  // Extract data from hierarchy response - FIX: Handle undefined data safely
  const { positions, jobPositions, summary } = useMemo(() => {
    if (!hierarchyData) {
      return { positions: [], jobPositions: [], summary: null }
    }

    if (hierarchyData.groupBy === 'mixed' && hierarchyData.data) {
      const positions = hierarchyData.data.filter((item: any) => item.type === 'position')
      const jobPositions = hierarchyData.data.filter((item: any) => item.type === 'jobPosition')
      return { positions, jobPositions, summary: hierarchyData.summary }
    }
    
    return { 
      positions: hierarchyData.positions || [], 
      jobPositions: hierarchyData.jobPositions || [],
      summary: hierarchyData.summary 
    }
  }, [hierarchyData])

  // Loading state
  if (hierarchyLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="card" count={3} />
        <LoadingSkeleton type="list" count={1} />
      </div>
    )
  }

  // Error state
  if (hierarchyError) {
    return (
      <ErrorMessage 
        message="Không thể tải dữ liệu hierarchy" 
        details={hierarchyError.message}
        onRetry={handleRefresh}
      />
    )
  }

  // No data state
  if (!hierarchyData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
          <p className="text-muted-foreground mb-4">
            Chưa có dữ liệu hierarchy cho tuần {selectedWeek}/{selectedYear}
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Báo cáo Hierarchy
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Quản lý và theo dõi báo cáo theo cấu trúc tổ chức
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <WeekFilters
                weekNumber={selectedWeek}
                year={selectedYear}
                onWeekChange={handleWeekChange}
                onYearChange={handleYearChange}
              />
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="hidden sm:inline-flex">
                  <Calendar className="w-3 h-3 mr-1" />
                  Tuần {selectedWeek}/{selectedYear}
                </Badge>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Làm mới</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <HierarchySummaryCards summary={summary} />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Tổng quan</span>
            <span className="sm:hidden">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Chức danh</span>
            <span className="sm:hidden">Chức danh</span>
          </TabsTrigger>
          {userPermissions.canViewRanking && (
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Xếp hạng</span>
              <span className="sm:hidden">Xếp hạng</span>
            </TabsTrigger>
          )}
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="overview" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ResponsiveGrid 
                cols={{ default: 1, md: 2, lg: 3 }} 
                gap={6}
                className="mb-6"
              >
                {/* Management Positions Overview */}
                {positions.map((position: any, index: number) => (
                  <motion.div
                    key={position.position?.id || `position-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <PerformanceContainer
                      title={position.position?.name || 'Chức danh'}
                      subtitle={position.position?.description}
                      completionRate={position.stats?.reportSubmissionRate || 0}
                      totalItems={position.stats?.totalUsers || 0}
                      completedItems={position.stats?.usersWithReports || 0}
                      stats={[
                        {
                          label: 'Văn phòng',
                          value: position.stats?.officesCount || 0,
                          icon: <Building className="w-4 h-4" />,
                          color: 'text-purple-600'
                        },
                        {
                          label: 'Hoàn thành',
                          value: position.stats?.usersWithCompletedReports || 0,
                          icon: <Award className="w-4 h-4" />,
                          color: 'text-green-600'
                        },
                        {
                          label: 'Tỷ lệ HT',
                          value: `${position.stats?.reportCompletionRate || 0}%`,
                          icon: <TrendingUp className="w-4 h-4" />,
                          color: 'text-blue-600'
                        }
                      ]}
                    />
                  </motion.div>
                ))}

                {/* Job Positions for Staff */}
                {jobPositions.map((jobPos: any, index: number) => (
                  <motion.div
                    key={jobPos.jobPosition?.id || `job-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: (positions.length + index) * 0.1 }}
                  >
                    <PerformanceContainer
                      title={jobPos.jobPosition?.jobName || 'Vị trí công việc'}
                      subtitle={`${jobPos.jobPosition?.department || 'Phòng ban'} - ${jobPos.jobPosition?.office || 'Văn phòng'}`}
                      completionRate={jobPos.stats?.reportSubmissionRate || 0}
                      totalItems={jobPos.users?.length || 0}
                      completedItems={jobPos.stats?.usersWithReports || 0}
                      className="border-l-4 border-l-blue-500"
                    />
                  </motion.div>
                ))}
              </ResponsiveGrid>
            </motion.div>
          </TabsContent>

          <TabsContent value="positions" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PositionGroupsList positions={positions} />
            </motion.div>
          </TabsContent>

          {userPermissions.canViewRanking && (
            <TabsContent value="ranking" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Xếp hạng tổng quan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Tính năng xếp hạng đang được phát triển. Vui lòng quay lại sau.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  )
})

HierarchyDashboard.displayName = 'HierarchyDashboard'

export default HierarchyDashboard
