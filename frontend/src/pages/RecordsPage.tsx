import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecords } from '../api'
import MaterialIcon from '../components/MaterialIcon'
import StatusBadge from '../components/StatusBadge'
import type { RecordSummary } from '../types'
import { formatDate } from '../utils/format'

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    getRecords()
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load records'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return records
    const q = query.toLowerCase()
    return records.filter(
      (record) =>
        record.record_id.toLowerCase().includes(q) ||
        record.source_domain.toLowerCase().includes(q) ||
        record.data_hash.toLowerCase().includes(q),
    )
  }, [query, records])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
      <div className="mb-8">
        <span className="section-label">Evidence ledger</span>
        <h1 className="mt-1 text-2xl font-semibold text-on-surface">Blockchain records</h1>
        <p className="mt-1 text-[13px] text-on-surface-variant">
          Local tamper-evident blockchain — not a public cryptocurrency network.
        </p>
      </div>

      <div className="card mb-6 p-4">
        <div className="relative max-w-sm">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            size={18}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records"
            className="w-full rounded-lg border border-outline-variant/60 bg-surface-bright py-2 pl-10 pr-3 text-[13px] outline-none focus:border-primary"
            aria-label="Search records"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-[13px] text-on-surface-variant">Loading records…</p>
      ) : error ? (
        <div className="rounded-xl border border-error-container bg-error-container/20 p-4 text-[13px] text-error">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-[13px] text-on-surface-variant">
          No records yet.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="border-b border-outline-variant/40 bg-surface-container-low">
              <tr>
                {['Record ID', 'Source', 'Fingerprint', 'Block', 'Created', 'Status', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-semibold uppercase tracking-wide text-on-surface-variant text-[11px]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.record_id} className="border-b border-outline-variant/30">
                  <td className="px-4 py-3 font-mono text-[12px]">{record.record_id.slice(0, 10)}…</td>
                  <td className="px-4 py-3">{record.source_domain}</td>
                  <td className="px-4 py-3 font-mono text-[12px]">{record.data_hash.slice(0, 12)}…</td>
                  <td className="px-4 py-3">{record.block_index}</td>
                  <td className="px-4 py-3">{formatDate(record.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={record.verification_status === 'verified' ? 'success' : 'neutral'}>
                      {record.verification_status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/records/${record.record_id}`}
                      className="font-medium text-on-surface hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
