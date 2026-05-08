'use client'

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<HTMLDivElement[]>([])
  const trailIndexRef = useRef(0)
  const trailRef = useRef<Array<{ x: number; y: number }>>([])

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      const cursor = cursorRef.current
      if (!cursor) return

      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`

      const target = e.target as HTMLElement
      const interactive = target.closest('a, button, [role="button"], input, textarea, select, label, [data-interactive]')
      const table = target.closest('table, [data-table]')

      cursor.style.width = interactive ? '28px' : '10px'
      cursor.style.height = interactive ? '28px' : '10px'
      cursor.style.borderWidth = interactive ? '2px' : '1.5px'
      cursor.style.background = interactive ? 'rgba(26,111,255,0.15)' : 'rgba(10,10,15,0.8)'
      cursor.style.boxShadow = interactive ? '0 0 12px rgba(26,111,255,0.4)' : 'none'
      cursor.style.borderColor = table ? 'rgba(160,160,176,0.8)' : 'rgba(160,160,176,0.9)'

      trailRef.current = [{ x: e.clientX, y: e.clientY }, ...trailRef.current].slice(0, dotRefs.current.length)
      trailIndexRef.current += 1
      trailRef.current.forEach((point, index) => {
        const dot = dotRefs.current[index]
        if (!dot) return
        dot.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`
        dot.style.opacity = String(0.28 - index * 0.045)
      })
    }

    window.addEventListener('mousemove', moveCursor, { passive: true })
    return () => window.removeEventListener('mousemove', moveCursor)
  }, [])

  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          ref={(node) => {
            if (node) dotRefs.current[index] = node
          }}
          className="fixed pointer-events-none z-[9998]"
          style={{
            left: 0,
            top: 0,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#1a6fff',
            opacity: 0,
            willChange: 'transform',
          }}
        />
      ))}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: 0,
          top: 0,
          width: 10,
          height: 10,
          borderRadius: '50%',
          border: '1.5px solid rgba(160,160,176,0.9)',
          background: 'rgba(10,10,15,0.8)',
          transition: 'width 0.14s ease, height 0.14s ease, background 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease',
          willChange: 'transform',
        }}
      />
    </>
  )
}
