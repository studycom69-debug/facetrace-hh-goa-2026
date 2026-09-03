interface ProbeDossierProps {
  previewUrl: string | null
  fileName: string
  fingerprint: string | null
  dimensions: { w: number; h: number } | null
  fileSizeMb?: string | null
  modelUsed?: string | null
  faceDetected?: boolean
  loading?: boolean
  consent?: boolean
  isUrl?: boolean
}

export default function ProbeDossier({
  previewUrl,
  fileName,
  fingerprint,
  dimensions,
  fileSizeMb,
  modelUsed,
  faceDetected,
  loading,
  consent,
  isUrl = false,
}: ProbeDossierProps) {

  return (
    <div className="card flex flex-col items-stretch gap-6 p-6 shadow-sm md:flex-row">
      <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-lg bg-surface-container-high md:w-56">
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Probe evidence" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-primary/10" />
            <div className="pointer-events-none absolute left-[26%] top-[22%] h-[58%] w-[48%] rounded">
              <div className="absolute left-0 top-0 h-3 w-3 bg-secondary" />
              <div className="absolute right-0 top-0 h-3 w-3 bg-secondary" />
              <div className="absolute bottom-0 left-0 h-3 w-3 bg-secondary" />
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-secondary" />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary" />
            </div>
            {faceDetected && (
              <div className="absolute bottom-2 left-2 rounded bg-surface-container-lowest/90 px-1.5 py-0.5 font-mono-code text-[11px] text-on-surface backdrop-blur">
                Face detected
              </div>
            )}
            {loading && !faceDetected && (
              <div className="absolute bottom-2 left-2 rounded bg-surface-container-lowest/90 px-1.5 py-0.5 font-mono-code text-[11px] text-on-surface backdrop-blur">
                Scanning…
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-mono-code text-on-surface-variant">
            No preview
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="section-label tracking-wider">Probe asset dossier</span>
            {consent && (
              <span className="inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 font-mono-code text-[11px] font-bold text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                AUTHORIZED SOURCE
              </span>
            )}
          </div>
          <h2 className="truncate text-xl font-semibold text-on-surface">{fileName}</h2>
          {fingerprint ? (
            <p className="mt-1 break-all font-mono text-[12px] text-on-surface-variant">
              SHA-256: {fingerprint}
            </p>
          ) : loading ? (
            <p className="mt-1 font-mono-code text-on-surface-variant">Computing input fingerprint…</p>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-surface-container-low p-4 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <span className="section-label">Resolution</span>
            <span className="font-mono text-[12px] font-semibold text-on-surface">
              {dimensions ? `${dimensions.w} × ${dimensions.h} px` : loading ? 'Reading…' : '—'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="section-label">File size</span>
            <span className="font-mono text-[12px] font-semibold text-on-surface">
              {fileSizeMb ? `${fileSizeMb} MB` : isUrl ? 'Remote URL' : '—'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="section-label">Analysis model</span>
            <span className="font-mono text-[12px] font-semibold text-on-surface">
              {modelUsed ?? (loading ? 'YuNet + SFace' : '—')}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="section-label">Input type</span>
            <span className="font-mono text-[12px] font-semibold text-on-surface">
              {isUrl ? 'Public URL' : 'Local upload'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="section-label">Face status</span>
            <span
              className={`font-mono text-[12px] font-semibold ${faceDetected ? 'text-secondary' : loading ? 'text-on-surface-variant' : 'text-on-surface'}`}
            >
              {faceDetected ? 'Detected' : loading ? 'Analyzing…' : 'Pending'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="section-label">Authorization</span>
            <span
              className={`font-mono text-[12px] font-semibold ${consent ? 'text-secondary' : 'text-on-surface-variant'}`}
            >
              {consent ? 'Confirmed valid' : 'Not confirmed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
