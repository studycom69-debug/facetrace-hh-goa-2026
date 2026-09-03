import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistory } from '../api'
import MaterialIcon from '../components/MaterialIcon'
import StatusBadge from '../components/StatusBadge'
import type { RunSummary } from '../types'
import { formatDate, formatPercent } from '../utils/format'

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'similarity'>('date')

  useEffect(() => {
    getHistory()
      .then(setRuns)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let items = [...runs]
    if (query.trim()) {
      const q = query.toLowerCase()
      items = items.filter(
        (run) =>
          run.run_id.toLowerCase().includes(q) ||
          (run.selected_candidate || '').toLowerCase().includes(q),
      )
    }
    if (statusFilter !== 'all') {
      items = items.filter((run) => (run.search_status || 'unknown') === statusFilter)
    }
    items.sort((a, b) => {
      if (sortBy === 'similarity') {
        return (b.similarity_score ?? -1) - (a.similarity_score ?? -1)
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    return items
  }, [query, runs, sortBy, statusFilter])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
      <div className="mb-8">
        <span className="section-label">Run archive</span>
        <h1 className="mt-1 text-2xl font-semibold text-on-surface">Search history</h1>
        <p className="mt-1 text-[13px] text-on-surface-variant">
          Review previous pipeline runs and reopen detailed evidence records.
        </p>
      </div>

      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size={18}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by run ID or source"
              className="w-full rounded-lg border border-outline-variant/60 bg-surface-bright py-2 pl-10 pr-3 text-[13px] outline-none focus:border-primary"
              aria-label="Search history"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-outline-variant/60 bg-surface-bright px-3 py-2 text-[13px] outline-none"
            aria-label="Filter by search status"
          >
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="no_results">No results</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'similarity')}
            className="rounded-lg border border-outline-variant/60 bg-surface-bright px-3 py-2 text-[13px] outline-none"
            aria-label="Sort history"
          >
            <option value="date">Sort by date</option>
            <option value="similarity">Sort by similarity</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-[13px] text-on-surface-variant">Loading history…</p>
      ) : error ? (
        <div className="rounded-xl border border-error-container bg-error-container/20 p-4 text-[13px] text-error">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-[13px] text-on-surface-variant">
          No runs recorded yet.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="border-b border-outline-variant/40 bg-surface-container-low">
              <tr>
                {['Run', 'Date', 'Source', 'Best similarity', 'Blockchain', 'Verification'].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wide text-on-surface-variant text-[11px]">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => (
                <tr
                  key={run.run_id}
                  className="border-b border-outline-variant/30 hover:bg-surface-container-low"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/history/${run.run_id}`}
                      className="font-mono text-[12px] font-medium text-on-surface hover:underline"
                    >
                      {run.run_id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatDate(run.timestamp)}</td>
                  <td className="max-w-[220px] truncate px-4 py-3">{run.selected_candidate || '—'}</td>
                  <td className="px-4 py-3">{formatPercent(run.similarity_score)}</td>
                  <td className="px-4 py-3">{run.block_id ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={run.verification_status === 'verified' ? 'success' : 'neutral'}>
                      {run.verification_status || '—'}
                    </StatusBadge>
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
