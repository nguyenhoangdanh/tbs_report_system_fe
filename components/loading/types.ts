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
  className?: string
  color?: "primary" | "secondary" | "success" | "warning" | "destructive"
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
  className?: string
  fullScreen?: boolean
  backdrop?: boolean
  color?: "primary" | "secondary" | "success" | "warning" | "destructive"
}

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  loadingVariant?: "spin" | "dots" | "pulse"
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}
