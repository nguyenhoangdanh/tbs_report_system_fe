import { LoadingSpinner } from "@/components/loading/loading-spinner";
import { ScreenLoading } from "@/components/loading/screen-loading";


export default function AllLoadingExample() {
    const variants = [
        'spin', 'dots', 'pulse', 'bars', 'wave', 'bounce', 'ring', 'dual-ring', 
        'ripple', 'grid', 'fade', 'flip', 'orbit', 'elastic', 'heart', 'hourglass',
        'square-split', 'triangle-spin', 'diamond-dance', 'hexagon-morph', 
        'line-wave', 'circle-chase', 'square-pulse', 'infinity',
        'corner-squares', 'conic-loader', 'tsb-text', 'company-logo'
    ] as const;

    const hollowVariants = ['spin', 'ring', 'dual-ring', 'corner-squares', 'conic-loader', 'company-logo', 'tsb-text'] as const;

    return (
        <div className="min-h-screen p-8 bg-background">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">Loading Animations Showcase</h1>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {variants.map((variant) => (
                        <div key={variant} className="flex flex-col items-center space-y-2">
                            <div className="p-4 border rounded-lg bg-card">
                                <LoadingSpinner size="lg" variant={variant} />
                            </div>
                            <span className="text-sm text-muted-foreground capitalize">
                                {variant.replace('-', ' ')}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-12">
                    <h2 className="text-xl font-semibold mb-4 text-center">TSB Company Loaders</h2>
                    <div className="flex justify-center items-center space-x-8">
                        <div className="flex flex-col items-center space-y-2">
                            <LoadingSpinner size="xl" variant="tsb-text" />
                            <span className="text-sm text-muted-foreground">TSB Text Animation</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <LoadingSpinner size="xl" variant="company-logo" color="primary" />
                            <span className="text-sm text-muted-foreground">Company Logo</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="text-xl font-semibold mb-4 text-center">Hollow Loaders with Content</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
                        {hollowVariants.map((variant) => (
                            <div key={`hollow-${variant}`} className="flex flex-col items-center space-y-2">
                                <div className="p-4 border rounded-lg bg-card">
                                    <LoadingSpinner 
                                        size="lg" 
                                        variant={variant} 
                                        hollow={true}
                                    >
                                        <span className="text-xs font-semibold">
                                            {variant === 'tsb-text' || variant === 'company-logo' ? 'TBS' : '%'}
                                        </span>
                                    </LoadingSpinner>
                                </div>
                                <span className="text-sm text-muted-foreground capitalize">
                                    {variant.replace('-', ' ')} + Content
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="text-xl font-semibold mb-4 text-center">Loading with Progress</h2>
                    <div className="flex justify-center items-center space-x-8">
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
                        
                        <LoadingSpinner 
                            size="xl" 
                            variant="corner-squares" 
                            hollow={true}
                            color="success"
                        >
                            <div className="text-center">
                                <div className="text-sm font-semibold">API</div>
                                <div className="text-xs opacity-75">Sync</div>
                            </div>
                        </LoadingSpinner>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <h2 className="text-xl font-semibold mb-4">Different Sizes</h2>
                    <div className="flex justify-center items-center space-x-4">
                        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                            <div key={size} className="flex flex-col items-center space-y-2">
                                <LoadingSpinner size={size} variant="corner-squares" />
                                <span className="text-xs text-muted-foreground">{size}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <h2 className="text-xl font-semibold mb-4">Different Colors</h2>
                    <div className="flex justify-center items-center space-x-4">
                        {(['primary', 'secondary', 'success', 'warning', 'destructive'] as const).map((color) => (
                            <div key={color} className="flex flex-col items-center space-y-2">
                                <LoadingSpinner size="lg" variant="conic-loader" color={color} />
                                <span className="text-xs text-muted-foreground capitalize">{color}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="text-xl font-semibold mb-4 text-center">Screen Loading Examples</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* TSB Company Screen Loading */}
                        <div className="border rounded-lg p-4 bg-card">
                            <h3 className="text-sm font-medium mb-2">TSB Company Loading</h3>
                            <div className="relative h-32 border rounded bg-muted/20">
                                <ScreenLoading
                                    variant="tsb-text"
                                    text="Đang tải dữ liệu..."
                                    size="md"
                                    fullScreen={false}
                                    backdrop={false}
                                />
                            </div>
                        </div>

                        {/* Progress Loading */}
                        <div className="border rounded-lg p-4 bg-card">
                            <h3 className="text-sm font-medium mb-2">Progress Loading</h3>
                            <div className="relative h-32 border rounded bg-muted/20">
                                <ScreenLoading
                                    variant="corner-squares"
                                    text="Uploading"
                                    size="md"
                                    fullScreen={false}
                                    backdrop={false}
                                    progress={75}
                                    hollow={true}
                                    showPercentage={true}
                                />
                            </div>
                        </div>

                        {/* Conic Loading */}
                        <div className="border rounded-lg p-4 bg-card">
                            <h3 className="text-sm font-medium mb-2">Conic Loading</h3>
                            <div className="relative h-32 border rounded bg-muted/20">
                                <ScreenLoading
                                    variant="conic-loader"
                                    text="Đang xử lý..."
                                    size="md"
                                    fullScreen={false}
                                    backdrop={false}
                                    color="success"
                                />
                            </div>
                        </div>

                        {/* Custom Content Loading */}
                        <div className="border rounded-lg p-4 bg-card">
                            <h3 className="text-sm font-medium mb-2">Custom Content</h3>
                            <div className="relative h-32 border rounded bg-muted/20">
                                <ScreenLoading
                                    variant="dual-ring"
                                    size="md"
                                    fullScreen={false}
                                    backdrop={false}
                                    hollow={true}
                                    color="warning"
                                >
                                    <div className="text-center">
                                        <div className="text-sm font-semibold">API</div>
                                        <div className="text-xs opacity-75">Sync</div>
                                    </div>
                                </ScreenLoading>
                            </div>
                        </div>

                        {/* Diamond Dance Loading */}
                        <div className="border rounded-lg p-4 bg-card">
                            <h3 className="text-sm font-medium mb-2">Diamond Dance</h3>
                            <div className="relative h-32 border rounded bg-muted/20">
                                <ScreenLoading
                                    variant="diamond-dance"
                                    text="Đang đồng bộ..."
                                    size="md"
                                    fullScreen={false}
                                    backdrop={false}
                                    color="destructive"
                                />
                            </div>
                        </div>

                        {/* Progress Bar Loading */}
                        <div className="border rounded-lg p-4 bg-card">
                            <h3 className="text-sm font-medium mb-2">Progress Bar</h3>
                            <div className="relative h-32 border rounded bg-muted/20">
                                <ScreenLoading
                                    variant="line-wave"
                                    text="Đang tải file..."
                                    size="sm"
                                    fullScreen={false}
                                    backdrop={false}
                                    progress={60}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="text-xl font-semibold mb-4 text-center">All Screen Loading Variants</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {variants.map((variant) => (
                            <div key={`screen-${variant}`} className="border rounded-lg p-2 bg-card">
                                <div className="relative h-24 border rounded bg-muted/20 mb-2">
                                    <ScreenLoading
                                        variant={variant}
                                        size="sm"
                                        fullScreen={false}
                                        backdrop={false}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground capitalize block text-center">
                                    {variant.replace('-', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}



