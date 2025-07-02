"use client"

import { useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NavigationDebug() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const params = {
    weekNumber: searchParams.get('weekNumber'),
    year: searchParams.get('year'),
    returnTo: searchParams.get('returnTo'),
  }
  
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-yellow-800">Navigation Debug</CardTitle>
      </CardHeader>
      <CardContent className="text-xs">
        <div className="space-y-1">
          <div><strong>Path:</strong> {pathname}</div>
          <div><strong>Week:</strong> {params.weekNumber || 'null'}</div>
          <div><strong>Year:</strong> {params.year || 'null'}</div>
          <div><strong>Return To:</strong> {params.returnTo || 'null'}</div>
          <div><strong>Timestamp:</strong> {new Date().toLocaleTimeString()}</div>
        </div>
      </CardContent>
    </Card>
  )
}
