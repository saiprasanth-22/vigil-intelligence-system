const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

const AUTH_TOKEN =
  process.env.NEXT_PUBLIC_AUTH_TOKEN ?? 'dev-demo-token'

const authHeaders = (): HeadersInit => ({
  Authorization: `Bearer ${AUTH_TOKEN}`,
})

// ── Shared record types ────────────────────────────────────────────────────

export interface FileRecord {
  id: string
  user_id: string
  name: string
  content_type: string
  size: number
  status: 'ready' | 'processing'
  chunk_count: number
  storage_path: string
  created_at: string
  updated_at: string
}

export interface LiveEventRecord {
  id: string
  user_id: string
  metric: string
  value: number
  source: string
  timestamp: string | null
  metadata: Record<string, unknown>
  is_anomaly: boolean
  anomaly_reason: string | null
  created_at: string
}

export interface ChatSource {
  type: 'file' | 'live_event'
  file_id?: string
  chunk_id?: string
  file_name?: string
  chunk_index?: number
  score?: number
  event_id?: string
  metric?: string
  value?: number
  is_anomaly?: boolean
}

// ── Endpoint-specific response types ──────────────────────────────────────

export interface HealthResponse {
  status: string
  service: string
  environment: string
}

export interface UploadFileResponse {
  file: FileRecord
}

export interface QueryChatResponse {
  answer: string
  sources: ChatSource[]
  latency_ms: number
  mode: string
}

export interface AdminOverviewResponse {
  files_uploaded: number
  chunks_indexed: number
  live_events: number
  anomalies: number
  queries: number
  active_websockets: number
  latest_file: FileRecord | null
  latest_event: LiveEventRecord | null
}

export interface GraphNode {
  id: string
  label: string
  type: string
  size: number
  status: string
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
}

export interface VisualizerGraphResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// ── Error handling ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`API ${status}: ${detail}`)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body?.detail ?? JSON.stringify(body)
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

// ── API functions ──────────────────────────────────────────────────────────

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`, { headers: authHeaders() })
  return handleResponse<HealthResponse>(res)
}

export async function uploadFile(file: File): Promise<UploadFileResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  return handleResponse<UploadFileResponse>(res)
}

export async function queryChat(
  query: string,
  mode: string,
): Promise<QueryChatResponse> {
  const res = await fetch(`${BASE_URL}/api/chat/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message: query, mode }),
  })
  return handleResponse<QueryChatResponse>(res)
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const res = await fetch(`${BASE_URL}/api/admin/overview`, { headers: authHeaders() })
  return handleResponse<AdminOverviewResponse>(res)
}

export async function getVisualizerGraph(): Promise<VisualizerGraphResponse> {
  const res = await fetch(`${BASE_URL}/api/visualizer/document-graph`, { headers: authHeaders() })
  return handleResponse<VisualizerGraphResponse>(res)
}
