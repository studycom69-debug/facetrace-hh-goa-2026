import { useState } from 'react'
import { verifyRecord } from '../api'
import type { VerificationResult } from '../types'
import MaterialIcon from './MaterialIcon'
import StatusBadge from './StatusBadge'

interface VerificationPanelProps {
  recordId: string
  initialStatus?: string
}

export default function VerificationPanel({ recordId, initialStatus }: VerificationPanelProps) {
  const [verifying, setVerifying] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    setVerifying(true)
    setError(null)
    setResult(null)
    setStage('Verifying record against blockchain')

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

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="section-label">Independent verification</span>
          <h3 className="mt-1 text-lg font-semibold text-on-surface">
            Verify evidence record
          </h3>
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
