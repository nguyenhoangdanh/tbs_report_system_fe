"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";

interface SimplePieChartProps {
  completed: number;
  incomplete: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  colors?: {
    completed: string;
    incomplete: string;
  };
}

export function SimplePieChart({
  completed,
  incomplete,
  size = 80,
  strokeWidth = 8,
  showLabel = false,
  showPercentage = true,
  colors,
}: SimplePieChartProps) {
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    const total = completed + incomplete;
    if (total === 0) return { percentage: 0, total: 0 };

    const percentage = Math.round((completed / total) * 100);
    return { percentage, total };
  }, [completed, incomplete]);

  const defaultColors = useMemo(() => {
    const isDark = theme === "dark";
    return {
      completed: colors?.completed || (isDark ? "#22c55e" : "#16a34a"),
      incomplete: colors?.incomplete || (isDark ? "#374151" : "#e5e7eb"),
      background: isDark ? "#1f2937" : "#f9fafb",
    };
  }, [theme, colors]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (chartData.percentage / 100) * circumference;

  if (chartData.total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-muted-foreground">N/A</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={defaultColors.incomplete}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={defaultColors.completed}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className={`font-bold text-foreground ${size < 60 ? "text-xs" : size < 80 ? "text-sm" : "text-base"}`}>
            {chartData.percentage}%
          </span>
        )}
        {showLabel && (
          <span className="text-xs text-muted-foreground">
            {completed}/{chartData.total}
          </span>
        )}
      </div>
    </div>
  );
}
