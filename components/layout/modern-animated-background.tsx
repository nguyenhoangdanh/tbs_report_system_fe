"use client"

import { memo, useMemo, useEffect, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useTheme } from "next-themes"

interface FloatingParticle {
    id: number
    x: number
    y: number
    size: number
    duration: number
    delay: number
    opacity: number
    color: string
    shape: "circle" | "square" | "diamond"
}

interface GridPoint {
    id: number
    x: number
    y: number
    delay: number
    intensity: number
}

interface ModernAnimatedBackgroundProps {
    particleCount?: number
    enableAnimation?: boolean
    children?: ReactNode
    variant?: "default" | "login" | "hero"
    className?: string
    performanceMode?: boolean
    intensity?: "subtle" | "normal" | "vibrant"
}

// Performance detection hook
const usePerformanceMode = () => {
    const [isLowPerformance, setIsLowPerformance] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // Detect mobile devices
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        setIsMobile(mobile)

        // Performance detection
        const detectPerformance = () => {
            // Check for low-end indicators
            const isLowRAM = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
            const isSlowConnection = (navigator as any).connection && 
                ((navigator as any).connection.effectiveType === 'slow-2g' || 
                 (navigator as any).connection.effectiveType === '2g' ||
                 (navigator as any).connection.effectiveType === '3g')
            const isCPUThrottled = (navigator as any).hardwareConcurrency && (navigator as any).hardwareConcurrency < 4
            const isBatteryLow = (navigator as any).getBattery && 
                (navigator as any).getBattery().then((battery: any) => battery.level < 0.2)

            setIsLowPerformance(mobile || isLowRAM || isSlowConnection || isCPUThrottled || !!isBatteryLow)
        }

        detectPerformance()
    }, [])

    return { isLowPerformance, isMobile }
}

const ModernAnimatedBackground = memo(
    ({
        particleCount = 8,
        enableAnimation = true,
        children,
        variant = "default",
        className = "",
        performanceMode = false,
        intensity = "subtle",
    }: ModernAnimatedBackgroundProps) => {
        const { theme, resolvedTheme } = useTheme()
        const currentTheme = resolvedTheme || theme || "dark"
        const shouldReduceMotion = useReducedMotion()
        const { isLowPerformance, isMobile } = usePerformanceMode()

        // Auto-enable performance mode on mobile or low-end devices
        const autoPerformanceMode = performanceMode || isLowPerformance || isMobile

        // Enhanced color schemes with better contrast for light theme
        const variantColors = useMemo(() => {
            const baseIntensity = autoPerformanceMode ? 0.3 : 
                { subtle: 0.4, normal: 0.6, vibrant: 0.8 }[intensity]

            const schemes = {
                default: {
                    light: [
                        `rgba(16, 185, 129, ${baseIntensity * 0.8})`, // Increased opacity
                        `rgba(34, 197, 94, ${baseIntensity * 0.7})`,
                        `rgba(5, 150, 105, ${baseIntensity * 0.6})`, // Darker green
                    ],
                    dark: [
                        `rgba(52, 211, 153, ${baseIntensity * 0.7})`,
                        `rgba(34, 197, 94, ${baseIntensity * 0.6})`,
                        `rgba(59, 130, 246, ${baseIntensity * 0.4})`,
                    ],
                    gradient: currentTheme === "dark" 
                        ? "from-emerald-500/10 to-green-500/8"
                        : "from-emerald-500/12 to-green-500/10", // Increased opacity
                    grid: currentTheme === "dark"
                        ? "rgba(52, 211, 153, 0.1)"
                        : "rgba(16, 185, 129, 0.15)", // Increased opacity
                    gridStrong: currentTheme === "dark"
                        ? "rgba(52, 211, 153, 0.2)"
                        : "rgba(5, 150, 105, 0.25)", // Darker and more opaque
                },
                login: {
                    light: [
                        `rgba(16, 185, 129, ${baseIntensity * 0.9})`, // Higher opacity
                        `rgba(34, 197, 94, ${baseIntensity * 0.8})`,
                        `rgba(6, 182, 212, ${baseIntensity * 0.6})`,
                    ],
                    dark: [
                        `rgba(52, 211, 153, ${baseIntensity * 0.8})`,
                        `rgba(34, 197, 94, ${baseIntensity * 0.7})`,
                        `rgba(6, 182, 212, ${baseIntensity * 0.5})`,
                    ],
                    gradient: currentTheme === "dark"
                        ? "from-emerald-500/12 to-green-500/10"
                        : "from-emerald-500/15 to-green-500/12", // Increased opacity
                    grid: currentTheme === "dark"
                        ? "rgba(52, 211, 153, 0.12)"
                        : "rgba(16, 185, 129, 0.18)", // Increased opacity
                    gridStrong: currentTheme === "dark"
                        ? "rgba(52, 211, 153, 0.25)"
                        : "rgba(5, 150, 105, 0.3)", // Much stronger
                },
                hero: {
                    light: [
                        `rgba(16, 185, 129, ${baseIntensity * 1.0})`, // Maximum opacity
                        `rgba(34, 197, 94, ${baseIntensity * 0.9})`,
                        `rgba(59, 130, 246, ${baseIntensity * 0.7})`,
                        `rgba(168, 85, 247, ${baseIntensity * 0.6})`,
                    ],
                    dark: [
                        `rgba(52, 211, 153, ${baseIntensity * 0.9})`,
                        `rgba(34, 197, 94, ${baseIntensity * 0.8})`,
                        `rgba(59, 130, 246, ${baseIntensity * 0.6})`,
                        `rgba(168, 85, 247, ${baseIntensity * 0.5})`,
                    ],
                    gradient: currentTheme === "dark"
                        ? "from-emerald-500/15 to-green-500/12"
                        : "from-emerald-500/20 to-green-500/16", // Much stronger
                    grid: currentTheme === "dark"
                        ? "rgba(52, 211, 153, 0.15)"
                        : "rgba(16, 185, 129, 0.22)", // Stronger grid
                    gridStrong: currentTheme === "dark"
                        ? "rgba(52, 211, 153, 0.3)"
                        : "rgba(5, 150, 105, 0.4)", // Very strong contrast
                },
            }
            return schemes[variant]
        }, [variant, currentTheme, intensity, autoPerformanceMode])

        // Generate grid intersection points for animation
        const gridPoints = useMemo(() => {
            if (shouldReduceMotion || !enableAnimation || autoPerformanceMode) return []
            
            const points: GridPoint[] = []
            const gridSize = isMobile ? 80 : 60 // Larger grid on mobile for performance
            const pointCount = isMobile ? 8 : 12
            
            for (let i = 0; i < pointCount; i++) {
                points.push({
                    id: i,
                    x: (Math.floor(Math.random() * (100 / gridSize)) * gridSize) + (gridSize / 2),
                    y: (Math.floor(Math.random() * (100 / gridSize)) * gridSize) + (gridSize / 2),
                    delay: Math.random() * 2,
                    intensity: Math.random() * 0.8 + 0.2,
                })
            }
            
            return points
        }, [shouldReduceMotion, enableAnimation, autoPerformanceMode, isMobile])

        // Enhanced particles with more variety
        const particles = useMemo(() => {
            if (shouldReduceMotion || !enableAnimation) return []
            
            const colors = currentTheme === "dark" ? variantColors.dark : variantColors.light
            const adjustedCount = autoPerformanceMode ? Math.min(particleCount, 4) : Math.min(particleCount, 8)

            return Array.from(
                { length: adjustedCount },
                (_, i): FloatingParticle => ({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: autoPerformanceMode ? Math.random() * 4 + 3 : Math.random() * 6 + 4,
                    duration: autoPerformanceMode ? Math.random() * 8 + 12 : Math.random() * 6 + 10,
                    delay: Math.random() * 3,
                    opacity: autoPerformanceMode ? Math.random() * 0.4 + 0.2 : Math.random() * 0.6 + 0.3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    shape: ["circle", "square", "diamond"][Math.floor(Math.random() * 3)] as "circle" | "square" | "diamond",
                }),
            )
        }, [particleCount, currentTheme, variantColors, autoPerformanceMode, shouldReduceMotion, enableAnimation])

        // Disable animations completely if reduced motion is preferred
        if (!enableAnimation || shouldReduceMotion) {
            return children ? (
                <div className={`min-h-screen relative ${className}`}>
                    {/* Enhanced static grid background for light theme */}
                    <div 
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `
                                linear-gradient(${variantColors.grid} 1px, transparent 1px),
                                linear-gradient(90deg, ${variantColors.grid} 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px',
                            opacity: currentTheme === "dark" ? 0.3 : 0.6, // Higher opacity for light
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/40 dark:from-green-950/10 dark:to-emerald-950/5" />
                    <div className="relative z-10">{children}</div>
                </div>
            ) : null
        }

        const Container = children ? "div" : "div"
        const containerProps = children
            ? {
                className: `min-h-screen relative overflow-hidden ${className}`,
            }
            : { className: `absolute inset-0 pointer-events-none overflow-hidden ${className}` }

        return (
            <Container {...containerProps}>
                {/* Enhanced Modern Grid Background with better light theme contrast */}
                <div className="absolute inset-0">
                    {/* Base grid pattern - stronger for light theme */}
                    <div 
                        className="absolute inset-0 transition-opacity duration-1000"
                        style={{
                            backgroundImage: `
                                linear-gradient(${variantColors.grid} 1px, transparent 1px),
                                linear-gradient(90deg, ${variantColors.grid} 1px, transparent 1px)
                            `,
                            backgroundSize: isMobile ? '60px 60px' : '40px 40px',
                            opacity: autoPerformanceMode 
                                ? (currentTheme === "dark" ? 0.3 : 0.5) 
                                : (currentTheme === "dark" ? 0.5 : 0.7), // Much higher for light
                        }}
                    />
                    
                    {/* Accent grid lines - much stronger for light theme */}
                    <div 
                        className="absolute inset-0 transition-opacity duration-1000"
                        style={{
                            backgroundImage: `
                                linear-gradient(${variantColors.gridStrong} 1px, transparent 1px),
                                linear-gradient(90deg, ${variantColors.gridStrong} 1px, transparent 1px)
                            `,
                            backgroundSize: isMobile ? '240px 240px' : '160px 160px',
                            opacity: autoPerformanceMode 
                                ? (currentTheme === "dark" ? 0.2 : 0.4) 
                                : (currentTheme === "dark" ? 0.4 : 0.8), // Much stronger for light
                        }}
                    />
                    
                    {/* Additional subtle pattern overlay for light theme depth */}
                    {currentTheme === "light" && (
                        <div 
                            className="absolute inset-0 transition-opacity duration-1000"
                            style={{
                                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), 
                                                 radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)`,
                                opacity: autoPerformanceMode ? 0.3 : 0.5,
                            }}
                        />
                    )}
                </div>

                {/* Enhanced gradient overlay - stronger for light */}
                <div 
                    className={`absolute inset-0 bg-gradient-to-br ${variantColors.gradient} transition-opacity duration-1000`}
                    style={{
                        opacity: currentTheme === "dark" ? 1 : 1.2, // Slightly stronger for light
                    }}
                />

                {/* Enhanced floating particles - better visibility in light */}
                {!autoPerformanceMode && particles.map((particle) => {
                    const shapeStyles = {
                        circle: "rounded-full",
                        square: "rounded-sm",
                        diamond: "rounded-sm transform rotate-45",
                    }

                    return (
                        <motion.div
                            key={particle.id}
                            className={`absolute ${shapeStyles[particle.shape]} pointer-events-none will-change-transform shadow-lg`}
                            style={{
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                background: currentTheme === "dark"
                                    ? `radial-gradient(circle, ${particle.color} 0%, ${particle.color}80 70%, transparent 100%)`
                                    : `linear-gradient(135deg, ${particle.color} 0%, ${particle.color}95 100%)`, // Stronger for light
                                boxShadow: currentTheme === "dark"
                                    ? `0 0 ${particle.size * 2}px ${particle.color}40`
                                    : `0 4px ${particle.size * 2}px ${particle.color}50, 0 0 ${particle.size}px ${particle.color}30`, // Enhanced shadow for light
                                transform: "translateZ(0)",
                            }}
                            animate={{
                                y: [0, -40, 0],
                                x: [0, Math.random() * 30 - 15, 0],
                                scale: [1, 1.2, 1],
                                opacity: [particle.opacity, particle.opacity * 0.3, particle.opacity],
                                rotate: particle.shape === "diamond" ? [45, 225, 45] : [0, 180, 0],
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                delay: particle.delay,
                                ease: "easeInOut",
                            }}
                        />
                    )
                })}

                {/* Enhanced grid intersection points - more visible in light */}
                {!autoPerformanceMode && gridPoints.map((point) => (
                    <motion.div
                        key={point.id}
                        className="absolute pointer-events-none"
                        style={{
                            left: `${point.x}%`,
                            top: `${point.y}%`,
                            transform: "translate(-50%, -50%)",
                        }}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [
                                0.2 * point.intensity * (currentTheme === "dark" ? 1 : 1.5), 
                                0.8 * point.intensity * (currentTheme === "dark" ? 1 : 1.3), 
                                0.2 * point.intensity * (currentTheme === "dark" ? 1 : 1.5)
                            ],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: point.delay,
                            ease: "easeInOut",
                        }}
                    >
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{
                                background: currentTheme === "dark"
                                    ? `radial-gradient(circle, ${variantColors.gridStrong} 0%, transparent 70%)`
                                    : `radial-gradient(circle, ${variantColors.gridStrong} 0%, ${variantColors.gridStrong}60 50%, transparent 80%)`, // Stronger gradient for light
                                boxShadow: currentTheme === "dark" 
                                    ? `0 0 10px ${variantColors.gridStrong}`
                                    : `0 0 15px ${variantColors.gridStrong}, 0 2px 8px ${variantColors.gridStrong}30`, // Enhanced shadow for light
                            }}
                        />
                    </motion.div>
                ))}

                {/* Enhanced geometric shapes - better visibility in light */}
                {!autoPerformanceMode && !isMobile && (
                    <>
                        {/* Rotating hexagon - enhanced for light */}
                        <motion.div
                            className="absolute top-[15%] left-[8%] w-20 h-20 border will-change-transform"
                            style={{
                                clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
                                background: currentTheme === "dark"
                                    ? `linear-gradient(45deg, ${variantColors.gridStrong}, transparent)`
                                    : `linear-gradient(45deg, ${variantColors.gridStrong}, ${variantColors.gridStrong}60, transparent)`, // Stronger for light
                                borderColor: currentTheme === "dark" ? "rgba(34, 197, 94, 0.3)" : "rgba(16, 185, 129, 0.4)",
                                boxShadow: currentTheme === "light" ? `0 4px 20px ${variantColors.gridStrong}30` : undefined,
                            }}
                            animate={{ 
                                rotate: [0, 360],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 25,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />

                        {/* Pulsing triangle - enhanced for light */}
                        <motion.div
                            className="absolute bottom-[20%] right-[10%] w-16 h-16 will-change-transform"
                            style={{
                                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                                background: currentTheme === "dark"
                                    ? `linear-gradient(135deg, ${variantColors.gridStrong}, transparent)`
                                    : `linear-gradient(135deg, ${variantColors.gridStrong}, ${variantColors.gridStrong}70, transparent)`, // Stronger for light
                                boxShadow: currentTheme === "light" ? `0 6px 25px ${variantColors.gridStrong}25` : undefined,
                            }}
                            animate={{ 
                                scale: [1, 1.3, 1],
                                rotate: [0, 180, 360],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />

                        {/* Floating line elements - enhanced for light */}
                        <motion.div
                            className="absolute top-[40%] right-[15%] w-24 h-0.5"
                            style={{
                                background: currentTheme === "dark"
                                    ? `linear-gradient(to right, transparent, ${variantColors.gridStrong}, transparent)`
                                    : `linear-gradient(to right, transparent, ${variantColors.gridStrong}, ${variantColors.gridStrong}80, transparent)`, // Stronger for light
                                boxShadow: currentTheme === "dark"
                                    ? `0 0 10px ${variantColors.gridStrong}`
                                    : `0 0 15px ${variantColors.gridStrong}, 0 2px 8px ${variantColors.gridStrong}30`, // Enhanced glow for light
                            }}
                            animate={{
                                opacity: [0.3, 1, 0.3],
                                scaleX: [1, 1.5, 1],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </>
                )}

                {/* Enhanced corner accents - better visibility in light */}
                <motion.div
                    className="absolute top-6 right-6 w-32 h-32"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: currentTheme === "dark" ? [0.3, 0.6, 0.3] : [0.4, 0.7, 0.4], // Higher opacity for light
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <div
                        className="w-full h-full rounded-full"
                        style={{
                            background: currentTheme === "dark"
                                ? `conic-gradient(from 0deg, ${variantColors.gridStrong}, transparent, ${variantColors.gridStrong})`
                                : `conic-gradient(from 0deg, ${variantColors.gridStrong}, ${variantColors.gridStrong}60, transparent, ${variantColors.gridStrong})`, // Enhanced for light
                            opacity: autoPerformanceMode ? (currentTheme === "dark" ? 0.3 : 0.4) : (currentTheme === "dark" ? 0.5 : 0.6),
                            boxShadow: currentTheme === "light" ? `0 0 30px ${variantColors.gridStrong}20` : undefined,
                        }}
                    />
                </motion.div>

                <motion.div
                    className="absolute bottom-6 left-6 w-24 h-24"
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 90, 0],
                        opacity: currentTheme === "dark" ? [0.3, 0.5, 0.3] : [0.4, 0.6, 0.4], // Higher opacity for light
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2,
                    }}
                >
                    <div
                        className="w-full h-full"
                        style={{
                            background: currentTheme === "dark"
                                ? `linear-gradient(45deg, ${variantColors.gridStrong}, transparent, ${variantColors.gridStrong})`
                                : `linear-gradient(45deg, ${variantColors.gridStrong}, ${variantColors.gridStrong}70, transparent, ${variantColors.gridStrong})`, // Enhanced for light
                            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                            opacity: autoPerformanceMode ? (currentTheme === "dark" ? 0.3 : 0.4) : (currentTheme === "dark" ? 0.4 : 0.5),
                            boxShadow: currentTheme === "light" ? `0 0 25px ${variantColors.gridStrong}20` : undefined,
                        }}
                    />
                </motion.div>

                {/* Render children */}
                {children && <div className="relative z-10">{children}</div>}
            </Container>
        )
    },
)

ModernAnimatedBackground.displayName = "ModernAnimatedBackground"

export { ModernAnimatedBackground }
