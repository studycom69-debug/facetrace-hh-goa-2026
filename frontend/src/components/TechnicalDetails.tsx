import { useState } from 'react'
import type { PipelineDiagnostics } from '../types'
import { formatPercent } from '../utils/format'
import MaterialIcon from './MaterialIcon'
import StatusBadge from './StatusBadge'

interface TechnicalDetailsProps {
  diagnostics: PipelineDiagnostics | null
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.slice(0, 40)
  }
}

function readableDetails(details?: Record<string, unknown>): string | null {
  if (!details || Object.keys(details).length === 0) return null
  const parts: string[] = []
  if (details.face_count != null) parts.push(`${details.face_count} face(s)`)
  if (details.confidence != null) parts.push(`confidence ${Number(details.confidence).toFixed(2)}`)
  if (details.model != null) parts.push(String(details.model))
  if (details.dimensions != null) parts.push(`${details.dimensions}-dim embedding`)
  if (details.provider != null) parts.push(String(details.provider))
  if (details.api_status != null) parts.push(`HTTP ${details.api_status}`)
  if (details.result_count != null) parts.push(`${details.result_count} results`)
  if (details.block_index != null) parts.push(`block ${details.block_index}`)
  return parts.length > 0 ? parts.join(' · ') : null
}

export default function TechnicalDetails({ diagnostics }: TechnicalDetailsProps) {
  const [open, setOpen] = useState(false)
  if (!diagnostics) return null

  const stages = [
    { name: 'Face detection', data: diagnostics.face_detection },
    { name: 'Face embedding', data: diagnostics.face_embedding },
    { name: 'Image submission', data: diagnostics.image_submission },
    { name: 'Public search', data: diagnostics.search_provider },
    { name: 'Blockchain record', data: diagnostics.blockchain },
  ].filter((stage) => stage.data)

  const downloadsSucceeded = diagnostics.candidate_downloads.filter((d) => d.success).length
  const downloadsFailed = diagnostics.candidate_downloads.length - downloadsSucceeded
  const comparisonsSucceeded = diagnostics.face_comparisons.filter((c) => c.success).length
  const comparisonsFailed = diagnostics.face_comparisons.length - comparisonsSucceeded

  const comparisonRows = diagnostics.face_comparisons.map((item, index) => ({
    key: `${domainFromUrl(item.url)}-${index}`,
    domain: domainFromUrl(item.url),
    outcome: item.success ? 'Compared' : 'Unavailable',
    score: item.similarity_score,
    note: item.success
      ? 'Face compared successfully'
      : item.message.includes('face')
        ? 'No usable face detected'
        : item.message.includes('HTTP') || item.message.includes('Download')
          ? 'Image could not be accessed'
          : item.message,
  }))

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-surface-container-low"
        aria-expanded={open}
      >
        <div>
          <p className="text-[13px] font-medium text-on-surface">View technical evidence</p>
          <p className="mt-0.5 text-[12px] text-on-surface-variant">
            Pipeline diagnostics for reviewers and judges
          </p>
        </div>
        <MaterialIcon name={open ? 'expand_less' : 'expand_more'} className="text-on-surface-variant" />
      </button>

      {open && (
        <div className="space-y-6 border-t border-outline-variant/40 px-6 py-5 text-[13px]">
          <div>
            <h3 className="section-label">Pipeline stages</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead className="border-b border-outline-variant/40 text-[11px] uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th className="pb-2 pr-4 font-semibold">Stage</th>
                    <th className="pb-2 pr-4 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((stage) => {
                    const detail = readableDetails(stage.data?.details)
                    return (
                      <tr key={stage.name} className="border-b border-outline-variant/30 last:border-0">
                        <td className="py-3 pr-4 font-medium text-on-surface">{stage.name}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge tone={stage.data?.success ? 'success' : 'danger'}>
                            {stage.data?.success ? 'Complete' : 'Issue'}
                          </StatusBadge>
                        </td>
                        <td className="py-3 text-on-surface-variant">
                          {stage.data?.message}
                          {detail ? <span className="mt-1 block text-[12px]">{detail}</span> : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {(diagnostics.candidate_downloads.length > 0 || comparisonRows.length > 0) && (
            <div>
              <h3 className="section-label">Candidate processing</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Downloads succeeded', downloadsSucceeded],
                  ['Downloads failed', downloadsFailed],
                  ['Comparisons completed', comparisonsSucceeded],
                  ['Comparisons unavailable', comparisonsFailed],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-3"
                  >
                    <dt className="text-[11px] text-on-surface-variant">{label}</dt>
                    <dd className="text-lg font-semibold text-on-surface">{value}</dd>
                  </div>
                ))}
              </dl>

              {comparisonRows.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left">
                    <thead className="border-b border-outline-variant/40 text-[11px] uppercase tracking-wide text-on-surface-variant">
                      <tr>
                        <th className="pb-2 pr-4 font-semibold">Source</th>
                        <th className="pb-2 pr-4 font-semibold">Outcome</th>
                        <th className="pb-2 pr-4 font-semibold">Similarity</th>
                        <th className="pb-2 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr key={row.key} className="border-b border-outline-variant/30 last:border-0">
                          <td className="py-2.5 pr-4 text-on-surface">{row.domain}</td>
                          <td className="py-2.5 pr-4 text-on-surface-variant">{row.outcome}</td>
                          <td className="py-2.5 pr-4 text-on-surface">{formatPercent(row.score)}</td>
                          <td className="py-2.5 text-on-surface-variant">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <p className="text-[12px] text-on-surface-variant">
            Raw embedding vectors, internal logs, and provider credentials are intentionally excluded.
          </p>
        </div>
      )}
    </section>
  )
}
