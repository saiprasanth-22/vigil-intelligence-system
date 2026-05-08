'use client'

import AppShell from '@/components/vigil/app-shell'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Cpu, Zap } from 'lucide-react'

/* ── Scanline BG ─────────────────────────────────────────────── */
function ScanlineBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0"
          style={{ height: 1, background: 'rgba(100,100,200,0.04)', top: `${i * 12.5}%` }}
          animate={{ y: ['0%', '800%'] }}
          transition={{ duration: 8, delay: i * 1, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

/* ── Hardware Meter ──────────────────────────────────────────── */
function HardwareMeter({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="vigil-label">{label}</span>
        <span className="font-mono text-xs text-[#a0a0b0]">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(100,100,200,0.1)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay / 1000 + 0.5, duration: 1.2, type: 'spring', stiffness: 80 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, #1a6fff, ${value > 70 ? '#ff6b1a' : '#7b2fff'})` }}
        />
      </div>
    </div>
  )
}

/* ── Module Card ─────────────────────────────────────────────── */
type InstallState = 'idle' | 'installing' | 'done'

function ModuleCard({
  tier,
  specs,
  recommended,
  selected,
  onSelect,
}: {
  tier: string
  specs: string[]
  recommended?: boolean
  selected: boolean
  onSelect: () => void
}) {
  const [install, setInstall] = useState<InstallState>('idle')
  const [progress, setProgress] = useState(0)

  const handleInstall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (install !== 'idle') return
    setInstall('installing')
    setProgress(0)
    const start = Date.now()
    const iv = setInterval(() => {
      const p = Math.min(((Date.now() - start) / 2500) * 100, 100)
      setProgress(p)
      if (p >= 100) {
        clearInterval(iv)
        setInstall('done')
      }
    }, 40)
  }

  return (
    <motion.div
      onClick={onSelect}
      className="vigil-card p-5 flex flex-col gap-4 relative overflow-hidden"
      style={{
        borderColor: selected ? 'rgba(255,107,26,0.5)' : 'rgba(100,100,200,0.12)',
      }}
      data-interactive
    >
      {/* Clockwise border trace */}
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: 'transparent',
            boxShadow: '0 0 0 1.5px rgba(255,107,26,0.5), 0 0 16px rgba(255,107,26,0.1)',
          }}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="vigil-label mb-1">Module</p>
          <h3 className="text-white font-bold text-lg tracking-widest">{tier}</h3>
        </div>
        {recommended && (
          <span className="vigil-pill" style={{ background: 'rgba(255,107,26,0.15)', color: '#ff6b1a', border: '1px solid rgba(255,107,26,0.3)' }}>
            Recommended
          </span>
        )}
      </div>

      <div className="h-px" style={{ background: 'rgba(100,100,200,0.12)' }} />

      <ul className="space-y-1.5">
        {specs.map(s => (
          <li key={s} className="flex items-center gap-2 text-xs text-[#a0a0b0]">
            <div className="w-1 h-1 rounded-full bg-[#4a4a6a] flex-shrink-0" />
            {s}
          </li>
        ))}
      </ul>

      {/* Install button */}
      <div className="relative h-10 mt-auto">
        {install === 'idle' && (
          <button
            onClick={handleInstall}
            className="vigil-btn w-full h-full text-sm"
            data-interactive
          >
            Install Module
          </button>
        )}
        {install === 'installing' && (
          <div className="w-full h-full rounded-xl overflow-hidden" style={{ background: '#1a1a2e' }}>
            <motion.div
              className="h-full rounded-xl flex items-center justify-center"
              animate={{ width: `${progress}%` }}
              style={{ background: 'linear-gradient(135deg, #1a6fff, #7b2fff)', minWidth: 40 }}
            >
              <span className="vigil-label text-white">{Math.round(progress)}%</span>
            </motion.div>
          </div>
        )}
        {install === 'done' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="w-full h-full rounded-xl flex items-center justify-center gap-2"
            style={{ background: 'rgba(0,200,117,0.12)', border: '1px solid rgba(0,200,117,0.3)' }}
          >
            <CheckCircle size={14} className="text-[#00c875]" />
            <span className="text-[#00c875] text-sm font-medium">Installed</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

/* ── Terminal ────────────────────────────────────────────────── */
const LOG_LINES = [
  '> Initializing VIGIL agent v2.4.1...',
  '> Scanning hardware configuration...',
  '> RAM: 16.2 GB available',
  '> CPU: 8 cores detected (Intel Core i9)',
  '> GPU: NVIDIA RTX 4070 — CUDA enabled',
  '> Storage: 847 GB free',
  '> Network interface: connected (eth0)',
  '> Agent daemon started on port 7732',
  '> Secure tunnel established ✓',
  '> Ready to receive commands_',
]

function Terminal() {
  const [lines, setLines] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let i = 0
    const iv = setInterval(() => {
      if (i >= LOG_LINES.length) { clearInterval(iv); return }
      setLines(prev => [...prev, LOG_LINES[i]])
      i++
    }, 280)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [lines])

  return (
    <div
      className="rounded-2xl p-4 font-mono text-xs overflow-y-auto"
      style={{ background: '#050508', border: '1px solid rgba(100,100,200,0.12)', height: 180 }}
    >
      {lines.filter(Boolean).map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="leading-relaxed"
          style={{ color: line?.startsWith('>') ? '#00c875' : '#a0a0b0' }}
        >
          {line}
          {i === lines.length - 1 && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="inline-block w-1.5 h-3 bg-[#00c875] ml-0.5 align-middle"
            />
          )}
        </motion.div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

/* ── PAGE ────────────────────────────────────────────────────── */
export default function ConnectPage() {
  const [selectedTier, setSelectedTier] = useState('CORE')
  const [connecting, setConnecting] = useState(false)
  const [connectionDone, setConnectionDone] = useState(false)
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    setTimeout(() => {
      setConnecting(true)
      setTimeout(() => {
        setConnectionDone(true)
        const iv = setInterval(() => setUptime(t => t + 1), 1000)
        return () => clearInterval(iv)
      }, 1800)
    }, 600)
  }, [])

  const uptimeStr = `${Math.floor(uptime / 60).toString().padStart(2, '0')}:${(uptime % 60).toString().padStart(2, '0')}`

  return (
    <AppShell>
      <div className="relative z-10 space-y-4 py-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">Connect Your Machine</h1>
            <p className="text-[#4a4a6a] text-sm mt-0.5">Install the VIGIL agent to stream system telemetry</p>
          </div>
        </div>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 240, damping: 28 }}
          className="vigil-card p-5"
        >
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {connecting && !connectionDone && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full"
                    style={{ border: '2px solid transparent', borderTopColor: '#1a6fff', borderRightColor: '#7b2fff' }}
                  />
                )}
                {connectionDone && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 rounded-full"
                    style={{ border: '2px solid #00c875', boxShadow: '0 0 12px rgba(0,200,117,0.3)' }}
                  />
                )}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(100,100,200,0.08)' }}
                >
                  <Cpu size={18} style={{ color: connectionDone ? '#00c875' : '#4a4a6a' }} />
                </div>
              </div>

              <motion.div
                animate={connectionDone ? { opacity: [0.6, 1, 0.6] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1.5"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: connectionDone ? '#00c875' : connecting ? '#ff6b1a' : '#4a4a6a',
                    boxShadow: connectionDone ? '0 0 6px rgba(0,200,117,0.5)' : 'none',
                  }}
                />
                <span className="font-mono text-sm font-bold" style={{ color: connectionDone ? '#00c875' : '#a0a0b0' }}>
                  {connectionDone ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </motion.div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="vigil-label">Agent Version</span>
                <span className="font-mono text-xs text-white">v2.4.1</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="vigil-label">Uptime</span>
                <span className="font-mono text-xs text-[#00c875]">{uptimeStr}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="vigil-label">Endpoint</span>
                <span className="font-mono text-xs text-[#a0a0b0]">localhost:7732</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Module Cards */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            {
              tier: 'LITE',
              specs: ['CPU monitoring', 'RAM tracking', 'Basic alerts', '1 stream max', '5 min latency'],
            },
            {
              tier: 'CORE',
              specs: ['Full hardware telemetry', 'GPU monitoring', 'Unlimited streams', 'Real-time latency', 'Advanced alerting', 'API access'],
              recommended: true,
            },
            {
              tier: 'APEX',
              specs: ['Everything in CORE', 'Predictive anomaly AI', 'Multi-machine sync', 'Priority support', 'Custom pipelines', 'Dedicated GPU'],
            },
          ].map((m, i) => (
            <motion.div
              key={m.tier}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 240, damping: 28 }}
            >
              <ModuleCard
                tier={m.tier}
                specs={m.specs}
                recommended={m.recommended}
                selected={selectedTier === m.tier}
                onSelect={() => setSelectedTier(m.tier)}
              />
            </motion.div>
          ))}
        </div>

        {/* Hardware + Terminal */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Hardware meters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 240, damping: 28 }}
            className="vigil-card p-5"
          >
            <span className="vigil-label text-[#a0a0b0] block mb-4">Hardware Metrics</span>
            <div className="space-y-4">
              <HardwareMeter label="RAM" value={62} delay={600} />
              <HardwareMeter label="CPU" value={38} delay={700} />
              <HardwareMeter label="Storage" value={24} delay={800} />
              <HardwareMeter label="GPU" value={81} delay={900} />
            </div>
          </motion.div>

          {/* Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 240, damping: 28 }}
            className="vigil-card p-5 flex flex-col gap-3"
          >
            <span className="vigil-label text-[#a0a0b0]">Agent Log</span>
            <Terminal />
          </motion.div>
        </div>
      </div>
    </AppShell>
  )
}
