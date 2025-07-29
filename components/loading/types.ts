import type React from "react"
export interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?:
    | "spin"
    | "dots"
    | "pulse"
    | "bars"
    | "wave"
    | "bounce"
    | "ring"
    | "dual-ring"
    | "ripple"
    | "grid"
    | "fade"
    | "flip"
    | "orbit"
    | "elastic"
    | "heart"
    | "hourglass"
    | "square-split"
    | "triangle-spin"
    | "diamond-dance"
    | "hexagon-morph"
    | "line-wave"
    | "circle-chase"
    | "square-pulse"
    | "infinity"
    | "corner-squares"
    | "conic-loader"
    | "tsb-text"
    | "company-logo"
  className?: string
  color?: "primary" | "secondary" | "success" | "warning" | "destructive"
  hollow?: boolean
  children?: React.ReactNode
}

export interface LoadingSkeletonProps {
  type?: "card" | "list" | "table" | "chart" | "hierarchy" | "dashboard" | "profile" | "form" | "grid" | "timeline"
  count?: number
  className?: string
  animated?: boolean
}

export interface ScreenLoadingProps {
  text?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?:
    | "spin"
    | "dots"
    | "pulse"
    | "bars"
    | "wave"
    | "bounce"
    | "ring"
    | "dual-ring"
    | "ripple"
    | "grid"
    | "fade"
    | "flip"
    | "orbit"
    | "elastic"
    | "heart"
    | "hourglass"
    | "square-split"
    | "triangle-spin"
    | "diamond-dance"
    | "hexagon-morph"
    | "line-wave"
    | "circle-chase"
    | "square-pulse"
    | "infinity"
    | "corner-squares"
    | "conic-loader"
    | "tsb-text"
    | "company-logo"
  className?: string
  fullScreen?: boolean
  backdrop?: boolean
  color?: "primary" | "secondary" | "success" | "warning" | "destructive"
  hollow?: boolean
  children?: React.ReactNode
  progress?: number
  showPercentage?: boolean
}

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  loadingVariant?: "spin" | "dots" | "pulse"
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}
