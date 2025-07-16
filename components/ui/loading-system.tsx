"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Loader2, BarChart3, Users, Building2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg"
    text?: string
    className?: string
    variant?: "default" | "dots" | "pulse" | "bars"
}

interface LoadingSkeletonProps {
    type?: "card" | "list" | "table" | "chart" | "hierarchy" | "dashboard"
    count?: number
    className?: string
}

interface AppLoadingProps {
    text?: string
    size?: "sm" | "md" | "lg"
    className?: string
    fullScreen?: boolean
}

// Spinner Component với nhiều variants
export const LoadingSpinner = memo(({ size = "md", text, className, variant = "default" }: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    }

    const renderSpinner = () => {
        switch (variant) {
            case "dots":
                return (
                    <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className={cn("bg-primary rounded-full", size === "sm" ? "w-1 h-1" : size === "md" ? "w-2 h-2" : "w-3 h-3")}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                )
            case "pulse":
                return (
                    <motion.div
                        className={cn("bg-primary rounded-full", sizeClasses[size])}
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    />
                )
            case "bars":
                return (
                    <div className="flex space-x-1 items-end">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className={cn("bg-primary", size === "sm" ? "w-1" : size === "md" ? "w-1.5" : "w-2")}
                                style={{ height: size === "sm" ? "12px" : size === "md" ? "16px" : "20px" }}
                                animate={{ scaleY: [1, 0.3, 1] }}
                                transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                )
            default:
                return <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        }
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {renderSpinner()}
            {text && <span className="text-sm text-muted-foreground">{text}</span>}
        </div>
    )
})

LoadingSpinner.displayName = "LoadingSpinner"

// Skeleton Component với nhiều types
const SkeletonPulse = memo(({ className }: { className: string }) => (
    <div className={cn("animate-pulse bg-muted rounded", className)} />
))

SkeletonPulse.displayName = "SkeletonPulse"

export const LoadingSkeleton = memo(({ type = "card", count = 1, className = "" }: LoadingSkeletonProps) => {
    const renderCardSkeleton = () => (
        <Card className="w-full border-border/50">
            <CardHeader className="space-y-3">
                <SkeletonPulse className="h-4 w-3/4" />
                <SkeletonPulse className="h-3 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="text-center space-y-2">
                            <SkeletonPulse className="h-8 w-full" />
                            <SkeletonPulse className="h-3 w-3/4 mx-auto" />
                        </div>
                    ))}
                </div>
                <SkeletonPulse className="h-2 w-full" />
                <SkeletonPulse className="h-8 w-24" />
            </CardContent>
        </Card>
    )

    const renderListSkeleton = () => (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 border border-border/50 rounded-lg">
                    <SkeletonPulse className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <SkeletonPulse className="h-4 w-3/4" />
                        <SkeletonPulse className="h-3 w-1/2" />
                    </div>
                    <SkeletonPulse className="h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    )

    const renderTableSkeleton = () => (
        <div className="space-y-3">
            <div className="grid grid-cols-4 gap-4 p-3 border-b border-border/50">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonPulse key={i} className="h-4 w-full" />
                ))}
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 p-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                        <SkeletonPulse key={j} className="h-4 w-3/4" />
                    ))}
                </div>
            ))}
        </div>
    )

    const renderChartSkeleton = () => (
        <Card className="border-border/50">
            <CardHeader>
                <SkeletonPulse className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
                <SkeletonPulse className="h-64 w-full" />
            </CardContent>
        </Card>
    )

    const renderHierarchySkeleton = () => (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-border/50">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <SkeletonPulse className="h-6 w-48" />
                        <SkeletonPulse className="h-8 w-24" />
                    </div>
                    <SkeletonPulse className="h-12 w-full" />
                </CardHeader>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <SkeletonPulse className="h-3 w-20" />
                                    <SkeletonPulse className="h-8 w-16" />
                                    <SkeletonPulse className="h-3 w-24" />
                                </div>
                                <SkeletonPulse className="h-12 w-12 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Position Cards */}
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <SkeletonPulse className="h-5 w-48" />
                                    <SkeletonPulse className="h-4 w-32" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <SkeletonPulse className="h-16 w-16 rounded-full" />
                                    <div className="grid grid-cols-2 gap-4">
                                        {Array.from({ length: 2 }).map((_, j) => (
                                            <div key={j} className="text-center space-y-1">
                                                <SkeletonPulse className="h-6 w-8 mx-auto" />
                                                <SkeletonPulse className="h-3 w-12 mx-auto" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )

    const renderDashboardSkeleton = () => (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <SkeletonPulse className="h-4 w-24" />
                                    <SkeletonPulse className="h-8 w-16" />
                                </div>
                                <SkeletonPulse className="h-12 w-12 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Card className="border-border/50">
                        <CardHeader>
                            <SkeletonPulse className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <SkeletonPulse className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-4">
                    <Card className="border-border/50">
                        <CardHeader>
                            <SkeletonPulse className="h-5 w-28" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <SkeletonPulse className="h-4 w-24" />
                                    <SkeletonPulse className="h-4 w-8" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )

    const renderSkeleton = () => {
        switch (type) {
            case "list":
                return renderListSkeleton()
            case "table":
                return renderTableSkeleton()
            case "chart":
                return renderChartSkeleton()
            case "hierarchy":
                return renderHierarchySkeleton()
            case "dashboard":
                return renderDashboardSkeleton()
            case "card":
            default:
                return renderCardSkeleton()
        }
    }

    return (
        <div className={cn("space-y-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i}>{renderSkeleton()}</div>
            ))}
        </div>
    )
})

LoadingSkeleton.displayName = "LoadingSkeleton"

// App Loading Component
export const AppLoading = memo(({ text = "Đang tải...", size = "md", className = "", fullScreen = false }: AppLoadingProps) => {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    }

    const content = (
        <div className="flex flex-col items-center justify-center space-y-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
                <Loader2 className={cn("text-primary", sizeClasses[size])} />
            </motion.div>
            <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {text}
            </motion.p>
        </div>
    )

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                {content}
            </div>
        )
    }

    return <div className={cn("flex items-center justify-center min-h-[200px]", className)}>{content}</div>
})

AppLoading.displayName = "AppLoading"

// Hierarchy Loading với animation nhẹ nhàng
export const HierarchyLoadingSkeleton = memo(() => (
    <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
    >
        <LoadingSkeleton type="hierarchy" count={1} />
    </motion.div>
))

HierarchyLoadingSkeleton.displayName = "HierarchyLoadingSkeleton"
