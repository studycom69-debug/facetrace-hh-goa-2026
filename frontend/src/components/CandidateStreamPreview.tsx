import MaterialIcon from './MaterialIcon'
import type { Candidate } from '../types'
import { formatPercent } from '../utils/format'

interface CandidateStreamPreviewProps {
  candidates: Candidate[]
  bestMatchUrl?: string | null
  loading?: boolean
  threshold: number
}

function streamBadge(candidate: Candidate, isBest: boolean, threshold: number) {
  const score = candidate.similarity_score
  if (isBest && score != null) {
    return { label: `${formatPercent(score)} MATCH`, className: 'bg-secondary-container text-on-secondary-container font-bold' }
  }
  if (score != null && score >= threshold) {
    return { label: `${formatPercent(score)} MATCH`, className: 'bg-secondary-container text-on-secondary-container' }
  }
  if (score != null) {
    return { label: `${formatPercent(score)} PROX`, className: 'bg-surface-container-highest text-on-surface' }
  }
  if (candidate.comparison_status === 'pending' || candidate.comparison_status === 'queued') {
    return { label: 'QUEUED', className: 'bg-surface-container text-outline' }
  }
  return { label: candidate.comparison_status.replace(/_/g, ' ').toUpperCase(), className: 'bg-surface-container text-on-surface-variant' }
}

export default function CandidateStreamPreview({
  candidates,
  bestMatchUrl,
  loading,
  threshold,
}: CandidateStreamPreviewProps) {
  const top = candidates.slice(0, 3)

  if (!loading && top.length === 0) {
    return null
  }

  const slots: Array<Candidate | 'loading'> =
    top.length > 0 ? top : loading ? ['loading', 'loading', 'loading'] : []

  return (
    <div className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="section-label">Candidate stream</span>
          <h3 className="text-lg font-semibold text-on-surface">Top ranked matches</h3>
        </div>
        <span className="font-mono-code text-on-surface-variant">
          {loading ? 'Awaiting results…' : 'Sorted by similarity'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {slots.map((item, i) => {
          if (item === 'loading') {
            return (
              <div
                key={`loading-${i}`}
                className="relative flex flex-col gap-2 rounded-lg bg-surface-container-low p-3 opacity-50 shadow-sm"
              >
                <div className="flex h-36 items-center justify-center rounded bg-surface-container">
                  <MaterialIcon name="hourglass_empty" className="animate-pulse text-outline" size={32} />
                </div>
                <span className="font-mono-code font-bold text-outline">Awaiting…</span>
              </div>
            )
          }

          const candidate = item
          const isBest = candidate.source_url === bestMatchUrl
          const badge = streamBadge(candidate, isBest, threshold)

          return (
            <div
              key={candidate.source_url}
              className={`relative flex flex-col gap-2 rounded-lg bg-surface-container-low p-3 shadow-sm ${isBest ? '' : 'opacity-90'}`}
            >
              <div className={`absolute right-2 top-2 rounded px-1.5 py-0.5 font-mono-code text-[11px] ${badge.className}`}>
                {badge.label}
              </div>
              <div className="h-36 overflow-hidden rounded bg-surface-container-high">
                {candidate.thumbnail_base64 ? (
                  <img
                    src={`data:image/jpeg;base64,${candidate.thumbnail_base64}`}
                    alt={`Candidate from ${candidate.source_domain}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <MaterialIcon name="image" className="text-outline" size={28} />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-mono-code font-bold ${isBest ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {candidate.rank != null ? `CANDIDATE #${String(candidate.rank).padStart(2, '0')}` : 'CANDIDATE'}
                  {isBest ? ' (BEST)' : ''}
                </span>
                <span className="truncate text-[13px] text-on-surface">{candidate.source_domain}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
