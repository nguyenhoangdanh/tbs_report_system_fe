"use client"

import { memo } from "react"
import { LoadingSpinner } from "./loading-spinner"
import { cn } from "@/lib/utils"
import type { ScreenLoadingProps } from "./types"

export const ScreenLoading = memo(
    ({
        text = "Đang tải...",
        size = "lg",
        variant = "spin",
        className = "",
        fullScreen = true,
        backdrop = true,
        color = "primary",
        hollow = false,
        children,
        progress,
        showPercentage = false,
    }: ScreenLoadingProps) => {
        const content = (
            <div className="flex flex-col items-center justify-center space-y-6 p-8">
                <div className="relative">
                    <LoadingSpinner
                        size={size}
                        variant={variant}
                        color={color}
                        hollow={hollow}
                    >
                        {hollow && (children || (showPercentage && progress !== undefined) || text) && (
                            <div className="text-center">
                                {children ? (
                                    children
                                ) : showPercentage && progress !== undefined ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-lg font-bold">{Math.round(progress)}%</span>
                                        {text && <span className="text-xs opacity-75 mt-1">{text}</span>}
                                    </div>
                                ) : (
                                    <span className="text-xs font-semibold">
                                        {variant === 'tsb-text' || variant === 'company-logo' ? 'TBS' : 'Loading'}
                                    </span>
                                )}
                            </div>
                        )}
                    </LoadingSpinner>
                </div>

                {!hollow && text && (
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground max-w-xs">{text}</p>
                        {showPercentage && progress !== undefined && (
                            <p className="text-xs text-muted-foreground/80">{Math.round(progress)}%</p>
                        )}
                    </div>
                )}

                {progress !== undefined && !showPercentage && (
                    <div className="w-48 bg-muted rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                )}
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
