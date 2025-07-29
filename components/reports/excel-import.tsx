'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Replace, Plus } from 'lucide-react'
import { toast } from 'react-toast-kit'
import * as XLSX from 'xlsx'
import type { Task } from '@/types'
import useReportStore from '@/store/report-store'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import ExcelJS from 'exceljs' // Ensure you have installed exceljs package

interface ExcelImportProps {
  weekNumber: number
  year: number
  isOpen: boolean
  onClose: () => void
}

interface ParsedTask {
  taskName: string
  friday: boolean
  saturday: boolean
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  isCompleted: boolean
  reasonNotDone: string
  rowIndex: number
}

type ImportMode = 'replace' | 'append'

const ExcelImport = ({ weekNumber, year, isOpen, onClose }: ExcelImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importMode, setImportMode] = useState<ImportMode>('append')
  const { currentTasks, addMultipleTasks, clearTasks } = useReportStore()

  // Check if there are existing tasks
  const hasExistingTasks = currentTasks.length > 0

  // Download template Excel file
//   const downloadTemplate = useCallback(() => {
//     const templateData = [
//       {
//         'STT': 1,
//         'Tên công việc': 'Ví dụ: Họp team weekly',
//         'Thứ 6': 'X',
//         'Thứ 7': '',
//         'Thứ 2': 'X',
//         'Thứ 3': 'X',
//         'Thứ 4': '',
//         'Thứ 5': 'X',
//         'YES (Hoàn thành)': 'X',
//         'NO (Chưa hoàn thành)': '',
//         'Lý do chưa hoàn thành': ''
//       },
//       {
//         'STT': 2,
//         'Tên công việc': 'Ví dụ: Viết báo cáo dự án',
//         'Thứ 6': '',
//         'Thứ 7': '',
//         'Thứ 2': 'X',
//         'Thứ 3': 'X',
//         'Thứ 4': 'X',
//         'Thứ 5': '',
//         'YES (Hoàn thành)': '',
//         'NO (Chưa hoàn thành)': 'X',
//         'Lý do chưa hoàn thành': 'Chưa có đủ dữ liệu từ bộ phận khác'
//       },
//       {
//         'STT': 3,
//         'Tên công việc': 'Ví dụ: Review code và test',
//         'Thứ 6': '',
//         'Thứ 7': '',
//         'Thứ 2': '',
//         'Thứ 3': 'X',
//         'Thứ 4': 'X',
//         'Thứ 5': 'X',
//         'YES (Hoàn thành)': 'X',
//         'NO (Chưa hoàn thành)': '',
//         'Lý do chưa hoàn thành': ''
//       }
//     ]

//     const ws = XLSX.utils.json_to_sheet(templateData)
//     const wb = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(wb, ws, 'Template')


//       XLSX.writeFile(wb, `Template_Bao_cao_tuan_${weekNumber}_${year}.xlsx`)
//     toast.success('Đã tải xuống file template!')
    //   }, [weekNumber, year])
    
    // Cần cài đặt: npm install exceljs

    const downloadTemplate = useCallback(async () => {
        const templateData = [
            {
                'STT': 1,
                'Tên công việc': 'Ví dụ: Họp team weekly',
                'Thứ 6': 'X',
                'Thứ 7': '',
                'Thứ 2': 'X',
                'Thứ 3': 'X',
                'Thứ 4': '',
                'Thứ 5': 'X',
                'YES (Hoàn thành)': 'X',
                'NO (Chưa hoàn thành)': '',
                'Lý do chưa hoàn thành': ''
            },
            {
                'STT': 2,
                'Tên công việc': 'Ví dụ: Viết báo cáo dự án',
                'Thứ 6': '',
                'Thứ 7': '',
                'Thứ 2': 'X',
                'Thứ 3': 'X',
                'Thứ 4': 'X',
                'Thứ 5': '',
                'YES (Hoàn thành)': '',
                'NO (Chưa hoàn thành)': 'X',
                'Lý do chưa hoàn thành': 'Chưa có đủ dữ liệu từ bộ phận khác'
            },
            {
                'STT': 3,
                'Tên công việc': 'Ví dụ: Review code và test',
                'Thứ 6': '',
                'Thứ 7': '',
                'Thứ 2': '',
                'Thứ 3': 'X',
                'Thứ 4': 'X',
                'Thứ 5': 'X',
                'YES (Hoàn thành)': 'X',
                'NO (Chưa hoàn thành)': '',
                'Lý do chưa hoàn thành': ''
            }
        ]

        // Tạo workbook và worksheet
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Template')

        // Định nghĩa columns với header
        worksheet.columns = [
            { header: 'STT', key: 'STT', width: 5 },
            { header: 'Tên công việc', key: 'Tên công việc', width: 30 },
            { header: 'Thứ 6', key: 'Thứ 6', width: 15 },
            { header: 'Thứ 7', key: 'Thứ 7', width: 15 },
            { header: 'Thứ 2', key: 'Thứ 2', width: 15 },
            { header: 'Thứ 3', key: 'Thứ 3', width: 15 },
            { header: 'Thứ 4', key: 'Thứ 4', width: 15 },
            { header: 'Thứ 5', key: 'Thứ 5', width: 15 },
            { header: 'YES (Hoàn thành)', key: 'YES (Hoàn thành)', width: 15 },
            { header: 'NO (Chưa hoàn thành)', key: 'NO (Chưa hoàn thành)', width: 20 },
            { header: 'Lý do chưa hoàn thành', key: 'Lý do chưa hoàn thành', width: 40 }
        ]

        // Thêm data
        templateData.forEach(row => {
            worksheet.addRow(row)
        })

        // Style cho header row (row 1)
        const headerRow = worksheet.getRow(1)
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' } // Màu vàng
            }
            cell.font = {
                bold: true,
                color: { argb: 'FF000000' } // Màu chữ đen
            }
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle'
            }
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        })

        // Thêm border cho tất cả cells có data
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                })
            }
        })

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Template_Bao_cao_tuan_${weekNumber}_${year}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success('Đã tải xuống file template!')
    }, [weekNumber, year])

  // Parse Excel file
  const parseExcelFile = useCallback((file: File): Promise<ParsedTask[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          if (!jsonData || jsonData.length < 2) {
            reject(new Error('File Excel không có dữ liệu hoặc định dạng không đúng'))
            return
          }

          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1) as any[][]

          // Find column indices
          const findColumnIndex = (searchTerms: string[]) => {
            return headers.findIndex(header => 
              searchTerms.some(term => 
                header?.toString().toLowerCase().includes(term.toLowerCase())
              )
            )
          }

          const columnIndices = {
            taskName: findColumnIndex(['tên công việc', 'công việc', 'task']),
            friday: findColumnIndex(['thứ 6', 't6', 'fri']),
            saturday: findColumnIndex(['thứ 7', 't7', 'sat']),
            monday: findColumnIndex(['thứ 2', 't2', 'mon']),
            tuesday: findColumnIndex(['thứ 3', 't3', 'tue']),
            wednesday: findColumnIndex(['thứ 4', 't4', 'wed']),
            thursday: findColumnIndex(['thứ 5', 't5', 'thu']),
            // Updated: Search for separate YES and NO columns
            isCompletedYes: findColumnIndex(['yes (hoàn thành)', 'yes', 'hoàn thành']),
            isCompletedNo: findColumnIndex(['no (chưa hoàn thành)', 'no', 'chưa hoàn thành']),
            // Fallback: Look for old combined column format
            isCompleted: findColumnIndex(['hoàn thành (yes/no)', 'completed', 'yes/no']),
            reasonNotDone: findColumnIndex(['lý do', 'reason', 'nguyên nhân'])
          }

          // Validate required columns
          if (columnIndices.taskName === -1) {
            reject(new Error('Không tìm thấy cột "Tên công việc"'))
            return
          }

          const tasks: ParsedTask[] = []
          const parseErrors: string[] = []

          rows.forEach((row, index) => {
            if (!row || row.length === 0) return

            const taskName = row[columnIndices.taskName]?.toString().trim()
            if (!taskName) {
              parseErrors.push(`Dòng ${index + 2}: Tên công việc không được để trống`)
              return
            }

            // Helper function to check if day is marked
            const isDayMarked = (colIndex: number) => {
              if (colIndex === -1) return false
              const value = row[colIndex]?.toString().trim().toLowerCase()
              return value === 'x' || value === '1' || value === 'true' || value === 'yes'
            }

            // Enhanced: Check completion status from YES/NO columns or fallback to old format
            const isTaskCompleted = () => {
              // Priority 1: Check YES column
              if (columnIndices.isCompletedYes !== -1) {
                const yesValue = row[columnIndices.isCompletedYes]?.toString().trim().toLowerCase()
                const isYesMarked = yesValue === 'x' || yesValue === '1' || yesValue === 'true' || yesValue === 'yes'
                
                // Priority 2: Check NO column
                if (columnIndices.isCompletedNo !== -1) {
                  const noValue = row[columnIndices.isCompletedNo]?.toString().trim().toLowerCase()
                  const isNoMarked = noValue === 'x' || noValue === '1' || noValue === 'true' || noValue === 'yes'
                  
                  // Validation: Both YES and NO cannot be marked
                  if (isYesMarked && isNoMarked) {
                    parseErrors.push(`Dòng ${index + 2}: Không thể đánh dấu cả YES và NO cùng lúc`)
                    return false
                  }
                  
                  // If NO is marked, task is not completed
                  if (isNoMarked) return false
                }
                
                // If YES is marked, task is completed
                if (isYesMarked) return true
              }
              
              // Priority 3: Check NO column only (if YES column not found)
              if (columnIndices.isCompletedNo !== -1) {
                const noValue = row[columnIndices.isCompletedNo]?.toString().trim().toLowerCase()
                const isNoMarked = noValue === 'x' || noValue === '1' || noValue === 'true' || noValue === 'yes'
                if (isNoMarked) return false
              }
              
              // Fallback: Check old combined column format
              if (columnIndices.isCompleted !== -1) {
                const value = row[columnIndices.isCompleted]?.toString().trim().toLowerCase()
                return value === 'yes' || value === 'y' || value === '1' || value === 'true' || value === 'hoàn thành'
              }
              
              // Default: If no completion columns found, assume not completed
              return false
            }

            const completed = isTaskCompleted()
            const reasonNotDone = columnIndices.reasonNotDone !== -1 
              ? row[columnIndices.reasonNotDone]?.toString().trim() || ''
              : ''

            // Validate: if not completed, reason is required
            if (!completed && !reasonNotDone) {
              parseErrors.push(`Dòng ${index + 2}: Công việc chưa hoàn thành phải có lý do`)
            }

            // Additional validation: if completed, should not have reason
            if (completed && reasonNotDone) {
              // This is just a warning, not an error
              console.warn(`Dòng ${index + 2}: Công việc đã hoàn thành nhưng vẫn có lý do chưa hoàn thành`)
            }

            const task: ParsedTask = {
              taskName,
              friday: isDayMarked(columnIndices.friday),
              saturday: isDayMarked(columnIndices.saturday),
              monday: isDayMarked(columnIndices.monday),
              tuesday: isDayMarked(columnIndices.tuesday),
              wednesday: isDayMarked(columnIndices.wednesday),
              thursday: isDayMarked(columnIndices.thursday),
              isCompleted: completed,
              reasonNotDone: completed ? '' : reasonNotDone, // Clear reason if completed
              rowIndex: index + 2
            }

            tasks.push(task)
          })

          if (parseErrors.length > 0) {
            setErrors(parseErrors)
          }

          resolve(tasks)
        } catch (error) {
          reject(new Error(`Lỗi đọc file Excel: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('Lỗi đọc file'))
      }

      reader.readAsBinaryString(file)
    })
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(fileExtension || '')) {
      toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)')
      return
    }

    setIsProcessing(true)
    setErrors([])
    setParsedTasks([])

    try {
      const tasks = await parseExcelFile(file)
      setParsedTasks(tasks)
      
      if (tasks.length > 0) {
        toast.success(`Đã phân tích thành công ${tasks.length} công việc từ Excel`)
      } else {
        toast.warning('Không tìm thấy công việc nào trong file Excel')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi không xác định')
      setErrors([error instanceof Error ? error.message : 'Lỗi không xác định'])
    } finally {
      setIsProcessing(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [parseExcelFile])

  // Import tasks to store with mode selection
  const handleImport = useCallback(() => {
    if (parsedTasks.length === 0) {
      toast.error('Không có công việc nào để import')
      return
    }

    if (errors.length > 0) {
      toast.error('Vui lòng sửa các lỗi trước khi import')
      return
    }

    // Convert parsed tasks to Task objects
    const tasksToAdd: Task[] = parsedTasks.map((parsedTask, index) => ({
      id: `temp-${Date.now()}-${index}`,
      taskName: parsedTask.taskName,
      monday: parsedTask.monday,
      tuesday: parsedTask.tuesday,
      wednesday: parsedTask.wednesday,
      thursday: parsedTask.thursday,
      friday: parsedTask.friday,
      saturday: parsedTask.saturday,
      isCompleted: parsedTask.isCompleted,
      reasonNotDone: parsedTask.reasonNotDone,
      reportId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    // Handle import based on mode
    if (importMode === 'replace') {
      // Clear existing tasks and add new ones
      clearTasks()
      addMultipleTasks(tasksToAdd)
      toast.success(`Đã thay thế ${currentTasks.length} công việc cũ bằng ${tasksToAdd.length} công việc mới!`)
    } else {
      // Append to existing tasks
      addMultipleTasks(tasksToAdd)
      toast.success(`Đã thêm ${tasksToAdd.length} công việc mới vào ${currentTasks.length} công việc hiện có!`)
    }

    onClose()
  }, [parsedTasks, errors, importMode, currentTasks.length, clearTasks, addMultipleTasks, onClose])

  const handleClose = useCallback(() => {
    setParsedTasks([])
    setErrors([])
    setImportMode('append')
    onClose()
  }, [onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[80vh] overflow-hidden flex flex-col p-0 sm:max-h-[70vh]">
        <DialogHeader className="flex-shrink-0 space-y-3 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Import công việc từ Excel</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Tải lên file Excel để import hàng loạt công việc cho tuần {weekNumber}/{year}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Download Template & File Selection */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2 justify-center"
                size="sm"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Tải template Excel</span>
              </Button>
              
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-2 justify-center"
                  size="sm"
                >
                  <Upload className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {isProcessing ? 'Đang xử lý...' : 'Chọn file Excel'}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Import Mode Selection - Only show if there are existing tasks and parsed tasks */}
          {hasExistingTasks && parsedTasks.length > 0 && (
            <Card className="border-2 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="p-3 sm:p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                  <h3 className="font-semibold text-orange-800 dark:text-orange-300 text-sm sm:text-base">
                    Phát hiện {currentTasks.length} công việc hiện có
                  </h3>
                </div>
                
                <p className="text-orange-700 dark:text-orange-300 text-xs sm:text-sm">
                  Bạn muốn xử lý như thế nào với {parsedTasks.length} công việc mới từ file Excel?
                </p>

                <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as ImportMode)}>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-2 sm:p-3 rounded-lg border border-orange-200 bg-white/50 dark:bg-gray-800/50">
                      <RadioGroupItem value="append" id="append" className="mt-0.5 flex-shrink-0" />
                      <div className="space-y-1 flex-1 min-w-0">
                        <Label htmlFor="append" className="flex items-center gap-2 font-medium cursor-pointer text-xs sm:text-sm">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                          <span>Thêm vào công việc hiện có</span>
                        </Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 break-words">
                          Giữ lại {currentTasks.length} công việc hiện tại và thêm {parsedTasks.length} công việc mới
                          {' '}(Tổng: {currentTasks.length + parsedTasks.length} công việc)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-2 sm:p-3 rounded-lg border border-orange-200 bg-white/50 dark:bg-gray-800/50">
                      <RadioGroupItem value="replace" id="replace" className="mt-0.5 flex-shrink-0" />
                      <div className="space-y-1 flex-1 min-w-0">
                        <Label htmlFor="replace" className="flex items-center gap-2 font-medium cursor-pointer text-xs sm:text-sm">
                          <Replace className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
                          <span>Thay thế tất cả</span>
                        </Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 break-words">
                          Xóa {currentTasks.length} công việc hiện tại và thay thế bằng {parsedTasks.length} công việc mới
                          {' '}(Tổng: {parsedTasks.length} công việc)
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">
                  Phát hiện {errors.length} lỗi
                </h3>
              </div>
              <div className="max-h-32 overflow-y-auto">
                <ul className="space-y-1 text-xs sm:text-sm text-red-700 dark:text-red-300">
                  {errors.map((error, index) => (
                    <li key={index} className="break-words">• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Preview */}
          {parsedTasks.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <h3 className="font-semibold text-green-800 dark:text-green-300 text-sm sm:text-base">
                  Phân tích thành công {parsedTasks.length} công việc
                </h3>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-48 sm:max-h-60 overflow-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                      <tr>
                        <th className="px-2 sm:px-3 py-2 text-left w-8 sm:w-12">STT</th>
                        <th className="px-2 sm:px-3 py-2 text-left min-w-0">Tên công việc</th>
                        <th className="px-2 sm:px-3 py-2 text-center hidden sm:table-cell">Ngày thực hiện</th>
                        <th className="px-2 sm:px-3 py-2 text-center w-16 sm:w-20">Trạng thái</th>
                        <th className="px-2 sm:px-3 py-2 text-left hidden md:table-cell min-w-0">Lý do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedTasks.map((task, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30">
                          <td className="px-2 sm:px-3 py-2 text-center text-xs">{index + 1}</td>
                          <td className="px-2 sm:px-3 py-2 min-w-0">
                            <div className="truncate max-w-[100px] sm:max-w-xs" title={task.taskName}>
                              {task.taskName}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-center hidden sm:table-cell">
                            <div className="flex gap-1 justify-center flex-wrap">
                              {task.friday && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-1 rounded">T6</span>}
                              {task.saturday && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-1 rounded">T7</span>}
                              {task.monday && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-1 rounded">T2</span>}
                              {task.tuesday && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-1 rounded">T3</span>}
                              {task.wednesday && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-1 rounded">T4</span>}
                              {task.thursday && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-1 rounded">T5</span>}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-center">
                            <span className={`text-xs px-1 sm:px-2 py-1 rounded-full whitespace-nowrap ${
                              task.isCompleted 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                            }`}>
                              {task.isCompleted ? 'Hoàn thành' : 'Chưa HT'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 py-2 min-w-0 hidden md:table-cell">
                            <div className="truncate max-w-xs" title={task.reasonNotDone}>
                              {task.reasonNotDone || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile-friendly summary for hidden columns */}
              <div className="sm:hidden space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Lưu ý:</strong> Xem chi tiết đầy đủ trên máy tính hoặc xoay ngang màn hình
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col justify-end gap-2 w-full sm:flex-row sm:gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="order-2 sm:order-1"
              size="sm"
            >
              Hủy
            </Button>
            {parsedTasks.length > 0 && errors.length === 0 && (
              <Button 
                onClick={handleImport} 
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2 justify-center order-1 sm:order-2"
                size="sm"
              >
                {importMode === 'replace' ? (
                  <Replace className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                ) : (
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                )}
                <span className="truncate">
                  {importMode === 'replace' 
                    ? `Thay thế bằng ${parsedTasks.length} CV`
                    : `Thêm ${parsedTasks.length} CV`
                  }
                </span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ExcelImport }
