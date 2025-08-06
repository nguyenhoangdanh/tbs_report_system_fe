"use client"

import { useState, useCallback } from "react"
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Button } from "@/components/ui/button"
import { X, Download, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { toast } from "react-toast-kit"

// Simple worker setup that works in all environments
if (typeof window !== 'undefined') {
  // Try local worker first (from postinstall script)
  const localWorkerPath = '/pdf.worker.min.mjs'
  
  // Check if local worker exists
  fetch(localWorkerPath, { method: 'HEAD' })
    .then(response => {
      if (response.ok) {
        pdfjs.GlobalWorkerOptions.workerSrc = localWorkerPath
      } else {
        throw new Error('Local worker not found')
      }
    })
    .catch(() => {
      // Fallback to CDN
      const cdnUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
      pdfjs.GlobalWorkerOptions.workerSrc = cdnUrl
    })
}

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
  defaultScale: 1.0,
}

interface PDFViewerProps {
  isOpen: boolean
  onClose: () => void
}

export default function PDFViewer({ isOpen, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [pdfError, setPdfError] = useState(false)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPdfError(false)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error)
    setPdfError(true)
    toast.error('Không thể tải file PDF')
  }, [])

  const handleDownloadPDF = () => {
    try {
      const link = document.createElement('a')
      link.href = '/huong_dan.pdf'
      link.download = 'huong_dan.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Đang tải xuống hướng dẫn...')
    } catch (error) {
      console.error('Error downloading guide:', error)
      toast.error('Không thể tải xuống hướng dẫn')
    }
  }

  const handleOpenInNewTab = () => {
    try {
      window.open('/huong_dan.pdf', '_blank')
      toast.success('Đang mở hướng dẫn trong tab mới...')
    } catch (error) {
      console.error('Error opening guide:', error)
      toast.error('Không thể mở hướng dẫn')
    }
  }

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1))
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages || 1))
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.0))
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-950/20 flex-shrink-0">
          <h2 className="text-xl font-semibold text-green-700 dark:text-green-300">
            Hướng dẫn sử dụng
            {numPages && (
              <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                ({pageNumber}/{numPages})
              </span>
            )}
          </h2>
          <div className="flex items-center gap-1">
            {/* PDF Controls */}
            {!pdfError && numPages && (
              <>
                <Button
                  onClick={zoomOut}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Thu nhỏ"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded min-w-[50px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  onClick={zoomIn}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Phóng to"
                  disabled={scale >= 2.0}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                <Button
                  onClick={goToPrevPage}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Trang trước"
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={goToNextPage}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Trang sau"
                  disabled={pageNumber >= numPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              </>
            )}

            <Button
              onClick={handleDownloadPDF}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600"
              title="Tải xuống PDF"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleOpenInNewTab}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-600"
              title="Mở trong tab mới"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4">
          {!pdfError ? (
            <div className="flex justify-center">
              <Document
                file="/huong_dan.pdf"
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={options}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderMode='canvas'
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  className="shadow-lg"
                />
              </Document>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>

                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Không thể tải PDF
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                  Vui lòng thử các phương án bên dưới:
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleOpenInNewTab}
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở trong tab mới
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                    Tải xuống
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}