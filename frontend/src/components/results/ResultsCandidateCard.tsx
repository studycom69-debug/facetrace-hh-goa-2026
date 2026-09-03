import MaterialIcon from '../MaterialIcon'
import type { Candidate } from '../../types'
import { formatPercent } from '../../utils/format'
import { candidateOutcomeLabel, pathFromUrl } from '../../utils/resultsHelpers'

interface ResultsCandidateCardProps {
  candidate: Candidate
  threshold: number
}

export default function ResultsCandidateCard({ candidate, threshold }: ResultsCandidateCardProps) {
  const score = candidate.similarity_score
  const outcome = candidateOutcomeLabel(candidate, threshold)
  const failed = outcome.tone === 'failed'
  const isMatch = outcome.tone === 'match'

  return (
    <article
      className={`group flex flex-col justify-between gap-2 rounded-xl bg-surface-container-lowest p-3 shadow-sm transition-shadow hover:shadow-md ${failed ? 'opacity-85' : ''}`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface-container-highest">
          {!failed && candidate.thumbnail_base64 ? (
            <img
              src={`data:image/jpeg;base64,${candidate.thumbnail_base64}`}
              alt={`Candidate from ${candidate.source_domain}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-3 text-center">
              <MaterialIcon
                name={failed ? 'broken_image' : 'image_not_supported'}
                className={failed ? 'text-error' : 'text-on-surface-variant'}
                size={28}
              />
              <span className={`mt-1 font-mono-code text-[11px] font-medium ${failed ? 'text-error' : 'text-on-surface-variant'}`}>
                {outcome.label}
              </span>
            </div>
          )}
          {candidate.rank != null && (
            <div className="absolute left-2 top-2 rounded bg-primary/90 px-1.5 py-0.5 font-mono-code text-[10px] text-on-primary">
              #{candidate.rank}
            </div>
          )}
          <div
            className={`absolute right-2 top-2 rounded px-1.5 py-0.5 font-mono-code text-[10px] font-semibold ${
              isMatch
                ? 'bg-secondary text-on-secondary'
                : score != null
                  ? 'bg-surface-container-highest text-on-surface'
                  : 'bg-error-container text-on-error-container'
            }`}
          >
            {score != null ? formatPercent(score) : 'N/A'}
          </div>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <span
            className={`flex items-center gap-1 font-mono-code text-[11px] font-medium ${
              isMatch ? 'text-secondary' : failed ? 'text-error' : 'text-on-surface-variant'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isMatch ? 'bg-secondary' : failed ? 'bg-error' : 'bg-outline'}`}
            />
            {outcome.label}
          </span>
        </div>

        <p className="truncate text-[13px] font-medium text-on-surface" title={candidate.source_domain}>
          {candidate.source_domain}
        </p>
        <span className="truncate font-mono text-[11px] text-on-surface-variant">
          {candidate.title ?? pathFromUrl(candidate.source_url)}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2">
        <span className="font-mono-code text-[10px] text-on-surface-variant">
          {candidate.comparison_status.replace(/_/g, ' ')}
        </span>
        {failed ? (
          <span className="text-[12px] text-on-surface-variant/60">Skipped</span>
        ) : (
          <a
            href={candidate.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[12px] font-medium text-primary hover:text-on-surface-variant"
          >
            Open source
            <MaterialIcon name="north_east" size={13} />
          </a>
        )}
      </div>
    </article>
  )
}
