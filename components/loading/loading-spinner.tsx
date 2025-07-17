"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
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
    ({ size = "md", variant = "spin", className, color = "primary" }: LoadingSpinnerProps) => {
        const sizes = sizeMap[size]
        const colorClass = colorMap[color]

        const renderVariant = () => {
            switch (variant) {
                case "spin":
                    return (
                        <div
                            className={cn(
                                "animate-spin rounded-full border-2 border-current border-t-transparent",
                                sizes.container,
                                colorClass,
                            )}
                        />
                    )

                case "dots":
                    return (
                        <div className="flex space-x-1">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className={cn("rounded-full bg-current animate-bounce", sizes.dot, colorClass)}
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                        </div>
                    )

                case "pulse":
                    return <div className={cn("rounded-full bg-current animate-pulse", sizes.container, colorClass)} />

                case "bars":
                    return (
                        <div className="flex space-x-1 items-end">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={cn("bg-current animate-pulse", sizes.bar, colorClass)}
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
                                        animationDelay: `${i * 0.1}s`,
                                        animationDuration: "0.8s",
                                    }}
                                />
                            ))}
                        </div>
                    )

                case "wave":
                    return (
                        <div className="flex space-x-1 items-center">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={cn("bg-current rounded-full", sizes.dot, colorClass)}
                                    style={{
                                        animation: `wave 1.4s ease-in-out ${i * 0.1}s infinite both`,
                                    }}
                                />
                            ))}
                        </div>
                    )

                case "bounce":
                    return (
                        <div className="flex space-x-1">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className={cn("bg-current rounded-full", sizes.dot, colorClass)}
                                    style={{
                                        animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                                    }}
                                />
                            ))}
                        </div>
                    )

                case "ring":
                    return (
                        <div className={cn("relative", sizes.container)}>
                            <div className={cn("absolute inset-0 rounded-full border-2 border-current opacity-20", colorClass)} />
                            <div
                                className={cn(
                                    "absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin",
                                    colorClass,
                                )}
                            />
                        </div>
                    )

                case "dual-ring":
                    return (
                        <div className={cn("relative", sizes.container)}>
                            <div
                                className={cn(
                                    "absolute inset-0 rounded-full border-2 border-current border-t-transparent animate-spin",
                                    colorClass,
                                )}
                            />
                            <div
                                className={cn(
                                    "absolute inset-1 rounded-full border-2 border-current border-b-transparent animate-spin",
                                    colorClass,
                                )}
                                style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
                            />
                        </div>
                    )

                case "ripple":
                    return (
                        <div className={cn("relative", sizes.container)}>
                            {[0, 1].map((i) => (
                                <div
                                    key={i}
                                    className={cn("absolute inset-0 rounded-full border-2 border-current animate-ping", colorClass)}
                                    style={{ animationDelay: `${i * 0.5}s` }}
                                />
                            ))}
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
                                        animation: `fade 1.2s ease-in-out ${(i % 3) * 0.1 + Math.floor(i / 3) * 0.1}s infinite both`,
                                    }}
                                />
                            ))}
                        </div>
                    )

                case "fade":
                    return (
                        <div className="flex space-x-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={cn("bg-current rounded-full", sizes.dot, colorClass)}
                                    style={{
                                        animation: `fade 1s ease-in-out ${i * 0.1}s infinite both`,
                                    }}
                                />
                            ))}
                        </div>
                    )

                case "flip":
                    return (
                        <div
                            className={cn("bg-current rounded", sizes.container, colorClass)}
                            style={{ animation: "flip 1.2s ease-in-out infinite" }}
                        />
                    )

                case "orbit":
                    return (
                        <div className={cn("relative", sizes.container)}>
                            <div
                                className={cn(
                                    "absolute top-0 left-1/2 w-2 h-2 bg-current rounded-full -translate-x-1/2 animate-spin",
                                    colorClass,
                                )}
                                style={{
                                    transformOrigin: `0 ${size === "xs" ? "8px" : size === "sm" ? "12px" : size === "md" ? "16px" : size === "lg" ? "24px" : "32px"}`,
                                }}
                            />
                        </div>
                    )

                case "elastic":
                    return (
                        <div className="flex space-x-1 items-end">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className={cn("bg-current rounded-full", sizes.dot, colorClass)}
                                    style={{
                                        animation: `elastic 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                                    }}
                                />
                            ))}
                        </div>
                    )

                case "heart":
                    return (
                        <div className={cn("relative", sizes.container, colorClass)}>
                            <div
                                className="absolute inset-0 animate-pulse"
                                style={{
                                    background: "currentColor",
                                    clipPath: "polygon(50% 20%, 80% 0%, 100% 35%, 82% 57%, 50% 100%, 18% 57%, 0% 35%, 20% 0%)",
                                }}
                            />
                        </div>
                    )

                case "hourglass":
                    return (
                        <div className={cn("relative", sizes.container, colorClass)}>
                            <div
                                className="absolute inset-0 animate-spin"
                                style={{
                                    background: "currentColor",
                                    clipPath: "polygon(0% 0%, 100% 0%, 50% 50%, 100% 100%, 0% 100%, 50% 50%)",
                                    animationDuration: "1.5s",
                                }}
                            />
                        </div>
                    )

                default:
                    return (
                        <div
                            className={cn(
                                "animate-spin rounded-full border-2 border-current border-t-transparent",
                                sizes.container,
                                colorClass,
                            )}
                        />
                    )
            }
        }

        return <div className={cn("inline-flex items-center justify-center", className)}>{renderVariant()}</div>
    },
)

LoadingSpinner.displayName = "LoadingSpinner"
