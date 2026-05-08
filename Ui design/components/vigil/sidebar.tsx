'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Library,
  Radio,
  MessageSquare,
  BarChart2,
  Cpu,
  Settings,
  Bell,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard' },
  { icon: Library,         label: 'Library',       href: '/library' },
  { icon: Radio,           label: 'Live',           href: '/live' },
  { icon: MessageSquare,   label: 'Unified Chat',  href: '/chat' },
  { icon: BarChart2,       label: 'Visualizer',    href: '/visualizer' },
  { icon: Cpu,             label: 'Connect',       href: '/connect' },
  { icon: Settings,        label: 'Settings',      href: '/settings' },
]

type OrbState = 'normal' | 'alert' | 'healthy' | 'critical'

function VIGILOrb({ state = 'normal' }: { state?: OrbState }) {
  const colors: Record<OrbState, string> = {
    normal:   'from-[#1a6fff] to-[#7b2fff]',
    alert:    'from-[#ff6b1a] to-[#ff3a00]',
    healthy:  'from-[#00c875] to-[#00a85c]',
    critical: 'from-[#ff2b2b] to-[#cc0000]',
  }
  const glows: Record<OrbState, string> = {
    normal:   'rgba(26,111,255,0.5)',
    alert:    'rgba(255,107,26,0.7)',
    healthy:  'rgba(0,200,117,0.6)',
    critical: 'rgba(255,43,43,0.7)',
  }

  return (
    <div
      className={`w-5 h-5 rounded-full bg-gradient-to-br ${colors[state]} relative vigil-orb-breathe`}
      style={{ boxShadow: `0 0 12px ${glows[state]}` }}
    >
      <div className="absolute inset-0.5 rounded-full bg-white/10" />
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [orbState] = useState<OrbState>('normal')

  const activeIndex = NAV_ITEMS.findIndex(item => pathname.startsWith(item.href))

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 32, delay: 0.1 }}
      className="vigil-sidebar fixed left-4 top-4 bottom-4 w-[240px] flex flex-col z-50 select-none"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <VIGILOrb state={orbState} />
        <span className="text-white font-bold text-lg tracking-widest font-sans">VIGIL</span>
      </div>

      <div className="h-px bg-[rgba(100,100,200,0.12)] mx-5" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 relative">
        {/* Sliding active indicator background */}
        <AnimatePresence>
          {activeIndex >= 0 && (
            <motion.div
              layoutId="active-bg"
              className="absolute left-3 right-3 rounded-xl"
              style={{
                height: 40,
                top: activeIndex * 48 + 4,
                background: 'rgba(26,111,255,0.08)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            />
          )}
        </AnimatePresence>

        {NAV_ITEMS.map((item, i) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl relative group mb-1"
              style={{ height: 40, marginBottom: 8 }}
            >
              {/* Active gradient left border */}
              {isActive && (
                <motion.div
                  layoutId="active-border"
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                  style={{ background: 'linear-gradient(180deg, #1a6fff, #7b2fff)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                />
              )}
              <item.icon
                size={16}
                className="flex-shrink-0"
                style={{ color: isActive ? '#1a6fff' : '#4a4a6a' }}
              />
              <span
                className="text-sm font-medium transition-colors"
                style={{ color: isActive ? '#ffffff' : '#a0a0b0' }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="h-px bg-[rgba(100,100,200,0.12)] mx-5" />

      {/* User / Status */}
      <div className="px-5 py-4 space-y-3">
        {/* Storage bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="vigil-label">Storage</span>
            <span className="vigil-label" style={{ color: '#a0a0b0' }}>2.4 / 10 GB</span>
          </div>
          <div className="h-1 rounded-full bg-[#1a1a2e] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '24%' }}
              transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #1a6fff, #ff6b1a)' }}
            />
          </div>
        </div>

        {/* User row */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a6fff] to-[#7b2fff] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">Vigil User</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00c875]" />
              <span className="vigil-label">Connected</span>
            </div>
          </div>
          <Bell size={14} className="text-[#4a4a6a]" />
        </div>
      </div>
    </motion.aside>
  )
}
