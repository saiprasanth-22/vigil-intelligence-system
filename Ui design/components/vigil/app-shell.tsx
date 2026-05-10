'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './sidebar'
import ParticleField from './particle-field'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const NAV_ORDER = ['/dashboard', '/library', '/live', '/chat', '/benchmark', '/visualizer', '/connect', '/settings']

function getIndex(path: string) {
  return NAV_ORDER.findIndex(p => path.startsWith(p))
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const currentIndex = getIndex(pathname)

  return (
    <div
      className="min-h-screen vigil-dot-grid relative overflow-visible"
      style={{ backgroundColor: '#0a0a0f' }}
    >
      <div className="fixed inset-0 pointer-events-none z-0">
        <ParticleField count={40} />
      </div>
      <Sidebar />
      <main className="relative z-10 ml-[272px] mr-4 my-4 min-h-[calc(100vh-32px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.32, 0, 0.67, 0] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
