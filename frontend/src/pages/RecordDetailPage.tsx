import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRecord } from '../api'
import MaterialIcon from '../components/MaterialIcon'
import StatusBadge from '../components/StatusBadge'
import VerificationPanel from '../components/VerificationPanel'
import type { RecordDetail } from '../types'
import { formatDate, formatPercent } from '../utils/format'

export default function RecordDetailPage() {
  const { recordId = '' } = useParams()
  const [record, setRecord] = useState<RecordDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRecord(recordId)
      .then(setRecord)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load record'))
      .finally(() => setLoading(false))
  }, [recordId])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-[13px] text-on-surface-variant sm:px-6 lg:px-[var(--spacing-margin-screen)]">
        Loading record…
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
        <Link to="/records" className="inline-flex items-center gap-1 text-[13px] text-on-surface hover:underline">
          <MaterialIcon name="arrow_back" size={16} />
          Back to records
        </Link>
        <div className="rounded-xl border border-error-container bg-error-container/20 p-4 text-[13px] text-error">
          {error || 'Record not found'}
        </div>
      </div>
    )
  }

  const similarity = record.metadata.similarity_score
  const score = typeof similarity === 'number' ? similarity : null

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
      <div>
        <Link to="/records" className="inline-flex items-center gap-1 text-[13px] text-on-surface hover:underline">
          <MaterialIcon name="arrow_back" size={16} />
          Back to records
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-on-surface">Record details</h1>
        <p className="mt-1 font-mono text-[12px] text-on-surface-variant">{record.record_id}</p>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="section-label">Stored evidence metadata</span>
          <StatusBadge tone={record.verification_status === 'verified' ? 'success' : 'neutral'}>
            {record.verification_status}
          </StatusBadge>
        </div>

        <dl className="grid gap-4 text-[13px] sm:grid-cols-2">
          {[
            ['Source domain', record.source_domain],
            ['Visual similarity', formatPercent(score)],
            ['Source URL', record.source_url],
            ['Data fingerprint', record.data_hash],
            ['Block hash', record.block_hash],
            ['Block index', String(record.block_index)],
            ['Previous block hash', record.previous_hash],
            ['Created', formatDate(record.created_at)],
            ['Metadata timestamp', String(record.metadata.timestamp || '—')],
          ].map(([label, value]) => (
            <div key={String(label)} className={label === 'Source URL' ? 'sm:col-span-2' : ''}>
              <dt className="text-on-surface-variant">{label}</dt>
              <dd
                className={`mt-0.5 ${['Data fingerprint', 'Block hash', 'Previous block hash', 'Source URL'].includes(String(label)) ? 'break-all font-mono text-[12px]' : ''}`}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-[12px] text-on-surface-variant">
          Biometric vectors are not stored on the blockchain. Only tamper-evident metadata fingerprints
          are recorded.
        </p>
      </div>

      <VerificationPanel recordId={record.record_id} initialStatus={record.verification_status} />
    </div>
  )
}
