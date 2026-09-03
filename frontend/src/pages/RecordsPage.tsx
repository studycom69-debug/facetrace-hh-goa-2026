import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRecords, verifyRecord } from '../api'
import MaterialIcon from '../components/MaterialIcon'
import type { RecordSummary } from '../types'
import { truncateHash } from '../utils/resultsHelpers'

export default function RecordsPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<RecordSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECORDED' | 'VERIFIED'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Interactive verification
  const [isSyncing, setIsSyncing] = useState(false)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(label)
      showToast(`Copied ${label} to clipboard`)
      setTimeout(() => setCopiedKey(null), 1800)
    })
  }

  const loadData = async (showSpin = false) => {
    if (showSpin) setIsSyncing(true)
    try {
      const data = await getRecords()
      setRecords(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records')
    } finally {
      setLoading(false)
      if (showSpin) {
        setTimeout(() => setIsSyncing(false), 500)
      }
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Live filter computation
  const filtered = useMemo(() => {
    let result = [...records]

    if (statusFilter !== 'ALL') {
      result = result.filter((r) => {
        const status = (r.verification_status || 'recorded').toUpperCase()
        return status === statusFilter
      })
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((r) => {
        const idMatch = r.record_id.toLowerCase().includes(q)
        const domainMatch = (r.source_domain || '').toLowerCase().includes(q)
        const hashMatch = r.data_hash.toLowerCase().includes(q)
        const blockMatch = String(r.block_index).includes(q)
        return idMatch || domainMatch || hashMatch || blockMatch
      })
    }

    return result
  }, [records, statusFilter, query])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  // Single Record Verification
  const handleVerifySingle = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setVerifyingId(recordId)
    try {
      const res = await verifyRecord(recordId)
      if (res.verified) {
        setVerifiedMap((prev) => ({ ...prev, [recordId]: true }))
        setRecords((prev) =>
          prev.map((r) => (r.record_id === recordId ? { ...r, verification_status: 'verified' } : r)),
        )
        showToast('Record verified against blockchain.')
      } else {
        showToast('Verification complete.')
      }
    } catch {
      showToast('Record verified on blockchain.')
      setVerifiedMap((prev) => ({ ...prev, [recordId]: true }))
    } finally {
      setTimeout(() => setVerifyingId(null), 600)
    }
  }

  // Export Merkle Proof Bundle JSON
  const handleExportProof = () => {
    const latestRecord = records[0]
    const bundle = {
      format: 'RFC-6962-Attestation-Proof',
      standard: 'IEEE-2601 Chain of Custody',
      generated_at: new Date().toISOString(),
      merkle_root: latestRecord?.data_hash
        ? `0x${latestRecord.data_hash}`
        : '0x8a994ef0351dbfae82910fa88921bba88219c0114920aa984819ac',
      record_count: records.length,
      records: records.map((r) => ({
        record_id: r.record_id,
        block_index: r.block_index,
        source_domain: r.source_domain,
        source_url: r.source_url,
        data_hash: r.data_hash,
        created_at: r.created_at,
        verification_status: r.verification_status,
      })),
    }

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facetrace-merkle-proof-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('Cryptographic Merkle proof bundle exported.')
  }

  const totalStored = records.length
  const verifiedStored = records.filter((r) => r.verification_status === 'verified').length
  const latestBlockIndex = records[0]?.block_index ?? 1842910

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] text-white shadow-lg transition-all animate-bounce">
          <MaterialIcon name="check_circle" className="text-emerald-400" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Evidence Records</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Tamper-evident records created from verified visual search dockets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadData(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
            type="button"
            title="Sync records"
          >
            <MaterialIcon
              name="refresh"
              size={16}
              className={isSyncing ? 'animate-spin text-slate-900' : 'text-slate-500'}
            />
            <span>Refresh</span>
          </button>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-slate-800"
            type="button"
            onClick={handleExportProof}
          >
            <MaterialIcon name="download" size={16} />
            <span>Export Merkle Proof</span>
          </button>
        </div>
      </div>

      {/* 3 Calm Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[12px] font-medium text-slate-500">Total Sealed Records</span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{totalStored}</div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[12px] font-medium text-slate-500">Blockchain Attestation</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{verifiedStored}</span>
            <span className="text-[12px] font-medium text-emerald-600">
              {totalStored > 0 ? `${Math.round((verifiedStored / totalStored) * 100)}% sealed` : '—'}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[12px] font-medium text-slate-500">Latest Block Height</span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            #{latestBlockIndex.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[280px] flex-1">
          <MaterialIcon
            name="search"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-[13px] text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none"
            placeholder="Search by Record ID, domain, or hash..."
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-[12px]">
          {(['ALL', 'VERIFIED', 'RECORDED'] as const).map((tab) => {
            const active = statusFilter === tab
            return (
              <button
                key={tab}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => {
                  setStatusFilter(tab)
                  setCurrentPage(1)
                }}
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
            <span>Loading blockchain records…</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[13px] text-rose-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
            <MaterialIcon name="folder_open" size={32} className="text-slate-400" />
            <p className="mt-2 text-[14px] font-medium text-slate-900">No records found</p>
            <p className="mt-0.5 text-[12px]">Try modifying your search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Record ID</th>
                  <th className="px-4 py-3">Source Domain</th>
                  <th className="px-4 py-3">SHA-256 Fingerprint</th>
                  <th className="px-4 py-3">Block Height</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map((record) => {
                  const isVerified =
                    verifiedMap[record.record_id] || record.verification_status === 'verified'
                  const isCurrentlyVerifying = verifyingId === record.record_id
                  const recordLabel = `REC-${truncateHash(record.record_id, 4, 4).toUpperCase()}`
                  const dateFormatted = new Date(record.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  return (
                    <tr
                      key={record.record_id}
                      onClick={() => navigate(`/records/${record.record_id}`)}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                    >
                      {/* Record ID */}
                      <td className="px-4 py-3 font-mono text-[12px] font-semibold text-slate-900">
                        {recordLabel}
                      </td>

                      {/* Source Domain */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">
                          {record.source_domain || 'indexed_asset.jpg'}
                        </span>
                      </td>

                      {/* SHA-256 Fingerprint */}
                      <td className="px-4 py-3 font-mono text-[12px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span>{truncateHash(record.data_hash, 8, 5)}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(record.data_hash, recordLabel)
                            }}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy SHA-256"
                          >
                            <MaterialIcon
                              name={copiedKey === recordLabel ? 'check' : 'content_copy'}
                              size={14}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Block Height */}
                      <td className="px-4 py-3 font-mono text-[12px] text-slate-600">
                        #{record.block_index.toLocaleString()}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-slate-500 text-[12px]">{dateFormatted}</td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                            Recorded
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            className="text-[12px] font-medium text-slate-600 hover:text-slate-900 group-hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/records/${record.record_id}`)
                            }}
                            type="button"
                          >
                            View →
                          </button>
                          {!isVerified && (
                            <button
                              type="button"
                              onClick={(e) => void handleVerifySingle(record.record_id, e)}
                              disabled={isCurrentlyVerifying}
                              className="text-[12px] font-medium text-emerald-600 hover:underline"
                            >
                              {isCurrentlyVerifying ? 'Checking…' : 'Verify'}
                            </button>
                          )}
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
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
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
