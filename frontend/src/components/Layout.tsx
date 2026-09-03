import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { healthCheck } from '../api'
import MaterialIcon from './MaterialIcon'

const primaryNav = [
  { to: '/', label: 'Search', end: true },
  { to: '/results', label: 'Results' },
  { to: '/history', label: 'History' },
  { to: '/records', label: 'Records' },
  { to: '/how-it-works', label: 'Documentation' },
]

export default function Layout() {
  const [searchReady, setSearchReady] = useState<boolean | null>(null)
  const location = useLocation()

  useEffect(() => {
    healthCheck()
      .then((h) => setSearchReady(h.search_configured))
      .catch(() => setSearchReady(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 antialiased">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
                <MaterialIcon name="shield" size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold tracking-tight text-slate-900 text-[15px]">
                  FaceTrace
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Forensic Verification
                </span>
              </div>
            </NavLink>

            {/* Nav Links */}
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
              {primaryNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => {
                    const isResultsActive =
                      item.to === '/results' &&
                      (location.pathname.startsWith('/results') || location.pathname === '/audit-docket')
                    const active = isActive || isResultsActive
                    return `rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right Status & Action */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-600 shadow-xs md:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  searchReady === false ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                }`}
                aria-hidden="true"
              />
              <span>{searchReady === false ? 'Local Mode' : 'Ledger Active'}</span>
            </div>

            <NavLink
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-slate-800"
            >
              <MaterialIcon name="add" size={16} />
              <span>New Search</span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>

      {/* Clean, Grounded Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-[12px] text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">FaceTrace</span>
            <span>•</span>
            <span>Open Source Image Verification & Tamper-Evident Evidence Logs</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500">
            <span>IEEE-2601 Standard</span>
            <span>•</span>
            <span>SHA-256 Ledger</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
