'use client'

import AppShell from '@/components/vigil/app-shell'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, GitCompare, Loader2, Scale, Send, XCircle } from 'lucide-react'
import { useState } from 'react'

const BENCHMARK_BASE_URLS = [
  process.env.NEXT_PUBLIC_BENCHMARK_API_URL,
  process.env.NEXT_PUBLIC_API_URL,
  'http://localhost:8080',
].filter(Boolean).map((url) => String(url).replace(/\/$/, ''))
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN ?? 'dev-demo-token'

interface PipelineResult {
  answer: string
  tokens: number
  latency_ms: number
  cost_usd: number
  sources?: string[]
  pipeline: string
}

interface BenchmarkResponse {
  question: string
  pipeline_1: PipelineResult
  pipeline_2: PipelineResult
  pipeline_3: PipelineResult
}

interface PipelineEvaluation {
  bertscore_f1: number
  llm_judge: 'PASS' | 'FAIL'
}

interface EvaluationResponse {
  pipeline_1: PipelineEvaluation
  pipeline_2: PipelineEvaluation
  pipeline_3: PipelineEvaluation
}

const PIPELINE_ACCENTS = {
  pipeline_1: '#1a6fff',
  pipeline_2: '#7b2fff',
  pipeline_3: '#00c875',
} as const

function formatCost(value: number) {
  if (value === 0) return '$0.00000000'
  return `$${value.toFixed(8)}`
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(100,100,200,0.06)', border: '1px solid rgba(100,100,200,0.1)' }}>
      <p className="vigil-label mb-1">{label}</p>
      <p className="text-white text-sm font-semibold">{value}</p>
    </div>
  )
}

function PipelineCard({
  result,
  accent,
  evaluation,
}: {
  result: PipelineResult
  accent: string
  evaluation?: PipelineEvaluation
}) {
  const passed = evaluation?.llm_judge === 'PASS'

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="vigil-card min-h-[560px] flex flex-col overflow-hidden"
    >
      <div className="p-5 border-b" style={{ borderColor: 'rgba(100,100,200,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}>
            <GitCompare size={16} style={{ color: accent }} />
          </div>
          <div>
            <p className="text-white text-base font-bold">{result.pipeline}</p>
            <p className="vigil-label">Health benchmark</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-5">
        <Metric label="Tokens" value={String(result.tokens ?? 0)} />
        <Metric label="Latency" value={`${result.latency_ms ?? 0} ms`} />
        <Metric label="Cost" value={formatCost(result.cost_usd ?? 0)} />
      </div>

      {evaluation && (
        <div className="grid grid-cols-2 gap-2 px-5 pb-5">
          <div className="rounded-lg px-3 py-2" style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}>
            <p className="vigil-label mb-1">BERTScore F1</p>
            <p className="text-white text-sm font-semibold">{evaluation.bertscore_f1.toFixed(4)}</p>
          </div>
          <div
            className="rounded-lg px-3 py-2 flex items-center gap-2"
            style={{
              background: passed ? 'rgba(0,200,117,0.1)' : 'rgba(255,43,43,0.1)',
              border: passed ? '1px solid rgba(0,200,117,0.35)' : '1px solid rgba(255,43,43,0.35)',
            }}
          >
            {passed ? <CheckCircle2 size={16} className="text-[#00c875]" /> : <XCircle size={16} className="text-[#ff6b6b]" />}
            <div>
              <p className="vigil-label mb-1">Judge</p>
              <p className="text-white text-sm font-semibold">{evaluation.llm_judge}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pb-5 flex-1 min-h-0">
        <div className="h-full rounded-xl p-4 overflow-y-auto" style={{ background: 'rgba(4,4,12,0.55)', border: `1px solid ${accent}26` }}>
          <p className="text-[#d8d8e8] text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
        </div>
      </div>

      {result.sources && result.sources.length > 0 && (
        <div className="px-5 pb-5">
          <p className="vigil-label mb-2">Sources</p>
          <div className="flex flex-wrap gap-1.5">
            {result.sources.slice(0, 5).map((source, index) => (
              <span
                key={`${source}-${index}`}
                className="vigil-pill"
                style={{ background: `${accent}12`, color: '#a0a0b0', border: `1px solid ${accent}30`, fontSize: 10 }}
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default function BenchmarkPage() {
  const [question, setQuestion] = useState('Which districts in Telangana have the highest maternal mortality rate?')
  const [referenceAnswer, setReferenceAnswer] = useState('')
  const [result, setResult] = useState<BenchmarkResponse | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const postBenchmark = async <T,>(path: string, body: Record<string, string>): Promise<T> => {
    let data: T | null = null
    let lastError = ''

    for (const baseUrl of BENCHMARK_BASE_URLS) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const responseBody = await response.text()
          lastError = responseBody || response.statusText
          continue
        }

        data = await response.json() as T
        break
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Request failed.'
      }
    }

    if (!data) throw new Error(lastError || 'Request failed.')
    return data
  }

  const runBenchmark = async () => {
    const text = question.trim()
    if (!text || loading) return

    setLoading(true)
    setError(null)
    setEvaluation(null)

    try {
      const data = await postBenchmark<BenchmarkResponse>('/api/benchmark/compare', { question: text })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed.')
    } finally {
      setLoading(false)
    }
  }

  const runEvaluation = async () => {
    if (!result || !referenceAnswer.trim() || evaluating) return

    setEvaluating(true)
    setError(null)

    try {
      const data = await postBenchmark<EvaluationResponse>('/api/benchmark/evaluate', {
        question: result.question,
        reference_answer: referenceAnswer.trim(),
        pipeline_1_answer: result.pipeline_1.answer,
        pipeline_2_answer: result.pipeline_2.answer,
        pipeline_3_answer: result.pipeline_3.answer,
      })
      setEvaluation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed.')
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-32px)] p-4 flex flex-col gap-4">
        <div className="vigil-card p-5">
          <div className="flex flex-col gap-4">
            <div>
              <p className="vigil-label mb-2">Benchmark</p>
              <h1 className="text-white text-2xl font-bold">Three-pipeline comparison</h1>
            </div>

            <div className="flex gap-3">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') runBenchmark()
                }}
                className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(4,4,12,0.7)', border: '1px solid rgba(123,47,255,0.28)' }}
                placeholder="Ask a health data question"
              />
              <button
                onClick={runBenchmark}
                disabled={loading || !question.trim()}
                className="rounded-xl px-4 py-3 flex items-center gap-2 text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1a6fff, #7b2fff)' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Run
              </button>
            </div>

            {result && (
              <div className="flex flex-col gap-3">
                <textarea
                  value={referenceAnswer}
                  onChange={(event) => setReferenceAnswer(event.target.value)}
                  className="min-h-[96px] resize-none rounded-xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: 'rgba(4,4,12,0.7)', border: '1px solid rgba(123,47,255,0.28)' }}
                  placeholder="Paste the reference answer for BERTScore and LLM-as-Judge evaluation"
                />
                <div>
                  <button
                    onClick={runEvaluation}
                    disabled={evaluating || !referenceAnswer.trim()}
                    className="rounded-xl px-4 py-3 flex items-center gap-2 text-white text-sm font-semibold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #7b2fff, #00c875)' }}
                  >
                    {evaluating ? <Loader2 size={16} className="animate-spin" /> : <Scale size={16} />}
                    Evaluate
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,43,43,0.08)', border: '1px solid rgba(255,43,43,0.2)' }}>
                <AlertCircle size={16} className="text-[#ff6b6b] mt-0.5" />
                <p className="text-[#ff8a8a] text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {result ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <PipelineCard result={result.pipeline_1} evaluation={evaluation?.pipeline_1} accent={PIPELINE_ACCENTS.pipeline_1} />
            <PipelineCard result={result.pipeline_2} evaluation={evaluation?.pipeline_2} accent={PIPELINE_ACCENTS.pipeline_2} />
            <PipelineCard result={result.pipeline_3} evaluation={evaluation?.pipeline_3} accent={PIPELINE_ACCENTS.pipeline_3} />
          </div>
        ) : (
          <div className="vigil-card min-h-[520px] flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(123,47,255,0.14)', border: '1px solid rgba(123,47,255,0.35)' }}>
                <GitCompare size={20} className="text-[#7b2fff]" />
              </div>
              <p className="text-white font-semibold">Ready to compare</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
