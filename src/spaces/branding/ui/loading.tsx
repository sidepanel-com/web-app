'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function Loading() {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.'
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center p-6">
        <span className="text-lg">Loading app{dots}</span>
      </CardContent>
    </Card>
  )
}
