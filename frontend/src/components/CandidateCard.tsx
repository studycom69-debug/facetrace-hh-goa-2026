import MaterialIcon from './MaterialIcon'
import type { Candidate } from '../types'
import { comparisonLabel, formatPercent } from '../utils/format'
import StatusBadge from './StatusBadge'

interface CandidateCardProps {
  candidate: Candidate
  threshold: number
  highlight?: boolean
}

export default function CandidateCard({ candidate, threshold, highlight = false }: CandidateCardProps) {
  const score = candidate.similarity_score
  const passed = score != null && score >= threshold

  return (
    <article
      className={`card overflow-hidden transition-shadow hover:shadow-md ${
        highlight ? 'ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="aspect-[4/3] bg-surface-container-low">
        {candidate.thumbnail_base64 ? (
          <img
            src={`data:image/jpeg;base64,${candidate.thumbnail_base64}`}
            alt={`Candidate from ${candidate.source_domain}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <MaterialIcon name="image_not_supported" className="text-on-surface-variant" size={28} />
            <p className="text-[12px] text-on-surface-variant">
              {candidate.comparison_status === 'download_failed'
                ? 'Image could not be accessed'
                : 'Preview unavailable'}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {candidate.rank != null && (
              <p className="font-mono-code text-[11px] font-semibold text-on-surface-variant">
                #{candidate.rank}
              </p>
            )}
            <p className="truncate text-[15px] font-semibold text-on-surface">
              {candidate.source_domain}
            </p>
            {candidate.title && (
              <p className="mt-1 line-clamp-2 text-[13px] text-on-surface-variant">
                {candidate.title}
              </p>
            )}
          </div>
          {score != null && (
            <p className="shrink-0 text-xl font-semibold text-on-surface">{formatPercent(score)}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {passed ? (
            <StatusBadge tone="success">Above threshold</StatusBadge>
          ) : score != null ? (
            <StatusBadge tone="neutral">Below threshold</StatusBadge>
          ) : (
            <StatusBadge tone="warning">
              {comparisonLabel(candidate.comparison_status, score, threshold)}
            </StatusBadge>
          )}
        </div>

        <a
          href={candidate.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-on-surface hover:underline"
        >
          Open source
          <MaterialIcon name="open_in_new" size={14} />
        </a>
      </div>
    </article>
  )
}
