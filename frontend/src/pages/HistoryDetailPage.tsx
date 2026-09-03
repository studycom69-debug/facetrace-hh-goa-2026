import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getHistoryDetail } from '../api'
import CandidateCard from '../components/CandidateCard'
import MaterialIcon from '../components/MaterialIcon'
import StatusBadge from '../components/StatusBadge'
import TechnicalDetails from '../components/TechnicalDetails'
import VerificationPanel from '../components/VerificationPanel'
import type { RunDetail } from '../types'
import { formatDate, formatPercent } from '../utils/format'

const THRESHOLD = 0.45

export default function HistoryDetailPage() {
  const { runId = '' } = useParams()
  const [run, setRun] = useState<RunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHistoryDetail(runId)
      .then(setRun)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load run'))
      .finally(() => setLoading(false))
  }, [runId])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-[13px] text-on-surface-variant sm:px-6 lg:px-[var(--spacing-margin-screen)]">
        Loading run details…
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
        <Link to="/history" className="inline-flex items-center gap-1 text-[13px] text-on-surface hover:underline">
          <MaterialIcon name="arrow_back" size={16} />
          Back to history
        </Link>
        <div className="rounded-xl border border-error-container bg-error-container/20 p-4 text-[13px] text-error">
          {error || 'Run not found'}
        </div>
      </div>
    )
  }

  const ranked = [...run.candidates].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
      <div>
        <Link to="/history" className="inline-flex items-center gap-1 text-[13px] text-on-surface hover:underline">
          <MaterialIcon name="arrow_back" size={16} />
          Back to history
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-on-surface">Run details</h1>
        <p className="mt-1 font-mono text-[12px] text-on-surface-variant">{run.run_id}</p>
      </div>

      <div className="card p-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-[13px]">
          {[
            ['Date', formatDate(run.timestamp)],
            ['Search status', run.search_status || '—'],
            ['Best similarity', formatPercent(run.similarity_score)],
            ['Face detected', run.face_detected ? 'Yes' : 'No'],
            ['Input fingerprint', run.input_fingerprint || '—'],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="section-label">{label}</dt>
              <dd className={`mt-1 ${label === 'Input fingerprint' ? 'break-all font-mono text-[12px]' : ''}`}>
                {value}
              </dd>
            </div>
          ))}
          <div>
            <dt className="section-label">Verification</dt>
            <dd className="mt-1">
              <StatusBadge tone={run.verification_status === 'verified' ? 'success' : 'neutral'}>
                {run.verification_status || '—'}
              </StatusBadge>
            </dd>
          </div>
        </dl>
      </div>

      {ranked.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-on-surface">Candidates</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ranked.map((candidate) => (
              <CandidateCard
                key={`${candidate.source_url}-${candidate.rank}`}
                candidate={candidate}
                threshold={THRESHOLD}
              />
            ))}
          </div>
        </section>
      )}

      {run.blockchain_record && (
        <section className="space-y-4">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-on-surface">Blockchain record</h2>
            <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
              <div>
                <dt className="text-on-surface-variant">Record ID</dt>
                <dd className="font-mono text-[12px]">{run.blockchain_record.record_id}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Fingerprint</dt>
                <dd className="break-all font-mono text-[12px]">{run.blockchain_record.data_hash}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Block</dt>
                <dd>{run.blockchain_record.block_index}</dd>
              </div>
            </dl>
          </div>
          <VerificationPanel
            recordId={run.blockchain_record.record_id}
            initialStatus={run.verification_status || undefined}
          />
        </section>
      )}

      {run.diagnostics && <TechnicalDetails diagnostics={run.diagnostics} />}
    </div>
  )
}
