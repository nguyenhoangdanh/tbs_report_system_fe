"use client";

import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Check, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as ExcelJS from 'exceljs';
import type { WeeklyReport } from '@/types';

interface ReportTemplateProps {
  report: WeeklyReport;
  className?: string;
}

export function ReportTemplate({ report, className = "" }: ReportTemplateProps) {
  const user = report.user;
  const tasks = report.tasks || [];

  // Calculate completion stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get current date for the template
  const currentDate = new Date();

  const dayHeaders = [
    { key: 'monday', label: 'Thứ 2', shortLabel: 'T2' },
    { key: 'tuesday', label: 'Thứ 3', shortLabel: 'T3' },
    { key: 'wednesday', label: 'Thứ 4', shortLabel: 'T4' },
    { key: 'thursday', label: 'Thứ 5', shortLabel: 'T5' },
    { key: 'friday', label: 'Thứ 6', shortLabel: 'T6' },
    { key: 'saturday', label: 'Thứ 7', shortLabel: 'T7' },
    { key: 'sunday', label: 'CN', shortLabel: 'CN' }
  ];

  // Export to Excel function with EXACT template formatting and logo
  const exportToExcel = async () => {
    try {
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`TUẦN ${report.weekNumber}`);

      // Set column widths to EXACTLY match template in image 2
      worksheet.columns = [
        { width: 7 },   // A: Logo/STT
        { width: 55 },  // B: KH-KQCV TUẦN (wider for text wrapping)
        { width: 7 },   // C: Thứ 2
        { width: 7 },   // D: Thứ 3
        { width: 7 },   // E: Thứ 4
        { width: 7 },   // F: Thứ 5
        { width: 7 },   // G: Thứ 6
        { width: 7 },   // H: Thứ 7
        { width: 5 },   // I: CN
        { width: 6 },   // J: YES
        { width: 6 },   // K: NO
        { width: 60 }   // L: Nguyên nhân - giải pháp (wider for text wrapping)
      ];

      // Try to add logo image, fallback to text if image not available
      try {
        // Load logo image as base64 or from public folder
        const response = await fetch('/images/logo.png');
        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          
          // Add image to workbook
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'png',
          });
          
          // Insert image in cell A1 with proper ExcelJS anchor format
          worksheet.addImage(imageId, {
            tl: { col: 1, row: 0 }, // top-left position (A1)
            ext: { width: 100, height: 25 }, // Set explicit width and height
            editAs: 'oneCell'
          });
          
          // Style the logo cell background
          worksheet.getCell('B1').style = {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } },
            border: {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            }
          };
        } else {
          throw new Error('Logo not found');
        }
      } catch (logoError) {
        console.warn('Could not load logo, using text fallback:', logoError);
        // Fallback to text if logo can't be loaded
        worksheet.getCell('B1').value = 'TBS';
        worksheet.getCell('B1').style = {
          font: { bold: true, size: 12, name: 'Time New Roman', color: { argb: 'FFFFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } },
          border: {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          }
        };
      }

      // Row 1: Title (B1:L1) - exactly like image 2
      worksheet.getCell('B1').value = `KQ CÔNG VIỆC CHI TIẾT NGÀY - TUẦN ${report.weekNumber}`;
      worksheet.mergeCells('B1:L1');

      // Style title row (B1:L1) - light blue background like image 2
      worksheet.getCell('B1').style = {
        font: { bold: true, size: 14, name: 'Time New Roman' },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid' },
        // fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCE5FF' } },
        border: {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        }
      };

      // Set title row height
      worksheet.getRow(1).height = 40; // Increased for logo

      // Row 2: Employee info first line - HỌ TÊN and MSNV
      // worksheet.getCell('A2').value = 'HỌ TÊN:';
      // worksheet.getCell('B2').value = `${user?.firstName} ${user?.lastName}`;
      // worksheet.getCell('H2').value = 'MSNV:';
      // worksheet.getCell('I2').value = user?.employeeCode;
      worksheet.getCell('B2').value = `HỌ TÊN: ${user?.firstName} ${user?.lastName}`;
      worksheet.getCell('C2').value = `MSNV: ${user?.employeeCode}`;

      // Merge employee info cells like image 2
      worksheet.mergeCells('C2:L2'); // Name spans B2:G2
      // worksheet.mergeCells('I2:L2'); // Employee code spans I2:L2

      // Row 3: Employee info second line - CĐ-VTCV and BP/PB/LINE
      // worksheet.getCell('A3').value = 'CĐ - VTCV:';
      // worksheet.getCell('B3').value = `${user?.jobPosition?.position?.name} - ${user?.jobPosition?.jobName}`;
      // worksheet.getCell('H3').value = 'BP/PB/LINE/TÔNM:';
      // worksheet.getCell('I3').value = user?.jobPosition?.department?.office?.name;
      worksheet.getCell('B3').value = `CD - VTCV: ${user?.jobPosition?.position?.name} - ${user?.jobPosition?.jobName}`;
      worksheet.getCell('C3').value = `BP/PB/LINE/TỔ/NM: ${user?.jobPosition?.department?.office?.name}`;

      // Merge job info cells like image 2
      // worksheet.mergeCells('B3:G3'); // Job position spans B3:G3
      // worksheet.mergeCells('I3:L3'); // Office spans I3:L3
      worksheet.mergeCells('C3:L3'); // Job position spans C3:L3
      // worksheet.mergeCells('I3:L3'); // Office spans I3:L3

      // Style employee info labels (bold)
      ['B2', 'I2', 'B3', 'I3'].forEach(cellAddr => {
        worksheet.getCell(cellAddr).style = {
          font: { bold: true, size: 11, name: 'Time New Roman' },
          alignment: { horizontal: 'left', vertical: 'middle' },
          border: {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          }
        };
      });

      // Style employee info values with text wrapping
      ['B2', 'I2', 'B3', 'I3'].forEach(cellAddr => {
        worksheet.getCell(cellAddr).style = {
          font: { size: 11, name: 'Time New Roman' },
          alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
          border: {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          }
        };
      });

      // Set appropriate row heights for employee info
      worksheet.getRow(2).height = 25;
      worksheet.getRow(3).height = 25;

      // Row 4: Table headers exactly like image 2
      const headers = ['STT', 'KH-KQCV TUẦN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN', 'YES', 'NO', 'Nguyên nhân - giải pháp'];
      
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(4, index + 1);
        cell.value = header;
        cell.style = {
          font: { bold: true, size: 11, name: 'Time New Roman' },
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCE5FF' } },
          border: {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          }
        };
      });

      // Set header row height
      worksheet.getRow(4).height = 30;

      // Data rows starting from row 5 with dynamic height
      tasks.forEach((task, index) => {
        const rowNum = 5 + index;
        const row = worksheet.getRow(rowNum);
        
        // Set row data exactly like image 2
        row.values = [
          index + 1,                    // STT
          task.taskName,               // KH-KQCV TUẦN
          task.monday ? 'x' : '',      // Thứ 2
          task.tuesday ? 'x' : '',     // Thứ 3
          task.wednesday ? 'x' : '',   // Thứ 4
          task.thursday ? 'x' : '',    // Thứ 5
          task.friday ? 'x' : '',      // Thứ 6
          task.saturday ? 'x' : '',    // Thứ 7
          task.sunday ? 'x' : '',      // CN
          task.isCompleted ? 'x' : '', // YES
          !task.isCompleted ? 'x' : '',// NO
          !task.isCompleted && task.reasonNotDone ? task.reasonNotDone : ''
        ];

        // Calculate dynamic row height based on text length
        const taskNameLength = task.taskName.length;
        const reasonLength = (!task.isCompleted && task.reasonNotDone) ? task.reasonNotDone.length : 20;
        const maxLength = Math.max(taskNameLength, reasonLength);
        
        // Dynamic height: minimum 25, increase by 15 for every 50 characters
        const calculatedHeight = Math.max(25, Math.ceil(maxLength / 50) * 15 + 10);
        row.height = calculatedHeight;

        // Style each cell in the row
        row.eachCell((cell, colNumber) => {
          let cellStyle: any = {
            font: { size: 10, name: 'Time New Roman' },
            alignment: { 
              horizontal: colNumber === 2 || colNumber === 12 ? 'left' : 'center',
              vertical: 'middle', // Center alignment for better text display
              wrapText: colNumber === 2 || colNumber === 12 // Enable text wrapping for long content
            },
            border: {
              top: { style: 'thin' }, bottom: { style: 'thin' },

              left: { style: 'thin' }, right: { style: 'thin' }
            }
          };

          // Special styling for YES/NO columns like image 2
          if (colNumber === 10 && cell.value === 'x') { // YES column - green
            cellStyle.fill = { type: 'pattern', pattern: 'solid', };
            cellStyle.font = { ...cellStyle.font, bold: true, color: { argb: 'FF006400' } };
          } else if (colNumber === 11 && cell.value === 'x') { // NO column - red
            cellStyle.fill = { type: 'pattern', pattern: 'solid',  };
            cellStyle.font = { ...cellStyle.font, bold: true, color: { argb: 'FF8B0000' } };
          }

          cell.style = cellStyle;
        });
      });

      // Summary section exactly like image 2
      const summaryRowStart = 5 + tasks.length;

      // worksheet.mergeCells(`A${summaryRowStart}:A${summaryRowStart+1}`);
      // Summary row 1 - merged across all columns
      worksheet.getCell(`B${summaryRowStart}`).value = `SỐ ĐẦU VIỆC HOÀN THÀNH/CHƯA HOÀN THÀNH:`;
      worksheet.getCell(`J${summaryRowStart}`).value = `${completedTasks}`;
      worksheet.getCell(`K${summaryRowStart}`).value = `${totalTasks - completedTasks}`;
      worksheet.mergeCells(`B${summaryRowStart}:I${summaryRowStart}`);
      
      // Summary row 2 - merged across all columns
      worksheet.getCell(`B${summaryRowStart + 1}`).value = `(%) KẾT QUẢ CÔNG VIỆC HOÀN THÀNH:`;
      worksheet.getCell(`J${summaryRowStart + 1}`).value = `${completionRate}%`;
      worksheet.mergeCells(`B${summaryRowStart + 1}:I${summaryRowStart + 1}`);
      worksheet.mergeCells(`J${summaryRowStart + 1}:K${summaryRowStart + 1}`);

      worksheet.mergeCells(`A${summaryRowStart}:A${summaryRowStart + 1}`);

      // Style summary cells - bright yellow like image 2
      [summaryRowStart, summaryRowStart + 1].forEach(rowNum => {
        const cell = worksheet.getCell(`B${rowNum}`);
        cell.style = {
          font: { bold: true, size: 12, name: 'Time New Roman' },
          alignment: { horizontal: 'center', vertical: 'middle' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } },
          border: {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          }
        };
        worksheet.getRow(rowNum).height = 25;
      });

      // Footer section exactly like image 2
      const footerRowStart = summaryRowStart + 3;
      
      // Date line positioned like image 2
      worksheet.getCell(`G${footerRowStart}`).value = `Phú Hòa, ngày ${format(currentDate, 'dd', { locale: vi })} tháng ${format(currentDate, 'MM', { locale: vi })} năm ${format(currentDate, 'yyyy', { locale: vi })}`;
      worksheet.mergeCells(`G${footerRowStart}:L${footerRowStart}`);
      
      // Signature headers positioned like image 2
      worksheet.getCell(`A${footerRowStart + 2}`).value = 'Trưởng đơn vị';
      worksheet.mergeCells(`A${footerRowStart + 2}:C${footerRowStart + 2}`);
      
      worksheet.getCell(`E${footerRowStart + 2}`).value = 'CBQL Trực Tiếp';
      worksheet.mergeCells(`E${footerRowStart + 2}:H${footerRowStart + 2}`);
      
      worksheet.getCell(`J${footerRowStart + 2}`).value = 'Người lập';
      worksheet.mergeCells(`J${footerRowStart + 2}:L${footerRowStart + 2}`);
      
      // Name signature with proper spacing
      worksheet.getCell(`J${footerRowStart + 6}`).value = `${user?.firstName} ${user?.lastName}`;
      worksheet.mergeCells(`J${footerRowStart + 6}:L${footerRowStart + 6}`);

      // Style footer elements
      worksheet.getCell(`G${footerRowStart}`).style = {
        font: { size: 10, name: 'Time New Roman', italic: true },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };

      // Style signature headers
      [`A${footerRowStart + 2}`, `E${footerRowStart + 2}`, `J${footerRowStart + 2}`].forEach(cellAddr => {
        worksheet.getCell(cellAddr).style = {
          font: { size: 11, bold: true, name: 'Time New Roman' },
          alignment: { horizontal: 'center', vertical: 'middle' }
        };
      });

      // Style signature name
      worksheet.getCell(`J${footerRowStart + 6}`).style = {
        font: { size: 11, bold: true, name: 'Time New Roman' },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `KQ CÔNG VIỆC CHI TIẾT NGÀY - TUẦN ${report.weekNumber}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header with Logo and Export Button */}
      <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src="/images/logo.png" 
              alt="TBS Group Logo" 
              className="w-10 h-10 sm:w-10 sm:h-10 object-contain"
              onError={(e) => {
                // Fallback to text if image doesn't load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling!.textContent = 'TBS';
              }}
            />
            <span className="text-white font-bold text-sm sm:text-lg hidden">TBS</span>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              KQ CÔNG VIỆC CHI TIẾT NGÀY
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              TUẦN {report.weekNumber} - NĂM {report.year}
            </p>
          </div>
        </div>
        
        <Button
          onClick={exportToExcel}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Xuất Excel</span>
          <span className="sm:hidden">Excel</span>
        </Button>
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
                CĐ - VTCV:
              </span>
              <span className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {user?.jobPosition?.position?.name} - {user?.jobPosition?.jobName}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row">
              <span className="font-semibold w-full sm:w-32 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                MSNV:
              </span>
              <span className="text-gray-900 dark:text-gray-100 font-mono text-sm sm:text-base">
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

      {/* Tasks Table */}
      <div className="p-4 sm:p-6">
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            {/* Table Header */}
            <thead>
              <tr className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                  STT
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[200px]">
                  KH-KQCV TUẦN
                </th>
                {dayHeaders.map(day => (
                  <th key={day.key} className="border border-gray-300 dark:border-gray-600 px-1 sm:px-2 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs min-w-[40px]">
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.shortLabel}</span>
                  </th>
                ))}
                <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-green-700 dark:text-green-400 text-xs sm:text-sm">
                  YES
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-red-700 dark:text-red-400 text-xs sm:text-sm">
                  NO
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[150px]">
                  Nguyên nhân - giải pháp
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {tasks.map((task, index) => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                    <div className="break-words">{task.taskName}</div>
                  </td>
                  {dayHeaders.map(day => (
                    <td key={day.key} className="border border-gray-300 dark:border-gray-600 px-1 sm:px-2 py-2 sm:py-3 text-center">
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
                    {/* {!task.isCompleted && task.reasonNotDone ? (
                      <div className="break-words max-w-xs">{task.reasonNotDone}</div>
                    ) : task.isCompleted ? (
                      <span className="text-green-600 font-medium">Đang kiểm thử</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )} */}
                    <div className="break-words max-w-xs">{task.reasonNotDone}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Footer */}
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="space-y-1">
              <div><span className="font-semibold">Trưởng đơn vị:</span></div>
              <div><span className="font-semibold">CBQL Trực Tiếp:</span></div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-12 sm:mb-16">
              Phú Hòa, ngày {format(currentDate, 'dd', { locale: vi })} tháng {format(currentDate, 'MM', { locale: vi })} năm {format(currentDate, 'yyyy', { locale: vi })}
            </div>
            <div className="text-center border-t border-gray-300 dark:border-gray-600 pt-2">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Người lập</div>
              <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
