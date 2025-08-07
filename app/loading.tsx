"use client";
import { useEffect, useState } from "react";
import { ScreenLoading } from "@/components/loading/screen-loading";

export default function Loading() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch on iOS
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <ScreenLoading
      size="lg"
      variant="grid"
      fullScreen
      backdrop
    />
  );
}
