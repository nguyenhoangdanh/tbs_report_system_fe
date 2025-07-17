"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
    type?: "card" | "list" | "table" | "chart" | "hierarchy" | "dashboard" | "profile" | "form" | "grid" | "timeline"
    count?: number
    className?: string
    animated?: boolean
}

const SkeletonPulse = memo(({ className, animated = true }: { className: string; animated?: boolean }) => (
    <div className={cn("bg-muted rounded", animated && "animate-pulse", className)} />
))

SkeletonPulse.displayName = "SkeletonPulse"

export const LoadingSkeleton = memo(
    ({ type = "card", count = 1, className = "", animated = true }: LoadingSkeletonProps) => {
        const renderCardSkeleton = () => (
            <Card className="w-full border-border/50">
                <CardHeader className="space-y-3">
                    <SkeletonPulse className="h-4 w-3/4" animated={animated} />
                    <SkeletonPulse className="h-3 w-1/2" animated={animated} />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="text-center space-y-2">
                                <SkeletonPulse className="h-8 w-full" animated={animated} />
                                <SkeletonPulse className="h-3 w-3/4 mx-auto" animated={animated} />
                            </div>
                        ))}
                    </div>
                    <SkeletonPulse className="h-2 w-full" animated={animated} />
                    <SkeletonPulse className="h-8 w-24" animated={animated} />
                </CardContent>
            </Card>
        )

        const renderListSkeleton = () => (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 border border-border/50 rounded-lg">
                        <SkeletonPulse className="h-10 w-10 rounded-full flex-shrink-0" animated={animated} />
                        <div className="flex-1 space-y-2">
                            <SkeletonPulse className="h-4 w-3/4" animated={animated} />
                            <SkeletonPulse className="h-3 w-1/2" animated={animated} />
                        </div>
                        <SkeletonPulse className="h-6 w-16 rounded-full" animated={animated} />
                    </div>
                ))}
            </div>
        )

        const renderTableSkeleton = () => (
            <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 p-3 border-b border-border/50">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonPulse key={i} className="h-4 w-full" animated={animated} />
                    ))}
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 p-3">
                        {Array.from({ length: 4 }).map((_, j) => (
                            <SkeletonPulse key={j} className="h-4 w-3/4" animated={animated} />
                        ))}
                    </div>
                ))}
            </div>
        )

        const renderChartSkeleton = () => (
            <Card className="border-border/50">
                <CardHeader>
                    <SkeletonPulse className="h-4 w-1/3" animated={animated} />
                </CardHeader>
                <CardContent>
                    <SkeletonPulse className="h-64 w-full" animated={animated} />
                </CardContent>
            </Card>
        )

        const renderHierarchySkeleton = () => (
            <div className="space-y-6">
                {/* Header */}
                <Card className="border-border/50">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <SkeletonPulse className="h-6 w-48" animated={animated} />
                            <SkeletonPulse className="h-8 w-24" animated={animated} />
                        </div>
                        <SkeletonPulse className="h-12 w-full" animated={animated} />
                    </CardHeader>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="border-border/50">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <SkeletonPulse className="h-3 w-20" animated={animated} />
                                        <SkeletonPulse className="h-8 w-16" animated={animated} />
                                        <SkeletonPulse className="h-3 w-24" animated={animated} />
                                    </div>
                                    <SkeletonPulse className="h-12 w-12 rounded-xl" animated={animated} />
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
                                        <SkeletonPulse className="h-5 w-48" animated={animated} />
                                        <SkeletonPulse className="h-4 w-32" animated={animated} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <SkeletonPulse className="h-16 w-16 rounded-full" animated={animated} />
                                        <div className="grid grid-cols-2 gap-4">
                                            {Array.from({ length: 2 }).map((_, j) => (
                                                <div key={j} className="text-center space-y-1">
                                                    <SkeletonPulse className="h-6 w-8 mx-auto" animated={animated} />
                                                    <SkeletonPulse className="h-3 w-12 mx-auto" animated={animated} />
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
                                        <SkeletonPulse className="h-4 w-24" animated={animated} />
                                        <SkeletonPulse className="h-8 w-16" animated={animated} />
                                    </div>
                                    <SkeletonPulse className="h-12 w-12 rounded-xl" animated={animated} />
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
                                <SkeletonPulse className="h-6 w-32" animated={animated} />
                            </CardHeader>
                            <CardContent>
                                <SkeletonPulse className="h-64 w-full" animated={animated} />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-4">
                        <Card className="border-border/50">
                            <CardHeader>
                                <SkeletonPulse className="h-5 w-28" animated={animated} />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <SkeletonPulse className="h-4 w-24" animated={animated} />
                                        <SkeletonPulse className="h-4 w-8" animated={animated} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )

        const renderProfileSkeleton = () => (
            <Card className="border-border/50">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                        <SkeletonPulse className="h-24 w-24 rounded-full mx-auto sm:mx-0" animated={animated} />
                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <SkeletonPulse className="h-6 w-48" animated={animated} />
                                <SkeletonPulse className="h-4 w-32" animated={animated} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <SkeletonPulse className="h-3 w-16" animated={animated} />
                                    <SkeletonPulse className="h-4 w-24" animated={animated} />
                                </div>
                                <div className="space-y-2">
                                    <SkeletonPulse className="h-3 w-16" animated={animated} />
                                    <SkeletonPulse className="h-4 w-20" animated={animated} />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )

        const renderFormSkeleton = () => (
            <Card className="border-border/50">
                <CardHeader>
                    <SkeletonPulse className="h-6 w-32" animated={animated} />
                </CardHeader>
                <CardContent className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <SkeletonPulse className="h-4 w-24" animated={animated} />
                            <SkeletonPulse className="h-10 w-full" animated={animated} />
                        </div>
                    ))}
                    <div className="flex gap-4">
                        <SkeletonPulse className="h-10 w-24" animated={animated} />
                        <SkeletonPulse className="h-10 w-20" animated={animated} />
                    </div>
                </CardContent>
            </Card>
        )

        const renderGridSkeleton = () => (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="p-4">
                            <SkeletonPulse className="h-32 w-full mb-4" animated={animated} />
                            <div className="space-y-2">
                                <SkeletonPulse className="h-4 w-3/4" animated={animated} />
                                <SkeletonPulse className="h-3 w-1/2" animated={animated} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )

        const renderTimelineSkeleton = () => (
            <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <SkeletonPulse className="h-3 w-3 rounded-full" animated={animated} />
                            {i < 3 && <SkeletonPulse className="h-16 w-0.5 mt-2" animated={animated} />}
                        </div>
                        <div className="flex-1 pb-8">
                            <SkeletonPulse className="h-4 w-32 mb-2" animated={animated} />
                            <SkeletonPulse className="h-3 w-24 mb-3" animated={animated} />
                            <SkeletonPulse className="h-16 w-full" animated={animated} />
                        </div>
                    </div>
                ))}
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
                case "profile":
                    return renderProfileSkeleton()
                case "form":
                    return renderFormSkeleton()
                case "grid":
                    return renderGridSkeleton()
                case "timeline":
                    return renderTimelineSkeleton()
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
    },
)

LoadingSkeleton.displayName = "LoadingSkeleton"
