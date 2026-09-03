export interface Candidate {
  source_url: string
  candidate_image_url: string
  source_domain: string
  title?: string
  similarity_score: number | null
  comparison_status: string
  rank?: number | null
  thumbnail_base64?: string
}

export interface DiagnosticsStage {
  success: boolean
  message: string
  details?: Record<string, unknown>
}

export interface PipelineDiagnostics {
  face_detection: DiagnosticsStage
  face_embedding: DiagnosticsStage
  image_submission: DiagnosticsStage
  search_provider: DiagnosticsStage
  candidate_downloads: Array<{ url: string; success: boolean; message: string }>
  face_comparisons: Array<{
    url: string
    success: boolean
    similarity_score: number | null
    message: string
  }>
  blockchain?: DiagnosticsStage
}

export interface PipelineSummary {
  candidates_found: number
  candidates_analyzed: number
  visual_matches: number
  best_similarity: number | null
  blockchain_recorded: boolean
  verification_status: string
}

export interface PipelineResponse {
  run_id: string
  status: string
  message: string
  face_analysis?: {
    face_detected: boolean
    face_count: number
    model_used: string
    embedding_generated: boolean
    input_fingerprint: string
  }
  search?: {
    provider: string
    status: string
    result_count: number
    api_status: number | null
    message: string
    candidates: Candidate[]
  }
  best_match?: Candidate
  blockchain?: {
    record_id: string
    data_hash: string
    block_index: number
    block_hash: string
    previous_hash: string
    timestamp: string
    metadata: Record<string, unknown>
    status: string
  }
  summary?: PipelineSummary
  diagnostics: PipelineDiagnostics
  threshold?: number
}

export interface FaceAnalysisResponse {
  face_detected: boolean
  face_count: number
  model_used: string
  embedding_generated: boolean
  input_fingerprint: string
  diagnostics: PipelineDiagnostics
}

export interface SearchResponse {
  provider: string
  status: string
  result_count: number
  api_status: number | null
  message: string
  candidates: Candidate[]
  diagnostics: PipelineDiagnostics
}

export interface RunSummary {
  run_id: string
  timestamp: string
  search_status: string | null
  similarity_score: number | null
  block_id: number | null
  verification_status: string | null
  selected_candidate: string | null
}

export interface RunDetail extends RunSummary {
  input_fingerprint: string | null
  face_detected: boolean
  diagnostics: PipelineDiagnostics | null
  candidates: Candidate[]
  blockchain_record: {
    record_id: string
    data_hash: string
    block_index: number
    block_hash: string
    metadata: Record<string, unknown>
  } | null
}

export interface RecordSummary {
  record_id: string
  source_url: string
  source_domain: string
  data_hash: string
  block_index: number
  created_at: string
  verification_status: string
}

export interface RecordDetail extends RecordSummary {
  run_id: string | null
  block_hash: string
  previous_hash: string
  timestamp: string
  metadata: Record<string, unknown>
}

export interface VerificationResult {
  verified: boolean
  status: string
  message: string
  stored_hash: string
  calculated_hash: string
  chain_valid: boolean
}

export type StepStatus = 'not_started' | 'processing' | 'completed' | 'failed' | 'waiting'

export interface PipelineStep {
  id: number
  label: string
  status: StepStatus
}

export type InputMode = 'upload' | 'url'
