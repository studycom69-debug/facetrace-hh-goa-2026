import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MaterialIcon from '../MaterialIcon'
import ResultsCandidateCard from './ResultsCandidateCard'
import TechnicalDetails from '../TechnicalDetails'
import VerificationPanel from '../VerificationPanel'
import type { ResultsViewModel } from '../../utils/resultsHelpers'
import {
  type CandidateFilter,
  filterCandidates,
  isNewsPress,
  truncateHash,
} from '../../utils/resultsHelpers'
import { isSocialPlatform } from '../../utils/socialPlatforms'
import { formatPercent } from '../../utils/format'

interface ResultsViewProps {
  data: ResultsViewModel
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      className="rounded p-0.5 text-on-surface-variant hover:text-secondary"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        })
      }}
    >
      <MaterialIcon name={copied ? 'done' : 'content_copy'} size={14} />
    </button>
  )
}

export default function ResultsView({ data }: ResultsViewProps) {
  const [filter, setFilter] = useState<CandidateFilter>('all')
  const [domainQuery, setDomainQuery] = useState('')

  const matchCount = data.visualMatches
  const socialCount = data.candidates.filter((c) => isSocialPlatform(c.source_domain)).length
  const newsCount = data.candidates.filter((c) => isNewsPress(c.source_domain)).length

  const filtered = useMemo(() => {
    let list = filterCandidates(data.candidates, filter, data.threshold)
    if (domainQuery.trim()) {
      const q = domainQuery.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.source_domain.toLowerCase().includes(q) ||
          c.source_url.toLowerCase().includes(q),
      )
    }
    return list
  }, [data.candidates, data.threshold, domainQuery, filter])

  const best = data.bestMatch
  const bestScore = best?.similarity_score ?? data.bestSimilarity

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
      {/* Breadcrumb */}
      <div className="flex flex-col justify-between gap-3 pb-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1 font-mono-code text-[11px] text-on-surface-variant">
          <Link to="/history" className="hover:text-on-surface">
            Pipeline runs
          </Link>
          <span>/</span>
          <span className="font-semibold text-on-surface">
            {truncateHash(data.runId, 8, 4).toUpperCase()}
            {data.finalized ? ' (FINALIZED)' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-[12px] text-on-surface shadow-sm transition-colors hover:bg-surface-container"
          >
            <MaterialIcon name="print" size={15} />
            Export audit slip
          </button>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] text-on-primary shadow-sm transition-colors hover:opacity-90"
          >
            <MaterialIcon name="add" size={15} />
            New search
          </Link>
        </div>
      </div>

      {/* Evidence summary metrics */}
      <section className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Candidates found', data.candidatesFound, 'Global index scan'],
            ['Analyzed', data.candidatesAnalyzed, 'Top-k deep analysis'],
            ['Visual matches', data.visualMatches, `>${(data.threshold * 100).toFixed(0)}% threshold`],
            ['Best similarity', bestScore != null ? formatPercent(bestScore) : '—', 'Rank #1 alignment'],
            ['Record status', data.blockchainRecorded ? 'RECORDED' : 'NOT RECORDED', data.blockchainRecorded ? 'Chain sealed' : 'No ledger entry'],
            ['Pipeline status', data.status, data.executionSeconds != null ? `${data.executionSeconds}s elapsed` : 'Completed run'],
          ].map(([label, value, sub]) => (
            <div key={String(label)} className="flex flex-col rounded-lg bg-surface-container-low/60 p-3">
              <span className="section-label tracking-wider">{label}</span>
              <span
                className={`mt-1 text-xl font-semibold text-on-surface ${label === 'Visual matches' || label === 'Best similarity' ? 'text-secondary' : ''}`}
              >
                {value}
              </span>
              <span className="mt-0.5 font-mono-code text-[11px] text-on-surface-variant">{sub}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-container-low/30 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2 font-mono-code text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              Ledger proof:
            </span>
            {data.blockchain ? (
              <span className="rounded bg-surface-container-lowest px-2 py-0.5 font-semibold tracking-tight text-on-surface shadow-sm">
                {truncateHash(data.blockchain.data_hash, 6, 4)}
              </span>
            ) : (
              <span>Not recorded</span>
            )}
            {data.modelUsed && (
              <>
                <span className="hidden text-on-surface-variant/60 sm:inline">|</span>
                <span className="hidden sm:inline">Engine: {data.modelUsed}</span>
              </>
            )}
          </div>
          {data.blockchain?.timestamp && (
            <span className="font-mono-code text-[11px] text-on-surface-variant">
              Audit timestamp: {new Date(data.blockchain.timestamp).toUTCString()}
            </span>
          )}
        </div>
      </section>

      {/* Best visual match hero */}
      {best && (
        <section className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-surface-container-high px-2.5 py-1 font-mono-code text-[11px] uppercase tracking-widest text-on-surface">
                Best visual match
              </span>
              {best.rank != null && (
                <span className="flex items-center gap-1 rounded bg-secondary-container/40 px-2.5 py-1 font-mono-code text-[11px] font-medium text-on-secondary-container">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Rank {best.rank} of {data.candidatesFound}
                </span>
              )}
            </div>
            {bestScore != null && (
              <span className="font-mono-code text-on-surface-variant">
                Similarity: {formatPercent(bestScore)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="flex flex-col gap-3 lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Probe */}
                <div className="flex flex-col rounded-lg bg-surface-container-low p-3">
                  <div className="flex items-center justify-between pb-2 font-mono-code text-[11px] text-on-surface-variant">
                    <span>PROBE (ORIGIN)</span>
                    <span className="text-on-surface">
                      {data.dimensions ? `${data.dimensions.w}×${data.dimensions.h}` : '—'}
                    </span>
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-highest">
                    {data.probePreview ? (
                      <img src={data.probePreview} alt="Probe" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-mono-code text-on-surface-variant">
                        No preview
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 rounded bg-primary/80 px-1.5 py-0.5 font-mono-code text-[10px] text-on-primary backdrop-blur">
                      SOURCE INPUT
                    </div>
                  </div>
                  {data.probeFingerprint && (
                    <div className="mt-2 flex items-center justify-between font-mono-code text-[10px] text-on-surface-variant">
                      <span>Hash: {truncateHash(data.probeFingerprint, 6, 4)}</span>
                    </div>
                  )}
                </div>

                {/* Best candidate */}
                <div className="flex flex-col rounded-lg bg-surface-container-low p-3">
                  <div className="flex items-center justify-between pb-2 font-mono-code text-[11px] text-on-surface-variant">
                    <span>CANDIDATE #{best.rank ?? 1}</span>
                    <span className="text-on-surface">{best.source_domain}</span>
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-highest">
                    {best.thumbnail_base64 ? (
                      <img
                        src={`data:image/jpeg;base64,${best.thumbnail_base64}`}
                        alt={`Best match from ${best.source_domain}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-mono-code text-on-surface-variant">
                        Preview unavailable
                      </div>
                    )}
                    {bestScore != null && bestScore >= data.threshold && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 font-mono-code text-[10px] text-on-secondary">
                        <MaterialIcon name="check" size={10} />
                        {formatPercent(bestScore)} match
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono-code text-[10px] text-on-surface-variant">
                    <span>Source: {best.source_domain}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-container-low/70 p-3 font-mono-code text-[11px] text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="compare_arrows" className="text-secondary" size={16} />
                  <span>
                    Cosine similarity:{' '}
                    <strong className="text-on-surface">{bestScore != null ? formatPercent(bestScore) : '—'}</strong>
                  </span>
                </div>
                {bestScore != null && bestScore >= data.threshold && (
                  <span className="font-semibold text-secondary">Above threshold</span>
                )}
              </div>
            </div>

            <div className="flex h-full flex-col justify-between gap-4 lg:col-span-6">
              <div className="flex flex-col gap-4">
                {bestScore != null && (
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary-container/50 px-3 py-1 font-mono-code text-[12px] font-semibold text-on-secondary-container">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                    {formatPercent(bestScore)} visual similarity
                  </div>
                )}
                {best.title && (
                  <h3 className="text-lg font-semibold leading-snug text-on-surface">{best.title}</h3>
                )}

                <div className="flex items-start gap-3 rounded-lg bg-surface-container-high/40 p-3">
                  <MaterialIcon name="info" className="mt-0.5 text-on-surface-variant" size={18} />
                  <div>
                    <span className="section-label text-on-surface">Forensic evidentiary notice</span>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-on-surface-variant">
                      Visual similarity represents cosine proximity in vector space — not positive legal
                      identity proof. Corroborate via independent verification.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 rounded-lg bg-surface-container-low/60 p-4 font-mono text-[12px]">
                  <div className="flex justify-between border-b border-outline-variant/30 py-1.5">
                    <span className="text-on-surface-variant">Source domain</span>
                    <span className="flex items-center gap-1 font-semibold text-on-surface">
                      {best.source_domain}
                      <MaterialIcon name="verified_user" className="text-secondary" size={14} />
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/30 py-1.5">
                    <span className="text-on-surface-variant">Comparison status</span>
                    <span className="text-on-surface">{best.comparison_status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-on-surface-variant">Source URL</span>
                    <span className="max-w-[240px] truncate text-on-surface-variant">{best.source_url}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={best.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-4 py-2 text-[12px] font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container-highest"
                >
                  Open source asset
                  <MaterialIcon name="open_in_new" size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Candidate explorer */}
      {data.candidates.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-lowest p-3 shadow-sm md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  ['all', `All results (${data.candidates.length})`],
                  ['matches', `Visual matches (${matchCount})`],
                  ['social', `Social platforms (${socialCount})`],
                  ['news', `News / press (${newsCount})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    filter === key
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative flex items-center">
              <MaterialIcon
                name="filter_list"
                className="absolute left-2.5 text-on-surface-variant"
                size={16}
              />
              <input
                type="text"
                value={domainQuery}
                onChange={(e) => setDomainQuery(e.target.value)}
                placeholder="Filter domain or URL…"
                className="w-48 rounded-lg bg-surface-container-low py-1 pl-8 pr-3 font-mono text-[12px] text-on-surface placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary lg:w-60"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl bg-surface-container-low p-6 text-[13px] text-on-surface-variant">
              No candidates match the current filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {filtered.map((candidate) => (
                <ResultsCandidateCard
                  key={`${candidate.source_url}-${candidate.rank}`}
                  candidate={candidate}
                  threshold={data.threshold}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Evidence record + verification */}
      {data.blockchain && (
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <section className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm lg:col-span-7">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="history_edu" className="text-primary" size={22} />
                  <h3 className="text-lg font-semibold text-on-surface">Evidence record</h3>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-secondary-container/40 px-2.5 py-1 font-mono-code text-[11px] font-semibold text-on-secondary-container">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  RECORDED
                </span>
              </div>
              <p className="mt-2 text-[13px] text-on-surface-variant">
                A tamper-evident fingerprint of the evidence payload has been recorded in the local
                verification ledger.
              </p>
            </div>

            <div className="flex flex-col gap-1 rounded-lg bg-surface-container-low/80 p-4 font-mono-code text-[11px]">
              {[
                ['Record ID', data.blockchain.record_id, true],
                ['SHA-256 fingerprint', data.blockchain.data_hash, true],
                ['Block number', `#${data.blockchain.block_index}`, false],
                ['Block hash', data.blockchain.block_hash, true],
                ['Previous block hash', data.blockchain.previous_hash || '—', false],
                ['Timestamp', new Date(data.blockchain.timestamp).toUTCString(), false],
              ].map(([label, value, copyable]) => (
                <div
                  key={String(label)}
                  className="flex flex-col justify-between gap-1 border-b border-outline-variant/30 py-2 last:border-0 sm:flex-row sm:items-center"
                >
                  <span className="text-on-surface-variant">{label}</span>
                  <div className="flex items-center gap-1 font-semibold text-on-surface">
                    <span className="break-all">{String(value)}</span>
                    {copyable && typeof value === 'string' && value !== '—' && (
                      <CopyButton value={value} label={String(label)} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="lg:col-span-5">
            <VerificationPanel
              recordId={data.blockchain.record_id}
              initialStatus={data.verificationStatus}
              variant="results"
            />
          </div>
        </div>
      )}

      {data.diagnostics && <TechnicalDetails diagnostics={data.diagnostics} variant="results" />}

      <div className="flex flex-col items-center justify-between gap-3 pb-6 font-mono-code text-[11px] text-on-surface-variant sm:flex-row">
        <div className="flex items-center gap-2">
          <MaterialIcon name="shield" className="text-secondary" size={16} />
          <span>Local SHA-256 tamper-evident ledger</span>
        </div>
        <Link to="/history" className="transition-colors hover:text-on-surface">
          View all pipeline runs
        </Link>
      </div>
    </div>
  )
}
