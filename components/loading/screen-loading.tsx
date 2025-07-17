"use client"

import { memo } from "react"
import { LoadingSpinner } from "./loading-spinner"
import { cn } from "@/lib/utils"

interface ScreenLoadingProps {
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

export const ScreenLoading = memo(
    ({
        text = "Đang tải...",
        size = "lg",
        variant = "spin",
        className = "",
        fullScreen = true,
        backdrop = true,
        color = "primary",
    }: ScreenLoadingProps) => {
        const content = (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <LoadingSpinner size={size} variant={variant} color={color} />
                {text && <p className="text-sm text-muted-foreground text-center max-w-xs">{text}</p>}
            </div>
        )

        if (fullScreen) {
            return (
                <div
                    className={cn(
                        "fixed inset-0 z-50 flex items-center justify-center",
                        backdrop && "bg-background/80 backdrop-blur-sm",
                        className,
                    )}
                >
                    {content}
                </div>
            )
        }

        return <div className={cn("flex items-center justify-center min-h-[200px]", className)}>{content}</div>
    },
)

ScreenLoading.displayName = "ScreenLoading"
