import MaterialIcon from './MaterialIcon'
import type { PipelineStep, StepStatus } from '../types'
import { activeStepIndex, completedStepCount, pipelineProgressPercent } from '../utils/pipelineHelpers'

interface ForensicStepperProps {
  steps: PipelineStep[]
  runId?: string | null
  inputFingerprint?: string | null
  modelUsed?: string | null
  loading?: boolean
}

function stepIcon(status: StepStatus, stepId: number): string {
  if (status === 'completed') return 'check'
  if (status === 'processing') return 'autorenew'
  if (status === 'failed') return 'close'
  if (status === 'waiting') return 'hourglass_empty'
  if (stepId === 6) return 'verified'
  return 'hourglass_empty'
}

function stepBadgeClass(status: StepStatus): string {
  if (status === 'processing') return 'bg-primary text-on-primary shadow-md'
  if (status === 'completed') return 'bg-secondary-container text-on-secondary-container'
  if (status === 'failed') return 'bg-error-container text-on-error-container'
  return 'bg-surface-container text-on-surface-variant'
}

export default function ForensicStepper({
  steps,
  runId,
  inputFingerprint,
  modelUsed,
  loading,
}: ForensicStepperProps) {
  const currentIdx = activeStepIndex(steps)
  const completed = completedStepCount(steps)
  const progress = pipelineProgressPercent(steps)

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-6">
        <div className="mb-5 flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
          <span className="section-label tracking-wider">Sequential audit stepper</span>
          <span className="font-mono-code font-semibold text-secondary">
            STAGE {String(Math.min(currentIdx + 1, 6)).padStart(2, '0')}/06
          </span>
        </div>

        <ol className="relative flex flex-col gap-6 pl-0.5" aria-label="Pipeline progress">
          <div
            className="absolute bottom-6 left-[15px] top-3 z-0 w-0.5 bg-surface-container-high"
            aria-hidden="true"
          />

          {steps.map((step) => {
            const isActive = step.status === 'processing'
            const isPending = step.status === 'not_started' || step.status === 'waiting'
            return (
              <li
                key={step.id}
                className={`relative z-10 flex items-start gap-3 ${isPending ? 'opacity-60' : ''}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${stepBadgeClass(step.status)} ${isActive ? 'animate-pulse' : ''}`}
                >
                  <MaterialIcon
                    name={stepIcon(step.status, step.id)}
                    size={18}
                    className={isActive ? 'animate-spin' : undefined}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`font-mono-code font-semibold ${isActive ? 'font-bold text-primary' : 'text-on-surface-variant'}`}
                    >
                      {String(step.id).padStart(2, '0')}
                    </span>
                    <span
                      className={`text-[15px] font-semibold ${isActive ? 'font-bold text-on-surface' : isPending ? 'text-on-surface-variant' : 'text-on-surface'}`}
                    >
                      {step.label}
                    </span>
                    {isActive && (
                      <span className="ml-1 rounded bg-surface-dim px-1.5 py-0.5 font-mono-code text-[11px] text-on-surface">
                        RUNNING
                      </span>
                    )}
                  </div>
                  {step.detail && (
                    <p
                      className={`mt-0.5 text-[12px] leading-relaxed ${isActive ? 'font-medium text-on-surface' : isPending ? 'text-outline' : 'text-on-surface-variant'}`}
                    >
                      {step.detail}
                    </p>
                  )}
                  {isActive && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  {(step.elapsedNote || step.statusNote) && (
                    <span
                      className={`mt-1 block font-mono-code text-[11px] ${
                        step.status === 'completed'
                          ? 'text-secondary'
                          : isActive
                            ? 'text-on-surface-variant'
                            : 'text-outline'
                      }`}
                    >
                      {step.elapsedNote ?? step.statusNote}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="rounded-xl bg-surface-container-low p-4 font-mono-code text-[11px] text-on-surface-variant">
        <div className="mb-1.5 flex items-center justify-between">
          <span>PIPELINE_STATUS</span>
          <span>{completed}/6 stages complete</span>
        </div>
        {runId && (
          <div className="mb-1.5 flex items-center justify-between">
            <span>RUN_ID</span>
            <span className="truncate pl-4 font-mono">{runId.slice(0, 12)}…</span>
          </div>
        )}
        {modelUsed && (
          <div className="mb-1.5 flex items-center justify-between">
            <span>ANALYSIS_MODEL</span>
            <span className="truncate pl-4 text-right">{modelUsed}</span>
          </div>
        )}
        {inputFingerprint && (
          <div className="flex items-center justify-between gap-2">
            <span className="shrink-0">INPUT_FINGERPRINT</span>
            <span className="truncate font-mono text-[10px]">
              {inputFingerprint.slice(0, 8)}…{inputFingerprint.slice(-4)}
            </span>
          </div>
        )}
        {loading && !inputFingerprint && (
          <div className="flex items-center justify-between">
            <span>SESSION</span>
            <span className="text-secondary">Active</span>
          </div>
        )}
      </div>
    </div>
  )
}
