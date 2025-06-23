import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface AuthLayoutProps {
  title: string
  description: string
  icon: string
  children: React.ReactNode
  gradientFrom?: string
  gradientTo?: string
}

export function AuthLayout({
  title,
  description,
  icon,
  children,
  gradientFrom = "green-50",
  gradientTo = "emerald-50"
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

      <div className="w-full max-w-md relative z-10">
        <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`w-16 h-16 bg-gradient-to-r from-${gradientFrom.split('-')[0]}-600 to-${gradientTo.split('-')[0]}-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}
            >
              <span className="text-white text-2xl">{icon}</span>
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
