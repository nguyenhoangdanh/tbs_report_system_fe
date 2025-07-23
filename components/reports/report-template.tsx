"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Check, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as ExcelJS from "exceljs"
import { type WeeklyReport, type TaskEvaluation, EvaluationType, type Task, type User } from "@/types"
import { getWorkWeekRange } from "@/utils/week-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  useCreateTaskEvaluation,
  useUpdateTaskEvaluation,
  useDeleteTaskEvaluation,
} from "@/hooks/use-task-evaluation"
import { AnimatedButton } from "../ui/animated-button"
import { useAuth } from "@/components/providers/auth-provider"
import { useApproveTask, useRejectTask, useUpdateReport } from "@/hooks/use-reports"
import { toast } from "react-toast-kit"
import { useQueryClient } from "@tanstack/react-query"
import { ConvertEvaluationTypeToVietNamese } from "@/utils"
import { Badge } from "../ui/badge"

interface ReportTemplateProps {
  report: WeeklyReport
  className?: string
  canEvaluation?: boolean
}

interface SelectedTaskState {
  task: Task
  employee?: User
}

interface EvaluationFormState {
  evaluatedIsCompleted: boolean
  evaluatedReasonNotDone: string
  evaluatorComment: string
  evaluationType: EvaluationType
}

const EvaluationTypeBadge = ({ type }: { type: EvaluationType }) => {
  const typeText = ConvertEvaluationTypeToVietNamese(type);
  const colorClasses = useMemo(() => {
    switch (type) {
      case EvaluationType.REVIEW:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case EvaluationType.APPROVAL:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case EvaluationType.REJECTION:
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }, [type]);

  return (
    <Badge className={`text-xs font-medium ${colorClasses}`}>
      {typeText}
    </Badge>
  )
}

export function ReportTemplate({ report, className = "", canEvaluation }: ReportTemplateProps) {
  const user = report.user
  const tasks = report.tasks || []
  const queryClient = useQueryClient()

  // Đặt tất cả hooks ở đầu component
  const [openEvalModal, setOpenEvalModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editEvaluation, setEditEvaluation] = useState<TaskEvaluation | null>(null)
  const [form, setForm] = useState<EvaluationFormState>({
    evaluatedIsCompleted: true,
    evaluatedReasonNotDone: "",
    evaluatorComment: "",
    evaluationType: EvaluationType.REVIEW,
  })

  // Hooks for create/update/delete
  const createEval = useCreateTaskEvaluation()
  const updateEval = useUpdateTaskEvaluation()
  const deleteEval = useDeleteTaskEvaluation()
  const updateReport = useUpdateReport()
  const { user: currentUser } = useAuth()
  const approveTask = useApproveTask()
  const rejectTask = useRejectTask()

  // Get work week display info
  const { displayInfo } = getWorkWeekRange(report.weekNumber, report.year)

  // Calculate completion stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.isCompleted).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Get current date for the template
  const currentDate = new Date()

  const dayHeaders = [
    { key: "friday", label: "Thứ 6", shortLabel: "T6" },
    { key: "saturday", label: "Thứ 7", shortLabel: "T7" },
    { key: "monday", label: "Thứ 2", shortLabel: "T2" },
    { key: "tuesday", label: "Thứ 3", shortLabel: "T3" },
    { key: "wednesday", label: "Thứ 4", shortLabel: "T4" },
    { key: "thursday", label: "Thứ 5", shortLabel: "T5" },
  ]

  // Open modal for a task
  const handleOpenEval = (task: Task) => {
    setSelectedTask(task)
    const myEval = task.evaluations?.find((ev: TaskEvaluation) => ev.evaluatorId === currentUser?.id) || null
    setEditEvaluation(myEval)

    setForm({
      evaluatedIsCompleted: myEval?.evaluatedIsCompleted ?? task.isCompleted,
      evaluatedReasonNotDone: myEval?.evaluatedReasonNotDone ?? task.reasonNotDone ?? "",
      evaluatorComment: myEval?.evaluatorComment ?? "",
      evaluationType: myEval?.evaluationType ?? EvaluationType.REVIEW,
    })
    setOpenEvalModal(true)
  }

  // Submit evaluation (create or update) with task status update
  const handleSubmitEval = async () => {
    if (!selectedTask) return

    if (!form.evaluatedIsCompleted && !form.evaluatorComment.trim()) {
      toast.error("Vui lòng nhập nhận xét khi đánh giá không hoàn thành!")
      return;
    }

    try {
      let evaluationResult: TaskEvaluation
      const originalIsCompleted = selectedTask.isCompleted

      if (editEvaluation) {
        evaluationResult = await updateEval.mutateAsync({
          evaluationId: editEvaluation.id,
          data: form,
        })
      } else {
        evaluationResult = await createEval.mutateAsync({
          ...form,
          taskId: selectedTask.id,
        })
      }

      if (currentUser?.isManager && form.evaluatedIsCompleted !== originalIsCompleted) {
        if (form.evaluatedIsCompleted) {
          await approveTask.mutateAsync(selectedTask.id)
        } else {
          await rejectTask.mutateAsync(selectedTask.id)
        }
      }

      queryClient.invalidateQueries({ queryKey: ["hierarchy", "user-details"], refetchType: "all" })
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "manager-reports"], refetchType: "all" })

      setOpenEvalModal(false)
      toast.success(editEvaluation ? "Đánh giá đã được cập nhật thành công!" : "Đánh giá đã được tạo thành công!")
    } catch (error) {
      console.error("Error submitting evaluation:", error)
      toast.error("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!")
    }
  }

  const handleDeleteEval = async () => {
    if (!editEvaluation) return

    try {
      await deleteEval.mutateAsync(editEvaluation.id)
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "user-details"], refetchType: "all" })
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "manager-reports"], refetchType: "all" })
      setOpenEvalModal(false)
      toast.success("Đánh giá đã được xóa thành công!")
    } catch (error) {
      console.error("Error deleting evaluation:", error)
      toast.error("Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại!")
    }
  }

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet(`TUẦN ${report.weekNumber}`, {
        views: [{ showGridLines: false }],
        properties: {},
      })

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.style = {
            font: { name: "Times New Roman", size: 12 },
          }
        })
      })

      // Set column widths to EXACTLY match template in image 2
      worksheet.columns = [
        { width: 7 }, // A: Logo/STT
        { width: 55 }, // B: KH-KQCV TUẦN (wider for text wrapping)
        { width: 7 }, // C: Thứ 2
        { width: 7 }, // D: Thứ 3
        { width: 7 }, // E: Thứ 4
        { width: 7 }, // F: Thứ 5
        { width: 7 }, // G: Thứ 6
        { width: 7 }, // H: Thứ 7
        { width: 6 }, // I: YES
        { width: 6 }, // J: NO
        { width: 60 }, // K: Nguyên nhân - giải pháp (wider for text wrapping)
      ]

      // Try to add logo image, fallback to text if image not available
      try {
        // Load logo image as base64 or from public folder
        const response = await fetch("/images/logo.png")
        if (response.ok) {
          const imageBuffer = await response.arrayBuffer()

          // Add image to workbook
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: "png",
          })

          // Insert image in cell A1 with proper ExcelJS anchor format
          worksheet.addImage(imageId, {
            tl: { col: 1, row: 0 }, // top-left position (A1)
            ext: { width: 100, height: 25 }, // Set explicit width and height
            editAs: "oneCell",
          })

          // Style the logo cell background
          worksheet.getCell("B1").style = {
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF90EE90" } },
            // border: {
            //   top: { style: 'thin' }, bottom: { style: 'thin' },
            //   left: { style: 'thin' }, right: { style: 'thin' }
            // }
          }
        } else {
          throw new Error("Logo not found")
        }
      } catch (logoError) {
        console.warn("Could not load logo, using text fallback:", logoError)
        // Fallback to text if logo can't be loaded
        worksheet.getCell("B1").value = "TBS"
        worksheet.getCell("B1").style = {
          font: { bold: true, color: { argb: "FFFFFFFF" } },
          alignment: { horizontal: "center", vertical: "middle" },
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF90EE90" } },
          // border: {
          //   top: { style: 'thin' }, bottom: { style: 'thin' },
          //   left: { style: 'thin' }, right: { style: 'thin' }
          // }
        }
      }

      // Row 1: Title (B1:L1) - exactly like image 2
      worksheet.getCell("B1").value = `KQ CÔNG VIỆC CHI TIẾT NGÀY - TUẦN ${report.weekNumber}`
      worksheet.mergeCells("B1:K1")

      // Style title row (B1:L1) - light blue background like image 2
      worksheet.getCell("B1").style = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: "center", vertical: "middle" },
        fill: { type: "pattern", pattern: "solid" },
        // fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCE5FF' } },
        // border: {
        //   top: { style: 'thin' }, bottom: { style: 'thin' },
        //   left: { style: 'thin' }, right: { style: 'thin' }
        // }
      }

      // Set title row height
      worksheet.getRow(1).height = 40 // Increased for logo

      // Row 2: Employee info first line - HỌ TÊN and MSNV
      // worksheet.getCell('A2').value = 'HỌ TÊN:';
      // worksheet.getCell('B2').value = `${user?.firstName} ${user?.lastName}`;
      // worksheet.getCell('H2').value = 'MSNV:';
      // worksheet.getCell('I2').value = user?.employeeCode;
      worksheet.getCell("B2").value = `HỌ TÊN: ${user?.firstName} ${user?.lastName}`
      worksheet.getCell("C2").value = `MSNV: ${user?.employeeCode}`

      // Merge employee info cells like image 2
      worksheet.mergeCells("C2:K2") // Name spans B2:G2
      // worksheet.mergeCells('I2:L2'); // Employee code spans I2:L2

      // Row 3: Employee info second line - CĐ-VTCV and BP/PB/LINE
      // worksheet.getCell('A3').value = 'CĐ - VTCV:';
      // worksheet.getCell('B3').value = `${user?.jobPosition?.position?.name} - ${user?.jobPosition?.jobName}`;
      // worksheet.getCell('H3').value = 'BP/PB/LINE/TÔNM:';
      // worksheet.getCell('I3').value = user?.jobPosition?.department?.office?.name;
      worksheet.getCell("B3").value = `CD - VTCV: ${user?.jobPosition?.position.name} - ${user?.jobPosition?.jobName}`
      worksheet.getCell("C3").value = `BP/PB/LINE/TỔ/NM: ${user?.jobPosition?.department?.office?.name}`

      // Merge job info cells like image 2
      // worksheet.mergeCells('B3:G3'); // Job position spans B3:G3
      // worksheet.mergeCells('I3:L3'); // Office spans I3:L3
      worksheet.mergeCells("C3:K3") // Job position spans C3:L3
        // worksheet.mergeCells('I3:L3'); // Office spans I3:L3

        // Style employee info labels (bold)
        ;["B2", "C2", "B3", "C3"].forEach((cellAddr) => {
          worksheet.getCell(cellAddr).style = {
            font: { bold: true },
            alignment: { horizontal: "left", vertical: "middle", wrapText: true },
            // border: {
            //   top: { style: 'thin' }, bottom: { style: 'thin' },
            //   left: { style: 'thin' }, right: { style: 'thin' }
            // }
          }
        })

      // Style employee info values with text wrapping
      // ['B2', 'C2', 'B3', 'C3'].forEach(cellAddr => {
      //   worksheet.getCell(cellAddr).style = {
      //     // font: { size: 10, name: 'Time New Roman' },
      //     alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
      //     // border: {
      //     //   top: { style: 'thin' }, bottom: { style: 'thin' },
      //     //   left: { style: 'thin' }, right: { style: 'thin' }
      //     // }
      //   };
      // });

      // Set appropriate row heights for employee info
      worksheet.getRow(2).height = 25
      worksheet.getRow(3).height = 25

      // Row 4: Table headers exactly like image 2
      const headers = [
        "STT",
        "KH-KQCV TUẦN",
        "Thứ 6",
        "Thứ 7",
        "Thứ 2",
        "Thứ 3",
        "Thứ 4",
        "Thứ 5",
        "YES",
        "NO",
        "Nguyên nhân - giải pháp",
      ]

      headers.forEach((header, index) => {
        const cell = worksheet.getCell(4, index + 1)
        cell.value = header
        cell.style = {
          font: { bold: true },
          alignment: { horizontal: "center", vertical: "middle", wrapText: true },
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCE5FF" } },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        }
        if (index === 8) {
          // YES column
          cell.style = {
            ...cell.style,
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCE5FF" } },
            font: { ...cell.style.font, color: { argb: "FF006400" } },
          }
        } else if (index === 9) {
          // NO column
          cell.style = {
            ...cell.style,
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCE5FF" } },
            font: { ...cell.style.font, color: { argb: "FF8B0000" } },
          }
        }
      })

      // Set header row height
      worksheet.getRow(4).height = 30

      // Data rows starting from row 5 with dynamic height
      tasks.forEach((task, index) => {
        const rowNum = 5 + index
        const row = worksheet.getRow(rowNum)

        // Set row data exactly like image 2
        row.values = [
          index + 1, // STT
          task.taskName, // KH-KQCV TUẦN
          task.friday ? "x" : "", // Thứ 6
          task.saturday ? "x" : "", // Thứ 7
          task.monday ? "x" : "", // Thứ 2
          task.tuesday ? "x" : "", // Thứ 3
          task.wednesday ? "x" : "", // Thứ 4
          task.thursday ? "x" : "", // Thứ 5
          task.isCompleted ? "x" : "", // YES
          !task.isCompleted ? "x" : "", // NO
          !task.isCompleted && task.reasonNotDone ? task.reasonNotDone : "",
        ]

        // Calculate dynamic row height based on text length
        const taskNameLength = task.taskName.length
        const reasonLength = !task.isCompleted && task.reasonNotDone ? task.reasonNotDone.length : 20
        const maxLength = Math.max(taskNameLength, reasonLength)

        // Dynamic height: minimum 25, increase by 15 for every 50 characters
        const calculatedHeight = Math.max(25, Math.ceil(maxLength / 50) * 15 + 10)
        row.height = calculatedHeight

        // Style each cell in the row
        row.eachCell((cell, colNumber) => {
          const cellStyle: any = {
            // font: { size: 10, name: 'Time New Roman' },
            alignment: {
              horizontal: colNumber === 2 || colNumber === 12 ? "left" : "center",
              vertical: "middle", // Center alignment for better text display
              wrapText: colNumber === 2 || colNumber === 12, // Enable text wrapping for long content
            },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          }

          // Special styling for YES/NO columns like image 2
          if (colNumber === 9 && cell.value === "x") {
            // YES column - green
            cellStyle.fill = { type: "pattern", pattern: "solid" }
            cellStyle.font = { ...cellStyle.font, bold: true, color: { argb: "FF006400" } }
          } else if (colNumber === 10 && cell.value === "x") {
            // NO column - red
            cellStyle.fill = { type: "pattern", pattern: "solid" }
            cellStyle.font = { ...cellStyle.font, bold: true, color: { argb: "FF8B0000" } }
          }

          cell.style = cellStyle
        })
      })

      // Summary section exactly like image 2
      const summaryRowStart = 5 + tasks.length

      // worksheet.mergeCells(`A${summaryRowStart}:A${summaryRowStart+1}`);
      // Summary row 1 - merged across all columns
      worksheet.getCell(`B${summaryRowStart}`).value = `SỐ ĐẦU VIỆC HOÀN THÀNH/CHƯA HOÀN THÀNH:`
      worksheet.getCell(`I${summaryRowStart}`).value = `${completedTasks}`
      worksheet.getCell(`J${summaryRowStart}`).value = `${totalTasks - completedTasks}`
      worksheet.mergeCells(`B${summaryRowStart}:H${summaryRowStart}`)
        // worksheet.getCell(`I${summaryRowStart}`).style = {
        //   border: {
        //   top: { style: 'thin' }, bottom: { style: 'thin' },
        //   left: { style: 'thin' }, right: { style: 'thin' }
        //   }
        // };
        // worksheet.getCell(`J${summaryRowStart}`).style = {
        //   border: {
        //   top: { style: 'thin' }, bottom: { style: 'thin' },
        //   left: { style: 'thin' }, right: { style: 'thin' }
        //   }
        // };
        ;[
          `A${summaryRowStart}`,
          `B${summaryRowStart}`,
          `C${summaryRowStart}`,
          `D${summaryRowStart}`,
          `E${summaryRowStart}`,
          `F${summaryRowStart}`,
          `G${summaryRowStart}`,
          `H${summaryRowStart}`,
          `I${summaryRowStart}`,
          `J${summaryRowStart}`,
          `K${summaryRowStart}`,
        ].forEach((cellAddr) => {
          worksheet.getCell(cellAddr).style = {
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } },
            alignment: { horizontal: "center", vertical: "middle" },
            font: { bold: true },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          }
        })

      // Summary row 2 - merged across all columns
      worksheet.getCell(`B${summaryRowStart + 1}`).value = `(%) KẾT QUẢ CÔNG VIỆC HOÀN THÀNH:`
      worksheet.getCell(`I${summaryRowStart + 1}`).value = `${completionRate}%`
      worksheet.mergeCells(`B${summaryRowStart + 1}:H${summaryRowStart + 1}`)
      worksheet.mergeCells(`I${summaryRowStart + 1}:J${summaryRowStart + 1}`)
        // worksheet.getCell(`I${summaryRowStart + 1}`).style = {
        //   border: {
        //   top: { style: 'thin' }, bottom: { style: 'thin' },
        //   left: { style: 'thin' }, right: { style: 'thin' }
        //   }
        // };
        // worksheet.getCell(`J${summaryRowStart + 1}`).style = {
        //   border: {
        //   top: { style: 'thin' }, bottom: { style: 'thin' },
        //   left: { style: 'thin' }, right: { style: 'thin' }
        //   }
        // };
        ;[
          `A${summaryRowStart + 1}`,
          `B${summaryRowStart + 1}`,
          `C${summaryRowStart + 1}`,
          `D${summaryRowStart + 1}`,
          `E${summaryRowStart + 1}`,
          `F${summaryRowStart + 1}`,
          `G${summaryRowStart + 1}`,
          `H${summaryRowStart + 1}`,
          `I${summaryRowStart + 1}`,
          `J${summaryRowStart + 1}`,
          `K${summaryRowStart + 1}`,
        ].forEach((cellAddr) => {
          worksheet.getCell(cellAddr).style = {
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } },
            alignment: { horizontal: "center", vertical: "middle" },
            font: { bold: true },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          }
        })

      worksheet.mergeCells(`A${summaryRowStart}:A${summaryRowStart + 1}`)
      worksheet.mergeCells(`K${summaryRowStart}:K${summaryRowStart + 1}`)

        // Style summary cells - bright yellow like image 2
        ;[summaryRowStart, summaryRowStart + 1].forEach((rowNum) => {
          const cell = worksheet.getCell(`B${rowNum}`)
          cell.style = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "middle" },
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          }
          worksheet.getRow(rowNum).height = 25
        })

      // Footer section exactly like image 2
      const footerRowStart = summaryRowStart + 3

      // Date line positioned like image 2
      worksheet.getCell(`K${footerRowStart}`).value =
        `Phú Hòa, ngày ${format(currentDate, "dd", { locale: vi })} tháng ${format(currentDate, "MM", { locale: vi })} năm ${format(currentDate, "yyyy", { locale: vi })}`
      // worksheet.mergeCells(`G${footerRowStart}:L${footerRowStart}`);

      // Signature headers positioned like image 2
      worksheet.getCell(`B${footerRowStart + 1}`).value = "Trưởng đơn vị"
      // worksheet.mergeCells(`A${footerRowStart + 2}:C${footerRowStart + 2}`);

      worksheet.getCell(`C${footerRowStart + 1}`).value = "CBQL Trực Tiếp"
      worksheet.mergeCells(`C${footerRowStart + 1}:J${footerRowStart + 1}`)

      worksheet.getCell(`K${footerRowStart + 1}`).value = "Người lập"
      // worksheet.mergeCells(`J${footerRowStart + 2}:L${footerRowStart + 2}`);

      // Name signature with proper spacing
      worksheet.getCell(`K${footerRowStart + 5}`).value = `${user?.firstName} ${user?.lastName}`
      // worksheet.mergeCells(`J${footerRowStart + 6}:L${footerRowStart + 6}`);

      // Style footer elements

      worksheet.getCell(`K${footerRowStart}`).style = {
        // font: { size: 11, name: 'Time New Roman', italic: true },
        alignment: { horizontal: "center", vertical: "middle" },
      }

      worksheet.getCell(`K${footerRowStart + 1}`).style = {
        // font: { size: 11, name: 'Time New Roman', italic: true },
        alignment: { horizontal: "center", vertical: "middle" },
      }

      worksheet.getCell(`K${footerRowStart + 5}`).style = {
        // font: { size: 11, bold: true, name: 'Time New Roman' },
        alignment: { horizontal: "center", vertical: "middle" },
      }

      worksheet.getCell(`C${footerRowStart + 1}`).style = {
        // font: { size: 11, name: 'Time New Roman', italic: true },
        alignment: { horizontal: "center", vertical: "middle" },
      }

      worksheet.getCell(`B${footerRowStart + 1}`).style = {
        // font: { size: 11, name: 'Time New Roman', italic: true },
        alignment: { horizontal: "center", vertical: "middle" },
      }

        // Style signature headers
        ;[`A${footerRowStart + 2}`, `E${footerRowStart + 2}`, `J${footerRowStart + 2}`].forEach((cellAddr) => {
          worksheet.getCell(cellAddr).style = {
            // font: { size: 11, bold: true, name: 'Time New Roman' },
            alignment: { horizontal: "center", vertical: "middle" },
          }
        })

      // Style signature name
      worksheet.getCell(`J${footerRowStart + 6}`).style = {
        // font: { size: 11, bold: true, name: 'Time New Roman' },
        alignment: { horizontal: "center", vertical: "middle" },
      }

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `KQ CÔNG VIỆC CHI TIẾT NGÀY - TUẦN ${report.weekNumber}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      alert("Có lỗi xảy ra khi xuất file Excel")
    }
  }

  // Desktop render
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header with Logo and Export Button */}
      <div className="flex flex-col sm:flex-row items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
          <div className="flex-shrink-0">
            <img
              src="/images/logo.png"
              alt="TBS Group Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
                target.nextElementSibling!.textContent = "TBS"
              }}
            />
            <span className="text-green-600 dark:text-green-400 font-bold text-sm sm:text-lg hidden">TBS</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              KQ CÔNG VIỆC CHI TIẾT NGÀY - {displayInfo.weekTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{displayInfo.dateRange}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{displayInfo.workDaysText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <Button
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Excel</span>
            <span className="sm:hidden">Excel</span>
          </Button>
        </div>
      </div>

      {/* Employee Information */}
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row">
              <span className="font-semibold w-full sm:w-32 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                HỌ TÊN:
              </span>
              <span className="text-gray-900 dark:text-gray-100 font-medium text-sm sm:text-base">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <span className="font-semibold w-full sm:w-32 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                CD - VTCV:
              </span>
              <span className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {user?.jobPosition?.position.name} - {user?.jobPosition?.jobName}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row">
              <span className="font-semibold w-full sm:w-32 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                MSNV:
              </span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">
                {user?.employeeCode}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <span className="font-semibold w-full sm:w-32 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                BP/PB/LINE:
              </span>
              <span className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {user?.jobPosition?.department?.office?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table with better mobile handling */}
      <div className="p-4 sm:p-6">
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="min-w-[800px]">
            {" "}
            {/* Minimum width for table */}
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                  <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    STT
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[200px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    KH-KQCV TUẦN
                  </th>
                  {dayHeaders.map((day) => (
                    <th
                      key={day.key}
                      className="border border-gray-300 dark:border-gray-600 px-1 sm:px-2 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs min-w-[40px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30"
                    >
                      <span className="hidden sm:inline">{day.label}</span>
                      <span className="sm:hidden">{day.shortLabel}</span>
                    </th>
                  ))}
                  <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-green-700 dark:text-green-400 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    YES
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-red-700 dark:text-red-400 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    NO
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[150px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    Nguyên nhân - giải pháp
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[150px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    Đánh giá
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {tasks.map((task, index) => {
                  // Tìm đánh giá của chính mình (manager hiện tại)
                  const myEval = task.evaluations?.find((ev) => ev.evaluatorId === currentUser?.id)
                  return (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <div className="break-words">{task.taskName}</div>
                      </td>
                      {dayHeaders.map((day) => (
                        <td
                          key={day.key}
                          className="border border-gray-300 dark:border-gray-600 px-1 sm:px-2 py-2 sm:py-3 text-center"
                        >
                          {task[day.key as keyof typeof task] && (
                            <div className="flex justify-center">
                              <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center">
                        {task.isCompleted && (
                          <div className="flex justify-center">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 font-bold" />
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center">
                        {!task.isCompleted && (
                          <div className="flex justify-center">
                            <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 font-bold" />
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <div className="break-words max-w-xs">{task.reasonNotDone}</div>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {/* Hiển thị tất cả đánh giá */}
                        {task?.evaluations && task?.evaluations.length > 0 ? (
                          <div className="space-y-2 max-w-xs lg:max-w-sm">
                            {task.evaluations
                              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                              .map((evalItem, evalIndex) => (
                              <div
                                key={evalIndex}
                                className="break-words border-b last:border-b-0 pb-2 last:pb-0 border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs mb-1">
                                  <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                                    {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
                                  </span>
                                    <EvaluationTypeBadge
                                      type={evalItem.evaluationType}
                                    />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                                      Trạng thái:
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${evalItem.evaluatedIsCompleted
                                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                        }`}
                                    >
                                      {evalItem.evaluatedIsCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
                                    </span>
                                  </div>
                                  {evalItem.evaluatedReasonNotDone && (
                                    <div className="mt-1">
                                      <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                                        Nguyên nhân/Giải pháp:
                                      </span>
                                      <p className="text-gray-800 dark:text-gray-200 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs break-words">
                                        {evalItem.evaluatedReasonNotDone}
                                      </p>
                                    </div>
                                  )}
                                  {evalItem.evaluatorComment && (
                                    <div className="mt-1">
                                      <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                                        Nhận xét:
                                      </span>
                                      <p className="text-gray-800 dark:text-gray-200 mt-1 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs break-words">
                                        {evalItem.evaluatorComment}
                                      </p>
                                    </div>
                                  )}
                                  {/* <div className="text-xs text-gray-400 dark:text-gray-500">
                                    {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                  </div> */}
                                    {evalIndex === 0 ? (
                                      <div className="text-xs flex items-center justify-between
                                       text-gray-400 dark:text-gray-500 bg-blue-400/10 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
                                        {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                          (Đánh giá mới nhất)
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-400 dark:text-gray-500">
                                        Cập nhật:{" "}
                                        {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                      </div>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <span className="text-gray-400 dark:text-gray-500 text-xs">Chưa có đánh giá nào</span>
                          </div>
                        )}

                        {/* Nút đánh giá/chỉnh sửa cho manager */}
                        {canEvaluation && (
                          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`w-full text-xs ${myEval
                                  ? "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                                  : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                }`}
                              onClick={() => handleOpenEval(task)}
                            >
                              {myEval ? "Chỉnh sửa đánh giá" : "Đánh giá"}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      <Dialog open={openEvalModal} onOpenChange={setOpenEvalModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editEvaluation ? "Chỉnh sửa đánh giá của bạn" : "Đánh giá công việc"}
            </DialogTitle>
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Công việc:</span> {selectedTask?.taskName}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form đánh giá */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                {editEvaluation ? "Chỉnh sửa đánh giá của bạn" : "Tạo đánh giá mới"}
              </h3>

              {/* Hiển thị đánh giá trước đó của bạn nếu có */}
              {editEvaluation && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <div className="text-sm font-medium text-orange-800 mb-2">Đánh giá hiện tại của bạn:</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Trạng thái:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${editEvaluation.evaluatedIsCompleted
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                          }`}
                      >
                        {editEvaluation.evaluatedIsCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
                      </span>
                    </div>
                    {editEvaluation.evaluatedReasonNotDone && (
                      <div>
                        <span className="font-medium">Nguyên nhân/Giải pháp:</span>
                        <p className="bg-white p-2 rounded mt-1">{editEvaluation.evaluatedReasonNotDone}</p>
                      </div>
                    )}
                    {editEvaluation.evaluatorComment && (
                      <div>
                        <span className="font-medium">Nhận xét:</span>
                        <p className="bg-white p-2 rounded mt-1">{editEvaluation.evaluatorComment}</p>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Loại: {editEvaluation.evaluationType} | Cập nhật:{" "}
                      {format(new Date(editEvaluation.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái hoàn thành <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.evaluatedIsCompleted ? "true" : "false"}
                    onChange={(e) => {
                      const isCompleted = e.target.value === "true";
                      setForm((f) => ({
                        ...f,
                        evaluatedIsCompleted: isCompleted,
                        evaluatedReasonNotDone: isCompleted ? "" : f.evaluatedReasonNotDone,
                        evaluationType: isCompleted ? EvaluationType.APPROVAL : EvaluationType.REJECTION,
                        evaluatorComment: isCompleted ? "" : f.evaluatorComment,
                      }));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">✅ Hoàn thành</option>
                    <option value="false">❌ Chưa hoàn thành</option>
                  </select>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nguyên nhân/Giải pháp</label>
                  <textarea
                    value={form.evaluatedReasonNotDone}
                    onChange={(e) => setForm((f) => ({ ...f, evaluatedReasonNotDone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Nhập nguyên nhân nếu chưa hoàn thành hoặc giải pháp cải thiện..."
                  />
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nhận xét của bạn</label>
                  <textarea
                    value={form.evaluatorComment}
                    onChange={(e) => setForm((f) => ({ ...f, evaluatorComment: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Nhập nhận xét, góp ý hoặc đánh giá chi tiết..."
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại đánh giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.evaluationType}
                    onChange={(e) => setForm((f) => ({ ...f, evaluationType: e.target.value as EvaluationType }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.values(EvaluationType).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div> */}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setOpenEvalModal(false)}>
                  Hủy
                </Button>
                {editEvaluation && (
                  <Button variant="destructive" onClick={handleDeleteEval} disabled={deleteEval.isPending}>
                    Xóa đánh giá
                  </Button>
                )}
                <AnimatedButton
                  onClick={handleSubmitEval}
                  loading={createEval.isPending || updateEval.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editEvaluation ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                </AnimatedButton>
              </div>
            </div>

            {/* Danh sách đánh giá khác để tham khảo */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                {/* Đánh giá khác để tham khảo ({selectedTask?.evaluations?.length || 0}) */}
                {`Đánh giá khác để tham khảo (${selectedTask?.evaluations?.filter((ev) => ev.evaluatorId !== currentUser?.id).length || 0})`}
              </h3>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {selectedTask?.evaluations && selectedTask.evaluations.length > 0 ? (
                  selectedTask.evaluations
                    .filter((evalItem) => evalItem.evaluatorId !== currentUser?.id) // Loại bỏ đánh giá của chính mình
                    .map((evalItem, evalIndex) => (
                      <div key={evalIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">
                              {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
                            </span>
                            <span className="text-gray-400 text-sm">({evalItem.evaluator?.employeeCode})</span>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                            {evalItem.evaluationType}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600 text-sm">Trạng thái:</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${evalItem.evaluatedIsCompleted
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                }`}
                            >
                              {evalItem.evaluatedIsCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
                            </span>
                          </div>

                          {evalItem.evaluatedReasonNotDone && (
                            <div>
                              <span className="font-medium text-gray-600 text-sm">Nguyên nhân/Giải pháp:</span>
                              <p className="text-gray-800 text-sm bg-white p-2 rounded mt-1">
                                {evalItem.evaluatedReasonNotDone}
                              </p>
                            </div>
                          )}

                          {evalItem.evaluatorComment && (
                            <div>
                              <span className="font-medium text-gray-600 text-sm">Nhận xét:</span>
                              <p className="text-gray-800 text-sm bg-white p-2 rounded mt-1">
                                {evalItem.evaluatorComment}
                              </p>
                            </div>
                          )}

                          <div className="text-xs text-gray-400 pt-1 border-t">
                            {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>Chưa có đánh giá nào khác để tham khảo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Section */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md border border-yellow-200 dark:border-yellow-700">
            <div className="text-center font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">
              SỐ ĐẦU VIỆC HOÀN THÀNH/CHƯA HOÀN THÀNH
            </div>
            <div className="flex justify-center items-center gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{completedTasks}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Hoàn thành</div>
              </div>
              <div className="text-xl sm:text-2xl text-gray-400">/</div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{totalTasks - completedTasks}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Chưa hoàn thành</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md border border-blue-200 dark:border-blue-700">
            <div className="text-center font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">
              (%) KẾT QUẢ CÔNG VIỆC HOÀN THÀNH
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600">{completionRate}%</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
