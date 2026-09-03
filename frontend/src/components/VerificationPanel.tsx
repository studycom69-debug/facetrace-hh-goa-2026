import { useState } from 'react'
import { verifyRecord } from '../api'
import type { VerificationResult } from '../types'
import MaterialIcon from './MaterialIcon'
import StatusBadge from './StatusBadge'

interface VerificationPanelProps {
  recordId: string
  initialStatus?: string
  variant?: 'default' | 'results'
}

export default function VerificationPanel({
  recordId,
  initialStatus,
  variant = 'default',
}: VerificationPanelProps) {
  const [verifying, setVerifying] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    setVerifying(true)
    setError(null)
    setResult(null)
    setStage('Recalculating fingerprint against ledger')

    try {
      const res = await verifyRecord(recordId)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setStage(null)
      setVerifying(false)
    }
  }

  const verified = result?.verified
  const displayStatus =
    verified === true ? 'verified' : verified === false ? 'failed' : initialStatus || 'recorded'

  if (variant === 'results') {
    return (
      <section className="flex h-full flex-col justify-between gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <MaterialIcon name="policy" className="text-secondary" size={22} />
            <h3 className="text-lg font-semibold text-on-surface">Independent verification</h3>
          </div>
          <p className="mt-2 text-[13px] text-on-surface-variant">
            Recalculate the evidence fingerprint locally and verify it against the tamper-evident ledger.
          </p>
        </div>

        {result?.verified && (
          <div className="flex flex-col gap-3 rounded-xl bg-secondary-container/25 p-4">
            <div className="flex items-start gap-3">
              <MaterialIcon name="check_circle" className="mt-0.5 text-secondary" size={20} />
              <div>
                <span className="section-label text-on-secondary-container">Integrity verified</span>
                <p className="mt-0.5 text-[12px] font-medium text-on-surface">{result.message}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg bg-surface-container-lowest/80 p-3 font-mono-code text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Stored fingerprint</span>
                <span className="flex items-center gap-1 font-semibold text-secondary">
                  Match <MaterialIcon name="check" size={14} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Current fingerprint</span>
                <span className="flex items-center gap-1 font-semibold text-secondary">
                  Match <MaterialIcon name="check" size={14} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Chain integrity</span>
                <span className="flex items-center gap-1 font-semibold text-secondary">
                  {result.chain_valid ? 'Valid' : 'Invalid'}{' '}
                  <MaterialIcon name="check" size={14} />
                </span>
              </div>
            </div>
          </div>
        )}

        {result && !result.verified && (
          <div className="rounded-xl border border-error-container bg-error-container/20 p-4 text-[13px] text-error">
            {result.message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-error-container bg-error-container/30 px-4 py-3 text-[13px] text-error">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-high py-2 text-[12px] font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            <MaterialIcon name="refresh" size={16} className={verifying ? 'animate-spin' : undefined} />
            {verifying ? stage ?? 'Verifying…' : 'Recalculate & attest fingerprint'}
          </button>
          <span className="text-center font-mono-code text-[10px] text-on-surface-variant">
            Client-side SHA-256 rehash against stored record
          </span>
        </div>
      </section>
    )
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="section-label">Independent verification</span>
          <h3 className="mt-1 text-lg font-semibold text-on-surface">Verify evidence record</h3>
          <p className="mt-1 text-[13px] text-on-surface-variant">
            Recalculate the fingerprint and validate chain integrity.
          </p>
        </div>
        <StatusBadge tone={displayStatus === 'verified' ? 'success' : 'neutral'}>
          {displayStatus}
        </StatusBadge>
      </div>

      {verifying && stage && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-[13px] text-on-surface-variant">
          <MaterialIcon name="progress_activity" className="animate-spin" size={16} />
          {stage}
        </div>
      )}

      <button
        type="button"
        onClick={handleVerify}
        disabled={verifying}
        className="btn-secondary"
        aria-label="Verify blockchain record"
      >
        <MaterialIcon name="verified_user" size={18} />
        {verifying ? 'Verifying…' : 'Verify record'}
      </button>

      {error && (
        <div className="mt-4 rounded-lg border border-error-container bg-error-container/30 px-4 py-3 text-[13px] text-error">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`mt-4 rounded-lg border px-4 py-4 ${
            result.verified
              ? 'border-secondary-container bg-secondary-container/20'
              : 'border-error-container bg-error-container/20'
          }`}
        >
          <div className="flex items-start gap-3">
            <MaterialIcon
              name={result.verified ? 'check_circle' : 'cancel'}
              className={result.verified ? 'text-secondary' : 'text-error'}
              filled
              size={22}
            />
            <div className="min-w-0">
              <p className="font-semibold text-on-surface">
                {result.verified ? 'Verified' : 'Verification failed'}
              </p>
              <p className="mt-1 text-[13px] text-on-surface-variant">{result.message}</p>
              <dl className="mt-3 space-y-2 text-[12px]">
                <div>
                  <dt className="text-on-surface-variant">Stored fingerprint</dt>
                  <dd className="break-all font-mono">{result.stored_hash}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Calculated fingerprint</dt>
                  <dd className="break-all font-mono">{result.calculated_hash}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Chain integrity</dt>
                  <dd>{result.chain_valid ? 'Valid' : 'Invalid'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
