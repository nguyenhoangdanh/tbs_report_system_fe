import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface AuthLayoutProps {
  title: string
  description: string
  icon: string | React.ReactNode
  children: React.ReactNode
  gradientFrom?: string
  gradientTo?: string
  maxWidth?: string // e.g. "max-w-md", "max-w-lg", "max-w-xl"
}

export function AuthLayout({
  title,
  description,
  icon,
  children,
  gradientFrom = "green-50",
  gradientTo = "emerald-50",
  maxWidth = "max-w-md" // <-- mặc định vẫn là max-w-md
}: AuthLayoutProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-${gradientFrom} via-background to-${gradientTo} dark:from-${gradientFrom.replace('50', '950/20')} dark:via-background dark:to-${gradientTo.replace('50', '950/20')} py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden`}>
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background decoration */}
      <motion.div
        className={`absolute top-20 left-20 w-64 h-64 bg-${gradientFrom.split('-')[0]}-400/10 dark:bg-${gradientFrom.split('-')[0]}-600/10 rounded-full blur-3xl`}
        animate={{ 
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity }}
      />

      <div className={`w-full ${maxWidth} relative z-10`}>
        <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl shadow-lg bg-gradient-to-br from-green-500 via-emerald-400 to-blue-500 dark:from-green-700 dark:via-emerald-700 dark:to-blue-700 border-2 border-white/70 dark:border-black/30"
            >
              <span className="flex items-center justify-center w-full h-full">
                {typeof icon === 'string' ? (
                  <span className="text-white text-2xl">{icon}</span>
                ) : (
                  // If icon is a ReactNode (e.g. lucide icon), enforce color for both modes
                  <span className="w-8 h-8 flex items-center justify-center text-white dark:text-slate-100">
                    {icon}
                  </span>
                )}
              </span>
            </motion.div>
            <CardTitle className="text-3xl text-center font-bold">
              {title}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
