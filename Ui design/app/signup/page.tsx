'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, Chrome } from 'lucide-react'
import ParticleField from '@/components/vigil/particle-field'

function FloatingLabelInput({
  label,
  type = 'text',
  value,
  onChange,
  error,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [focused, setFocused] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const floated = focused || value.length > 0
  const inputType = type === 'password' ? (showPw ? 'text' : 'password') : type

  return (
    <div className="relative">
      <div className="relative">
        <motion.label
          animate={{
            y: floated ? -24 : 0,
            fontSize: floated ? '11px' : '14px',
            color: focused ? '#1a6fff' : floated ? '#a0a0b0' : '#4a4a6a',
          }}
          transition={{ duration: 0.18 }}
          className="absolute left-4 top-3.5 font-medium pointer-events-none tracking-wide uppercase z-10"
          style={{ letterSpacing: floated ? '0.08em' : '0' }}
        >
          {label}
        </motion.label>
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="vigil-input pt-5 pb-2"
          style={{
            borderColor: error ? '#ff2b2b' : focused ? '#1a6fff' : '#1a1a2e',
            boxShadow: error
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,43,43,0.2)'
              : focused
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 2px rgba(26,111,255,0.25)'
              : 'inset 0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-[#a0a0b0] transition-colors"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-[#ff2b2b] text-xs mt-1.5 px-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!name) errs.name = 'Name is required'
    if (!email.includes('@')) errs.email = 'Enter a valid email'
    if (password.length < 8) errs.password = 'At least 8 characters'
    if (password !== confirm) errs.confirm = 'Passwords do not match'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden vigil-dot-grid"
      style={{ backgroundColor: '#0a0a0f' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <ParticleField count={30} />
      </div>

      {/* Soft glow behind card */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(26,111,255,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className={`vigil-card w-full max-w-md mx-4 p-8 ${shake ? 'vigil-shake' : ''}`}
        style={{ borderRadius: 28 }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-5 h-5 rounded-full"
              style={{ background: 'radial-gradient(circle, #1a6fff, #7b2fff)', boxShadow: '0 0 10px rgba(26,111,255,0.5)' }}
            />
            <span className="text-white font-bold tracking-[0.25em] text-sm">VIGIL</span>
          </div>
          <h1 className="text-white font-bold text-2xl mb-2">Create your account</h1>
          <p className="text-[#a0a0b0] text-sm">Start watching your data</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingLabelInput label="Full Name" value={name} onChange={setName} error={errors.name} />
          <FloatingLabelInput label="Email" type="email" value={email} onChange={setEmail} error={errors.email} />
          <FloatingLabelInput label="Password" type="password" value={password} onChange={setPassword} error={errors.password} />
          <FloatingLabelInput label="Confirm Password" type="password" value={confirm} onChange={setConfirm} error={errors.confirm} />

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="vigil-btn w-full py-3.5 text-sm font-semibold"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <button
              type="button"
              className="vigil-btn-ghost w-full py-3.5 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Chrome size={14} />
              Continue with Google
            </button>
          </div>
        </form>

        <p className="text-center text-[#4a4a6a] text-sm mt-6">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-[#1a6fff] hover:text-[#4a8fff] transition-colors font-medium"
          >
            Sign In
          </button>
        </p>
      </motion.div>
    </div>
  )
}
