import type { Candidate, PipelineDiagnostics, PipelineResponse, RunDetail } from '../types'
import { isSocialPlatform } from './socialPlatforms'

const NEWS_PRESS_KEYWORDS = [
  'news',
  'press',
  'archive',
  'reuters',
  'apnews',
  'journal',
  'media',
  'wire',
  'times',
  'post',
  'herald',
  'gazette',
]

export type CandidateFilter = 'all' | 'matches' | 'social' | 'news'

export interface ResultsViewModel {
  runId: string
  status: string
  threshold: number
  probePreview: string | null
  probeFileName: string
  probeFingerprint: string | null
  dimensions: { w: number; h: number } | null
  modelUsed: string | null
  candidatesFound: number
  candidatesAnalyzed: number
  visualMatches: number
  bestSimilarity: number | null
  blockchainRecorded: boolean
  verificationStatus: string
  bestMatch: Candidate | null
  candidates: Candidate[]
  blockchain: {
    record_id: string
    data_hash: string
    block_index: number
    block_hash: string
    previous_hash: string
    timestamp: string
  } | null
  diagnostics: PipelineDiagnostics | null
  executionSeconds: number | null
  finalized: boolean
}

export function isNewsPress(domain: string): boolean {
  const d = domain.toLowerCase()
  return NEWS_PRESS_KEYWORDS.some((k) => d.includes(k))
}

export function pathFromUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url
  }
}

export function truncateHash(hash: string, start = 6, end = 4): string {
  if (hash.length <= start + end + 3) return hash
  return `${hash.slice(0, start)}…${hash.slice(-end)}`
}

export function filterCandidates(
  candidates: Candidate[],
  filter: CandidateFilter,
  threshold: number,
): Candidate[] {
  switch (filter) {
    case 'matches':
      return candidates.filter((c) => c.similarity_score != null && c.similarity_score >= threshold)
    case 'social':
      return candidates.filter((c) => isSocialPlatform(c.source_domain))
    case 'news':
      return candidates.filter((c) => isNewsPress(c.source_domain))
    default:
      return candidates
  }
}

export function candidateOutcomeLabel(
  candidate: Candidate,
  threshold: number,
): { label: string; tone: 'match' | 'accessible' | 'failed' | 'neutral' } {
  if (candidate.comparison_status === 'download_failed') {
    return { label: 'Download failed', tone: 'failed' }
  }
  if (candidate.comparison_status === 'no_face_detected') {
    return { label: 'No usable face', tone: 'failed' }
  }
  const score = candidate.similarity_score
  if (score != null && score >= threshold) {
    return { label: 'Visual match', tone: 'match' }
  }
  if (score != null) {
    return { label: 'Accessible', tone: 'accessible' }
  }
  return { label: 'Not analyzed', tone: 'neutral' }
}

export function fromPipelineResponse(
  result: PipelineResponse,
  extras: {
    probePreview?: string | null
    probeFileName?: string
    dimensions?: { w: number; h: number } | null
    pipelineStartedAt?: number | null
  } = {},
): ResultsViewModel {
  const summary = result.summary
  const candidates = [...(result.search?.candidates ?? [])].sort(
    (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
  )
  const best = result.best_match ?? candidates.find((c) => c.rank === 1) ?? candidates[0] ?? null

  return {
    runId: result.run_id,
    status: result.status,
    threshold: result.threshold ?? 0.45,
    probePreview: extras.probePreview ?? null,
    probeFileName: extras.probeFileName ?? 'Probe image',
    probeFingerprint: result.face_analysis?.input_fingerprint ?? result.blockchain?.data_hash ?? null,
    dimensions: extras.dimensions ?? null,
    modelUsed: result.face_analysis?.model_used ?? null,
    candidatesFound: summary?.candidates_found ?? result.search?.result_count ?? candidates.length,
    candidatesAnalyzed: summary?.candidates_analyzed ?? candidates.filter((c) => c.similarity_score != null).length,
    visualMatches:
      summary?.visual_matches ??
      candidates.filter((c) => c.similarity_score != null && c.similarity_score >= (result.threshold ?? 0.45)).length,
    bestSimilarity: summary?.best_similarity ?? best?.similarity_score ?? null,
    blockchainRecorded: summary?.blockchain_recorded ?? !!result.blockchain,
    verificationStatus: summary?.verification_status ?? 'pending',
    bestMatch: best,
    candidates,
    blockchain: result.blockchain
      ? {
          record_id: result.blockchain.record_id,
          data_hash: result.blockchain.data_hash,
          block_index: result.blockchain.block_index,
          block_hash: result.blockchain.block_hash,
          previous_hash: result.blockchain.previous_hash,
          timestamp: result.blockchain.timestamp,
        }
      : null,
    diagnostics: result.diagnostics ?? null,
    executionSeconds: extras.pipelineStartedAt
      ? Math.round(((Date.now() - extras.pipelineStartedAt) / 1000) * 100) / 100
      : null,
    finalized: result.status === 'completed' || result.status === 'partial',
  }
}

export function fromRunDetail(run: RunDetail): ResultsViewModel {
  const candidates = [...run.candidates].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
  const best = candidates.find((c) => c.rank === 1) ?? candidates[0] ?? null
  const threshold = 0.45

  return {
    runId: run.run_id,
    status: run.search_status ?? 'completed',
    threshold,
    probePreview: null,
    probeFileName: 'Historical probe',
    probeFingerprint: run.input_fingerprint,
    dimensions: null,
    modelUsed: null,
    candidatesFound: candidates.length,
    candidatesAnalyzed: candidates.filter((c) => c.similarity_score != null).length,
    visualMatches: candidates.filter((c) => c.similarity_score != null && c.similarity_score >= threshold).length,
    bestSimilarity: run.similarity_score ?? best?.similarity_score ?? null,
    blockchainRecorded: !!run.blockchain_record,
    verificationStatus: run.verification_status ?? 'pending',
    bestMatch: best,
    candidates,
    blockchain: run.blockchain_record
      ? {
          record_id: run.blockchain_record.record_id,
          data_hash: run.blockchain_record.data_hash,
          block_index: run.blockchain_record.block_index,
          block_hash: run.blockchain_record.block_hash,
          previous_hash: '',
          timestamp: run.timestamp,
        }
      : null,
    diagnostics: run.diagnostics,
    executionSeconds: null,
    finalized: true,
  }
}
