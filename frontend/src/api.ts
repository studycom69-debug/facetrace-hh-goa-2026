import type {
  FaceAnalysisResponse,
  InputMode,
  PipelineResponse,
  RecordDetail,
  RecordSummary,
  RunDetail,
  RunSummary,
  SearchResponse,
  VerificationResult,
} from './types'

const API_BASE = '/api'

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({ detail: res.statusText }))
  if (typeof err.detail === 'string') return err.detail
  if (Array.isArray(err.detail)) return err.detail.map((d: { msg: string }) => d.msg).join(', ')
  return err.message || 'Request failed'
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(await parseError(res))
  }
  return res.json()
}

function buildInputForm(
  mode: InputMode,
  file: File | null,
  imageUrl: string,
): FormData {
  const form = new FormData()
  if (mode === 'upload' && file) {
    form.append('file', file)
  } else if (mode === 'url') {
    form.append('image_url', imageUrl.trim())
  }
  return form
}

export async function analyzeFace(
  mode: InputMode,
  file: File | null,
  imageUrl: string,
): Promise<FaceAnalysisResponse> {
  const form = buildInputForm(mode, file, imageUrl)
  return apiFetch(`${API_BASE}/analyze-face`, { method: 'POST', body: form })
}

export async function searchWeb(
  mode: InputMode,
  file: File | null,
  imageUrl: string,
): Promise<SearchResponse> {
  const form = buildInputForm(mode, file, imageUrl)
  return apiFetch(`${API_BASE}/search`, { method: 'POST', body: form })
}

export async function compareAndRecord(
  mode: InputMode,
  file: File | null,
  imageUrl: string,
  runId: string,
  search: SearchResponse,
  consent: boolean,
  threshold: number,
): Promise<PipelineResponse> {
  const form = buildInputForm(mode, file, imageUrl)
  form.append('run_id', runId)
  form.append('candidates_json', JSON.stringify(search.candidates))
  form.append(
    'search_json',
    JSON.stringify({
      provider: search.provider,
      status: search.status,
      result_count: search.result_count,
      api_status: search.api_status,
      message: search.message,
      submission_message:
        search.diagnostics?.image_submission?.message || 'Image submitted for search',
    }),
  )
  form.append('consent', String(consent))
  form.append('create_record', 'true')
  form.append('threshold', String(threshold))
  return apiFetch(`${API_BASE}/compare-and-record`, { method: 'POST', body: form })
}

export async function runPipelineSequential(
  mode: InputMode,
  file: File | null,
  imageUrl: string,
  consent: boolean,
  threshold: number,
  onStage?: (stage: 'analyze' | 'search' | 'compare') => void,
): Promise<PipelineResponse> {
  onStage?.('analyze')
  const face = await analyzeFace(mode, file, imageUrl)
  if (!face.face_detected) {
    throw new Error('No usable face detected in the submitted image.')
  }

  onStage?.('search')
  const search = await searchWeb(mode, file, imageUrl)
  if (search.status === 'failed') {
    return {
      run_id: crypto.randomUUID(),
      status: 'partial',
      message: search.message,
      face_analysis: {
        face_detected: face.face_detected,
        face_count: face.face_count,
        model_used: face.model_used,
        embedding_generated: face.embedding_generated,
        input_fingerprint: face.input_fingerprint,
      },
      search: {
        provider: search.provider,
        status: search.status,
        result_count: search.result_count,
        api_status: search.api_status,
        message: search.message,
        candidates: [],
      },
      summary: {
        candidates_found: search.result_count,
        candidates_analyzed: 0,
        visual_matches: 0,
        best_similarity: null,
        blockchain_recorded: false,
        verification_status: 'pending',
      },
      diagnostics: {
        ...search.diagnostics,
        face_detection: face.diagnostics.face_detection,
        face_embedding: face.diagnostics.face_embedding,
      },
      threshold,
    }
  }

  if (!search.candidates.length) {
    return {
      run_id: crypto.randomUUID(),
      status: 'partial',
      message: 'No publicly indexed visual matches were found.',
      face_analysis: {
        face_detected: face.face_detected,
        face_count: face.face_count,
        model_used: face.model_used,
        embedding_generated: face.embedding_generated,
        input_fingerprint: face.input_fingerprint,
      },
      search: {
        provider: search.provider,
        status: 'no_results',
        result_count: 0,
        api_status: search.api_status,
        message: search.message,
        candidates: [],
      },
      summary: {
        candidates_found: 0,
        candidates_analyzed: 0,
        visual_matches: 0,
        best_similarity: null,
        blockchain_recorded: false,
        verification_status: 'pending',
      },
      diagnostics: {
        ...search.diagnostics,
        face_detection: face.diagnostics.face_detection,
        face_embedding: face.diagnostics.face_embedding,
      },
      threshold,
    }
  }

  onStage?.('compare')
  const runId = crypto.randomUUID()
  return compareAndRecord(mode, file, imageUrl, runId, search, consent, threshold)
}

export async function verifyRecord(recordId: string): Promise<VerificationResult> {
  const form = new FormData()
  form.append('record_id', recordId)
  return apiFetch(`${API_BASE}/blockchain/verify`, { method: 'POST', body: form })
}

export async function getHistory(): Promise<RunSummary[]> {
  return apiFetch(`${API_BASE}/history`)
}

export async function getHistoryDetail(runId: string): Promise<RunDetail> {
  return apiFetch(`${API_BASE}/history/${runId}`)
}

export async function getRecords(): Promise<RecordSummary[]> {
  return apiFetch(`${API_BASE}/records`)
}

export async function getRecord(recordId: string): Promise<RecordDetail> {
  return apiFetch(`${API_BASE}/records/${recordId}`)
}

export async function healthCheck() {
  return apiFetch<{ status: string; search_configured: boolean; similarity_threshold: number }>(
    `${API_BASE}/health`,
  )
}
