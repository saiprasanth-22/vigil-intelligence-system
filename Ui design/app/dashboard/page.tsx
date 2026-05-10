'use client'

import AppShell from '@/components/vigil/app-shell'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Bell, Search, X, TrendingUp } from 'lucide-react'

/* ── useCountUp ──────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1500, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now()
      const tick = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [target, duration, delay])
  return value
}

/* ── STAT CARD ───────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  suffix = '',
  delay = 0,
  wide = false,
}: {
  label: string
  value: number | null
  suffix?: string
  delay?: number
  wide?: boolean
}) {
  const count = useCountUp(value ?? 0, 1400, delay)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 + 0.3, type: 'spring', stiffness: 240, damping: 28 }}
      className={`vigil-card vigil-gradient-top p-5 flex flex-col justify-between ${wide ? 'col-span-2' : ''}`}
      style={{ minHeight: 110 }}
    >
      <span className="vigil-label">{label}</span>
      {value === null ? (
        <span className="text-[#4a4a6a] text-sm">No data yet</span>
      ) : (
        <span className="font-mono text-white font-bold" style={{ fontSize: 34 }}>
          {count.toLocaleString()}{suffix}
        </span>
      )}
    </motion.div>
  )
}

/* ── VIGIL SCORE CARD ────────────────────────────────────────── */
function VigilScoreCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, type: 'spring', stiffness: 240, damping: 28 }}
      className="vigil-card p-5 flex flex-col justify-between col-span-1"
      style={{ minHeight: 110, border: '1px solid rgba(26,111,255,0.2)' }}
    >
      <span className="vigil-label">Vigil Score</span>
      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-[#4a4a6a]" />
        <span className="text-[#4a4a6a] text-sm">No score yet</span>
      </div>
    </motion.div>
  )
}

/* ── ACTIVITY FEED ───────────────────────────────────────────── */
const ACTIVITY_COLORS = {
  library:  '#1a6fff',
  live:     '#ff6b1a',
  unified:  '#7b2fff',
}

type ActivityEvent = {
  id: number
  type: keyof typeof ACTIVITY_COLORS
  text: string
  time: string
}

const INITIAL_EVENTS: ActivityEvent[] = []

function ActivityFeed() {
  const [events, setEvents] = useState(INITIAL_EVENTS)

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
      <AnimatePresence initial={false}>
        {events.map(ev => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="flex items-center gap-3 py-2.5 border-b"
            style={{ borderColor: 'rgba(100,100,200,0.08)' }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: ACTIVITY_COLORS[ev.type] }}
            />
            <span className="text-[#a0a0b0] text-sm flex-1 truncate">{ev.text}</span>
            <span className="font-mono text-xs text-[#4a4a6a] flex-shrink-0">{ev.time}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {events.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <span className="text-[#4a4a6a] text-sm">No activity yet</span>
        </div>
      )}
    </div>
  )
}

/* ── STORAGE RING ────────────────────────────────────────────── */
function StorageRing() {
  const pct = 0
  const r = 45
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => { const t = setTimeout(() => setDrawn(true), 1000); return () => clearTimeout(t) }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(100,100,200,0.1)" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: drawn ? offset : circ }}
            transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
          />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a6fff" />
              <stop offset="100%" stopColor="#ff6b1a" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-white font-bold text-lg">{pct}%</span>
          <span className="vigil-label mt-0.5">Used</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        <div className="text-center text-[#4a4a6a] text-sm">No files uploaded</div>
      </div>
    </div>
  )
}

/* ── RECENT QUERIES ──────────────────────────────────────────── */
const QUERIES: Array<{ query: string; source: string; confidence: number; time: string }> = []

function ConfidencePill({ score }: { score: number }) {
  const color = score >= 80 ? '#00c875' : score >= 60 ? '#ff6b1a' : '#ff2b2b'
  return (
    <span
      className="vigil-pill text-xs"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {score}%
    </span>
  )
}

/* ── NOTIFICATION BELL ───────────────────────────────────────── */
function NotificationBell() {
  const [open, setOpen] = useState(false)
  const alerts: Array<{ text: string; type: 'info' | 'warning'; time: string }> = []
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2.5 rounded-xl transition-colors"
        style={{ background: 'rgba(100,100,200,0.06)', border: '1px solid rgba(100,100,200,0.12)' }}
        data-interactive
      >
        <Bell size={16} className="text-[#a0a0b0]" />
        {alerts.length > 0 && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#ff6b1a', boxShadow: '0 0 6px rgba(255,107,26,0.6)' }}
          />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="vigil-card absolute right-0 mt-2 w-72 p-3 z-50"
            style={{ borderRadius: 16 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="vigil-label text-[#a0a0b0]">Notifications</span>
              <button onClick={() => setOpen(false)}><X size={12} className="text-[#4a4a6a]" /></button>
            </div>
            {alerts.length === 0 && (
              <div className="py-6 text-center text-[#4a4a6a] text-sm">No notifications</div>
            )}
            {alerts.map((a, i) => (
              <div key={i} className="flex gap-2.5 py-2.5 border-b" style={{ borderColor: 'rgba(100,100,200,0.08)' }}>
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: a.type === 'warning' ? '#ff6b1a' : '#1a6fff' }}
                />
                <div>
                  <p className="text-[#a0a0b0] text-xs">{a.text}</p>
                  <p className="vigil-label mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── SEARCH BAR ──────────────────────────────────────────────── */
function ExpandSearch() {
  const [expanded, setExpanded] = useState(false)
  const [val, setVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 100) }
  const close = () => { if (!val) setExpanded(false) }

  return (
    <motion.div
      animate={{ width: expanded ? 280 : 40 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="overflow-hidden rounded-xl flex items-center"
      style={{ background: 'rgba(100,100,200,0.06)', border: '1px solid rgba(100,100,200,0.12)' }}
    >
      <button onClick={open} className="flex-shrink-0 p-2.5" data-interactive>
        <Search size={16} className="text-[#a0a0b0]" />
      </button>
      {expanded && (
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={close}
          placeholder="Search everything..."
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#4a4a6a] pr-3"
        />
      )}
    </motion.div>
  )
}

/* ── PAGE ────────────────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-4 py-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">Dashboard</h1>
            <p className="text-[#4a4a6a] text-sm mt-0.5">System overview</p>
          </div>
          <div className="flex items-center gap-2">
            <ExpandSearch />
            <NotificationBell />
          </div>
        </div>

        {/* Stat Cards — asymmetric 5-column grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr' }}>
          <StatCard label="Total Files"     value={null}  delay={0}   wide={false} />
          <StatCard label="Active Streams"  value={null}  delay={100} />
          <StatCard label="Queries Today"   value={null}  delay={200} />
          <StatCard label="Storage Used"    value={null}  suffix=" GB" delay={300} />
          <VigilScoreCard />
        </div>

        {/* Middle row — asymmetric */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '65fr 35fr' }}>
          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 220, damping: 28 }}
            className="vigil-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="vigil-label text-[#a0a0b0]">Activity Feed</span>
              <div className="flex items-center gap-3">
                {(['library', 'live', 'unified'] as const).map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACTIVITY_COLORS[t] }} />
                    <span className="vigil-label capitalize">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <ActivityFeed />
          </motion.div>

          {/* Storage Ring */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, type: 'spring', stiffness: 220, damping: 28 }}
            className="vigil-card p-5 flex flex-col"
          >
            <span className="vigil-label text-[#a0a0b0] mb-5">Storage</span>
            <div className="flex-1 flex items-center justify-center">
              <StorageRing />
            </div>
          </motion.div>
        </div>

        {/* Recent Queries */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, type: 'spring', stiffness: 220, damping: 28 }}
          className="vigil-card p-5"
        >
          <span className="vigil-label text-[#a0a0b0] block mb-4">Recent Queries</span>
          <div data-table className="w-full">
            <div
              className="grid text-left mb-2 pb-2 border-b"
              style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr', borderColor: 'rgba(100,100,200,0.12)' }}
            >
              {['Query', 'Source', 'Confidence', 'Time'].map(h => (
                <span key={h} className="vigil-label">{h}</span>
              ))}
            </div>
            {QUERIES.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 + i * 0.05 }}
                className="grid items-center py-2.5 border-b"
                style={{
                  gridTemplateColumns: '3fr 1fr 1fr 1fr',
                  borderColor: 'rgba(100,100,200,0.06)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(100,100,200,0.02)',
                }}
              >
                <span className="text-[#a0a0b0] text-sm font-mono truncate pr-4">{q.query}</span>
                <span className="vigil-pill text-[#4a4a6a]" style={{ background: 'rgba(100,100,200,0.08)' }}>
                  {q.source}
                </span>
                <ConfidencePill score={q.confidence} />
                <span className="font-mono text-xs text-[#4a4a6a]">{q.time}</span>
              </motion.div>
            ))}
            {QUERIES.length === 0 && (
              <div className="py-10 text-center text-[#4a4a6a] text-sm">No recent queries yet</div>
            )}
          </div>
        </motion.div>
      </div>
    </AppShell>
  )
}
