'use client'

import AppShell from '@/components/vigil/app-shell'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/* ── Animated bar chart ──────────────────────────────────────── */
const CHART_DATA = [
  { label: 'Mon', library: 42, live: 28, chat: 15 },
  { label: 'Tue', library: 65, live: 44, chat: 23 },
  { label: 'Wed', library: 38, live: 71, chat: 31 },
  { label: 'Thu', library: 89, live: 55, chat: 42 },
  { label: 'Fri', library: 74, live: 82, chat: 28 },
  { label: 'Sat', library: 31, live: 24, chat: 11 },
  { label: 'Sun', library: 56, live: 38, chat: 19 },
]

function BarChart() {
  const max = Math.max(...CHART_DATA.flatMap(d => [d.library, d.live, d.chat]))

  return (
    <div className="flex items-end gap-3 h-48 px-2">
      {CHART_DATA.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-end gap-0.5 flex-1 w-full">
            {([
              { val: d.library, color: '#1a6fff' },
              { val: d.live,    color: '#ff6b1a' },
              { val: d.chat,    color: '#7b2fff' },
            ]).map((bar, j) => (
              <motion.div
                key={j}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3 + i * 0.06 + j * 0.02, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  flex: 1,
                  height: `${(bar.val / max) * 100}%`,
                  background: bar.color,
                  borderRadius: '4px 4px 2px 2px',
                  opacity: 0.85,
                  transformOrigin: 'bottom',
                  minHeight: 4,
                }}
              />
            ))}
          </div>
          <span className="vigil-label">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Metric ring ─────────────────────────────────────────────── */
function MetricRing({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - value / 100)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 96, height: 96 }}>
        <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(100,100,200,0.1)" strokeWidth="7" />
          <motion.circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ delay: delay / 1000, duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono font-bold text-white text-lg">{value}</span>
        </div>
      </div>
      <span className="vigil-label text-center" style={{ color: '#a0a0b0' }}>{label}</span>
    </div>
  )
}

export default function VisualizerPage() {
  return (
    <AppShell>
      <div className="space-y-4 py-2">
        <div>
          <h1 className="text-white font-bold text-xl">Visualizer</h1>
          <p className="text-[#4a4a6a] text-sm mt-0.5">Data activity overview</p>
        </div>

        {/* Top rings */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'Queries Resolved', value: 94, color: '#1a6fff', delay: 200 },
            { label: 'Index Coverage',   value: 87, color: '#7b2fff', delay: 300 },
            { label: 'Stream Uptime',    value: 99, color: '#00c875', delay: 400 },
            { label: 'Alert Rate',       value: 12, color: '#ff6b1a', delay: 500 },
          ].map(m => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: m.delay / 1000, type: 'spring', stiffness: 240, damping: 28 }}
              className="vigil-card p-5 flex flex-col items-center"
            >
              <MetricRing {...m} />
            </motion.div>
          ))}
        </div>

        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 240, damping: 28 }}
          className="vigil-card p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <span className="vigil-label text-[#a0a0b0]">Activity by Day</span>
            <div className="flex gap-4">
              {[
                { label: 'Library', color: '#1a6fff' },
                { label: 'Live',    color: '#ff6b1a' },
                { label: 'Chat',    color: '#7b2fff' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="vigil-label">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <BarChart />
        </motion.div>

        {/* Source breakdown */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[
            { title: 'Top Queried Documents', items: ['report_q3_2024.pdf — 48 queries', 'contracts_2024.docx — 31 queries', 'market_analysis.csv — 22 queries', 'strategy_memo.pdf — 18 queries'] },
            { title: 'Most Active Streams', items: ['AAPL — 1,241 events/hr', 'MSFT — 892 events/hr', 'BTC — 3,441 events/hr', 'ETH — 2,187 events/hr'] },
          ].map((panel, i) => (
            <motion.div
              key={panel.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 240, damping: 28 }}
              className="vigil-card p-5"
            >
              <span className="vigil-label text-[#a0a0b0] block mb-3">{panel.title}</span>
              <div className="space-y-2">
                {panel.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-[#4a4a6a]" style={{ minWidth: 16 }}>{j + 1}</span>
                    <span className="text-xs text-[#a0a0b0] flex-1">{item.split(' — ')[0]}</span>
                    <span className="font-mono text-xs text-white">{item.split(' — ')[1]}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
