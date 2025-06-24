import { BarChart3 } from 'lucide-react'

export function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl shadow-lg bg-gradient-to-br from-green-500 via-emerald-400 to-blue-500 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <BarChart3 className="w-2/3 h-2/3 text-white drop-shadow-lg" />
    </div>
  )
}
