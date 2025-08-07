import { EvaluationType } from "@/types";
import * as ExcelJS from "exceljs"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { type WeeklyReport } from "@/types"

export  function  ConvertEvaluationTypeToVietNamese(type: EvaluationType): string {
  switch (type) {
    case EvaluationType.REVIEW:
      return 'Đánh giá';
    case EvaluationType.APPROVAL:
      return 'Phê duyệt';
    case EvaluationType.REJECTION:
      return 'Từ chối';
    default:
      return '';
  }
}

// Export to Excel function
export const exportToExcel = async (report: WeeklyReport) => {
  const { user, tasks = [] } = report
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.isCompleted).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const currentDate = new Date()

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
      const response = await fetch("/images/remove-bg-logo.png")
      if (response.ok) {
        const imageBuffer = await response.arrayBuffer()
        const imageId = workbook.addImage({
          buffer: imageBuffer,
          extension: "png",
        })

        worksheet.addImage(imageId, {
          tl: { col: 1, row: 0 },
          ext: { width: 100, height: 40 },
          editAs: "oneCell",
        })

        // worksheet.getCell("B1").style = {
        //   fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF90EE90" } },
        // }
      } else {
        throw new Error("Logo not found")
      }
    } catch (logoError) {
      console.warn("Could not load logo, using text fallback:", logoError)
      worksheet.getCell("B1").value = "TBS"
      worksheet.getCell("B1").style = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        alignment: { horizontal: "left", vertical: "middle" },
        // fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF90EE90" } },
      }
    }

    // Row 1: Title (B1:L1)
    worksheet.getCell("C1").value = `KQ CÔNG VIỆC CHI TIẾT NGÀY - TUẦN ${report.weekNumber}`
    worksheet.mergeCells("C1:K1")

    worksheet.getCell("C1").style = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: "left", vertical: "middle" },
      // fill: { type: "pattern", pattern: "solid" },
    }

    worksheet.getRow(1).height = 40

    // Employee info rows
    worksheet.getCell("B2").value = `HỌ TÊN: ${user?.firstName} ${user?.lastName}`
    worksheet.getCell("C2").value = `MSNV: ${user?.employeeCode}`
    worksheet.mergeCells("C2:K2")

    worksheet.getCell("B3").value = `CD - VTCV: ${user?.jobPosition?.position.name} - ${user?.jobPosition?.jobName}`
    worksheet.getCell("C3").value = `BP/PB/LINE/TỔ/NM: ${user?.jobPosition?.department?.office?.name}`
    worksheet.mergeCells("C3:K3")

    ;["B2", "C2", "B3", "C3"].forEach((cellAddr) => {
      worksheet.getCell(cellAddr).style = {
        font: { bold: true },
        alignment: { horizontal: "left", vertical: "middle", wrapText: true },
      }
    })

    worksheet.getRow(2).height = 25
    worksheet.getRow(3).height = 25

    // Table headers
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
        cell.style = {
          ...cell.style,
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCE5FF" } },
          font: { ...cell.style.font, color: { argb: "FF006400" } },
        }
      } else if (index === 9) {
        cell.style = {
          ...cell.style,
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCE5FF" } },
          font: { ...cell.style.font, color: { argb: "FF8B0000" } },
        }
      }
    })

    worksheet.getRow(4).height = 30

    // Data rows
    tasks.forEach((task, index) => {
      const rowNum = 5 + index
      const row = worksheet.getRow(rowNum)

      row.values = [
        index + 1,
        task.taskName,
        task.friday ? "x" : "",
        task.saturday ? "x" : "",
        task.monday ? "x" : "",
        task.tuesday ? "x" : "",
        task.wednesday ? "x" : "",
        task.thursday ? "x" : "",
        task.isCompleted ? "x" : "",
        !task.isCompleted ? "x" : "",
        !task.isCompleted && task.reasonNotDone ? task.reasonNotDone : "",
      ]

      const taskNameLength = task.taskName.length
      const reasonLength = !task.isCompleted && task.reasonNotDone ? task.reasonNotDone.length : 20
      const maxLength = Math.max(taskNameLength, reasonLength)
      const calculatedHeight = Math.max(25, Math.ceil(maxLength / 50) * 15 + 10)
      row.height = calculatedHeight

      row.eachCell((cell, colNumber) => {
        const cellStyle: any = {
          alignment: {
            horizontal: colNumber === 2 || colNumber === 12 ? "left" : "center",
            vertical: "middle",
            wrapText: colNumber === 2 || colNumber === 12,
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        }

        if (colNumber === 9 && cell.value === "x") {
          // cellStyle.fill = { type: "pattern", pattern: "solid" }
          cellStyle.font = { ...cellStyle.font, bold: true, color: { argb: "FF006400" } }
        } else if (colNumber === 10 && cell.value === "x") {
          // cellStyle.fill = { type: "pattern", pattern: "solid" }
          cellStyle.font = { ...cellStyle.font, bold: true, color: { argb: "FF8B0000" } }
        }

        cell.style = cellStyle
      })
    })

    // Summary section
    const summaryRowStart = 5 + tasks.length

    worksheet.getCell(`B${summaryRowStart}`).value = `SỐ ĐẦU VIỆC HOÀN THÀNH/CHƯA HOÀN THÀNH:`
    worksheet.getCell(`I${summaryRowStart}`).value = `${completedTasks}`
    worksheet.getCell(`J${summaryRowStart}`).value = `${totalTasks - completedTasks}`
    worksheet.mergeCells(`B${summaryRowStart}:H${summaryRowStart}`)

    worksheet.getCell(`B${summaryRowStart + 1}`).value = `(%) KẾT QUẢ CÔNG VIỆC HOÀN THÀNH:`
    worksheet.getCell(`I${summaryRowStart + 1}`).value = `${completionRate}%`
    worksheet.mergeCells(`B${summaryRowStart + 1}:H${summaryRowStart + 1}`)
    worksheet.mergeCells(`I${summaryRowStart + 1}:J${summaryRowStart + 1}`)

    const summaryColumns = [`A${summaryRowStart}`, `B${summaryRowStart}`, `C${summaryRowStart}`, `D${summaryRowStart}`, `E${summaryRowStart}`, `F${summaryRowStart}`, `G${summaryRowStart}`, `H${summaryRowStart}`, `I${summaryRowStart}`, `J${summaryRowStart}`, `K${summaryRowStart}`]
    const summaryColumns2 = [`A${summaryRowStart + 1}`, `B${summaryRowStart + 1}`, `C${summaryRowStart + 1}`, `D${summaryRowStart + 1}`, `E${summaryRowStart + 1}`, `F${summaryRowStart + 1}`, `G${summaryRowStart + 1}`, `H${summaryRowStart + 1}`, `I${summaryRowStart + 1}`, `J${summaryRowStart + 1}`, `K${summaryRowStart + 1}`]

    ;[...summaryColumns, ...summaryColumns2].forEach((cellAddr) => {
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

    ;[summaryRowStart, summaryRowStart + 1].forEach((rowNum) => {
      worksheet.getRow(rowNum).height = 25
    })

    // Footer section
    const footerRowStart = summaryRowStart + 3

    worksheet.getCell(`K${footerRowStart}`).value =
      `Phú Hòa, ngày ${format(currentDate, "dd", { locale: vi })} tháng ${format(currentDate, "MM", { locale: vi })} năm ${format(currentDate, "yyyy", { locale: vi })}`

    worksheet.getCell(`B${footerRowStart + 1}`).value = "Trưởng đơn vị"
    worksheet.getCell(`C${footerRowStart + 1}`).value = "CBQL Trực Tiếp"
    worksheet.mergeCells(`C${footerRowStart + 1}:J${footerRowStart + 1}`)
    worksheet.getCell(`K${footerRowStart + 1}`).value = "Người lập"
    worksheet.getCell(`K${footerRowStart + 5}`).value = `${user?.firstName} ${user?.lastName}`

    const footerCells = [`K${footerRowStart}`, `K${footerRowStart + 1}`, `K${footerRowStart + 5}`, `C${footerRowStart + 1}`, `B${footerRowStart + 1}`]
    footerCells.forEach((cellAddr) => {
      worksheet.getCell(cellAddr).style = {
        alignment: { horizontal: "center", vertical: "middle" },
      }
    })

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
    // console.error("Error exporting to Excel:", error)
    // throw new Error("Có lỗi xảy ra khi xuất file Excel")
  }
}