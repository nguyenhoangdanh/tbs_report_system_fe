"use client"

import { LoadingButton } from "./loading-button"
import { LoadingSkeleton } from "./loading-skeleton"
import { LoadingSpinner } from "./loading-spinner"
import { ScreenLoading } from "./screen-loading"

// Convenience exports
export type {
    LoadingSpinnerProps,
    LoadingSkeletonProps,
    ScreenLoadingProps,
    LoadingButtonProps,
} from "./types"

// Default screen loading for common use cases
export const DefaultScreenLoading = () => (
    <ScreenLoading text="Đang tải dữ liệu..." size="lg" variant="dual-ring" fullScreen={true} backdrop={true} />
)

export const QuickLoading = () => <ScreenLoading text="Vui lòng đợi..." size="md" variant="dots" fullScreen={false} />

// Loading Examples
export const LoadingExamples = () => (
    <div className="space-y-8">
        {/* Spinner Variants */}
        <div>
            <h3 className="font-semibold mb-2">LoadingSpinner Variants</h3>
            <div className="flex gap-4 flex-wrap">
                {["spin", "dots", "pulse", "bars", "wave", "bounce", "ring", "dual-ring", "ripple", "grid", "fade", "flip", "orbit", "elastic", "heart", "hourglass"].map((variant) => (
                    <div key={variant} className="flex flex-col items-center">
                        <LoadingSpinner size="md" variant={variant as any} />
                        <span className="text-xs mt-2">{variant}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Skeleton Types */}
        <div>
            <h3 className="font-semibold mb-2">LoadingSkeleton Types</h3>
            <div className="grid grid-cols-2 gap-4">
                {["card", "list", "table", "chart", "hierarchy", "dashboard", "profile", "form", "grid", "timeline"].map((type) => (
                    <div key={type}>
                        <h4 className="text-sm mb-2">{type}</h4>
                        <LoadingSkeleton type={type as any} />
                    </div>
                ))}
            </div>
        </div>

        {/* Screen Loading */}
        {/* <div>
            <h3 className="font-semibold mb-2">ScreenLoading Examples</h3>
            <div className="flex gap-8 flex-wrap">
                <div>
                    <ScreenLoading text="Đang tải toàn màn hình..." size="lg" variant="dual-ring" fullScreen backdrop />
                </div>
                <div>
                    <ScreenLoading text="Chỉ loading vùng này" size="md" variant="dots" fullScreen={false} />
                </div>
            </div>
        </div> */}

        {/* Loading Button */}
        <div>
            <h3 className="font-semibold mb-2">LoadingButton Examples</h3>
            <div className="flex gap-4 flex-wrap">
                <LoadingButton loading loadingText="Đang lưu..." variant="default">Lưu</LoadingButton>
                <LoadingButton loading loadingVariant="dots" variant="secondary">Đang xử lý</LoadingButton>
                <LoadingButton loading loadingVariant="pulse" variant="destructive">Xóa</LoadingButton>
                <LoadingButton variant="outline">Không loading</LoadingButton>
            </div>
        </div>
    </div>
)
