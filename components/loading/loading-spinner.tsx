"use client"

import React, { memo } from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl"
    variant?: "spin" | "ring" | "dual-ring" | "grid" | "bars" | "square-split" | "corner-squares"
    className?: string
    color?: "primary" | "secondary" | "success" | "warning" | "destructive"
    hollow?: boolean
    children?: React.ReactNode
}

const sizeMap = {
    xs: { container: "w-4 h-4", dot: "w-1 h-1", bar: "w-0.5", ring: "w-4 h-4" },
    sm: { container: "w-6 h-6", dot: "w-1.5 h-1.5", bar: "w-1", ring: "w-6 h-6" },
    md: { container: "w-8 h-8", dot: "w-2 h-2", bar: "w-1.5", ring: "w-8 h-8" },
    lg: { container: "w-12 h-12", dot: "w-3 h-3", bar: "w-2", ring: "w-12 h-12" },
    xl: { container: "w-16 h-16", dot: "w-4 h-4", bar: "w-3", ring: "w-16 h-16" },
}

const colorMap = {
    primary: "text-primary",
    secondary: "text-secondary-foreground",
    success: "text-green-500",
    warning: "text-yellow-500",
    destructive: "text-red-500",
}

export const LoadingSpinner = memo(
    ({ size = "md", variant = "spin", className, color = "primary", hollow = false, children }: LoadingSpinnerProps) => {
        const sizes = sizeMap[size]
        const colorClass = colorMap[color]

        const renderVariant = () => {
            switch (variant) {
                case "spin":
                    return (
                        <div className={cn("relative", sizes.container)}>
                            <div
                                className={cn(
                                    "rounded-full border-2 border-current border-t-transparent",
                                    sizes.container,
                                    colorClass,
                                )}
                                style={{
                                    borderWidth: size === "xs" ? "1.5px" : size === "sm" ? "2px" : "2.5px",
                                    animation: "spin 1s linear infinite"
                                }}
                            />
                            {hollow && children && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {children}
                                </div>
                            )}
                        </div>
                    )

                case "ring":
                    return (
                        <div className={cn("relative", sizes.container)}>
                            <div 
                                className={cn("absolute inset-0 rounded-full border-2 border-current opacity-20", colorClass)}
                                style={{
                                    borderWidth: size === "xs" ? "1.5px" : size === "sm" ? "2px" : "2.5px"
                                }}
                            />
                            <div
                                className={cn(
                                    "absolute inset-0 rounded-full border-2 border-transparent border-t-current",
                                    colorClass,
                                )}
                                style={{
                                    borderWidth: size === "xs" ? "1.5px" : size === "sm" ? "2px" : "2.5px",
                                    animation: "spin 1s linear infinite"
                                }}
                            />
                            {hollow && children && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {children}
                                </div>
                            )}
                        </div>
                    )

                case "dual-ring":
                    return (
                        <div className={cn("relative", sizes.container)}>
                            <div
                                className={cn(
                                    "absolute inset-0 rounded-full border-2 border-current border-t-transparent",
                                    colorClass,
                                )}
                                style={{
                                    borderWidth: size === "xs" ? "1.5px" : size === "sm" ? "2px" : "2.5px",
                                    animation: "spin 1s linear infinite"
                                }}
                            />
                            <div
                                className={cn(
                                    "absolute rounded-full border-2 border-current border-b-transparent",
                                    colorClass,
                                )}
                                style={{ 
                                    top: size === "xs" ? "2px" : size === "sm" ? "3px" : "4px",
                                    left: size === "xs" ? "2px" : size === "sm" ? "3px" : "4px",
                                    right: size === "xs" ? "2px" : size === "sm" ? "3px" : "4px",
                                    bottom: size === "xs" ? "2px" : size === "sm" ? "3px" : "4px",
                                    borderWidth: size === "xs" ? "1px" : size === "sm" ? "1.5px" : "2px",
                                    animation: "spin 0.8s linear infinite reverse"
                                }}
                            />
                            {hollow && children && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    {children}
                                </div>
                            )}
                        </div>
                    )

                case "grid":
                    return (
                        <div className="grid grid-cols-3 gap-1">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn("bg-current rounded-sm", sizes.dot, colorClass)}
                                    style={{
                                        animation: `fade 1s ease-in-out ${(i % 3) * 0.1 + Math.floor(i / 3) * 0.1}s infinite both`,
                                    }}
                                />
                            ))}
                        </div>
                    )

                case "bars":
                    return (
                        <div className="flex space-x-1 items-end">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={cn("bg-current", sizes.bar, colorClass)}
                                    style={{
                                        height:
                                            size === "xs"
                                                ? "12px"
                                                : size === "sm"
                                                    ? "16px"
                                                    : size === "md"
                                                        ? "20px"
                                                        : size === "lg"
                                                            ? "24px"
                                                            : "28px",
                                        animation: `wave 0.8s ease-in-out ${i * 0.1}s infinite both`,
                                    }}
                                />
                            ))}
                        </div>
                    )

                case "square-split":
                    const splitSize = size === "xs" ? 8 : size === "sm" ? 12 : size === "md" ? 16 : size === "lg" ? 24 : 32;
                    
                    return (
                        <div className={cn("relative flex items-center justify-center", sizes.container)}>
                            <div
                                className="relative"
                                style={{
                                    width: `${splitSize}px`,
                                    height: `${splitSize}px`,
                                }}
                            >
                                {/* Top-left piece */}
                                <div
                                    className={cn("split-square", colorClass)}
                                    style={{
                                        width: `${splitSize / 2}px`,
                                        height: `${splitSize / 2}px`,
                                        top: 0,
                                        left: 0,
                                        animation: "square-split-1 1.5s ease-in-out infinite",
                                    }}
                                />
                                {/* Top-right piece */}
                                <div
                                    className={cn("split-square", colorClass)}
                                    style={{
                                        width: `${splitSize / 2}px`,
                                        height: `${splitSize / 2}px`,
                                        top: 0,
                                        right: 0,
                                        animation: "square-split-2 1.5s ease-in-out infinite",
                                    }}
                                />
                                {/* Bottom-left piece */}
                                <div
                                    className={cn("split-square", colorClass)}
                                    style={{
                                        width: `${splitSize / 2}px`,
                                        height: `${splitSize / 2}px`,
                                        bottom: 0,
                                        left: 0,
                                        animation: "square-split-3 1.5s ease-in-out infinite",
                                    }}
                                />
                                {/* Bottom-right piece */}
                                <div
                                    className={cn("split-square", colorClass)}
                                    style={{
                                        width: `${splitSize / 2}px`,
                                        height: `${splitSize / 2}px`,
                                        bottom: 0,
                                        right: 0,
                                        animation: "square-split-4 1.5s ease-in-out infinite",
                                    }}
                                />
                            </div>
                            {hollow && children && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {children}
                                </div>
                            )}
                        </div>
                    )

                case "corner-squares":
                    const cornerSize = size === "xs" ? 32 : size === "sm" ? 40 : size === "md" ? 48 : size === "lg" ? 64 : 80;
                    const squareSize = Math.floor(cornerSize * 0.2);
                    
                    return (
                        <div className="relative flex items-center justify-center">
                            <div
                                className="corner-squares-container"
                                style={{
                                    width: `${cornerSize}px`,
                                    height: `${cornerSize}px`,
                                }}
                            >
                                {/* Top-left corner */}
                                <div
                                    className={cn("corner-square", colorClass)}
                                    style={{
                                        width: `${squareSize}px`,
                                        height: `${squareSize}px`,
                                        top: 0,
                                        left: 0,
                                        animation: "corner-squares-1 1.8s ease-in-out infinite",
                                    }}
                                />
                                {/* Top-right corner */}
                                <div
                                    className={cn("corner-square", colorClass)}
                                    style={{
                                        width: `${squareSize}px`,
                                        height: `${squareSize}px`,
                                        top: 0,
                                        right: 0,
                                        animation: "corner-squares-2 1.8s ease-in-out infinite",
                                    }}
                                />
                                {/* Bottom-right corner */}
                                <div
                                    className={cn("corner-square", colorClass)}
                                    style={{
                                        width: `${squareSize}px`,
                                        height: `${squareSize}px`,
                                        bottom: 0,
                                        right: 0,
                                        animation: "corner-squares-3 1.8s ease-in-out infinite",
                                    }}
                                />
                                {/* Bottom-left corner */}
                                <div
                                    className={cn("corner-square", colorClass)}
                                    style={{
                                        width: `${squareSize}px`,
                                        height: `${squareSize}px`,
                                        bottom: 0,
                                        left: 0,
                                        animation: "corner-squares-4 1.8s ease-in-out infinite",
                                    }}
                                />
                            </div>
                            {hollow && children && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {children}
                                </div>
                            )}
                        </div>
                    )

                default:
                    return (
                        <div className={cn("relative", sizes.container)}>
                            <div
                                className={cn(
                                    "rounded-full border-2 border-current border-t-transparent",
                                    sizes.container,
                                    colorClass,
                                )}
                                style={{
                                    borderWidth: size === "xs" ? "1.5px" : size === "sm" ? "2px" : "2.5px",
                                    animation: "spin 1s linear infinite"
                                }}
                            />
                            {hollow && children && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {children}
                                </div>
                            )}
                        </div>
                    )
            }
        }

        return <div className={cn("inline-flex items-center justify-center", className)}>{renderVariant()}</div>
    },
)

LoadingSpinner.displayName = "LoadingSpinner"
