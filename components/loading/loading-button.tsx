"use client"

import type React from "react"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./loading-spinner"

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean
    loadingText?: string
    loadingVariant?: "spin" | "dots" | "pulse"
    children: React.ReactNode
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

export const LoadingButton = memo(
    ({
        loading = false,
        loadingText,
        loadingVariant = "spin",
        children,
        disabled,
        className,
        ...props
    }: LoadingButtonProps) => {
        return (
            <Button disabled={disabled || loading} className={cn(className)} {...props}>
                {loading && <LoadingSpinner size="xs" variant={loadingVariant} className="mr-2" />}
                {loading && loadingText ? loadingText : children}
            </Button>
        )
    },
)

LoadingButton.displayName = "LoadingButton"
