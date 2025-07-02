"use client";

import React, { memo, useMemo } from "react";
import { useTheme } from "next-themes";

interface SimplePieChartProps {
  completed: number;
  incomplete: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export const SimplePieChart = memo(
  ({
    completed,
    incomplete,
    size = 60,
    strokeWidth = 4,
    className = "",
    showLabel = true,
  }: SimplePieChartProps) => {
    const { theme } = useTheme();

    const {
      radius,
      circumference,
      completedPercentage,
      strokeDasharray,
      colors,
    } = useMemo(
      () => {
        const total = completed + incomplete;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const completedPercentage = total > 0 ? (completed / total) * 100 : 0;
        const strokeDasharray = `${(completedPercentage / 100) * circumference} ${circumference}`;

        // Enhanced color scheme with better contrast
        const colors = {
          background:
            theme === "dark"
              ? "rgba(148, 163, 184, 0.2)"
              : "rgba(148, 163, 184, 0.3)",
          progress:
            completedPercentage >= 90
              ? theme === "dark"
                ? "#10b981"
                : "#059669" // emerald
              : completedPercentage >= 70
              ? theme === "dark"
                ? "#f59e0b"
                : "#d97706" // amber
              : theme === "dark"
              ? "#ef4444"
              : "#dc2626", // red
          text: theme === "dark" ? "#f8fafc" : "#1e293b",
        };

        return {
          radius,
          circumference,
          completedPercentage,
          strokeDasharray,
          colors,
        };
      },
      [completed, incomplete, size, strokeWidth, theme]
    );

    const center = size / 2;

    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        {/* Drop shadow for depth */}
        <div className="absolute inset-0 rounded-full bg-black/5 dark:bg-black/20 blur-sm transform translate-y-0.5" />

        <svg
          width={size}
          height={size}
          className="transform -rotate-90 relative z-10"
          style={{
            filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
          }}
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient
              id={`bg-gradient-${size}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={colors.background} />
              <stop
                offset="100%"
                stopColor={
                  theme === "dark"
                    ? "rgba(148, 163, 184, 0.1)"
                    : "rgba(148, 163, 184, 0.2)"
                }
              />
            </linearGradient>
            <linearGradient
              id={`progress-gradient-${size}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={colors.progress} />
              <stop
                offset="100%"
                stopColor={colors.progress}
                stopOpacity="0.8"
              />
            </linearGradient>
          </defs>

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#bg-gradient-${size})`}
            strokeWidth={strokeWidth}
          />

          {/* Progress circle with enhanced styling */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#progress-gradient-${size})`}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.3))",
            }}
          />
        </svg>

        {/* Enhanced label with better typography */}
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-bold transition-all duration-300"
              style={{
                fontSize: Math.max(size * 0.2, 10),
                color: colors.text,
                textShadow:
                  theme === "dark"
                    ? "0 1px 2px rgba(0, 0, 0, 0.5)"
                    : "0 1px 2px rgba(255, 255, 255, 0.8)",
              }}
            >
              {Math.round(completedPercentage)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);

SimplePieChart.displayName = "SimplePieChart";
