import { LoadingSpinner } from "@/components/loading/loading-spinner";
import { ScreenLoading } from "@/components/loading/screen-loading";
import { LoadingButton } from "@/components/loading/loading-button";
import { LoadingSkeleton } from "@/components/loading/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AllLoadingExample() {
    // Only optimized variants for better performance
    const variants = [
        'spin', 'ring', 'dual-ring', 'grid', 'bars', 'square-split', 'corner-squares'
    ] as const;

    const colors = ['primary', 'secondary', 'success', 'warning', 'destructive'] as const;
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    return (
        <div className="min-h-screen p-8 bg-background">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Optimized Loading Components</h1>
                    <p className="text-muted-foreground">High-performance loading animations for better user experience</p>
                </div>

                {/* All Loading Variants */}
                <Card>
                    <CardHeader>
                        <CardTitle>Loading Spinner Variants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 items-center justify-items-center">
                            {variants.map((variant) => (
                                <div key={variant} className="flex flex-col items-center space-y-3">
                                    <LoadingSpinner size="lg" variant={variant} color="primary" />
                                    <span className="text-sm font-medium capitalize">{variant.replace('-', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Different Sizes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Different Sizes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center items-end space-x-8">
                            {sizes.map((size) => (
                                <div key={size} className="flex flex-col items-center space-y-3">
                                    <LoadingSpinner size={size} variant="corner-squares" color="primary" />
                                    <span className="text-sm text-muted-foreground uppercase">{size}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Different Colors */}
                <Card>
                    <CardHeader>
                        <CardTitle>Different Colors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center items-center space-x-8">
                            {colors.map((color) => (
                                <div key={color} className="flex flex-col items-center space-y-3">
                                    <LoadingSpinner size="lg" variant="dual-ring" color={color} />
                                    <span className="text-sm text-muted-foreground capitalize">{color}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Hollow Loading with Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hollow Loading with Custom Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                            <div className="flex flex-col items-center space-y-3">
                                <LoadingSpinner 
                                    size="xl" 
                                    variant="spin" 
                                    hollow={true}
                                    color="primary"
                                >
                                    <div className="text-center">
                                        <div className="text-lg font-bold">75%</div>
                                        <div className="text-xs opacity-75">Loading</div>
                                    </div>
                                </LoadingSpinner>
                                <span className="text-sm font-medium">Progress Indicator</span>
                            </div>

                            <div className="flex flex-col items-center space-y-3">
                                <LoadingSpinner 
                                    size="xl" 
                                    variant="ring" 
                                    hollow={true}
                                    color="success"
                                >
                                    <div className="text-center">
                                        <div className="text-sm font-semibold">API</div>
                                        <div className="text-xs opacity-75">Sync</div>
                                    </div>
                                </LoadingSpinner>
                                <span className="text-sm font-medium">API Status</span>
                            </div>

                            <div className="flex flex-col items-center space-y-3">
                                <LoadingSpinner 
                                    size="xl" 
                                    variant="dual-ring" 
                                    hollow={true}
                                    color="warning"
                                >
                                    <div className="text-center">
                                        <div className="text-sm font-semibold">3</div>
                                        <div className="text-xs opacity-75">Items</div>
                                    </div>
                                </LoadingSpinner>
                                <span className="text-sm font-medium">Item Counter</span>
                            </div>

                            <div className="flex flex-col items-center space-y-3">
                                <LoadingSpinner 
                                    size="xl" 
                                    variant="corner-squares" 
                                    hollow={true}
                                    color="destructive"
                                >
                                    <div className="text-center">
                                        <div className="text-sm font-semibold">!</div>
                                        <div className="text-xs opacity-75">Error</div>
                                    </div>
                                </LoadingSpinner>
                                <span className="text-sm font-medium">Error State</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Loading Buttons */}
                <Card>
                    <CardHeader>
                        <CardTitle>Loading Buttons</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <LoadingButton loading={true} loadingVariant="spin">
                                Submitting...
                            </LoadingButton>
                            <LoadingButton loading={true} loadingVariant="ring" variant="secondary">
                                Processing...
                            </LoadingButton>
                            <LoadingButton loading={true} loadingVariant="bars" variant="outline">
                                Uploading...
                            </LoadingButton>
                            <LoadingButton loading={false} loadingVariant="spin" variant="destructive">
                                Normal Button
                            </LoadingButton>
                        </div>
                    </CardContent>
                </Card>

                {/* Screen Loading Examples */}
                <Card>
                    <CardHeader>
                        <CardTitle>Screen Loading Components</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Basic Loading */}
                            <div className="border rounded-lg bg-muted/20">
                                <div className="p-3 border-b bg-card rounded-t-lg">
                                    <h3 className="text-sm font-medium">Basic Loading</h3>
                                </div>
                                <div className="relative h-40">
                                    <ScreenLoading
                                        variant="spin"
                                        text="Đang tải dữ liệu..."
                                        size="md"
                                        fullScreen={false}
                                        backdrop={false}
                                        color="primary"
                                    />
                                </div>
                            </div>

                            {/* Progress Loading */}
                            <div className="border rounded-lg bg-muted/20">
                                <div className="p-3 border-b bg-card rounded-t-lg">
                                    <h3 className="text-sm font-medium">Progress Loading</h3>
                                </div>
                                <div className="relative h-40">
                                    <ScreenLoading
                                        variant="corner-squares"
                                        text="Đang tải lên..."
                                        size="md"
                                        fullScreen={false}
                                        backdrop={false}
                                        progress={65}
                                        showPercentage={true}
                                        color="success"
                                    />
                                </div>
                            </div>

                            {/* Custom Content Loading */}
                            <div className="border rounded-lg bg-muted/20">
                                <div className="p-3 border-b bg-card rounded-t-lg">
                                    <h3 className="text-sm font-medium">Custom Content</h3>
                                </div>
                                <div className="relative h-40">
                                    <ScreenLoading
                                        variant="dual-ring"
                                        size="lg"
                                        fullScreen={false}
                                        backdrop={false}
                                        hollow={true}
                                        color="warning"
                                    >
                                        <div className="text-center">
                                            <div className="text-lg font-bold">TBS</div>
                                            <div className="text-xs opacity-75">System</div>
                                        </div>
                                    </ScreenLoading>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Loading Skeletons */}
                <Card>
                    <CardHeader>
                        <CardTitle>Loading Skeletons</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Card Skeleton */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Card Skeleton</h3>
                            <LoadingSkeleton type="card" count={1} />
                        </div>

                        {/* List Skeleton */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">List Skeleton</h3>
                            <LoadingSkeleton type="list" count={1} />
                        </div>

                        {/* Table Skeleton */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Table Skeleton</h3>
                            <LoadingSkeleton type="table" count={1} />
                        </div>

                        {/* Dashboard Skeleton */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Dashboard Skeleton</h3>
                            <LoadingSkeleton type="dashboard" count={1} />
                        </div>

                        {/* Grid Skeleton */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Grid Skeleton</h3>
                            <LoadingSkeleton type="grid" count={1} />
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Comparison */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Optimized Variants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-medium mb-4 text-green-600">✅ Optimized (Kept)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {variants.map((variant) => (
                                        <div key={variant} className="flex flex-col items-center space-y-2 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                                            <LoadingSpinner size="md" variant={variant} color="success" />
                                            <span className="text-xs font-medium capitalize">{variant.replace('-', ' ')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-4 text-red-600">❌ Removed (Performance)</h3>
                                <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                                    <p className="text-sm text-muted-foreground mb-2">Removed complex animations:</p>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        <li>• dots, pulse, wave, bounce</li>
                                        <li>• ripple, fade, flip, orbit</li>
                                        <li>• elastic, heart, hourglass</li>
                                        <li>• triangle-spin, diamond-dance</li>
                                        <li>• hexagon-morph, line-wave</li>
                                        <li>• circle-chase, square-pulse</li>
                                        <li>• infinity, conic-loader</li>
                                        <li>• tsb-text, company-logo</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Tips */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl mb-2">⚡</div>
                                <h3 className="font-medium mb-2">Faster Rendering</h3>
                                <p className="text-sm text-muted-foreground">Simplified animations reduce CPU usage and improve frame rates</p>
                            </div>
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl mb-2">📱</div>
                                <h3 className="font-medium mb-2">Mobile Optimized</h3>
                                <p className="text-sm text-muted-foreground">Reduced complexity ensures smooth performance on mobile devices</p>
                            </div>
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl mb-2">🔋</div>
                                <h3 className="font-medium mb-2">Battery Friendly</h3>
                                <p className="text-sm text-muted-foreground">Lower power consumption with optimized GPU acceleration</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}



