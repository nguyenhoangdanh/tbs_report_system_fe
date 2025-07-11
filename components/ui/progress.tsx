"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";
import { classifyPerformance } from "@/utils/performance-classification";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  primaryColor?: string; // Allow custom color
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, primaryColor, ...props }, ref) => {
  // Get color from performance classification if no custom color provided
  const normalizedValue = Math.max(0, Math.min(100, value));
  const classification = classifyPerformance(normalizedValue);
  const color = primaryColor || classification.color;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 transition-all duration-700 ease-out"
        style={{
          transform: `translateX(-${100 - normalizedValue}%)`,
          backgroundColor: color,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
