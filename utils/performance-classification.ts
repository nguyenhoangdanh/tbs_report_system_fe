import { Ranking } from "@/services/report.service"

export interface PerformanceClassification {
  level: Ranking
  label: string
  labelEn: string
  color: string
  bgColor: string
  borderColor: string
  description: string
  minPercentage: number
  maxPercentage: number
}

/**
 * Xếp loại hiệu suất theo bảng màu chuẩn Việt Nam
 * GIỎI (100%) = Màu tím/magenta
 * KHÁ (95-99%) = Màu xanh lá
 * TB (90-94%) = Màu vàng
 * YẾU (85-89%) = Màu cam
 * KÉM (<85%) = Màu đỏ
 */
export const PERFORMANCE_LEVELS: PerformanceClassification[] = [
  {
    level: 'EXCELLENT',
    label: 'GIỎI',
    labelEn: 'EXCELLENT',
    color: '#d946ef', // magenta-500 - Màu tím như trong ảnh
    bgColor: '#fdf4ff', // magenta-50
    borderColor: '#d946ef',
    description: 'Hoàn thành xuất sắc',
    minPercentage: 91,
    maxPercentage: 100
  },
  {
    level: 'GOOD',
    label: 'KHÁ',
    labelEn: 'GOOD', 
    color: '#22c55e', // green-500 - Màu xanh lá như trong ảnh
    bgColor: '#f0fdf4', // green-50
    borderColor: '#22c55e',
    description: 'Hoàn thành tốt',
    minPercentage: 80,
    maxPercentage: 90
  },
  {
    level: 'AVERAGE',
    label: 'TRUNG BÌNH',
    labelEn: 'AVERAGE',
    color: '#eab308', // yellow-500 - Màu vàng như trong ảnh
    bgColor: '#fefce8', // yellow-50
    borderColor: '#eab308',
    description: 'Hoàn thành trung bình',
    minPercentage: 70,
    maxPercentage: 79,
  },
  {
    level: 'POOR',
    label: 'YẾU',
    labelEn: 'POOR',
    color: '#f97316', // orange-500 - Màu cam như trong ảnh
    bgColor: '#fff7ed', // orange-50
    borderColor: '#f97316',
    description: 'Cần cải thiện',
    minPercentage: 0,
    maxPercentage: 69 // Mặc định dưới 70% sẽ là Y
  },
  // {
  //   level: 'FAIL',
  //   label: 'KÉM',
  //   labelEn: 'FAIL',
  //   color: '#dc2626', // red-600 - Màu đỏ như trong ảnh
  //   bgColor: '#fef2f2', // red-50
  //   borderColor: '#dc2626',
  //   description: 'Yêu cầu cải thiện ngay',
  //   minPercentage: 0,
  //   maxPercentage: 84
  // }
]

/**
 * Xếp loại hiệu suất dựa trên tỷ lệ phần trăm
 */
export function classifyPerformance(percentage: number): PerformanceClassification {
  // Đảm bảo percentage trong khoảng 0-100
  const normalizedPercentage = Math.max(0, Math.min(100, percentage))
  
  // if (normalizedPercentage === 100) {
  //   return PERFORMANCE_LEVELS[0] // GIỎI - Màu tím
  // } else if (normalizedPercentage >= 95) {
  //   return PERFORMANCE_LEVELS[1] // KHÁ - Màu xanh lá
  // } else if (normalizedPercentage >= 90) {
  //   return PERFORMANCE_LEVELS[2] // TB - Màu vàng
  // } else if (normalizedPercentage >= 85) {
  //   return PERFORMANCE_LEVELS[3] // YẾU - Màu cam
  // }
  // else {
  //   return PERFORMANCE_LEVELS[4] // KÉM - Màu đỏ
  // }
  if (normalizedPercentage >= 90) {
    return PERFORMANCE_LEVELS[0] // GIỎI - Màu tím
  } else if (normalizedPercentage >= 80) {
    return PERFORMANCE_LEVELS[1] // KHÁ - Màu xanh lá
  } else if (normalizedPercentage >= 70) {
    return PERFORMANCE_LEVELS[2] // TRUNG BÌNH - Màu vàng
  } else {
    return PERFORMANCE_LEVELS[3] // YẾU - Màu cam
  }
}
/**
 * Lấy màu sắc dựa trên tỷ lệ hoàn thành
 */
export function getPerformanceColor(percentage: number): {
  text: string
  background: string
  border: string
} {
  const classification = classifyPerformance(percentage)
  return {
    text: classification.color,
    background: classification.bgColor,
    border: classification.borderColor
  }
}

/**
 * Lấy badge style theo màu chuẩn từ ảnh
 */
export function getPerformanceBadge(percentage: number): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className: string
} {
  const classification = classifyPerformance(percentage)
  
  switch (classification.level) {
    case 'EXCELLENT':
      return {
        label: classification.label,
        variant: 'default',
        className: 'bg-purple-500 text-white border-purple-500 hover:bg-purple-600'
      }
    case 'GOOD':
      return {
        label: classification.label,
        variant: 'default', 
        className: 'bg-green-500 text-white border-green-500 hover:bg-green-600'
      }
    case 'AVERAGE':
      return {
        label: classification.label,
        variant: 'secondary',
        className: 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600'
      }
    case 'POOR':
      return {
        label: classification.label,
        variant: 'outline',
        className: 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
      }
    // case 'FAIL':
    //   return {
    //     label: classification.label,
    //     variant: 'destructive',
    //     className: 'bg-red-500 text-white border-red-500 hover:bg-red-600'
    //   }
    default:
      return {
        label: 'N/A',
        variant: 'outline',
        className: 'bg-gray-100 text-gray-800 border-gray-400'
      }
  }
}

/**
 * Lấy CSS class cho progress bar theo màu từ ảnh
 */
export function getProgressBarStyle(percentage: number): string {
  const classification = classifyPerformance(percentage)
  
  switch (classification.level) {
    case 'EXCELLENT':
      return 'bg-gradient-to-r from-purple-500 to-purple-600' // Màu tím
    case 'GOOD':
      return 'bg-gradient-to-r from-green-400 to-green-500' // Màu xanh lá
    case 'AVERAGE':
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600' // Màu vàng
    case 'POOR':
      return 'bg-gradient-to-r from-orange-500 to-orange-600' // Màu cam
    // case 'FAIL':
    //   return 'bg-gradient-to-r from-red-500 to-red-600' // Màu đỏ
    default:
      return 'bg-gray-400'
  }
}

/**
 * Format hiển thị xếp loại với icon
 */
export function formatPerformanceWithIcon(percentage: number): {
  label: string
  icon: string
  color: string
} {
  const classification = classifyPerformance(percentage)
  
  let icon = ''
  switch (classification.level) {
    case 'EXCELLENT':
      icon = '🏆' // Trophy
      break
    case 'GOOD':
      icon = '👍' // Thumbs up
      break
    case 'AVERAGE':
      icon = '📊' // Bar chart
      break
    case 'POOR':
      icon = '⚠️' // Warning
      break
    // case 'FAIL':
    //   icon = '❌' // Cross mark
      break
  }
  
  return {
    label: classification.label,
    icon,
    color: classification.color
  }
}

/**
 * Calculate performance distribution from completion rates array
 */

/**
 * Get text color for performance percentage - Updated to match PERFORMANCE_LEVELS
 */
export function getPerformanceTextColor(percentage: number): string {
  const classification = classifyPerformance(percentage)
  return classification.color
}

/**
 * Get background color for performance percentage - Updated to match PERFORMANCE_LEVELS
 */
export function getPerformanceBackgroundColor(percentage: number): string {
  const classification = classifyPerformance(percentage)
  return classification.bgColor
}

/**
 * Get border color for performance percentage - Updated to match PERFORMANCE_LEVELS
 */
export function getPerformanceBorderColor(percentage: number): string {
  const classification = classifyPerformance(percentage)
  return classification.borderColor
}
