"use client"

import { memo } from "react"
import { motion, easeInOut } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const shimmerVariants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Number.POSITIVE_INFINITY,
      ease: easeInOut
    }
  }
}

const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
}

export const HierarchyLoadingSkeleton = memo(() => (
  <motion.div
    className="space-y-6"
    variants={containerVariants}
    initial="initial"
    animate="animate"
  >
    {/* Filters Loading */}
    <motion.div variants={itemVariants}>
      <Card className="glass-green border-green-500/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.div variants={shimmerVariants}>
              <Skeleton className="h-6 w-48 bg-green-100 dark:bg-green-900/30" />
            </motion.div>
            <motion.div variants={shimmerVariants}>
              <Skeleton className="h-8 w-24 bg-green-100 dark:bg-green-900/30" />
            </motion.div>
          </div>
          <motion.div variants={shimmerVariants} className="mt-4">
            <Skeleton className="h-12 w-full bg-green-100 dark:bg-green-900/30" />
          </motion.div>
        </CardHeader>
      </Card>
    </motion.div>

    {/* Summary Cards Loading */}
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={itemVariants}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          variants={shimmerVariants}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="glass-green border-green-500/20">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 bg-green-100 dark:bg-green-900/30" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2 bg-green-100 dark:bg-green-900/30" />
              <Skeleton className="h-3 w-32 bg-green-100 dark:bg-green-900/30" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>

    {/* Position Cards Loading */}
    <motion.div className="space-y-4" variants={itemVariants}>
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          variants={shimmerVariants}
          transition={{ delay: i * 0.2 }}
        >
          <Card className="glass-green border-green-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48 bg-green-100 dark:bg-green-900/30" />
                  <Skeleton className="h-4 w-32 bg-green-100 dark:bg-green-900/30" />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Skeleton className="h-16 w-32 bg-green-100 dark:bg-green-900/30" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="text-center space-y-1">
                        <Skeleton className="h-6 w-8 mx-auto bg-green-100 dark:bg-green-900/30" />
                        <Skeleton className="h-3 w-12 mx-auto bg-green-100 dark:bg-green-900/30" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
))

HierarchyLoadingSkeleton.displayName = "HierarchyLoadingSkeleton"
