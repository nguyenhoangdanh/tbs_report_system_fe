"use client"

import { memo, useMemo, type ReactNode } from "react"
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

interface ModernAnimatedBackgroundProps {
    particleCount?: number
    enableAnimation?: boolean
    children?: ReactNode
    variant?: "default" | "login" | "hero"
    className?: string
    performanceMode?: boolean
    intensity?: "subtle" | "normal" | "vibrant"
}

const ModernAnimatedBackground = memo(
    ({
        particleCount = 20,
        enableAnimation = true,
        children,
        variant = "default",
        className = "",
        performanceMode = false,
        intensity = "normal",
    }: ModernAnimatedBackgroundProps) => {
        const { theme, resolvedTheme } = useTheme()
        const currentTheme = resolvedTheme || theme || "dark"
        const shouldReduceMotion = useReducedMotion()

        // Enhanced color schemes with green focus
        const variantColors = useMemo(() => {
            const intensityMultiplier = {
                subtle: 0.6,
                normal: 1,
                vibrant: 1.4,
            }[intensity]

            const schemes = {
                default: {
                    light: [
                        `rgba(16, 185, 129, ${0.4 * intensityMultiplier})`, // Emerald
                        `rgba(5, 150, 105, ${0.35 * intensityMultiplier})`, // Green
                        `rgba(34, 197, 94, ${0.4 * intensityMultiplier})`, // Green-500
                        `rgba(59, 130, 246, ${0.25 * intensityMultiplier})`, // Blue accent
                        `rgba(168, 85, 247, ${0.3 * intensityMultiplier})`, // Purple accent
                    ],
                    dark: [
                        `rgba(52, 211, 153, ${0.6 * intensityMultiplier})`, // Emerald-400
                        `rgba(16, 185, 129, ${0.5 * intensityMultiplier})`, // Emerald-500
                        `rgba(34, 197, 94, ${0.6 * intensityMultiplier})`, // Green-500
                        `rgba(59, 130, 246, ${0.4 * intensityMultiplier})`, // Blue accent
                        `rgba(168, 85, 247, ${0.45 * intensityMultiplier})`, // Purple accent
                    ],
                    gradient:
                        currentTheme === "dark"
                            ? "from-emerald-500/20 via-green-500/15 to-emerald-600/20"
                            : "from-emerald-500/10 via-green-500/8 to-emerald-600/10",
                    mesh:
                        currentTheme === "dark"
                            ? "from-emerald-400/30 via-green-500/20 to-teal-500/25"
                            : "from-emerald-400/15 via-green-500/10 to-teal-500/12",
                },
                login: {
                    light: [
                        `rgba(16, 185, 129, ${0.5 * intensityMultiplier})`, // Primary emerald
                        `rgba(5, 150, 105, ${0.4 * intensityMultiplier})`, // Darker green
                        `rgba(34, 197, 94, ${0.45 * intensityMultiplier})`, // Green-500
                        `rgba(6, 182, 212, ${0.3 * intensityMultiplier})`, // Cyan accent
                    ],
                    dark: [
                        `rgba(52, 211, 153, ${0.7 * intensityMultiplier})`, // Primary emerald
                        `rgba(16, 185, 129, ${0.6 * intensityMultiplier})`, // Emerald-500
                        `rgba(34, 197, 94, ${0.65 * intensityMultiplier})`, // Green-500
                        `rgba(6, 182, 212, ${0.5 * intensityMultiplier})`, // Cyan accent
                    ],
                    gradient:
                        currentTheme === "dark"
                            ? "from-emerald-500/25 via-green-500/20 to-teal-500/25"
                            : "from-emerald-500/12 via-green-500/10 to-teal-500/12",
                    mesh:
                        currentTheme === "dark"
                            ? "from-emerald-400/35 via-green-500/25 to-teal-500/30"
                            : "from-emerald-400/18 via-green-500/12 to-teal-500/15",
                },
                hero: {
                    light: [
                        `rgba(16, 185, 129, ${0.6 * intensityMultiplier})`, // Hero emerald
                        `rgba(5, 150, 105, ${0.5 * intensityMultiplier})`, // Deep green
                        `rgba(34, 197, 94, ${0.55 * intensityMultiplier})`, // Green-500
                        `rgba(59, 130, 246, ${0.4 * intensityMultiplier})`, // Blue
                        `rgba(168, 85, 247, ${0.45 * intensityMultiplier})`, // Purple
                        `rgba(6, 182, 212, ${0.4 * intensityMultiplier})`, // Cyan
                    ],
                    dark: [
                        `rgba(52, 211, 153, ${0.8 * intensityMultiplier})`, // Hero emerald
                        `rgba(16, 185, 129, ${0.7 * intensityMultiplier})`, // Emerald-500
                        `rgba(34, 197, 94, ${0.75 * intensityMultiplier})`, // Green-500
                        `rgba(59, 130, 246, ${0.6 * intensityMultiplier})`, // Blue
                        `rgba(168, 85, 247, ${0.65 * intensityMultiplier})`, // Purple
                        `rgba(6, 182, 212, ${0.6 * intensityMultiplier})`, // Cyan
                    ],
                    gradient:
                        currentTheme === "dark"
                            ? "from-emerald-500/30 via-green-500/25 to-emerald-600/30"
                            : "from-emerald-500/15 via-green-500/12 to-emerald-600/15",
                    mesh:
                        currentTheme === "dark"
                            ? "from-emerald-400/40 via-green-500/30 to-teal-500/35"
                            : "from-emerald-400/20 via-green-500/15 to-teal-500/18",
                },
            }
            return schemes[variant]
        }, [variant, currentTheme, intensity])

        // Enhanced particles with more variety
        const particles = useMemo(() => {
            const colors = currentTheme === "dark" ? variantColors.dark : variantColors.light
            const shapes: Array<"circle" | "square" | "diamond"> = ["circle", "square", "diamond"]
            const adjustedCount = performanceMode ? Math.min(particleCount, 10) : particleCount

            return Array.from(
                { length: adjustedCount },
                (_, i): FloatingParticle => ({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 8 + 4,
                    duration: Math.random() * 10 + 15,
                    delay: Math.random() * 5,
                    opacity: Math.random() * 0.8 + 0.3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    shape: shapes[Math.floor(Math.random() * shapes.length)],
                }),
            )
        }, [particleCount, currentTheme, variantColors, performanceMode])

        if (!enableAnimation || shouldReduceMotion) {
            return children ? <div className={className}>{children}</div> : null
        }

        const Container = children ? "div" : "div"
        const containerProps = children
            ? {
                className: `min-h-screen relative overflow-hidden ${className}`,
                style: {
                    background: `linear-gradient(135deg, ${variantColors.gradient
                        .replace(/from-|via-|to-/g, "")
                        .split(" ")
                        .map((c) => `var(--${c.replace("/", "-")})`)
                        .join(", ")})`,
                },
            }
            : { className: `absolute inset-0 pointer-events-none overflow-hidden ${className}` }

        return (
            <Container {...containerProps}>
                {/* Enhanced mesh gradient background */}
                <div
                    className="absolute inset-0 opacity-60"
                    style={{
                        background: `
              radial-gradient(circle at 20% 50%, ${variantColors.mesh.split(" ")[0].replace("from-", "")} 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${variantColors.mesh.split(" ")[1].replace("via-", "")} 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, ${variantColors.mesh.split(" ")[2].replace("to-", "")} 0%, transparent 50%)
            `,
                    }}
                />

                {/* Animated grid pattern */}
                <div className="absolute inset-0 bg-grid-green opacity-30" />

                {/* Enhanced floating particles */}
                {particles.map((particle) => {
                    const shapeStyles = {
                        circle: "rounded-full",
                        square: "rounded-sm",
                        diamond: "rounded-sm rotate-45",
                    }

                    return (
                        <motion.div
                            key={particle.id}
                            className={`absolute ${shapeStyles[particle.shape]} pointer-events-none shadow-lg`}
                            style={{
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                background:
                                    currentTheme === "dark"
                                        ? `radial-gradient(circle, ${particle.color} 0%, ${particle.color}80 70%, transparent 100%)`
                                        : `linear-gradient(135deg, ${particle.color} 0%, ${particle.color}90 100%)`,
                                boxShadow:
                                    currentTheme === "dark"
                                        ? `0 0 ${particle.size * 3}px ${particle.color}60`
                                        : `0 4px ${particle.size * 2}px ${particle.color}40`,
                                willChange: "transform, opacity",
                            }}
                            animate={{
                                y: [0, -80, 0],
                                x: [0, Math.random() * 60 - 30, 0],
                                scale: [1, 1.6, 1],
                                opacity: [particle.opacity, particle.opacity * 0.3, particle.opacity],
                                rotate: particle.shape === "diamond" ? [45, 405, 45] : [0, 360, 0],
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Number.POSITIVE_INFINITY,
                                delay: particle.delay,
                                ease: "easeInOut",
                            }}
                        />
                    )
                })}

                {/* Enhanced geometric shapes */}
                {!performanceMode && (
                    <>
                        <motion.div
                            className="absolute top-[120px] left-8 w-32 h-32 border-2 rounded-2xl glass-green"
                            style={{ willChange: "transform" }}
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.3, 1],
                                borderColor:
                                    currentTheme === "dark"
                                        ? ["rgba(52, 211, 153, 0.6)", "rgba(16, 185, 129, 0.6)", "rgba(52, 211, 153, 0.6)"]
                                        : ["rgba(16, 185, 129, 0.4)", "rgba(5, 150, 105, 0.4)", "rgba(16, 185, 129, 0.4)"],
                            }}
                            transition={{
                                duration: 25,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                            }}
                        />

                        <motion.div
                            className="absolute bottom-1/3 right-12 w-28 h-28 border-2 rounded-full glass-green"
                            style={{ willChange: "transform" }}
                            animate={{
                                rotate: [360, 0],
                                scale: [1, 0.7, 1],
                                borderColor:
                                    currentTheme === "dark"
                                        ? ["rgba(34, 197, 94, 0.6)", "rgba(6, 182, 212, 0.6)", "rgba(34, 197, 94, 0.6)"]
                                        : ["rgba(34, 197, 94, 0.4)", "rgba(6, 182, 212, 0.4)", "rgba(34, 197, 94, 0.4)"],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                            }}
                        />

                        <motion.div
                            className="absolute bottom-32 left-20 w-24 h-24 border-2 rounded-lg glass-green"
                            style={{ willChange: "transform" }}
                            animate={{
                                rotate: [0, -360],
                                scale: [1, 1.2, 1],
                                x: [0, 20, 0],
                            }}
                            transition={{
                                duration: 18,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                            }}
                        />
                    </>
                )}

                {/* Enhanced floating lines with glow */}
                {!performanceMode && (
                    <>
                        <motion.div
                            className="absolute top-1/4 left-1/3 h-px"
                            style={{
                                width: "10rem",
                                background:
                                    currentTheme === "dark"
                                        ? "linear-gradient(to right, transparent, rgba(52, 211, 153, 0.8), transparent)"
                                        : "linear-gradient(to right, transparent, rgba(16, 185, 129, 0.6), transparent)",
                                boxShadow:
                                    currentTheme === "dark" ? "0 0 20px rgba(52, 211, 153, 0.5)" : "0 0 15px rgba(16, 185, 129, 0.3)",
                                willChange: "opacity, transform",
                            }}
                            animate={{
                                opacity: [0.4, 1, 0.4],
                                scaleX: [1, 2, 1],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                            }}
                        />

                        <motion.div
                            className="absolute bottom-1/3 right-1/4 h-px"
                            style={{
                                width: "8rem",
                                background:
                                    currentTheme === "dark"
                                        ? "linear-gradient(to right, transparent, rgba(34, 197, 94, 0.8), transparent)"
                                        : "linear-gradient(to right, transparent, rgba(34, 197, 94, 0.6), transparent)",
                                boxShadow:
                                    currentTheme === "dark" ? "0 0 20px rgba(34, 197, 94, 0.5)" : "0 0 15px rgba(34, 197, 94, 0.3)",
                                willChange: "opacity, transform",
                            }}
                            animate={{
                                opacity: [0.4, 0.9, 0.4],
                                scaleX: [1, 1.8, 1],
                            }}
                            transition={{
                                duration: 10,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                                delay: 2,
                            }}
                        />
                    </>
                )}

                {/* Enhanced corner accents with glow */}
                <motion.div
                    className="absolute top-8 right-8 w-40 h-40 rounded-full"
                    style={{
                        background:
                            currentTheme === "dark"
                                ? "radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)"
                                : "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)",
                        boxShadow:
                            currentTheme === "dark" ? "0 0 60px rgba(52, 211, 153, 0.2)" : "0 0 40px rgba(16, 185, 129, 0.15)",
                        willChange: "transform, opacity",
                    }}
                    animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />

                <motion.div
                    className="absolute bottom-8 left-8 w-32 h-32 rounded-full"
                    style={{
                        background:
                            currentTheme === "dark"
                                ? "radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)"
                                : "radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)",
                        boxShadow: currentTheme === "dark" ? "0 0 50px rgba(34, 197, 94, 0.2)" : "0 0 35px rgba(34, 197, 94, 0.15)",
                        willChange: "transform, opacity",
                    }}
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0.7, 0.5],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 3,
                    }}
                />

                {/* Render children if provided */}
                {children && <div className="relative z-10">{children}</div>}
            </Container>
        )
    },
)

ModernAnimatedBackground.displayName = "ModernAnimatedBackground"

export { ModernAnimatedBackground }
