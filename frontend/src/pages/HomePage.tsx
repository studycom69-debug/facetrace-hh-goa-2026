import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { runPipelineSequential } from '../api'
import CandidateCard from '../components/CandidateCard'
import CandidateStreamPreview from '../components/CandidateStreamPreview'
import ForensicStepper from '../components/ForensicStepper'
import MaterialIcon from '../components/MaterialIcon'
import PipelineActivityLog from '../components/PipelineActivityLog'
import ProbeDossier from '../components/ProbeDossier'
import StatusBadge from '../components/StatusBadge'
import TechnicalDetails from '../components/TechnicalDetails'
import VerificationPanel from '../components/VerificationPanel'
import type { InputMode, PipelineResponse } from '../types'
import { formatPercent } from '../utils/format'
import { isSocialPlatform } from '../utils/socialPlatforms'
import {
  buildActivityLog,
  buildPipelineSteps,
  getStageLabel,
  pipelineProgressPercent,
  stageProgressDetail,
  type ActiveStage,
} from '../utils/pipelineHelpers'

const THRESHOLD = 0.45
const STAGE_SEQUENCE: Exclude<ActiveStage, null>[] = [
  'input',
  'analyze',
  'search',
  'compare',
  'record',
  'verify',
]

export default function HomePage() {
  const navigate = useNavigate()
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null)
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeStage, setActiveStage] = useState<ActiveStage>(null)
  const [result, setResult] = useState<PipelineResponse | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [error, setError] = useState<{ title: string; detail: string; technical?: string } | null>(
    null,
  )
  const [filter, setFilter] = useState<'all' | 'social'>('all')
  const [pipelineStartedAt, setPipelineStartedAt] = useState<number | null>(null)
  const [stageTimestamps, setStageTimestamps] = useState<
    Partial<Record<Exclude<ActiveStage, null>, number>>
  >({})
  const [completedStages, setCompletedStages] = useState<ActiveStage[]>([])
  const [, setTick] = useState(0)

  const hasInput = inputMode === 'upload' ? !!file : imageUrl.trim().startsWith('http')

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setResult(null)
    setError(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
    const img = new Image()
    img.onload = () => setDimensions({ w: img.width, h: img.height })
    img.src = url
  }, [])

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setDimensions(null)
    setResult(null)
    setError(null)
    setActiveStage(null)
  }

  const resetSearch = () => {
    clearFile()
    setImageUrl('')
    setConsent(false)
    setFilter('all')
    setRunId(null)
    setPipelineStartedAt(null)
    setStageTimestamps({})
    setCompletedStages([])
  }

  useEffect(() => {
    if (!loading) return
    const id = window.setInterval(() => setTick((t) => t + 1), 500)
    return () => window.clearInterval(id)
  }, [loading])

  useEffect(() => {
    if (!loading || !activeStage) return
    const now = Date.now()
    setStageTimestamps((prev) => (prev[activeStage] ? prev : { ...prev, [activeStage]: now }))
    const idx = STAGE_SEQUENCE.indexOf(activeStage)
    if (idx > 0) {
      setCompletedStages(STAGE_SEQUENCE.slice(0, idx))
    }
  }, [activeStage, loading])

  const handleRun = async () => {
    if (!hasInput || !consent) return
    const id = crypto.randomUUID()
    const started = Date.now()
    setRunId(id)
    setPipelineStartedAt(started)
    setStageTimestamps({ input: started })
    setCompletedStages([])
    setLoading(true)
    setError(null)
    setResult(null)
    setActiveStage('input')

    try {
      setActiveStage('analyze')
      const res = await runPipelineSequential(
        inputMode,
        file,
        imageUrl,
        consent,
        THRESHOLD,
        (stage) => {
          if (stage === 'analyze') setActiveStage('analyze')
          if (stage === 'search') setActiveStage('search')
          if (stage === 'compare') setActiveStage('compare')
        },
      )

      setActiveStage(res.blockchain ? 'verify' : res.search?.candidates?.length ? 'record' : 'search')
      setResult(res)

      if (res.status === 'completed' && (res.search?.candidates?.length ?? 0) > 0) {
        setTimeout(() => {
          navigate(`/results/${res.run_id}`, {
            state: {
              result: res,
              probePreview,
              probeFileName,
              dimensions,
              pipelineStartedAt: started,
            },
          })
        }, 1400)
      }

      if (res.search?.status === 'failed') {
        setError({
          title: 'Search failed',
          detail: res.search.message,
          technical: res.search.api_status ? `HTTP ${res.search.api_status}` : undefined,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pipeline failed'
      setActiveStage('analyze')
      setError({
        title: message.includes('face') ? 'Face analysis failed' : 'Request failed',
        detail: message,
      })
    } finally {
      setLoading(false)
    }
  }

  const showDiagnostic = loading || !!result || !!error

  const probeFileName =
    file?.name ?? (imageUrl.trim() ? imageUrl.trim().replace(/^https?:\/\//, '').slice(0, 48) : 'Probe image')
  const probePreview = preview ?? (inputMode === 'url' && imageUrl.trim() ? imageUrl.trim() : null)
  const probeFingerprint =
    result?.face_analysis?.input_fingerprint ?? result?.blockchain?.data_hash ?? null

  const pipelineSteps = useMemo(
    () =>
      buildPipelineSteps({
        activeStage,
        loading,
        hasInput,
        result,
        error,
        fileName: file?.name,
        fileSizeMb: file ? (file.size / (1024 * 1024)).toFixed(2) : undefined,
        dimensions,
        stageTimestamps,
        pipelineStartedAt,
      }),
    [activeStage, dimensions, error, file, hasInput, loading, pipelineStartedAt, result, stageTimestamps],
  )

  const progressPercent = pipelineProgressPercent(pipelineSteps)

  const activityEntries = useMemo(
    () => buildActivityLog(loading, activeStage, result, completedStages, stageTimestamps),
    [activeStage, completedStages, loading, result, stageTimestamps],
  )

  const stageActivityLabel = getStageLabel(activeStage)
  const stageDetail = stageProgressDetail(activeStage, loading, result)
  const displayRunId = result?.run_id ?? runId

  const candidates = result?.search?.candidates ?? []
  const socialAvailable = candidates.some((c) => isSocialPlatform(c.source_domain))
  const filteredCandidates =
    filter === 'social' ? candidates.filter((c) => isSocialPlatform(c.source_domain)) : candidates
  const best = result?.best_match
  const summary = result?.summary

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-container-low px-4 py-8 sm:px-6 lg:px-[var(--spacing-margin-screen)] lg:py-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-surface-container-high/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-secondary-container/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">
          {loading ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2.5 py-1 font-mono-code text-[11px] text-on-surface-variant">
                  <span className="h-2 w-2 animate-ping rounded-full bg-secondary" />
                  PIPELINE ACTIVE
                </span>
                {displayRunId && (
                  <span className="font-mono-code text-[11px] text-on-surface-variant">
                    RUN: #{displayRunId.slice(0, 8).toUpperCase()}
                  </span>
                )}
                <span className="font-mono-code text-outline">•</span>
                <span className="font-mono-code text-[11px] text-on-surface-variant">
                  STAGE {String(Math.min(STAGE_SEQUENCE.indexOf(activeStage ?? 'input') + 1, 6)).padStart(2, '0')}/06
                </span>
              </div>

              <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div className="max-w-3xl">
                  <div className="flex items-end gap-3">
                    <span className="text-[40px] font-bold leading-none text-on-surface">{progressPercent}%</span>
                  </div>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-on-surface-variant">
                    Automated perceptual embedding correlation with tamper-evident cryptographic
                    provenance logging across verified public records.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start rounded-xl bg-surface-container-lowest px-4 py-3 shadow-sm lg:self-end">
                  <MaterialIcon name="progress_activity" className="animate-spin text-primary" size={20} />
                  <span className="font-mono-code text-on-surface-variant">Processing authorized input…</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 font-mono-code uppercase tracking-wider text-on-surface-variant">
                <span className="inline-flex h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
                <span>{showDiagnostic ? 'Pipeline session' : 'Visual evidence pipeline'}</span>
                {displayRunId && showDiagnostic && (
                  <>
                    <span className="text-outline">•</span>
                    <span>RUN: #{displayRunId.slice(0, 8).toUpperCase()}</span>
                  </>
                )}
              </div>

              <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div className="max-w-3xl">
                  <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-on-surface lg:text-[40px]">
                    Find visual matches.
                    <br className="hidden sm:inline" />
                    Preserve the evidence.
                  </h1>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-on-surface-variant">
                    Search publicly indexed visual content, compare accessible candidates, and create a
                    tamper-evident verification record.
                  </p>
                </div>

                {showDiagnostic && !loading && (
                  <button type="button" onClick={resetSearch} className="btn-secondary self-start lg:self-end">
                    <MaterialIcon name="add" size={18} />
                    New search
                  </button>
                )}

                {result?.blockchain?.data_hash && (
                  <div className="flex items-center gap-2 self-start rounded-xl bg-surface-container-lowest px-4 py-3 shadow-sm lg:self-end">
                    <div className="flex flex-col">
                      <span className="section-label">Latest fingerprint</span>
                      <span className="font-mono-code font-semibold text-on-surface">
                        {result.blockchain.data_hash.slice(0, 8)}…{result.blockchain.data_hash.slice(-4)}
                      </span>
                    </div>
                    <MaterialIcon name="verified_user" className="text-secondary" filled size={20} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Main workspace */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
        {!showDiagnostic ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <div className="card flex flex-col gap-6 p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex rounded-lg bg-surface-container-low p-0.5">
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                      inputMode === 'upload'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <MaterialIcon name="upload_file" size={16} />
                    Upload image
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('url')}
                    className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                      inputMode === 'url'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <MaterialIcon name="link" size={16} />
                    Public URL
                  </button>
                </div>
              </div>

              {inputMode === 'upload' ? (
                <div className="flex flex-col gap-4">
                  {!preview ? (
                    <div
                      onDrop={(e) => {
                        e.preventDefault()
                        const f = e.dataTransfer.files[0]
                        if (f?.type.startsWith('image/')) handleFile(f)
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      className="group relative flex cursor-pointer flex-col items-center rounded-xl bg-surface-bright p-10 text-center transition-colors hover:bg-surface-container-low"
                    >
                      <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 rounded-sm bg-surface-container-highest" />
                      <div className="pointer-events-none absolute right-3 top-3 h-3 w-3 rounded-sm bg-surface-container-highest" />
                      <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 rounded-sm bg-surface-container-highest" />
                      <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 rounded-sm bg-surface-container-highest" />

                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm transition-transform group-hover:scale-105">
                        <MaterialIcon name="cloud_upload" className="text-primary" size={32} />
                      </div>
                      <h2 className="text-lg font-semibold text-on-surface">Upload an authorized image</h2>
                      <p className="mt-1 max-w-md text-[13px] text-on-surface-variant">
                        Drag and drop source media or click to browse files from your device.
                      </p>
                      <span className="mt-4 rounded-full bg-surface-container px-3 py-1 font-mono-code text-on-surface-variant">
                        JPG, PNG, WEBP
                      </span>
                      <label className="btn-secondary mt-5 cursor-pointer">
                        <MaterialIcon name="folder_open" size={16} />
                        Choose image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleFile(f)
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 overflow-hidden rounded-lg bg-surface-container-highest">
                          <img src={preview} alt="Upload preview" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="max-w-xs truncate text-[15px] font-semibold text-on-surface">{file?.name}</p>
                          <p className="font-mono-code text-on-surface-variant">
                            {file && `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                            {dimensions ? ` · ${dimensions.w}×${dimensions.h}px` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        aria-label="Remove image"
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-container-lowest text-error hover:bg-error-container/30"
                      >
                        <MaterialIcon name="delete" size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="section-label" htmlFor="image-url">
                    Direct public media link
                  </label>
                  <div className="flex items-center rounded-lg bg-surface-bright px-3 py-2 shadow-sm">
                    <MaterialIcon name="link" className="mr-2 text-on-surface-variant" size={20} />
                    <input
                      id="image-url"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value)
                        setResult(null)
                        setError(null)
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-transparent font-mono text-[13px] text-on-surface outline-none placeholder:text-outline"
                    />
                  </div>
                  <p className="font-mono-code text-on-surface-variant">
                    Public URLs can be more reliable for reverse-image search providers.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-4 rounded-xl bg-surface-container-low p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
                  <MaterialIcon name="shield" size={20} />
                </div>
                <div>
                  <span className="section-label font-semibold text-on-surface">Authorized usage guideline</span>
                  <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">
                    Use only images you own, have permission to process, or are otherwise authorized to review.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                />
                <span className="text-[13px] leading-snug text-on-surface">
                  I confirm that I have permission or another legitimate basis to process this image.
                </span>
              </label>

              <div className="flex flex-col justify-between gap-4 border-t border-outline-variant/30 pt-4 sm:flex-row sm:items-center">
                <p className="text-[12px] text-on-surface-variant">
                  Processing uses the real backend pipeline — no simulated results.
                </p>
                <button
                  type="button"
                  disabled={!hasInput || !consent || loading}
                  onClick={handleRun}
                  className="btn-primary"
                >
                  Start search
                  <MaterialIcon name="arrow_forward" size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="card flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="section-label">Face analysis</span>
                  <MaterialIcon name="face" size={16} />
                </div>
                <span className="text-lg font-semibold text-on-surface">YuNet + SFace</span>
                <p className="text-[12px] text-on-surface-variant">OpenCV face detection and embedding generation.</p>
              </div>
              <div className="card flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="section-label">Public search</span>
                  <MaterialIcon name="travel_explore" size={16} />
                </div>
                <span className="text-lg font-semibold text-on-surface">SerpApi Lens</span>
                <p className="text-[12px] text-on-surface-variant">Reverse-image search against publicly indexed content.</p>
              </div>
              <div className="card flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="section-label">Evidence record</span>
                  <MaterialIcon name="fingerprint" size={16} />
                </div>
                <span className="text-lg font-semibold text-on-surface">Local ledger</span>
                <p className="text-[12px] text-on-surface-variant">SHA-256 fingerprints in a tamper-evident blockchain.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <ForensicStepper
                steps={pipelineSteps}
                runId={displayRunId}
                inputFingerprint={probeFingerprint}
                modelUsed={result?.face_analysis?.model_used ?? (loading ? 'YuNet + SFace' : null)}
                loading={loading}
              />
            </div>

            <div className="flex flex-col gap-6 lg:col-span-8">
              <div className="flex items-start gap-4 rounded-xl bg-surface-container-high p-5 shadow-sm">
                <MaterialIcon name="info" className="mt-0.5 shrink-0 text-tertiary-container" size={24} />
                <div>
                  <span className="section-label font-bold tracking-wider text-on-tertiary-fixed">
                    Investigative protocol mandate
                  </span>
                  <p className="mt-1 text-[13px] leading-relaxed text-on-surface">
                    <strong>NOTICE:</strong> Visual similarity is an automated metric and does{' '}
                    <em>not</em> constitute legal identity proof. Matches represent statistical image
                    proximities requiring independent human verification prior to evidentiary chain entry.
                  </p>
                </div>
              </div>

              <ProbeDossier
                previewUrl={probePreview}
                fileName={probeFileName}
                fingerprint={probeFingerprint}
                dimensions={dimensions}
                fileSizeMb={file ? (file.size / (1024 * 1024)).toFixed(2) : null}
                modelUsed={result?.face_analysis?.model_used}
                faceDetected={result?.face_analysis?.face_detected ?? false}
                loading={loading}
                consent={consent}
                isUrl={inputMode === 'url'}
              />

              <PipelineActivityLog
                entries={activityEntries}
                loading={loading}
                stageLabel={stageActivityLabel}
                progressPercent={progressPercent}
                stageDetail={stageDetail}
              />

              <CandidateStreamPreview
                candidates={candidates}
                bestMatchUrl={best?.source_url}
                loading={loading && (activeStage === 'compare' || activeStage === 'search')}
                threshold={result?.threshold ?? THRESHOLD}
              />
            </div>
          </div>
        )}
      </section>

      {/* Error */}
      {error && (
        <section className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
          <div className="rounded-xl border border-error-container bg-error-container/20 p-5">
            <p className="font-semibold text-error">{error.title}</p>
            <p className="mt-1 text-[13px] text-on-surface-variant">{error.detail}</p>
            {error.technical && (
              <p className="mt-2 font-mono-code text-on-surface-variant">
                Technical details: {error.technical}
              </p>
            )}
            {error.title === 'Search failed' && (
              <p className="mt-2 text-[13px] text-on-surface-variant">
                Check search configuration and retry.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Results */}
      {result && (
        <section className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="section-label">Evidence summary</span>
                <h2 className="mt-1 text-xl font-semibold text-on-surface">Search complete</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/results/${result.run_id}`, {
                      state: {
                        result,
                        probePreview,
                        probeFileName,
                        dimensions,
                        pipelineStartedAt,
                      },
                    })
                  }
                  className="btn-primary py-1.5 px-3 text-[13px]"
                >
                  <MaterialIcon name="verified" size={16} />
                  View Audit Docket
                </button>
                <StatusBadge tone={result.status === 'completed' ? 'success' : 'neutral'}>
                  {result.status}
                </StatusBadge>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Candidates found', summary?.candidates_found ?? result.search?.result_count ?? 0],
                ['Candidates analyzed', summary?.candidates_analyzed ?? 0],
                ['Visual matches', summary?.visual_matches ?? 0],
                ['Best similarity', formatPercent(summary?.best_similarity ?? best?.similarity_score ?? null)],
                ['Blockchain', summary?.blockchain_recorded || result.blockchain ? 'Recorded' : 'Not recorded'],
                ['Verification', summary?.verification_status ?? 'Pending'],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-surface-container-low p-4">
                  <dt className="section-label">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold capitalize text-on-surface">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {best && (
            <div className="card p-6">
              <span className="section-label">Best visual match</span>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold text-on-surface">
                    {formatPercent(best.similarity_score)}
                  </p>
                  <p className="mt-2 text-[13px] text-on-surface-variant">
                    Source: {best.source_domain}
                  </p>
                  {best.title && (
                    <p className="mt-1 text-[13px] text-on-surface-variant">{best.title}</p>
                  )}
                </div>
                <a
                  href={best.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Open source
                  <MaterialIcon name="open_in_new" size={16} />
                </a>
              </div>
              <p className="mt-4 text-[12px] text-on-surface-variant">
                Visual similarity result — not identity proof.
              </p>
            </div>
          )}

          {candidates.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Candidate results</h3>
                  <p className="text-[13px] text-on-surface-variant">
                    Ranked by visual similarity from publicly indexed results.
                  </p>
                </div>
                <div className="flex rounded-lg bg-surface-container-low p-0.5">
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`rounded-md px-3 py-1.5 text-[13px] font-medium ${
                      filter === 'all'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    All public results
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('social')}
                    disabled={!socialAvailable}
                    className={`rounded-md px-3 py-1.5 text-[13px] font-medium disabled:opacity-40 ${
                      filter === 'social'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    Social platforms
                  </button>
                </div>
              </div>

              {filter === 'social' && (
                <p className="text-[12px] text-on-surface-variant">
                  Showing only candidates returned from social platforms in this search result set.
                </p>
              )}

              {filteredCandidates.length === 0 ? (
                <div className="card p-6 text-[13px] text-on-surface-variant">
                  No social-platform candidates were returned for this search.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCandidates.map((candidate) => (
                    <CandidateCard
                      key={`${candidate.source_url}-${candidate.rank ?? candidate.comparison_status}`}
                      candidate={candidate}
                      threshold={result.threshold ?? THRESHOLD}
                      highlight={candidate.source_url === best?.source_url}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {result.blockchain && (
            <div className="space-y-4">
              <div className="card p-6">
                <span className="section-label">Verification record</span>
                <h3 className="mt-1 text-lg font-semibold text-on-surface">
                  Evidence record created
                </h3>
                <p className="mt-1 text-[13px] text-on-surface-variant">
                  Local tamper-evident blockchain — not a public cryptocurrency network.
                </p>

                <dl className="mt-5 grid gap-4 text-[13px] sm:grid-cols-2">
                  {[
                    ['Record ID', result.blockchain.record_id],
                    ['Data fingerprint', result.blockchain.data_hash],
                    ['Block', String(result.blockchain.block_index)],
                    ['Block hash', result.blockchain.block_hash],
                    ['Previous block hash', result.blockchain.previous_hash],
                    ['Timestamp', result.blockchain.timestamp],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-on-surface-variant">{label}</dt>
                      <dd className="mt-0.5 break-all font-mono text-[12px] text-on-surface">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <VerificationPanel
                recordId={result.blockchain.record_id}
                initialStatus={summary?.verification_status}
              />
            </div>
          )}

          {result.diagnostics && <TechnicalDetails diagnostics={result.diagnostics} />}
        </section>
      )}
    </div>
  )
}
