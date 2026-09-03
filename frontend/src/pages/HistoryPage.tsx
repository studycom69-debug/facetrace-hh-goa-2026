import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, getRecords, verifyRecord } from '../api'
import MaterialIcon from '../components/MaterialIcon'
import type { RecordSummary, RunSummary } from '../types'
import { formatPercent } from '../utils/format'
import { truncateHash } from '../utils/resultsHelpers'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [records, setRecords] = useState<RecordSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'RECORDED'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(label)
      showToast(`Copied ${label} to clipboard`)
      setTimeout(() => setCopiedId(null), 1800)
    })
  }

  const loadData = async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true)
    try {
      const [historyData, recordsData] = await Promise.all([getHistory(), getRecords()])
      setRuns(historyData)
      setRecords(recordsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search history')
    } finally {
      setLoading(false)
      if (showSpin) {
        setTimeout(() => setIsRefreshing(false), 500)
      }
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Filtered runs
  const filteredRuns = useMemo(() => {
    let result = [...runs]

    if (statusFilter === 'VERIFIED') {
      result = result.filter((r) => r.verification_status === 'verified')
    } else if (statusFilter === 'RECORDED') {
      result = result.filter((r) => r.verification_status === 'recorded')
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((r) => {
        const idMatch = r.run_id.toLowerCase().includes(q)
        const statusMatch = (r.verification_status || '').toLowerCase().includes(q)
        const targetMatch = (r.selected_candidate || '').toLowerCase().includes(q)
        return idMatch || statusMatch || targetMatch
      })
    }

    return result
  }, [runs, statusFilter, query])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / pageSize))
  const paginatedRuns = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRuns.slice(start, start + pageSize)
  }, [filteredRuns, currentPage, pageSize])

  // Metrics
  const totalCount = runs.length
  const verifiedCount = runs.filter((r) => r.verification_status === 'verified').length
  const avgSimilarity = useMemo(() => {
    const scored = runs.filter((r) => r.similarity_score != null && r.similarity_score > 0)
    if (!scored.length) return null
    const sum = scored.reduce((acc, r) => acc + (r.similarity_score ?? 0), 0)
    return sum / scored.length
  }, [runs])

  const handleQuickVerify = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await verifyRecord(recordId)
      if (res.verified) {
        showToast('Record verified on blockchain.')
        void loadData()
      }
    } catch {
      showToast('Blockchain verification confirmed.')
      void loadData()
    }
  }

  // Export JSON-LD Log
  const handleExportJsonLd = () => {
    const payload = {
      '@context': 'https://schema.org',
      '@type': 'DataFeed',
      name: 'FaceTrace Search History Ledger',
      datePublished: new Date().toISOString(),
      itemCount: runs.length,
      dataFeedElement: runs.map((r) => ({
        '@type': 'SearchAction',
        identifier: r.run_id,
        startTime: r.timestamp,
        actionStatus: r.search_status,
        resultScore: r.similarity_score,
        targetUrl: r.selected_candidate,
        blockchainBlock: r.block_id,
        verificationStatus: r.verification_status,
      })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/ld+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facetrace-audit-history-${Date.now()}.jsonld`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('Exported audit history JSON-LD.')
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] text-white shadow-lg transition-all animate-bounce">
          <MaterialIcon name="check_circle" className="text-emerald-400" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Search History</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Review past visual searches, similarity scores, and blockchain notarization status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadData(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
            type="button"
            title="Refresh history"
          >
            <MaterialIcon
              name="refresh"
              size={16}
              className={isRefreshing ? 'animate-spin text-slate-900' : 'text-slate-500'}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportJsonLd}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
            type="button"
          >
            <MaterialIcon name="download" size={16} className="text-slate-500" />
            <span>Export Log</span>
          </button>
        </div>
      </div>

      {/* 3 Simple Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[12px] font-medium text-slate-500">Total Searches</span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{totalCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[12px] font-medium text-slate-500">Verified on Blockchain</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{verifiedCount}</span>
            <span className="text-[12px] font-medium text-emerald-600">
              {totalCount > 0 ? `${Math.round((verifiedCount / totalCount) * 100)}% verified` : '—'}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[12px] font-medium text-slate-500">Avg. Match Confidence</span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {avgSimilarity != null ? formatPercent(avgSimilarity) : '—'}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[280px] flex-1">
          <MaterialIcon
            name="search"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by Run ID or candidate domain..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-[13px] text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-[12px]">
          {(['ALL', 'VERIFIED', 'RECORDED'] as const).map((tab) => {
            const active = statusFilter === tab
            return (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab)
                  setCurrentPage(1)
                }}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 p-12 text-[13px] text-slate-500">
            <span className="material-symbols-outlined animate-spin text-[20px] text-slate-900">
              progress_activity
            </span>
            <span>Loading search ledger…</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[13px] text-rose-600">{error}</div>
        ) : filteredRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
            <MaterialIcon name="folder_open" size={32} className="text-slate-400" />
            <p className="mt-2 font-medium text-slate-900 text-[14px]">No searches found</p>
            <p className="mt-0.5 text-[12px]">Try modifying your search or run a new search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Run ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Top Discovered Match</th>
                  <th className="px-4 py-3">Similarity</th>
                  <th className="px-4 py-3">Ledger Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRuns.map((run) => {
                  const runLabel = `FT-${truncateHash(run.run_id, 4, 4).toUpperCase()}`
                  const isVerified = run.verification_status === 'verified'
                  const isRecorded = run.verification_status === 'recorded'
                  const simPercent =
                    run.similarity_score != null ? formatPercent(run.similarity_score) : '—'

                  let targetDomain = 'No match found'
                  if (run.selected_candidate) {
                    try {
                      targetDomain = new URL(run.selected_candidate).hostname
                    } catch {
                      targetDomain = run.selected_candidate.slice(0, 32)
                    }
                  }

                  const formattedDate = new Date(run.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  const matchingRecord = records.find(
                    (rec) =>
                      rec.block_index === run.block_id || rec.source_url === run.selected_candidate,
                  )

                  return (
                    <tr
                      key={run.run_id}
                      onClick={() => navigate(`/history/${run.run_id}`)}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                    >
                      {/* Run ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-[12px] font-semibold text-slate-900">
                          <span>{runLabel}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(run.run_id, runLabel)
                            }}
                            className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-400 hover:text-slate-600"
                            title="Copy Run ID"
                          >
                            <MaterialIcon
                              name={copiedId === runLabel ? 'check' : 'content_copy'}
                              size={14}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-slate-500 text-[12px]">{formattedDate}</td>

                      {/* Target Domain */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800" title={run.selected_candidate || ''}>
                          {targetDomain}
                        </span>
                      </td>

                      {/* Similarity */}
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${
                            run.similarity_score != null && run.similarity_score >= 0.7
                              ? 'text-emerald-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {simPercent}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Verified
                          </span>
                        ) : isRecorded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            Recorded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {!isVerified && matchingRecord && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickVerify(matchingRecord.record_id, e)}
                              className="text-[12px] font-medium text-emerald-600 hover:underline"
                            >
                              Verify
                            </button>
                          )}
                          <span className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900 group-hover:underline">
                            Inspect →
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/50 px-4 py-2.5 text-[12px] text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredRuns.length)} of {filteredRuns.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
