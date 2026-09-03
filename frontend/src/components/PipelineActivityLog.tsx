import MaterialIcon from './MaterialIcon'
import type { ActivityEntry } from '../utils/pipelineHelpers'

interface PipelineActivityLogProps {
  entries: ActivityEntry[]
  loading: boolean
  stageLabel: string
  progressPercent: number
  stageDetail?: string
}

export default function PipelineActivityLog({
  entries,
  loading,
  stageLabel,
  progressPercent,
  stageDetail,
}: PipelineActivityLogProps) {
  return (
    <div className="card flex flex-col gap-4 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="section-label uppercase tracking-wider">{stageLabel}</span>
          <p className="mt-1 text-lg font-semibold text-on-surface">
            {stageDetail ?? (loading ? 'Processing pipeline stage' : 'Pipeline events recorded')}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[32px] font-bold leading-none text-on-surface">
            {progressPercent}
            <span className="text-lg font-normal text-on-surface-variant">%</span>
          </span>
          {loading && (
            <span className="mt-1 block font-mono-code text-on-surface-variant">Pipeline active</span>
          )}
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-surface-container p-0.5">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-4 font-mono-code">
        <div className="flex items-center justify-between pb-2 text-on-surface-variant">
          <span className="text-[11px]">SYSTEM EVENT STREAM</span>
          <span className="flex items-center gap-1.5 text-[11px]">
            {loading && (
              <>
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-secondary" />
                LIVE
              </>
            )}
            {!loading && entries.length > 0 && `${entries.length} events`}
          </span>
        </div>

        {entries.length === 0 && !loading && (
          <p className="text-[12px] text-on-surface-variant">No diagnostic events recorded.</p>
        )}

        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-start gap-2 text-[12px] ${
              entry.active
                ? 'rounded bg-surface-container-high p-2 font-semibold text-on-surface'
                : 'text-on-surface-variant'
            }`}
          >
            {entry.active ? (
              <MaterialIcon
                name="progress_activity"
                size={14}
                className="mt-0.5 shrink-0 animate-spin text-primary"
              />
            ) : (
              <span
                className={`shrink-0 font-bold ${entry.success ? 'text-secondary' : 'text-error'}`}
              >
                ✓
              </span>
            )}
            {entry.timestamp && (
              <span className="shrink-0 text-outline">{entry.timestamp}</span>
            )}
            <span className="min-w-0 break-words">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
