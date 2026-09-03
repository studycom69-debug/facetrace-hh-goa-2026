import type { PipelineResponse, PipelineStep, StepStatus } from '../types'

export type ActiveStage = 'input' | 'analyze' | 'search' | 'compare' | 'record' | 'verify' | null

const STAGE_ORDER: ActiveStage[] = ['input', 'analyze', 'search', 'compare', 'record', 'verify']

const STAGE_MESSAGES: Record<Exclude<ActiveStage, null>, string> = {
  input: 'Validating authorized image input',
  analyze: 'Running OpenCV YuNet face detection and SFace embedding extraction',
  search: 'Querying SerpApi Google Lens for publicly indexed visual matches',
  compare: 'Downloading and comparing accessible candidate images by cosine similarity',
  record: 'Creating tamper-evident evidence record on local ledger',
  verify: 'Finalizing chain-of-custody verification readiness',
}

const STAGE_LABELS: Record<Exclude<ActiveStage, null>, string> = {
  input: 'Step 01: Input ingestion',
  analyze: 'Step 02: Vector extraction',
  search: 'Step 03: Public index query',
  compare: 'Step 04: Vector cosine proximity engine',
  record: 'Step 05: Ledger registration',
  verify: 'Step 06: Attestation seal',
}

export function getStageActivityMessage(stage: ActiveStage): string {
  if (!stage) return 'Waiting to start pipeline'
  return STAGE_MESSAGES[stage]
}

export function getStageLabel(stage: ActiveStage): string {
  if (!stage) return 'Pipeline activity'
  return STAGE_LABELS[stage]
}

export function formatElapsed(ms: number): string {
  const totalSec = ms / 1000
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  if (minutes > 0) {
    return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`
  }
  return `00:${seconds.toFixed(3).padStart(6, '0')}`
}

export function formatLogTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

export interface ActivityEntry {
  id: string
  success: boolean
  message: string
  timestamp?: string
  active?: boolean
}

export function buildActivityLog(
  loading: boolean,
  activeStage: ActiveStage,
  result: PipelineResponse | null,
  completedStages: ActiveStage[] = [],
  stageTimestamps: Partial<Record<Exclude<ActiveStage, null>, number>> = {},
): ActivityEntry[] {
  if (loading) {
    const entries: ActivityEntry[] = completedStages
      .filter((s): s is Exclude<ActiveStage, null> => s != null)
      .map((stage) => ({
        id: `done-${stage}`,
        success: true,
        message: STAGE_MESSAGES[stage],
        timestamp: stageTimestamps[stage] ? formatLogTime(stageTimestamps[stage]) : undefined,
      }))

    if (activeStage) {
      entries.push({
        id: 'current',
        success: true,
        message: STAGE_MESSAGES[activeStage],
        timestamp: formatLogTime(Date.now()),
        active: true,
      })
    }

    return entries
  }

  if (!result?.diagnostics) return []

  const d = result.diagnostics
  const entries: ActivityEntry[] = []

  if (d.face_detection) {
    entries.push({
      id: 'face-detection',
      success: d.face_detection.success,
      message: d.face_detection.message,
    })
  }
  if (d.face_embedding) {
    entries.push({
      id: 'face-embedding',
      success: d.face_embedding.success,
      message: d.face_embedding.message,
    })
  }
  if (d.search_provider) {
    entries.push({
      id: 'search',
      success: d.search_provider.success,
      message: d.search_provider.message,
    })
  }

  for (const [i, cmp] of d.face_comparisons.entries()) {
    const score =
      cmp.similarity_score != null ? ` — Similarity: ${(cmp.similarity_score * 100).toFixed(1)}%` : ''
    entries.push({
      id: `cmp-${i}`,
      success: cmp.success,
      message: `${cmp.message}${score}`,
    })
  }

  if (d.blockchain) {
    entries.push({
      id: 'blockchain',
      success: d.blockchain.success,
      message: d.blockchain.message,
    })
  }

  return entries
}

const STEP_LABELS = [
  'Input Ingestion',
  'Vector Extraction',
  'Public Index Query',
  'Vector Comparison',
  'Ledger Registration',
  'Attestation Seal',
] as const

const STAGE_BY_STEP: ActiveStage[] = ['input', 'analyze', 'search', 'compare', 'record', 'verify']

export function stepStatus(
  current: ActiveStage,
  target: ActiveStage,
  failed = false,
): StepStatus {
  if (failed && current === target) return 'failed'
  if (!current) return 'not_started'
  const currentIdx = STAGE_ORDER.indexOf(current)
  const targetIdx = STAGE_ORDER.indexOf(target)
  if (currentIdx > targetIdx) return 'completed'
  if (currentIdx === targetIdx) return 'processing'
  return 'waiting'
}

interface BuildStepsOptions {
  activeStage: ActiveStage
  loading: boolean
  hasInput: boolean
  result: PipelineResponse | null
  error: { title: string } | null
  fileName?: string
  fileSizeMb?: string
  dimensions?: { w: number; h: number } | null
  stageTimestamps?: Partial<Record<Exclude<ActiveStage, null>, number>>
  pipelineStartedAt?: number | null
}

export function buildPipelineSteps(opts: BuildStepsOptions): PipelineStep[] {
  const failedSearch = opts.result?.search?.status === 'failed'
  const failedFace = opts.result?.status === 'failed' || opts.error?.title === 'Face analysis failed'
  const fa = opts.result?.face_analysis
  const search = opts.result?.search
  const summary = opts.result?.summary
  const now = Date.now()

  const statuses: StepStatus[] =
    !opts.loading && !opts.result && !opts.error
      ? [
          opts.hasInput ? 'completed' : 'not_started',
          'not_started',
          'not_started',
          'not_started',
          'not_started',
          'not_started',
        ]
      : [
          stepStatus(opts.activeStage, 'input'),
          failedFace ? 'failed' : stepStatus(opts.activeStage, 'analyze'),
          failedSearch ? 'failed' : stepStatus(opts.activeStage, 'search'),
          stepStatus(opts.activeStage, 'compare'),
          stepStatus(opts.activeStage, 'record'),
          stepStatus(opts.activeStage, 'verify'),
        ]

  const compareDetail =
    opts.activeStage === 'compare' && opts.loading
      ? 'Downloading and comparing accessible candidate images'
      : summary
        ? `${summary.candidates_analyzed} analyzed · ${summary.visual_matches} above threshold`
        : search?.candidates.length
          ? `${search.candidates.length} candidates returned from index`
          : undefined

  const details: (string | undefined)[] = [
    opts.fileName
      ? `Image validated: ${opts.fileName}${opts.fileSizeMb ? ` (${opts.fileSizeMb} MB)` : ''}`
      : opts.hasInput
        ? 'Public URL submitted for processing'
        : undefined,
    fa
      ? `Face isolated · ${fa.model_used}${fa.embedding_generated ? ' · embedding generated' : ''}`
      : opts.activeStage === 'analyze' && opts.loading
        ? 'OpenCV YuNet + SFace embedding pipeline'
        : undefined,
    search
      ? `${search.result_count} indexed candidate matches · ${search.provider}`
      : opts.activeStage === 'search' && opts.loading
        ? 'Querying SerpApi Google Lens public index'
        : undefined,
    compareDetail,
    opts.result?.blockchain
      ? `Block ${opts.result.blockchain.block_index} recorded on local ledger`
      : summary?.blockchain_recorded
        ? 'Cryptographically signed evidence receipt created'
        : opts.activeStage === 'record' && opts.loading
          ? 'Awaiting comparison threshold validation'
          : undefined,
    summary?.verification_status === 'verified'
      ? 'Record verified against stored chain'
      : opts.result?.blockchain
        ? 'Pending independent verification'
        : undefined,
  ]

  const elapsedNotes = STAGE_BY_STEP.map((stage, i) => {
    if (statuses[i] !== 'completed') return undefined
    const started = opts.stageTimestamps?.[stage as Exclude<ActiveStage, null>]
    const nextStage = STAGE_BY_STEP[i + 1]
    const ended =
      (nextStage && opts.stageTimestamps?.[nextStage as Exclude<ActiveStage, null>]) ||
      (opts.pipelineStartedAt && !opts.loading && i === STAGE_BY_STEP.length - 1 ? now : undefined)
    if (started && ended) {
      return `Completed · ${formatElapsed(ended - started)}`
    }
    if (started) {
      return `Completed · ${formatElapsed(now - started)}`
    }
    return 'Completed'
  })

  const notes: (string | undefined)[] = statuses.map((s, i) => {
    if (s === 'completed') return elapsedNotes[i] ?? 'Complete'
    if (s === 'processing') return 'In progress'
    if (s === 'failed') return 'Failed'
    if (s === 'waiting') return 'Waiting'
    return undefined
  })

  return STEP_LABELS.map((label, i) => ({
    id: i + 1,
    label,
    status: statuses[i],
    detail: details[i],
    statusNote: statuses[i] === 'processing' ? 'RUNNING' : notes[i],
    elapsedNote: statuses[i] === 'completed' ? elapsedNotes[i] : undefined,
  }))
}

export function completedStepCount(steps: PipelineStep[]): number {
  return steps.filter((s) => s.status === 'completed').length
}

export function activeStepIndex(steps: PipelineStep[]): number {
  const processing = steps.findIndex((s) => s.status === 'processing')
  if (processing >= 0) return processing
  const completed = completedStepCount(steps)
  return Math.min(completed, steps.length - 1)
}

export function pipelineProgressPercent(steps: PipelineStep[]): number {
  const completed = completedStepCount(steps)
  const processing = steps.some((s) => s.status === 'processing')
  const raw = ((completed + (processing ? 0.45 : 0)) / steps.length) * 100
  return Math.min(99, Math.round(raw))
}

export function stageProgressDetail(
  activeStage: ActiveStage,
  loading: boolean,
  result: PipelineResponse | null,
): string | undefined {
  if (!loading || !activeStage) return undefined
  if (activeStage === 'compare' && result?.search?.candidates.length) {
    return `Evaluating ${result.search.candidates.length} indexed candidates`
  }
  return STAGE_MESSAGES[activeStage]
}
