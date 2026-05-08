'use client'

import AppShell from '@/components/vigil/app-shell'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, AlertCircle } from 'lucide-react'
import { queryChat, ApiError } from '@/lib/api-client'

type Source = 'library' | 'live' | 'both'

interface ChatMsg {
  id: number
  role: 'user' | 'ai'
  text: string
  citations?: string[]
  isError?: boolean
}

const MODE_MAP: Record<Source, string> = {
  library: 'library',
  live: 'live',
  both: 'unified',
}

const SOURCE_CONFIGS: Record<Source, { label: string; color: string; bg: string }> = {
  library: { label: 'Library',      color: '#1a6fff', bg: 'rgba(26,111,255,0.15)'  },
  live:    { label: 'Live',          color: '#ff6b1a', bg: 'rgba(255,107,26,0.15)' },
  both:    { label: 'Both',          color: '#7b2fff', bg: 'rgba(123,47,255,0.15)' },
}

const ACTIVE_CHIPS: Record<Source, string[]> = {
  library: ['report_q3_2024.pdf', 'contracts_2024.docx', 'strategy_memo.pdf'],
  live:    ['AAPL Stream', 'MSFT Stream', 'BTC Feed'],
  both:    ['report_q3_2024.pdf', 'contracts_2024.docx', 'AAPL Stream', 'BTC Feed'],
}

const SUGGESTIONS = [
  'What are the key risk factors across all my data?',
  'Compare Q3 performance with live market signals.',
  'Summarise the most critical alerts from today.',
  'What is the current confluence score and why?',
]


function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animId: number

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const nodes = Array.from({ length: 18 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 140) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(123,47,255,${0.03 * (1 - d / 140)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

function SourcePanel({ citedDoc, onClose }: { citedDoc: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      className="vigil-card h-full flex flex-col"
      style={{ width: 280, flexShrink: 0 }}
    >
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(100,100,200,0.1)' }}>
        <span className="vigil-label text-[#a0a0b0]">Source</span>
        <button onClick={onClose} data-interactive>
          <X size={14} className="text-[#4a4a6a]" />
        </button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(26,111,255,0.1)' }}>
            <span className="text-[#1a6fff] text-xs font-bold">PDF</span>
          </div>
          <span className="text-white text-sm font-medium">{citedDoc}</span>
        </div>
        <p className="text-[#a0a0b0] text-xs leading-relaxed">
          Relevant excerpt from this document: "Q3 2024 revenue increased by 12% year-over-year, driven primarily by
          strong growth in the APAC region. Operating margins remained stable at 34.2%, reflecting disciplined
          cost management despite inflationary pressures..."
        </p>
        <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(26,111,255,0.06)', border: '1px solid rgba(26,111,255,0.15)' }}>
          <span className="vigil-label">Page 4, Section 2.3</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function ChatPage() {
  const [source, setSource] = useState<Source>('both')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [sourcePanel, setSourcePanel] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || thinking) return
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }])
    setInput('')
    setThinking(true)

    try {
      const data = await queryChat(text, MODE_MAP[source])
      const citations = [
        ...new Set(
          data.sources
            .map(s => (s.type === 'file' ? (s.file_name ?? s.file_id) : (s.metric ?? s.event_id)))
            .filter((c): c is string => Boolean(c))
        ),
      ]
      setMessages(prev => [
        ...prev,
        { id: Date.now(), role: 'ai', text: data.answer, citations: citations.length ? citations : undefined },
      ])
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `Error ${err.status}: ${err.detail}`
          : 'Something went wrong. Please try again.'
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: message, isError: true }])
    } finally {
      setThinking(false)
    }
  }

  return (
    <AppShell>
      <div style={{
        height: 'calc(100vh - 32px)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box'
      }}>
        {/* Source toggles */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {(Object.keys(SOURCE_CONFIGS) as Source[]).map(s => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className="relative px-5 py-2 rounded-full text-sm font-semibold transition-colors"
                style={{
                  color: source === s ? '#fff' : '#4a4a6a',
                  border: source === s ? 'none' : '1px solid rgba(100,100,200,0.15)',
                }}
                data-interactive
              >
                {source === s && (
                  <motion.div
                    layoutId="source-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: SOURCE_CONFIGS[s].bg, border: `1px solid ${SOURCE_CONFIGS[s].color}40`, boxShadow: `0 0 12px ${SOURCE_CONFIGS[s].color}25` }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10" style={{ color: source === s ? SOURCE_CONFIGS[s].color : '#4a4a6a' }}>
                  {SOURCE_CONFIGS[s].label}
                </span>
              </button>
            ))}
          </div>

          {/* Active chips */}
          <div className="flex flex-wrap gap-1.5">
            {ACTIVE_CHIPS[source].map(chip => (
              <motion.span
                key={chip}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="vigil-pill"
                style={{ background: 'rgba(100,100,200,0.08)', color: '#a0a0b0', border: '1px solid rgba(100,100,200,0.15)', fontSize: 10 }}
              >
                {chip}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div
          className="vigil-card"
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <NeuralBackground />

          <div className="relative z-10 flex-1 flex flex-col p-4 min-w-0">
            <div style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* Empty state */}
              {messages.length === 0 && (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '24px',
                  minHeight: '400px',
                }}>
                  <div>
                    <p className="text-white font-bold text-xl text-center mb-2">Ask anything across your data.</p>
                    <p className="text-[#4a4a6a] text-sm text-center">Querying: {ACTIVE_CHIPS[source].join(', ')}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-md">
                    {SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={s}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.12 }}
                        onClick={() => setInput(s)}
                        className="text-left px-4 py-2.5 rounded-xl text-sm text-[#a0a0b0] transition-all"
                        style={{ background: 'rgba(100,100,200,0.06)', border: '1px solid rgba(100,100,200,0.1)' }}
                        data-interactive
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div
                      className="max-w-[70%] px-4 py-3 text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #1a6fff, #7b2fff)',
                        borderRadius: '18px 18px 4px 18px',
                      }}
                    >
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[75%]">
                      <div
                        className="px-4 py-3 text-sm leading-relaxed"
                        style={msg.isError ? {
                          background: 'rgba(255,43,43,0.06)',
                          border: '1px solid rgba(255,43,43,0.2)',
                          borderLeft: '3px solid #ff2b2b',
                          borderRadius: '4px 18px 18px 18px',
                          color: '#ff6b6b',
                        } : {
                          background: 'rgba(100,100,200,0.06)',
                          border: '1px solid rgba(123,47,255,0.2)',
                          borderLeft: '3px solid #7b2fff',
                          borderRadius: '4px 18px 18px 18px',
                          color: '#a0a0b0',
                        }}
                      >
                        {msg.isError && <AlertCircle size={13} className="inline mr-1.5 mb-0.5" />}
                        {msg.text}
                      </div>
                      {msg.citations && (
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex flex-wrap gap-1.5 mt-2"
                        >
                          {msg.citations.map(c => (
                            <button
                              key={c}
                              onClick={() => setSourcePanel(c)}
                              className="vigil-pill text-[#1a6fff]"
                              style={{ background: 'rgba(26,111,255,0.1)', border: '1px solid rgba(26,111,255,0.2)', fontSize: 10 }}
                              data-interactive
                            >
                              {c}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-1.5 px-4 py-3 w-fit"
                  style={{
                    background: 'rgba(100,100,200,0.06)',
                    border: '1px solid rgba(123,47,255,0.2)',
                    borderLeft: '3px solid #7b2fff',
                    borderRadius: '4px 18px 18px 18px',
                  }}
                >
                  <div className="thinking-dot w-2 h-2 rounded-full" style={{ background: '#1a6fff' }} />
                  <div className="thinking-dot w-2 h-2 rounded-full" style={{ background: '#1a6fff' }} />
                  <div className="thinking-dot w-2 h-2 rounded-full" style={{ background: '#1a6fff' }} />
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>


              <button
                onClick={sendMessage}
                disabled={thinking}
                className="p-2.5 rounded-xl flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #1a6fff, #7b2fff)' }}
                data-interactive
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
           {/* Input */}
            <div className="flex items-center gap-2 mt-3">
              <button className="p-2.5 text-[#4a4a6a] hover:text-[#a0a0b0] transition-colors" data-interactive>
                <Paperclip size={15} />
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask anything across your data..."
                className="flex-1 text-sm py-2.5 px-4 rounded-xl text-white placeholder-[#4a4a6a] outline-none"
                style={{ background: 'rgba(100,100,200,0.06)', border: '1px solid rgba(100,100,200,0.15)' }}
              />

          {/* Source panel */}
          <AnimatePresence>
            {sourcePanel && (
              <SourcePanel citedDoc={sourcePanel} onClose={() => setSourcePanel(null)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  )
}
