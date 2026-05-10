'use client'

import AppShell from '@/components/vigil/app-shell'
import { motion, AnimatePresence, useAnimate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'

/* ── PIPELINE NODES ──────────────────────────────────────────── */
interface PipelineNodeDef {
  id: string
  label: string
  sublabel: string
}

const PIPELINE_NODES: PipelineNodeDef[] = []

function PipelineNode({
  node,
  active,
  delay,
  onClick,
  showPopup,
}: {
  node: PipelineNodeDef
  active: boolean
  delay: number
  onClick: () => void
  showPopup: boolean
}) {
  return (
    <div className="flex flex-col items-center relative">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, type: 'spring', stiffness: 280, damping: 24 }}
        onClick={onClick}
        className="relative flex flex-col items-center justify-center rounded-2xl text-center"
        style={{
          width: 90,
          height: 72,
          background: active
            ? 'radial-gradient(circle at center, rgba(26,111,255,0.2) 0%, rgba(26,111,255,0.06) 100%)'
            : 'rgba(15,15,26,0.9)',
          border: active
            ? '1px solid rgba(26,111,255,0.4)'
            : '1px solid rgba(100,100,200,0.15)',
          boxShadow: active ? '0 0 20px rgba(26,111,255,0.15), inset 0 0 20px rgba(26,111,255,0.05)' : 'none',
        }}
        data-interactive
      >
        {active && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl"
            style={{ border: '1px solid rgba(26,111,255,0.4)' }}
          />
        )}
        <span className="vigil-label mb-0.5" style={{ color: active ? '#1a6fff' : '#4a4a6a' }}>{node.id}</span>
        <span className="text-xs font-medium" style={{ color: active ? '#ffffff' : '#a0a0b0' }}>{node.label}</span>
        <span className="vigil-label mt-0.5">{node.sublabel}</span>
      </motion.div>

      {/* Node popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-2 vigil-card p-3 z-10 text-left"
            style={{ width: 160, borderRadius: 14 }}
          >
            <p className="vigil-label text-[#a0a0b0] mb-1.5">Node Stats</p>
            <div className="space-y-1">
              <p className="text-xs text-[#4a4a6a]">No node metrics yet</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── ANIMATED SVG LINE ───────────────────────────────────────── */
function PipelineLine({ active, delay }: { active: boolean; delay: number }) {
  return (
    <div className="flex items-center" style={{ width: 32, marginTop: -24 }}>
      <svg width="32" height="4" overflow="visible">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a6fff" />
            <stop offset="100%" stopColor="#7b2fff" />
          </linearGradient>
        </defs>
        <motion.line
          x1="0" y1="2" x2="32" y2="2"
          stroke={active ? 'url(#lineGrad)' : 'rgba(100,100,200,0.2)'}
          strokeWidth="2"
          strokeDasharray="6 4"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: 1,
            strokeDashoffset: active ? [0, -20] : 0,
          }}
          transition={{
            pathLength: { delay, duration: 0.4 },
            strokeDashoffset: { duration: 0.5, repeat: Infinity, ease: 'linear' },
          }}
        />
      </svg>
    </div>
  )
}

/* ── WAVEFORM ────────────────────────────────────────────────── */
function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 60 }, (_, i) => i)
  return (
    <div className="h-12 flex items-end gap-px px-4 overflow-hidden">
      {bars.map(i => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-sm"
          animate={active ? {
            scaleY: [
              Math.random() * 0.6 + 0.1,
              Math.random() * 0.9 + 0.3,
              Math.random() * 0.4 + 0.1,
            ]
          } : { scaleY: 0.05 }}
          transition={{
            duration: 0.8 + Math.random() * 0.8,
            repeat: Infinity,
            delay: i * 0.02,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: 'bottom', background: 'linear-gradient(180deg, #1a6fff, rgba(26,111,255,0.15))', minWidth: 2 }}
        />
      ))}
    </div>
  )
}

/* ── LIVE DATA ROWS ──────────────────────────────────────────── */
interface DataRow {
  id: number
  time: string
  source: string
  signal: string
  delta: string
  fresh: boolean
}

/* ── ALERT PANEL ─────────────────────────────────────────────── */
interface Alert {
  id: number
  type: 'critical' | 'warning' | 'info'
  text: string
  time: string
}

const ALERT_CONFIGS = {
  critical: { color: '#ff2b2b', icon: AlertTriangle },
  warning:  { color: '#ff6b1a', icon: AlertTriangle },
  info:     { color: '#1a6fff', icon: Info },
}

const INITIAL_ALERTS: Alert[] = []

/* ── PAGE ────────────────────────────────────────────────────── */
export default function LivePage() {
  const [connected, setConnected] = useState(false)
  const [activeNodes, setActiveNodes] = useState<number[]>([])
  const [popupNode, setPopupNode] = useState<number | null>(null)
  const [confluence, setConfluence] = useState(0)
  const [rows, setRows] = useState<DataRow[]>([])
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS)
  const [edgePulse, setEdgePulse] = useState(false)

  const handleConnect = () => {
    setConnected(true)
    PIPELINE_NODES.forEach((_, i) => {
      setTimeout(() => setActiveNodes(prev => [...prev, i]), 300 + i * 200)
    })
  }

  useEffect(() => {
    if (!connected) return
    setRows([])
    setAlerts([])
  }, [connected])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-interactive]')) setPopupNode(null)
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  return (
    <AppShell>
      {/* Edge pulse on critical alert */}
      <AnimatePresence>
        {edgePulse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ boxShadow: 'inset 0 0 80px rgba(255,43,43,0.4)', borderRadius: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Waveform at bottom */}
      <div className="fixed bottom-0 left-[272px] right-0 z-10 pb-0" style={{ background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(8px)' }}>
        <Waveform active={connected} />
      </div>

      <div className="space-y-4 py-2 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">Live Mode</h1>
            <p className="text-[#4a4a6a] text-sm mt-0.5">Real-time stream analysis</p>
          </div>
          <button
            onClick={handleConnect}
            disabled={connected}
            className="vigil-btn px-6 py-2.5 text-sm"
            style={{ opacity: connected ? 0.5 : 1 }}
          >
            {connected ? 'Connected' : 'Connect Stream'}
          </button>
        </div>

        {/* Pipeline + Confluence */}
        <div className="vigil-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 min-h-[72px]">
              {PIPELINE_NODES.length > 0 ? PIPELINE_NODES.map((node, i) => (
                <div key={node.id} className="flex items-center">
                  <PipelineNode
                    node={node}
                    active={activeNodes.includes(i)}
                    delay={0}
                    onClick={() => setPopupNode(prev => prev === i ? null : i)}
                    showPopup={popupNode === i}
                  />
                  {i < PIPELINE_NODES.length - 1 && (
                    <PipelineLine active={activeNodes.includes(i) && activeNodes.includes(i + 1)} delay={0} />
                  )}
                </div>
              )) : (
                <div className="text-[#4a4a6a] text-sm">No pipeline stages configured</div>
              )}
            </div>

            {/* Confluence */}
            <div className="flex flex-col items-end ml-6 flex-shrink-0">
              <motion.span
                className="font-mono font-bold leading-none"
                style={{ fontSize: 48, color: '#ff6b1a', textShadow: '0 0 20px rgba(255,107,26,0.4)' }}
              >
                {confluence}
              </motion.span>
              <span className="vigil-label mt-1">Confluence Score</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-16 h-0.5 rounded-full" style={{ background: 'rgba(100,100,200,0.2)' }}>
                  <div className="h-full rounded-full" style={{ width: '0%', background: '#ff6b1a' }} />
                </div>
                <span className="vigil-label">No threshold set</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data feed + Alerts */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '60fr 40fr' }}>
          {/* Data feed */}
          <div className="vigil-card p-4 overflow-hidden" style={{ maxHeight: 340 }}>
            <span className="vigil-label text-[#a0a0b0] block mb-3">Real-Time Data Feed</span>
            <div
              className="grid mb-2 pb-2 border-b"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', borderColor: 'rgba(100,100,200,0.1)' }}
            >
              {['Time', 'Source', 'Signal', 'Delta'].map(h => (
                <span key={h} className="vigil-label">{h}</span>
              ))}
            </div>
            <div data-table className="overflow-y-auto" style={{ maxHeight: 240 }}>
              <AnimatePresence initial={false}>
                {rows.map(row => (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="grid items-center py-2 border-b"
                    style={{
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      borderColor: 'rgba(100,100,200,0.06)',
                      background: row.fresh ? 'rgba(255,107,26,0.05)' : 'transparent',
                      transition: 'background 0.5s ease',
                    }}
                  >
                    <span className="font-mono text-xs text-[#4a4a6a]">{row.time}</span>
                    <span className="font-mono text-xs font-bold text-white">{row.source}</span>
                    <span className="font-mono text-xs text-[#a0a0b0]">{row.signal}</span>
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: row.delta.startsWith('+') ? '#00c875' : '#ff2b2b' }}
                    >
                      {row.delta}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {rows.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#4a4a6a' }}
                  />
                  <p className="vigil-label">{connected ? 'No live events' : 'Waiting for connection...'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Alert panel */}
          <div className="vigil-card p-4 overflow-hidden" style={{ maxHeight: 340 }}>
            <span className="vigil-label text-[#a0a0b0] block mb-3">Alerts</span>
            <div className="overflow-y-auto" style={{ maxHeight: 265 }}>
              <AnimatePresence initial={false}>
                {alerts.map(alert => {
                  const cfg = ALERT_CONFIGS[alert.type]
                  const Icon = cfg.icon
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: -16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl mb-2"
                      style={{
                        background: `${cfg.color}0c`,
                        border: `1px solid ${cfg.color}25`,
                        borderLeft: `3px solid ${cfg.color}`,
                      }}
                    >
                      <Icon size={12} style={{ color: cfg.color, marginTop: 2, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#a0a0b0] leading-relaxed">{alert.text}</p>
                        <span className="font-mono text-[10px] text-[#4a4a6a] mt-0.5 block">{alert.time}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {alerts.length === 0 && (
                <div className="flex items-center justify-center py-10">
                  <span className="text-[#4a4a6a] text-sm">No live events</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
