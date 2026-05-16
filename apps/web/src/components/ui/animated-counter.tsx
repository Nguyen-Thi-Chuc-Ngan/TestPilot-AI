'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  duration?: number
  suffix?: string
  prefix?: string
}

export function AnimatedCounter({ value, duration = 1500, suffix = '', prefix = '' }: Props) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = null
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease out cubic
      setDisplay(Math.floor(eased * value))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>
}
