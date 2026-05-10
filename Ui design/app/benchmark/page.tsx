'use client'

import AppShell from '@/components/vigil/app-shell'
import { AlertCircle, GitCompare, Loader2, Scale, Send } from 'lucide-react'
import { useMemo, useState } from 'react'

const API_URL = (process.env.NEXT_PUBLIC_BENCHMARK_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN ?? 'dev-demo-token'
const MAX_SOURCES = 5

type PipelineKey = 'pipeline_1' | 'pipeline_2' | 'pipeline_3'

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

interface PipelineView {
  key: PipelineKey
  name: string
  tag: string
  accent: 'neutral' | 'blue' | 'purple'
  color: string
  result: PipelineResult
  evaluation?: PipelineEvaluation
}

interface RecentRun {
  id: string
  question: string
  timestamp: string
  winner: string
}

interface ScorePoint {
  pipeline_1: number | null
  pipeline_2: number | null
  pipeline_3: number | null
}

interface MetricRow {
  key: 'accuracy' | 'citation' | 'latency' | 'hallucination' | 'throughput'
  label: string
  values: Record<PipelineKey, number | null>
  display: Record<PipelineKey, string>
  higherBetter: boolean
}

const PIPELINE_META: Record<PipelineKey, Omit<PipelineView, 'result' | 'evaluation' | 'key'>> = {
  pipeline_1: {
    name: 'LLM-Only',
    tag: 'baseline',
    accent: 'neutral',
    color: '#9090a8',
  },
  pipeline_2: {
    name: 'Vector RAG',
    tag: 'retrieval',
    accent: 'blue',
    color: '#1a6fff',
  },
  pipeline_3: {
    name: 'GraphRAG',
    tag: 'graph',
    accent: 'purple',
    color: '#7b2fff',
  },
}

const PIPELINE_KEYS: PipelineKey[] = ['pipeline_1', 'pipeline_2', 'pipeline_3']

function accentVars(accent: PipelineView['accent']) {
  if (accent === 'purple') {
    return {
      ring: 'rgba(123,47,255,0.45)',
      glow: 'rgba(123,47,255,0.22)',
      text: '#c8b8ff',
      bar: '#7b2fff',
      rgb: '123,47,255',
      column: 'col-purple',
    }
  }

  if (accent === 'blue') {
    return {
      ring: 'rgba(26,111,255,0.45)',
      glow: 'rgba(26,111,255,0.22)',
      text: '#a8c4ff',
      bar: '#1a6fff',
      rgb: '26,111,255',
      column: 'col-blue',
    }
  }

  return {
    ring: 'rgba(255,255,255,0.18)',
    glow: 'rgba(255,255,255,0.06)',
    text: '#cfcfd8',
    bar: '#6b6b8a',
    rgb: '255,255,255',
    column: 'col-neutral',
  }
}

function formatCost(value: number) {
  if (!value) return '$0.00000000'
  return `$${value.toFixed(8)}`
}

function formatPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return '--'
  return `${value.toFixed(digits)}%`
}

function formatNumber(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) return '--'
  return value.toFixed(digits)
}

function getAccuracy(evaluation?: PipelineEvaluation) {
  return evaluation ? evaluation.bertscore_f1 * 100 : null
}

function getCitationPrecision(result: PipelineResult) {
  const count = result.sources?.length ?? 0
  return Math.min(100, (count / MAX_SOURCES) * 100)
}

function getHallucinationRate(evaluation?: PipelineEvaluation) {
  if (!evaluation) return null
  return evaluation.llm_judge === 'FAIL' ? 75 : 5
}

function getThroughput(result: PipelineResult) {
  if (!result.latency_ms) return null
  return 1000 / result.latency_ms
}

function getWinner(rows: MetricRow[], key: MetricRow['key']) {
  const row = rows.find((item) => item.key === key)
  if (!row) return null

  const values = PIPELINE_KEYS
    .map((pipeline) => ({ pipeline, value: row.values[pipeline] }))
    .filter((item): item is { pipeline: PipelineKey; value: number } => item.value !== null && Number.isFinite(item.value))

  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => (row.higherBetter ? b.value - a.value : a.value - b.value))
  return sorted[0]?.pipeline ?? null
}

function makeRunId() {
  return `run_${Math.random().toString(16).slice(2, 7)}`
}

function buildPipelineViews(result: BenchmarkResponse | null, evaluation: EvaluationResponse | null): PipelineView[] {
  if (!result) return []

  return PIPELINE_KEYS.map((key) => ({
    key,
    ...PIPELINE_META[key],
    result: result[key],
    evaluation: evaluation?.[key],
  }))
}

function buildMetricRows(result: BenchmarkResponse | null, evaluation: EvaluationResponse | null): MetricRow[] {
  if (!result) return []

  return [
    {
      key: 'accuracy',
      label: 'Answer Accuracy',
      higherBetter: true,
      values: {
        pipeline_1: getAccuracy(evaluation?.pipeline_1),
        pipeline_2: getAccuracy(evaluation?.pipeline_2),
        pipeline_3: getAccuracy(evaluation?.pipeline_3),
      },
      display: {
        pipeline_1: formatPercent(getAccuracy(evaluation?.pipeline_1), 1),
        pipeline_2: formatPercent(getAccuracy(evaluation?.pipeline_2), 1),
        pipeline_3: formatPercent(getAccuracy(evaluation?.pipeline_3), 1),
      },
    },
    {
      key: 'citation',
      label: 'Citation Precision',
      higherBetter: true,
      values: {
        pipeline_1: getCitationPrecision(result.pipeline_1),
        pipeline_2: getCitationPrecision(result.pipeline_2),
        pipeline_3: getCitationPrecision(result.pipeline_3),
      },
      display: {
        pipeline_1: formatPercent(getCitationPrecision(result.pipeline_1), 0),
        pipeline_2: formatPercent(getCitationPrecision(result.pipeline_2), 0),
        pipeline_3: formatPercent(getCitationPrecision(result.pipeline_3), 0),
      },
    },
    {
      key: 'latency',
      label: 'Latency',
      higherBetter: false,
      values: {
        pipeline_1: result.pipeline_1.latency_ms,
        pipeline_2: result.pipeline_2.latency_ms,
        pipeline_3: result.pipeline_3.latency_ms,
      },
      display: {
        pipeline_1: `${result.pipeline_1.latency_ms} ms`,
        pipeline_2: `${result.pipeline_2.latency_ms} ms`,
        pipeline_3: `${result.pipeline_3.latency_ms} ms`,
      },
    },
    {
      key: 'hallucination',
      label: 'Hallucination Rate',
      higherBetter: false,
      values: {
        pipeline_1: getHallucinationRate(evaluation?.pipeline_1),
        pipeline_2: getHallucinationRate(evaluation?.pipeline_2),
        pipeline_3: getHallucinationRate(evaluation?.pipeline_3),
      },
      display: {
        pipeline_1: formatPercent(getHallucinationRate(evaluation?.pipeline_1), 0),
        pipeline_2: formatPercent(getHallucinationRate(evaluation?.pipeline_2), 0),
        pipeline_3: formatPercent(getHallucinationRate(evaluation?.pipeline_3), 0),
      },
    },
    {
      key: 'throughput',
      label: 'Throughput',
      higherBetter: true,
      values: {
        pipeline_1: getThroughput(result.pipeline_1),
        pipeline_2: getThroughput(result.pipeline_2),
        pipeline_3: getThroughput(result.pipeline_3),
      },
      display: {
        pipeline_1: `${formatNumber(getThroughput(result.pipeline_1), 2)} qps`,
        pipeline_2: `${formatNumber(getThroughput(result.pipeline_2), 2)} qps`,
        pipeline_3: `${formatNumber(getThroughput(result.pipeline_3), 2)} qps`,
      },
    },
  ]
}

function getPipelineWinner(evaluation: EvaluationResponse | null, result: BenchmarkResponse | null) {
  if (evaluation) {
    const ranked = PIPELINE_KEYS
      .map((key) => ({ key, score: evaluation[key].bertscore_f1 }))
      .sort((a, b) => b.score - a.score)
    return PIPELINE_META[ranked[0].key].name
  }

  if (result) {
    const ranked = PIPELINE_KEYS
      .map((key) => ({ key, latency: result[key].latency_ms || Number.MAX_SAFE_INTEGER }))
      .sort((a, b) => a.latency - b.latency)
    return `${PIPELINE_META[ranked[0].key].name} pending`
  }

  return '--'
}

async function postBenchmark<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }

  return response.json() as Promise<T>
}

function Chip({ children, kind = '' }: { children: React.ReactNode; kind?: string }) {
  return (
    <span className={`chip ${kind} text-[10px] tracking-wider uppercase px-2 py-[3px] rounded-[4px]`}>
      {children}
    </span>
  )
}

function Bar({ pct, accent }: { pct: number; accent: PipelineView['accent'] }) {
  const v = accentVars(accent)
  return (
    <div className="h-[6px] w-full rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(3, Math.min(100, pct))}%`,
          background: `linear-gradient(90deg, ${v.bar} 0%, ${accent === 'blue' ? '#7b2fff' : '#1a6fff'} 100%)`,
          boxShadow: `0 0 12px ${v.glow}`,
        }}
      />
    </div>
  )
}

function PipelineColumn({ pipeline }: { pipeline: PipelineView }) {
  const vars = accentVars(pipeline.accent)
  const accuracy = getAccuracy(pipeline.evaluation)
  const hallucination = getHallucinationRate(pipeline.evaluation)
  const throughput = getThroughput(pipeline.result)

  return (
    <div className={`card rounded-2xl ${vars.column} flex flex-col min-h-[620px]`} data-model-column={pipeline.key}>
      <div className="px-5 pt-5 pb-4 border-b border-[rgba(123,47,255,0.12)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: vars.bar, boxShadow: `0 0 10px ${vars.bar}` }} />
          <span className="font-display text-[18px] font-semibold tracking-tight">{pipeline.name}</span>
          <span className="ml-auto chip text-[9px] px-1.5 py-0.5" style={{ color: vars.text, borderColor: vars.ring }}>
            {pipeline.tag}
          </span>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <div
            className={`font-mono leading-none text-[58px] ${pipeline.accent === 'purple' ? 'metric-glow' : pipeline.accent === 'blue' ? 'metric-glow-blue' : ''}`}
            style={{ color: pipeline.accent === 'neutral' ? '#cfcfd8' : 'white' }}
          >
            {accuracy === null ? '--' : accuracy.toFixed(1)}
          </div>
          <div className="pb-2">
            <div className="font-mono text-[10px] tracking-widest text-[#4a4a6a]">ACCURACY</div>
            <div className="font-mono text-[12px] text-[#a0a0b0]">{pipeline.evaluation ? pipeline.evaluation.llm_judge : 'awaiting judge'}</div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-[rgba(123,47,255,0.12)]">
        <div className="min-h-[220px] max-h-[320px] rounded-xl p-4 overflow-y-auto bg-[rgba(4,4,12,0.55)] border border-[rgba(123,47,255,0.16)]">
          <div className="font-mono text-[10px] tracking-widest text-[#4a4a6a] mb-2">ANSWER</div>
          <p className="text-[#d8d8e8] text-sm leading-relaxed whitespace-pre-wrap">{pipeline.result.answer || 'No answer returned.'}</p>
        </div>
      </div>

      <div className="divide-y divide-[rgba(123,47,255,0.08)]">
        <MetricStrip label="Tokens" value={pipeline.result.tokens.toLocaleString()} hint="Groq usage or estimate" pct={Math.min(100, pipeline.result.tokens / 25)} accent={pipeline.accent} />
        <MetricStrip label="Latency" value={`${pipeline.result.latency_ms} ms`} hint="End-to-end request time" pct={Math.max(5, 100 - pipeline.result.latency_ms / 40)} accent={pipeline.accent} />
        <MetricStrip label="Cost" value={formatCost(pipeline.result.cost_usd)} hint="At $0.05 per 1M tokens" pct={Math.min(100, pipeline.result.cost_usd * 1000000)} accent={pipeline.accent} />
        <MetricStrip label="Citation precision" value={formatPercent(getCitationPrecision(pipeline.result), 0)} hint={`${pipeline.result.sources?.length ?? 0} of ${MAX_SOURCES} max sources`} pct={getCitationPrecision(pipeline.result)} accent={pipeline.accent} />
        <MetricStrip label="Hallucination rate" value={formatPercent(hallucination, 0)} hint="Judge-derived estimate" pct={hallucination ?? 0} accent={pipeline.accent} />
        <MetricStrip label="Throughput" value={`${formatNumber(throughput, 2)} qps`} hint="1000 divided by latency" pct={Math.min(100, (throughput ?? 0) * 40)} accent={pipeline.accent} />
      </div>

      {(pipeline.result.sources?.length ?? 0) > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {pipeline.result.sources?.slice(0, MAX_SOURCES).map((source, index) => (
              <span
                key={`${source}-${index}`}
                className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px]"
                style={{ background: `rgba(${vars.rgb},0.08)`, border: `1px solid ${vars.ring}`, color: vars.text }}
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricStrip({
  label,
  value,
  hint,
  pct,
  accent,
}: {
  label: string
  value: string
  hint: string
  pct: number
  accent: PipelineView['accent']
}) {
  return (
    <div className="px-5 py-3.5 row-hover">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[12px] text-[#a0a0b0]">{label}</div>
          <div className="font-mono text-[10px] text-[#4a4a6a] mt-0.5">{hint}</div>
        </div>
        <div className="font-mono text-[18px] text-white tabular-nums">{value}</div>
      </div>
      <div className="mt-2.5">
        <Bar pct={pct} accent={accent} />
      </div>
    </div>
  )
}

function KpiRail({
  result,
  evaluation,
  runId,
}: {
  result: BenchmarkResponse | null
  evaluation: EvaluationResponse | null
  runId: string
}) {
  const winner = getPipelineWinner(evaluation, result)
  const totalTokens = result ? PIPELINE_KEYS.reduce((sum, key) => sum + (result[key].tokens ?? 0), 0) : 0
  const avgLatency = result ? Math.round(PIPELINE_KEYS.reduce((sum, key) => sum + (result[key].latency_ms ?? 0), 0) / PIPELINE_KEYS.length) : 0
  const totalCost = result ? PIPELINE_KEYS.reduce((sum, key) => sum + (result[key].cost_usd ?? 0), 0) : 0

  const kpis = [
    { label: 'Run ID', value: runId || '--', sub: result ? 'latest request' : 'not started' },
    { label: 'Question', value: result ? '1' : '0', sub: 'live benchmark query' },
    { label: 'Avg latency', value: result ? `${avgLatency} ms` : '--', sub: 'three-pipeline mean' },
    { label: 'Total tokens', value: result ? totalTokens.toLocaleString() : '--', sub: `${formatCost(totalCost)} blended` },
    { label: 'Leader', value: winner, sub: evaluation ? 'by BERTScore F1' : 'pending evaluation' },
  ]

  return (
    <div className="pb-5">
      <div className="card rounded-xl p-1 grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[rgba(123,47,255,0.10)]">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="px-5 py-4">
            <div className="font-mono text-[10px] tracking-widest text-[#4a4a6a]">{kpi.label.toUpperCase()}</div>
            <div className="mt-1.5 font-mono text-[20px] text-white metric-glow truncate">{kpi.value}</div>
            <div className="mt-1 text-[11px] text-[#a0a0b0] font-mono truncate">{kpi.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricsComparisonTable({ rows }: { rows: MetricRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgba(123,47,255,0.12)]">
        <div className="font-display text-[15px] font-semibold">Metrics comparison</div>
        <div className="font-mono text-[11px] text-[#a0a0b0]">real API response mapped into evaluation columns</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <thead>
            <tr className="font-mono text-[10px] tracking-widest text-[#4a4a6a] border-b border-[rgba(123,47,255,0.10)]">
              <th className="text-left px-5 py-3">PIPELINE</th>
              {rows.map((row) => (
                <th key={row.key} className="text-left px-4 py-3">{row.label.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PIPELINE_KEYS.map((pipeline) => {
              const meta = PIPELINE_META[pipeline]
              const vars = accentVars(meta.accent)
              return (
                <tr key={pipeline} className="row-hover border-b border-[rgba(123,47,255,0.08)] last:border-b-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: vars.bar, boxShadow: `0 0 10px ${vars.bar}` }} />
                      <span className="font-mono text-[12px] text-white">{meta.name}</span>
                    </div>
                  </td>
                  {rows.map((row) => {
                    const winning = getWinner(rows, row.key) === pipeline
                    return (
                      <td key={row.key} className="px-4 py-4">
                        <span
                          className="font-mono text-[12px] rounded-md px-2 py-1 border"
                          style={{
                            color: winning ? '#ffffff' : '#a0a0b0',
                            background: winning ? (row.key === 'latency' || row.key === 'throughput' ? 'rgba(47,227,160,0.12)' : 'rgba(123,47,255,0.16)') : 'rgba(255,255,255,0.03)',
                            borderColor: winning ? (row.key === 'latency' || row.key === 'throughput' ? 'rgba(47,227,160,0.35)' : 'rgba(123,47,255,0.42)') : 'rgba(123,47,255,0.10)',
                            boxShadow: winning ? '0 0 16px rgba(123,47,255,0.18)' : 'none',
                          }}
                        >
                          {row.display[pipeline]}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TrajectoryChart({ history }: { history: ScorePoint[] }) {
  const width = 760
  const height = 220
  const pad = 32
  const prepared = history.length > 0 ? history : []
  const allValues = prepared.flatMap((point) => PIPELINE_KEYS.map((key) => point[key]).filter((value): value is number => value !== null))
  const min = allValues.length ? Math.max(0, Math.min(...allValues) - 4) : 60
  const max = allValues.length ? Math.min(100, Math.max(...allValues) + 4) : 100
  const span = Math.max(1, max - min)

  const pathFor = (key: PipelineKey) => {
    const values = prepared.map((point) => point[key])
    if (values.length === 0) return ''
    return values
      .map((value, index) => {
        const safeValue = value ?? min
        const x = pad + (index / Math.max(1, values.length - 1)) * (width - pad * 1.4)
        const y = height - pad - ((safeValue - min) / span) * (height - pad * 1.8)
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }

  return (
    <div className="card rounded-2xl p-5 min-h-[330px]">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <div className="font-display text-[15px] font-semibold">Score trajectory</div>
          <div className="font-mono text-[11px] text-[#a0a0b0]">BERTScore F1 across last 10 evaluated runs</div>
        </div>
        <div className="flex items-center gap-3">
          {PIPELINE_KEYS.map((key) => {
            const meta = PIPELINE_META[key]
            return (
              <div key={key} className="flex items-center gap-1.5 font-mono text-[11px] text-[#a0a0b0]">
                <span className="w-2.5 h-[2px]" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                <span>{meta.name.toLowerCase()}</span>
              </div>
            )
          })}
        </div>
      </div>

      {prepared.length === 0 ? (
        <div className="h-[220px] grid place-items-center rounded-xl border border-[rgba(123,47,255,0.10)] bg-[rgba(4,4,12,0.32)]">
          <div className="text-center">
            <div className="font-mono text-[12px] text-[#a0a0b0]">run evaluation to plot scores</div>
          </div>
        </div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px]">
          {[60, 70, 80, 90, 100].map((tick) => {
            const y = height - pad - ((tick - min) / span) * (height - pad * 1.8)
            if (y < 10 || y > height - 10) return null
            return (
              <g key={tick}>
                <line x1={pad} x2={width - pad / 2} y1={y} y2={y} stroke="rgba(123,47,255,0.10)" strokeDasharray="2 4" />
                <text x={6} y={y + 3} fill="#4a4a6a" fontSize="10" fontFamily="JetBrains Mono">{tick}</text>
              </g>
            )
          })}
          {PIPELINE_KEYS.map((key) => {
            const meta = PIPELINE_META[key]
            const path = pathFor(key)
            return (
              <path
                key={key}
                d={path}
                fill="none"
                stroke={meta.color}
                strokeWidth={key === 'pipeline_1' ? 1.4 : 2}
                strokeDasharray={key === 'pipeline_1' ? '4 4' : '0'}
              />
            )
          })}
          {prepared.map((_, index) => {
            const x = pad + (index / Math.max(1, prepared.length - 1)) * (width - pad * 1.4)
            return <text key={index} x={x} y={height - 8} textAnchor="middle" fill="#4a4a6a" fontSize="10" fontFamily="JetBrains Mono">{index + 1}</text>
          })}
        </svg>
      )}
    </div>
  )
}

function RecentRunsTable({ runs }: { runs: RecentRun[] }) {
  return (
    <div className="card rounded-2xl min-h-[330px]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(123,47,255,0.12)]">
        <div>
          <div className="font-display text-[15px] font-semibold">Recent runs</div>
          <div className="font-mono text-[11px] text-[#a0a0b0]">last 5 questions asked</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost rounded-md px-3 py-1.5 text-[11px] font-mono" type="button">filter</button>
          <button className="btn-ghost rounded-md px-3 py-1.5 text-[11px] font-mono" type="button">export csv</button>
        </div>
      </div>

      <div className="divide-y divide-[rgba(123,47,255,0.08)]">
        <div className="grid grid-cols-[1fr_1fr_2fr_1fr] gap-3 px-5 py-2 font-mono text-[10px] tracking-widest text-[#4a4a6a]">
          <div>RUN</div>
          <div>WINNER</div>
          <div>QUESTION</div>
          <div>TIME</div>
        </div>
        {runs.length === 0 ? (
          <div className="px-5 py-16 text-center font-mono text-[12px] text-[#a0a0b0]">no runs yet</div>
        ) : (
          runs.map((run) => (
            <div key={run.id} className="grid grid-cols-[1fr_1fr_2fr_1fr] gap-3 px-5 py-3 row-hover items-center">
              <div className="font-mono text-[12px] text-white">{run.id}</div>
              <div><Chip kind={run.winner.includes('Graph') ? '' : run.winner.includes('Vector') ? 'chip-blue' : ''}>{run.winner}</Chip></div>
              <div className="font-mono text-[12px] text-[#a0a0b0] truncate">{run.question}</div>
              <div className="font-mono text-[12px] text-[#a0a0b0]">{run.timestamp}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function BenchmarkPage() {
  const [question, setQuestion] = useState('')
  const [referenceAnswer, setReferenceAnswer] = useState('')
  const [result, setResult] = useState<BenchmarkResponse | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null)
  const [scoreHistory, setScoreHistory] = useState<ScorePoint[]>([])
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([])
  const [currentRunId, setCurrentRunId] = useState('')
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pipelines = useMemo(() => buildPipelineViews(result, evaluation), [result, evaluation])
  const metricRows = useMemo(() => buildMetricRows(result, evaluation), [result, evaluation])

  const runBenchmark = async () => {
    const text = question.trim()
    if (!text || loading) return

    const runId = makeRunId()
    setCurrentRunId(runId)
    setLoading(true)
    setError(null)
    setEvaluation(null)

    try {
      const data = await postBenchmark<BenchmarkResponse>('/api/benchmark/compare', { question: text })
      setResult(data)
      setRecentRuns((runs) => [
        {
          id: runId,
          question: text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          winner: getPipelineWinner(null, data),
        },
        ...runs,
      ].slice(0, 5))
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
      setScoreHistory((history) => [
        ...history,
        {
          pipeline_1: data.pipeline_1.bertscore_f1 * 100,
          pipeline_2: data.pipeline_2.bertscore_f1 * 100,
          pipeline_3: data.pipeline_3.bertscore_f1 * 100,
        },
      ].slice(-10))

      const winner = getPipelineWinner(data, result)
      setRecentRuns((runs) => runs.map((run, index) => index === 0 ? { ...run, winner } : run))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed.')
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <AppShell>
      <div className="benchmark-scope min-h-[calc(100vh-32px)] px-4 py-4 lg:px-8 lg:py-7">
        <div className="flex items-end justify-between gap-6 flex-wrap pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[32px] font-semibold tracking-tight text-white">Benchmark</h1>
              <Chip kind="chip-blue">eval suite live</Chip>
            </div>
            <p className="text-[#a0a0b0] mt-1 max-w-2xl">
              Side-by-side performance for LLM-only, vector retrieval, and GraphRAG pipelines on the health data benchmark.
            </p>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <div className="min-w-[320px] flex-1">
              <div className="font-mono text-[10px] tracking-widest text-[#4a4a6a] mb-1.5">QUESTION</div>
              <input
                className="input w-full rounded-md px-3 py-2 text-[13px] font-mono placeholder-[#4a4a6a]"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') runBenchmark()
                }}
                placeholder="Ask a health data question"
              />
            </div>

            <button
              onClick={runBenchmark}
              disabled={loading || !question.trim()}
              className="btn-primary rounded-md px-5 py-2.5 text-[13px] font-display font-medium tracking-tight flex items-center gap-2 disabled:opacity-60"
              type="button"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {loading ? 'running...' : 'Run benchmark'}
            </button>
          </div>
        </div>

        <KpiRail result={result} evaluation={evaluation} runId={currentRunId} />

        {result && (
          <div className="card rounded-xl p-4 mb-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-[#4a4a6a] mb-1.5">REFERENCE ANSWER</div>
                <textarea
                  value={referenceAnswer}
                  onChange={(event) => setReferenceAnswer(event.target.value)}
                  className="input min-h-[92px] w-full resize-none rounded-md px-3 py-2 text-[13px] font-mono placeholder-[#4a4a6a]"
                  placeholder="Paste the reference answer for BERTScore and LLM-as-Judge evaluation"
                />
              </div>
              <button
                onClick={runEvaluation}
                disabled={evaluating || !referenceAnswer.trim()}
                className="btn-primary rounded-md px-5 py-2.5 text-[13px] font-display font-medium tracking-tight flex items-center justify-center gap-2 disabled:opacity-60"
                type="button"
              >
                {evaluating ? <Loader2 size={15} className="animate-spin" /> : <Scale size={15} />}
                {evaluating ? 'evaluating...' : 'Evaluate'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-xl px-3 py-2 bg-[rgba(255,95,126,0.08)] border border-[rgba(255,95,126,0.24)]">
            <AlertCircle size={16} className="text-[#ff5f7e] mt-0.5" />
            <p className="text-[#ffb1bf] text-sm">{error}</p>
          </div>
        )}

        {pipelines.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 pb-6">
            {pipelines.map((pipeline) => (
              <PipelineColumn key={pipeline.key} pipeline={pipeline} />
            ))}
          </div>
        ) : (
          <div className="card rounded-2xl min-h-[440px] grid place-items-center mb-6">
            <div className="text-center">
              <div
                className="mx-auto mb-4 h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(123,47,255,0.14)', border: '1px solid rgba(123,47,255,0.35)' }}
              >
                <GitCompare size={20} className="text-[#7b2fff]" />
              </div>
              <p className="text-white font-semibold">Ready to compare</p>
              <p className="font-mono text-[12px] text-[#a0a0b0] mt-1">Run a question to populate live benchmark results.</p>
            </div>
          </div>
        )}

        <div className="pb-6">
          <MetricsComparisonTable rows={metricRows} />
        </div>

        <div className="pb-10 grid grid-cols-1 2xl:grid-cols-[1.4fr_1fr] gap-5">
          <TrajectoryChart history={scoreHistory} />
          <RecentRunsTable runs={recentRuns} />
        </div>
      </div>

      <style jsx global>{`
        .benchmark-scope {
          color: #ffffff;
          font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
          background-image:
            radial-gradient(1100px 700px at 85% -10%, rgba(26, 111, 255, 0.08), transparent 60%),
            radial-gradient(900px 600px at -5% 10%, rgba(123, 47, 255, 0.10), transparent 60%),
            linear-gradient(180deg, rgba(10, 10, 15, 0.92) 0%, rgba(8, 7, 13, 0.94) 100%);
        }

        .benchmark-scope .font-mono {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-feature-settings: 'tnum' 1, 'ss01' 1;
        }

        .benchmark-scope .font-display {
          font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0;
        }

        .benchmark-scope .card {
          background: rgba(15, 10, 30, 0.8);
          border: 1px solid rgba(123, 47, 255, 0.2);
          box-shadow: 0 0 20px rgba(123, 47, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .benchmark-scope .btn-primary {
          background: linear-gradient(135deg, #1a6fff 0%, #7b2fff 100%);
          color: white;
          box-shadow: 0 0 24px rgba(123, 47, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18);
          transition: transform .12s ease, box-shadow .2s ease, filter .2s ease;
        }

        .benchmark-scope .btn-primary:hover {
          filter: brightness(1.06);
          box-shadow: 0 0 32px rgba(123, 47, 255, 0.5);
        }

        .benchmark-scope .btn-primary:active {
          transform: translateY(1px);
        }

        .benchmark-scope .btn-ghost {
          background: rgba(123, 47, 255, 0.06);
          border: 1px solid rgba(123, 47, 255, 0.18);
          color: #ffffff;
          transition: all .15s ease;
        }

        .benchmark-scope .btn-ghost:hover {
          background: rgba(123, 47, 255, 0.12);
          border-color: rgba(123, 47, 255, 0.32);
        }

        .benchmark-scope .input {
          background: rgba(10, 8, 20, 0.7);
          border: 1px solid rgba(123, 47, 255, 0.18);
          color: #ffffff;
          transition: border-color .15s ease, box-shadow .15s ease;
        }

        .benchmark-scope .input:focus {
          outline: none;
          border-color: #7b2fff;
          box-shadow: 0 0 0 3px rgba(123, 47, 255, 0.18);
        }

        .benchmark-scope .metric-glow {
          text-shadow: 0 0 24px rgba(123, 47, 255, 0.55), 0 0 2px rgba(255, 255, 255, 0.4);
        }

        .benchmark-scope .metric-glow-blue {
          text-shadow: 0 0 24px rgba(26, 111, 255, 0.55), 0 0 2px rgba(255, 255, 255, 0.4);
        }

        .benchmark-scope .chip {
          background: rgba(123, 47, 255, 0.08);
          border: 1px solid rgba(123, 47, 255, 0.22);
          color: #c8b8ff;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }

        .benchmark-scope .chip-blue {
          background: rgba(26, 111, 255, 0.10);
          border-color: rgba(26, 111, 255, 0.32);
          color: #a8c4ff;
        }

        .benchmark-scope .col-purple {
          box-shadow: 0 0 24px rgba(123, 47, 255, 0.18), inset 0 0 0 1px rgba(123, 47, 255, 0.28);
        }

        .benchmark-scope .col-blue {
          box-shadow: 0 0 24px rgba(26, 111, 255, 0.16), inset 0 0 0 1px rgba(26, 111, 255, 0.28);
        }

        .benchmark-scope .col-neutral {
          box-shadow: 0 0 18px rgba(123, 47, 255, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.06);
        }

        .benchmark-scope .row-hover:hover {
          background: rgba(123, 47, 255, 0.05);
        }
      `}</style>
    </AppShell>
  )
}
