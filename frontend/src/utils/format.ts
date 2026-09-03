export function formatPercent(score: number | null | undefined): string {
  if (score == null) return '—'
  return `${(score * 100).toFixed(1)}%`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return `${text.slice(0, length)}…`
}

export function comparisonLabel(status: string, score: number | null, threshold: number): string {
  if (score != null && score >= threshold) return 'High visual similarity'
  if (score != null) return 'Visual similarity'
  if (status === 'download_failed') return 'Image inaccessible'
  if (status === 'no_face_detected') return 'No usable face detected'
  if (status === 'comparison_failed') return 'Comparison failed'
  return 'Not analyzed'
}
