'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ParticleField from '@/components/vigil/particle-field'

const TITLE = 'VIGIL'

function NebulaBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Deep nebula blobs */}
      <div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: 600,
          height: 600,
          top: '10%',
          left: '15%',
          background: 'radial-gradient(ellipse, rgba(26,111,255,0.07) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute rounded-full blur-[140px]"
        style={{
          width: 500,
          height: 500,
          top: '20%',
          right: '10%',
          background: 'radial-gradient(ellipse, rgba(123,47,255,0.06) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute rounded-full blur-[180px]"
        style={{
          width: 700,
          height: 400,
          bottom: '5%',
          left: '30%',
          background: 'radial-gradient(ellipse, rgba(26,111,255,0.04) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}

function HeroOrb() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6, type: 'spring', stiffness: 200 }}
      className="relative flex items-center justify-center"
      style={{ width: 160, height: 160 }}
    >
      {/* Outer glow */}
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute rounded-full"
        style={{
          width: 160,
          height: 160,
          background: 'radial-gradient(circle, rgba(123,47,255,0.15) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      {/* Mid ring */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        className="absolute rounded-full"
        style={{
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(123,47,255,0.25) 0%, transparent 70%)',
          filter: 'blur(10px)',
        }}
      />
      {/* Core */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 30px rgba(26,111,255,0.6), 0 0 60px rgba(26,111,255,0.2)',
            '0 0 40px rgba(123,47,255,0.7), 0 0 80px rgba(123,47,255,0.25)',
            '0 0 30px rgba(26,111,255,0.6), 0 0 60px rgba(26,111,255,0.2)',
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-full"
        style={{
          width: 72,
          height: 72,
          background: 'radial-gradient(circle, #3a8fff 0%, #1a6fff 50%, #7b2fff 100%)',
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)' }}
        />
      </motion.div>
    </motion.div>
  )
}

function TypewriterTitle() {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const delay = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        i++
        setDisplayed(TITLE.slice(0, i))
        if (i >= TITLE.length) {
          clearInterval(interval)
          setDone(true)
        }
      }, 80)
      return () => clearInterval(interval)
    }, 1000)
    return () => clearTimeout(delay)
  }, [])

  return (
    <h1
      className="font-bold text-white tracking-[0.2em]"
      style={{ fontSize: 72, lineHeight: 1 }}
    >
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-1 h-16 bg-[#1a6fff] ml-1 align-middle"
        />
      )}
    </h1>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [dotGridVisible, setDotGridVisible] = useState(false)
  const [particlesVisible, setParticlesVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setDotGridVisible(true), 300)
    const t2 = setTimeout(() => setParticlesVisible(true), 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: '#0a0a0f' }}
    >
      {/* Dot grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: dotGridVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 vigil-dot-grid pointer-events-none"
      />

      {/* Particles */}
      {particlesVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
        >
          <ParticleField count={50} />
        </motion.div>
      )}

      {/* Nebula */}
      <NebulaBg />

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        className="pointer-events-none"
      >
        <div
          style={{
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #1a6fff 0%, #7b2fff 50%, transparent 70%)',
            filter: 'blur(60px)',
            opacity: 0.6,
          }}
          className="vigil-orb-breathe"
        />
      </div>

      {/* Top Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.4 }}
        className="relative z-10 flex items-center justify-between px-8 pt-7"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-4 h-4 rounded-full"
            style={{ background: 'radial-gradient(circle, #1a6fff, #7b2fff)', boxShadow: '0 0 8px rgba(26,111,255,0.5)' }}
          />
          <span className="text-white font-bold text-sm tracking-[0.25em]">VIGIL</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/login')}
            className="vigil-btn-ghost text-sm px-5 py-2 font-medium transition-all"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="vigil-btn text-sm px-5 py-2"
          >
            Get Started
          </button>
        </div>
      </motion.nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 px-8" style={{ paddingBottom: '8vh' }}>
        <HeroOrb />

        <div className="mt-10 mb-4">
          <TypewriterTitle />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="text-[#a0a0b0] text-lg font-medium tracking-wide mb-10"
        >
          See everything. Miss nothing.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, type: 'spring', stiffness: 300, damping: 28 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.push('/signup')}
            className="vigil-btn px-8 py-3.5 text-base font-semibold"
          >
            Get Started
          </button>
          <button
            onClick={() => router.push('/login')}
            className="vigil-btn-ghost px-8 py-3.5 text-base font-medium text-[#a0a0b0]"
          >
            Sign In
          </button>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.5 }}
          className="flex items-center gap-3 mt-14 flex-wrap justify-center"
        >
          {['Document Library', 'Live Streaming', 'Unified Chat', 'AI Analysis', 'Real-time Alerts'].map((feat, i) => (
            <motion.div
              key={feat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2 + i * 0.08 }}
              className="vigil-pill border text-[#a0a0b0]"
              style={{ borderColor: 'rgba(100,100,200,0.2)', background: 'rgba(15,15,26,0.6)' }}
            >
              {feat}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(transparent, rgba(10,10,15,0.8))' }}
      />
    </div>
  )
}
