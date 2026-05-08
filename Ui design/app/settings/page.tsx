'use client'

import AppShell from '@/components/vigil/app-shell'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, ReactNode } from 'react'
import {
  User, HardDrive, Key, Bell, Palette, Shield, AlertTriangle,
  ChevronDown, Copy, Check, Eye, EyeOff, ToggleLeft, ToggleRight
} from 'lucide-react'

/* ── Toggle Switch ───────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0"
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? 'linear-gradient(135deg, #1a6fff, #7b2fff)' : 'rgba(100,100,200,0.15)',
        border: '1px solid rgba(100,100,200,0.2)',
      }}
      data-interactive
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
      />
    </button>
  )
}

/* ── Section Card ────────────────────────────────────────────── */
function SectionCard({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
  danger = false,
}: {
  icon: React.ElementType
  title: string
  children: ReactNode
  defaultOpen?: boolean
  danger?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="vigil-card overflow-hidden"
      style={{
        borderColor: danger ? 'rgba(255,43,43,0.25)' : 'rgba(100,100,200,0.12)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5 text-left"
        data-interactive
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: danger ? 'rgba(255,43,43,0.1)' : 'rgba(26,111,255,0.1)' }}
          >
            <Icon size={15} style={{ color: danger ? '#ff2b2b' : '#1a6fff' }} />
          </div>
          <span className="text-white font-medium text-sm">{title}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-[#4a4a6a]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-5 pb-5 space-y-4"
              style={{ borderTop: '1px solid rgba(100,100,200,0.08)' }}
            >
              <div className="pt-4">{children}</div>
              {!danger && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    className="vigil-btn px-5 py-2 text-sm flex items-center gap-2"
                    data-interactive
                  >
                    <AnimatePresence mode="wait">
                      {saved ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          className="flex items-center gap-1.5"
                        >
                          <Check size={13} />
                          Saved
                        </motion.span>
                      ) : (
                        <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          Save Changes
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── API Key Row ─────────────────────────────────────────────── */
function ApiKeyRow({ label, value }: { label: string; value: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const masked = '•'.repeat(24) + value.slice(-4)

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(100,100,200,0.04)', border: '1px solid rgba(100,100,200,0.1)' }}>
      <div className="flex-1 min-w-0">
        <p className="vigil-label mb-1">{label}</p>
        <span className="font-mono text-xs text-[#a0a0b0]">{visible ? value : masked}</span>
      </div>
      <button
        onClick={() => setVisible(v => !v)}
        className="p-1.5 text-[#4a4a6a] hover:text-[#a0a0b0] transition-colors"
        data-interactive
      >
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: copied ? '#00c875' : '#4a4a6a' }}
        data-interactive
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  )
}

/* ── Active Session Row ──────────────────────────────────────── */
function SessionRow({ device, location, time, current }: { device: string; location: string; time: string; current?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'rgba(100,100,200,0.08)' }}>
      <div>
        <p className="text-sm text-[#a0a0b0]">{device}</p>
        <p className="vigil-label mt-0.5">{location} · {time}</p>
      </div>
      {current ? (
        <span className="vigil-pill" style={{ background: 'rgba(0,200,117,0.1)', color: '#00c875', border: '1px solid rgba(0,200,117,0.2)' }}>
          Current
        </span>
      ) : (
        <button className="text-xs text-[#ff2b2b] hover:text-[#ff5555] transition-colors" data-interactive>
          Revoke
        </button>
      )}
    </div>
  )
}

/* ── PAGE ────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [name, setName] = useState('Vigil User')
  const [email, setEmail] = useState('user@vigil.ai')
  const [notifs, setNotifs] = useState({
    alerts: true,
    documents: true,
    streams: false,
    digest: true,
  })
  const [dangerConfirm, setDangerConfirm] = useState('')
  const [deleteAttempted, setDeleteAttempted] = useState(false)

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-2 space-y-3">
        <div className="mb-4">
          <h1 className="text-white font-bold text-xl">Settings</h1>
          <p className="text-[#4a4a6a] text-sm mt-0.5">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <SectionCard icon={User} title="Profile">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ background: 'linear-gradient(135deg, #1a6fff, #7b2fff)' }}
                >
                  {name[0] || 'V'}
                </div>
                <button
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                  style={{ background: 'linear-gradient(135deg, #1a6fff, #7b2fff)' }}
                  data-interactive
                >
                  +
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="vigil-input text-sm py-2.5"
                  placeholder="Full name"
                />
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="vigil-input text-sm py-2.5"
                  placeholder="Email address"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Storage */}
        <SectionCard icon={HardDrive} title="Storage">
          <div className="space-y-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-[#a0a0b0]">2.4 GB used of 10 GB</span>
              <span className="vigil-label">24%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(100,100,200,0.1)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '24%' }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #1a6fff, #ff6b1a)' }}
              />
            </div>
            <button
              className="vigil-btn-ghost text-sm px-4 py-2"
              data-interactive
            >
              Upgrade Storage
            </button>
          </div>
        </SectionCard>

        {/* API Keys */}
        <SectionCard icon={Key} title="API Keys">
          <div className="space-y-2">
            <ApiKeyRow label="Production Key" value="vgl_prod_xK9mN2pQ4rT7wY1jL5cE8dF3" />
            <ApiKeyRow label="Development Key" value="vgl_dev_zA4bX7nM2kP9rT5wQ1jL8cE" />
            <button
              className="vigil-btn-ghost text-xs px-4 py-2 mt-1"
              data-interactive
            >
              Generate New Key
            </button>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon={Bell} title="Notifications">
          <div className="space-y-3">
            {(Object.entries(notifs) as [keyof typeof notifs, boolean][]).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#a0a0b0] capitalize">{key} notifications</p>
                  <p className="vigil-label mt-0.5">
                    {key === 'alerts' && 'Receive alerts for anomalies and critical events'}
                    {key === 'documents' && 'When documents finish indexing'}
                    {key === 'streams' && 'Updates on live stream status changes'}
                    {key === 'digest' && 'Daily summary of activity'}
                  </p>
                </div>
                <Toggle checked={val} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard icon={Palette} title="Appearance">
          <div className="space-y-2">
            <p className="vigil-label text-[#a0a0b0]">Theme</p>
            <div className="flex gap-2">
              {['Dark', 'System'].map(t => (
                <button
                  key={t}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: t === 'Dark' ? 'rgba(26,111,255,0.15)' : 'rgba(100,100,200,0.06)',
                    border: t === 'Dark' ? '1px solid rgba(26,111,255,0.3)' : '1px solid rgba(100,100,200,0.15)',
                    color: t === 'Dark' ? '#1a6fff' : '#4a4a6a',
                  }}
                  data-interactive
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard icon={Shield} title="Security">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="vigil-label text-[#a0a0b0]">Change Password</p>
              <input type="password" className="vigil-input text-sm py-2.5" placeholder="Current password" />
              <input type="password" className="vigil-input text-sm py-2.5" placeholder="New password" />
              <input type="password" className="vigil-input text-sm py-2.5" placeholder="Confirm new password" />
            </div>
            <div>
              <p className="vigil-label text-[#a0a0b0] mb-2">Active Sessions</p>
              <SessionRow device="Chrome on macOS" location="New York, US" time="Active now" current />
              <SessionRow device="VIGIL Desktop App" location="New York, US" time="2 hours ago" />
              <SessionRow device="Safari on iPhone" location="New York, US" time="Yesterday" />
            </div>
          </div>
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard icon={AlertTriangle} title="Danger Zone" defaultOpen={false} danger>
          <div className="space-y-4">
            <p className="text-sm text-[#a0a0b0]">
              Deleting your account is permanent and cannot be undone. All data, documents, and streams will be removed.
            </p>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,43,43,0.04)', border: '1px solid rgba(255,43,43,0.15)' }}>
              <p className="vigil-label mb-2" style={{ color: '#ff2b2b' }}>
                Type DELETE to confirm
              </p>
              <input
                type="text"
                value={dangerConfirm}
                onChange={e => setDangerConfirm(e.target.value)}
                placeholder="DELETE"
                className="vigil-input text-sm py-2.5 mb-3"
                style={{ borderColor: dangerConfirm === 'DELETE' ? '#ff2b2b' : undefined }}
              />
              <button
                onClick={() => setDeleteAttempted(true)}
                disabled={dangerConfirm !== 'DELETE'}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: dangerConfirm === 'DELETE' ? 'rgba(255,43,43,0.15)' : 'rgba(100,100,200,0.06)',
                  border: `1px solid ${dangerConfirm === 'DELETE' ? 'rgba(255,43,43,0.4)' : 'rgba(100,100,200,0.15)'}`,
                  color: dangerConfirm === 'DELETE' ? '#ff2b2b' : '#4a4a6a',
                }}
                data-interactive
              >
                Delete My Account
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  )
}
