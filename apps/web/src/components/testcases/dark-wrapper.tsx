'use client'

import { useEffect } from 'react'

export function DarkWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Save current theme
    const root = document.documentElement
    const prev = root.className

    // Force dark
    root.classList.add('dark')

    return () => {
      // Restore on unmount
      root.className = prev
    }
  }, [])

  return (
    <div style={{ background: '#09090b', color: 'white' }} className="-m-6 h-[calc(100vh-4rem)] overflow-hidden">
      {children}
    </div>
  )
}
