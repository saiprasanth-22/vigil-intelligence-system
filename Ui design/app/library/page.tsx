'use client'

import AppShell from '@/components/vigil/app-shell'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { Search, Upload, FileText, Send, RotateCcw } from 'lucide-react'

type FileStatus = 'processing' | 'indexing' | 'ready'

interface DocFile {
  id: number
  name: string
  size: string
  date: string
  status: FileStatus
  progress?: number
}

const INITIAL_FILES: DocFile[] = [
  { id: 1, name: 'report_q3_2024.pdf',      size: '2.4 MB', date: 'Today',    status: 'ready' },
  { id: 2, name: 'market_analysis.csv',     size: '840 KB', date: 'Today',    status: 'indexing' },
  { id: 3, name: 'contracts_2024.docx',     size: '1.1 MB', date: 'Yesterday',status: 'ready' },
  { id: 4, name: 'strategy_memo.pdf',       size: '560 KB', date: '2 days ago',status: 'ready' },
  { id: 5, name: 'financials_2024.xlsx',    size: '3.2 MB', date: '3 days ago',status: 'processing', progress: 62 },
]

const STATUS_CONFIGS: Record<FileStatus, { label: string; color: string; bg: string }> = {
  processing: { label: 'Processing', color: '#ff6b1a', bg: 'rgba(255,107,26,0.12)' },
  indexing:   { label: 'Indexing',   color: '#1a6fff', bg: 'rgba(26,111,255,0.12)' },
  ready:      { label: 'Ready',      color: '#00c875', bg: 'rgba(0,200,117,0.12)'  },
}

const TABS = ['All', 'PDFs', 'CSVs', 'Docs']

function FileCard({ file, onClick, selected }: { file: DocFile; onClick: () => void; selected: boolean }) {
  const cfg = STATUS_CONFIGS[file.status]
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="vigil-card p-4 mb-2 overflow-hidden"
      style={{
        borderColor: selected ? 'rgba(26,111,255,0.4)' : 'rgba(100,100,200,0.12)',
        background: selected ? 'rgba(26,111,255,0.06)' : 'rgba(15,15,26,0.85)',
      }}
      data-interactive
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <FileText size={14} style={{ color: cfg.color, flexShrink: 0 }} />
          <span className="text-white text-sm font-medium truncate">{file.name}</span>
        </div>
        <span
          className="vigil-pill flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="vigil-label">{file.size}</span>
        <span className="vigil-label">·</span>
        <span className="vigil-label">{file.date}</span>
      </div>
      {file.status === 'processing' && typeof file.progress === 'number' && (
        <div className="mt-2.5 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(100,100,200,0.1)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${file.progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #1a6fff, #ff6b1a)' }}
          />
        </div>
      )}
    </motion.div>
  )
}

/* ── Chat Bubble ────────────────────────────────────────────── */
interface ChatMsg {
  id: number
  role: 'user' | 'ai'
  text: string
  citations?: string[]
}

const INITIAL_MSGS: ChatMsg[] = [
  {
    id: 1,
    role: 'ai',
    text: 'I have indexed your documents. Ask me anything about the content.',
    citations: ['report_q3_2024.pdf', 'contracts_2024.docx'],
  },
]

function StreamingText({ text }: { text: string }) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  const iRef = useRef(0)
  const [started] = useState(() => true)

  if (!started) return <span>{text}</span>

  // Simple one-shot reveal
  if (!done && shown.length === 0) {
    let i = 0
    const tick = () => {
      i++
      setShown(text.slice(0, i))
      if (i < text.length) setTimeout(tick, 18)
      else setDone(true)
    }
    setTimeout(tick, 0)
  }

  return <span>{done ? text : shown}<motion.span animate={{ opacity: [1,0] }} transition={{ duration: 0.5, repeat: done ? 0 : Infinity }} className="inline-block w-px h-3.5 bg-[#7b2fff] ml-0.5 align-middle" /></span>
}

export default function LibraryPage() {
  const [files, setFiles] = useState(INITIAL_FILES)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<DocFile>(INITIAL_FILES[0])
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL_MSGS)
  const [input, setInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [thinking, setThinking] = useState(false)

  const filtered = files.filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    if (activeTab === 'PDFs') return f.name.endsWith('.pdf')
    if (activeTab === 'CSVs') return f.name.endsWith('.csv')
    if (activeTab === 'Docs') return f.name.endsWith('.docx')
    return true
  })

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg: ChatMsg = { id: Date.now(), role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setThinking(true)

    const RESPONSES = [
      { text: `Based on ${selectedFile.name}, the key insight is that Q3 revenue increased 12% YoY driven by expansion in the APAC region. Margins held steady at 34.2%.`, citations: [selectedFile.name] },
      { text: 'I found 3 relevant clauses in your contracts related to this. The termination clause on page 4 is most relevant.', citations: ['contracts_2024.docx'] },
      { text: 'The market analysis shows a bullish trend for the sector with 15% projected growth over the next 2 quarters.', citations: ['market_analysis.csv'] },
    ]
    const resp = RESPONSES[Math.floor(Math.random() * RESPONSES.length)]

    setTimeout(() => {
      setThinking(false)
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', ...resp }])
    }, 1800)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    droppedFiles.forEach(f => {
      setFiles(prev => [{
        id: Date.now() + Math.random(),
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        date: 'Just now',
        status: 'processing',
        progress: 0,
      }, ...prev])
    })
  }

  return (
    <AppShell>
      <div className="flex gap-4 h-[calc(100vh-40px)] py-2">
        {/* LEFT PANEL */}
        <div className="flex flex-col gap-3" style={{ width: '35%', flexShrink: 0 }}>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4a6a]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="vigil-input pl-9 text-sm"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(100,100,200,0.06)', border: '1px solid rgba(100,100,200,0.1)' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors"
                style={{ color: activeTab === tab ? '#ffffff' : '#4a4a6a' }}
                data-interactive
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(26,111,255,0.2), rgba(123,47,255,0.2))', border: '1px solid rgba(26,111,255,0.25)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(f => (
              <FileCard
                key={f.id}
                file={f}
                selected={selectedFile?.id === f.id}
                onClick={() => setSelectedFile(f)}
              />
            ))}
          </div>

          {/* Drop zone */}
          <motion.div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            animate={{
              scale: isDragging ? 1.02 : 1,
              borderColor: isDragging ? '#ff6b1a' : 'rgba(255,107,26,0.3)',
              background: isDragging ? 'rgba(255,107,26,0.06)' : 'transparent',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="rounded-2xl flex flex-col items-center gap-2 py-5 text-center"
            style={{ border: '1.5px dashed rgba(255,107,26,0.3)', borderRadius: 20 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Upload size={20} style={{ color: isDragging ? '#ff6b1a' : '#4a4a6a' }} />
            </motion.div>
            <p className="text-xs text-[#4a4a6a]">Drop files here</p>
          </motion.div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Document Preview */}
          {selectedFile && (
            <motion.div
              key={selectedFile.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="vigil-card p-5"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <FileText size={16} style={{ color: STATUS_CONFIGS[selectedFile.status].color }} />
                <span className="text-white font-medium">{selectedFile.name}</span>
                <span
                  className="vigil-pill ml-auto"
                  style={{
                    background: STATUS_CONFIGS[selectedFile.status].bg,
                    color: STATUS_CONFIGS[selectedFile.status].color,
                  }}
                >
                  {STATUS_CONFIGS[selectedFile.status].label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {['Revenue Growth', 'APAC Expansion', 'Q3 Margins', 'Key Metrics', 'Risk Factors'].map(chip => (
                  <span
                    key={chip}
                    className="vigil-pill"
                    style={{ background: 'rgba(26,111,255,0.1)', color: '#1a6fff', border: '1px solid rgba(26,111,255,0.2)' }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <p className="text-[#a0a0b0] text-sm leading-relaxed">
                This document contains Q3 2024 financial results. Key highlights include 12% revenue growth YoY,
                strong performance in APAC markets, and maintained operating margins at 34.2%.
                Three risk factors identified in the regulatory section.
              </p>
            </motion.div>
          )}

          {/* Chat */}
          <div className="flex-1 vigil-card p-4 flex flex-col gap-3 min-h-0">
            <span className="vigil-label text-[#a0a0b0]">Document Chat</span>

            <div className="flex-1 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div
                      className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #1a6fff, #7b2fff)', borderRadius: '18px 18px 4px 18px' }}
                    >
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[80%]">
                      <div
                        className="px-4 py-2.5 text-sm text-[#a0a0b0]"
                        style={{
                          background: 'rgba(100,100,200,0.06)',
                          border: '1px solid rgba(123,47,255,0.25)',
                          borderLeft: '3px solid #7b2fff',
                          borderRadius: '4px 18px 18px 18px',
                        }}
                      >
                        {i === messages.length - 1 ? msg.text : msg.text}
                      </div>
                      {msg.citations && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.citations.map(c => (
                            <button
                              key={c}
                              className="vigil-pill text-[#1a6fff]"
                              style={{ background: 'rgba(26,111,255,0.1)', border: '1px solid rgba(26,111,255,0.2)', fontSize: 10 }}
                              data-interactive
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              {thinking && (
                <div className="flex gap-1.5 px-4 py-3 rounded-2xl w-fit"
                  style={{ background: 'rgba(100,100,200,0.06)', border: '1px solid rgba(123,47,255,0.2)', borderLeft: '3px solid #7b2fff' }}>
                  <div className="thinking-dot w-2 h-2 rounded-full" style={{ background: '#1a6fff' }} />
                  <div className="thinking-dot w-2 h-2 rounded-full" style={{ background: '#1a6fff' }} />
                  <div className="thinking-dot w-2 h-2 rounded-full" style={{ background: '#1a6fff' }} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about this document..."
                className="vigil-input flex-1 text-sm py-2.5"
              />
              <button
                onClick={sendMessage}
                className="p-2.5 rounded-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1a6fff, #7b2fff)' }}
                data-interactive
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
