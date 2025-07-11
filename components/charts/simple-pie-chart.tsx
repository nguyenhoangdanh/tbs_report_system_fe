"use client";

import { memo } from "react";

interface SimplePieChartProps {
  completedPercentage: number;
  size?: number;
  strokeWidth?: number;
  primaryColor?: string;
  className?: string;
}

export const SimplePieChart = memo(
  ({
    completedPercentage,
    size = 60,
    strokeWidth = 4,
    primaryColor = "#22c55e",
    className = "",
  }: SimplePieChartProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (completedPercentage / 100) * circumference;

    return (
      <div
        className={`relative ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={primaryColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium" style={{ color: primaryColor }}>
            {completedPercentage}%
          </span>
        </div>
      </div>
    );
  }
);

SimplePieChart.displayName = "SimplePieChart";
