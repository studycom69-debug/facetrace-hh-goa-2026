import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getHistoryDetail } from '../api'
import MaterialIcon from '../components/MaterialIcon'
import ResultsView from '../components/results/ResultsView'
import type { PipelineResponse } from '../types'
import { fromPipelineResponse, fromRunDetail } from '../utils/resultsHelpers'
import type { ResultsViewModel } from '../utils/resultsHelpers'

import AuditDocketPage from './AuditDocketPage'

export interface ResultsLocationState {
  result: PipelineResponse
  probePreview?: string | null
  probeFileName?: string
  dimensions?: { w: number; h: number } | null
  pipelineStartedAt?: number | null
}

export default function ResultsPage() {
  const { runId = '' } = useParams()
  const isDemo = runId.toLowerCase() === 'run-9912' || runId.toLowerCase() === 'demo'
  if (isDemo) {
    return <AuditDocketPage />
  }

  const location = useLocation()
  const state = location.state as ResultsLocationState | null

  const [data, setData] = useState<ResultsViewModel | null>(() => {
    if (state?.result && state.result.run_id === runId) {
      return fromPipelineResponse(state.result, {
        probePreview: state.probePreview,
        probeFileName: state.probeFileName,
        dimensions: state.dimensions,
        pipelineStartedAt: state.pipelineStartedAt,
      })
    }
    return null
  })
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data?.runId === runId) return

    setLoading(true)
    setError(null)
    getHistoryDetail(runId)
      .then((run) => setData(fromRunDetail(run)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load results'))
      .finally(() => setLoading(false))
  }, [data?.runId, runId])

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-[13px] text-on-surface-variant sm:px-6 lg:px-[var(--spacing-margin-screen)]">
        Loading results…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-12 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
        <Link to="/" className="inline-flex items-center gap-1 text-[13px] text-on-surface hover:underline">
          <MaterialIcon name="arrow_back" size={16} />
          Back to search
        </Link>
        <div className="rounded-xl border border-error-container bg-error-container/20 p-4 text-[13px] text-error">
          {error || 'Results not found'}
        </div>
      </div>
    )
  }

  return <ResultsView data={data} />
}
