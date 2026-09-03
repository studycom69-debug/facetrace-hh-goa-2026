import MaterialIcon from './MaterialIcon'
import type { PipelineStep, StepStatus } from '../types'

interface PipelineStepsProps {
  steps: PipelineStep[]
  activeStep?: number
}

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: 'Upload an image or provide a public URL.',
  2: 'Detect and process the visual face information.',
  3: 'Search publicly indexed visual matches.',
  4: 'Compare accessible candidates and rank visual similarity.',
  5: 'Create a tamper-evident evidence record.',
  6: 'Verify the evidence against the stored record.',
}

function statusLabel(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return 'Complete'
    case 'processing':
      return 'In progress'
    case 'failed':
      return 'Failed'
    case 'waiting':
      return 'Waiting'
    default:
      return 'Pending'
  }
}

function stepBadgeClass(status: StepStatus, isActive: boolean): string {
  if (status === 'processing' || isActive) {
    return 'bg-primary text-on-primary shadow-sm'
  }
  if (status === 'completed') {
    return 'bg-secondary-container text-on-secondary-container'
  }
  if (status === 'failed') {
    return 'bg-error-container text-on-error-container'
  }
  return 'bg-surface-container text-on-surface-variant'
}

function statusBadgeClass(status: StepStatus): string {
  if (status === 'completed') return 'bg-secondary-container text-on-secondary-container'
  if (status === 'processing') return 'bg-surface-container-high text-on-surface'
  if (status === 'failed') return 'bg-error-container text-on-error-container'
  return 'text-on-surface-variant'
}

export default function PipelineSteps({ steps, activeStep }: PipelineStepsProps) {
  const currentIdx =
    activeStep ??
    steps.findIndex((s) => s.status === 'processing') ??
    steps.filter((s) => s.status === 'completed').length

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="card flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div>
            <span className="section-label">Pipeline process</span>
            <p className="mt-1 text-lg font-semibold text-on-surface">Execution sequence</p>
          </div>
          <span className="rounded bg-surface-container px-2 py-0.5 font-mono-code text-on-surface">
            {String(Math.min(currentIdx + 1, 6)).padStart(2, '0')} / 06
          </span>
        </div>

        <ol className="relative flex flex-col" aria-label="Pipeline progress">
          <div
            className="absolute bottom-6 left-4 top-4 z-0 w-0.5 bg-surface-container-high"
            aria-hidden="true"
          />

          {steps.map((step) => {
            const isActive = step.status === 'processing'
            return (
              <li
                key={step.id}
                className="relative z-10 flex items-start gap-4 pb-6 last:pb-0"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded font-mono-code text-[11px] font-medium ${stepBadgeClass(step.status, isActive)}`}
                >
                  {String(step.id).padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold text-on-surface">{step.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono-code text-[11px] ${statusBadgeClass(step.status)}`}
                    >
                      {statusLabel(step.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-on-surface-variant">
                    {STEP_DESCRIPTIONS[step.id]}
                  </p>
                  {step.status === 'processing' && (
                    <div className="mt-2 flex items-center gap-1.5 text-[12px] text-on-surface-variant">
                      <MaterialIcon name="progress_activity" className="animate-spin" size={14} />
                      Processing…
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        <div className="rounded-lg bg-surface-container-low p-4">
          <span className="section-label">Evidence integrity</span>
          <p className="mt-1 font-mono-code leading-relaxed text-on-surface-variant">
            Each stage produces auditable pipeline evidence. Final records are sealed with SHA-256
            fingerprints in a local tamper-evident ledger.
          </p>
        </div>
      </div>
    </aside>
  )
}
