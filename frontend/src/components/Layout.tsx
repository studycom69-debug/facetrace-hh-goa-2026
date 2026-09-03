import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { healthCheck } from '../api'
import MaterialIcon from './MaterialIcon'

const primaryNav = [
  { to: '/', label: 'New Search', end: true },
  { to: '/history', label: 'History' },
  { to: '/records', label: 'Records' },
  { to: '/how-it-works', label: 'How It Works' },
]

export default function Layout() {
  const [searchReady, setSearchReady] = useState<boolean | null>(null)

  useEffect(() => {
    healthCheck()
      .then((h) => setSearchReady(h.search_configured))
      .catch(() => setSearchReady(false))
  }, [])

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-outline-variant/40 bg-surface-container-lowest/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <MaterialIcon name="shield" className="text-on-primary" size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none tracking-tight text-on-surface">
                  FaceTrace
                </span>
                <span className="mt-0.5 font-mono-code uppercase tracking-wider text-on-surface-variant">
                  Visual Discovery & Verification
                </span>
              </div>
            </div>

            <div className="hidden h-6 w-px bg-outline-variant/60 md:block" aria-hidden="true" />

            <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
              {primaryNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-surface-container-high font-semibold text-on-surface'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {searchReady !== null && (
              <div className="hidden items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1 xl:flex">
                <span
                  className={`h-2 w-2 rounded-full ${searchReady ? 'animate-pulse bg-secondary' : 'bg-error'}`}
                  aria-hidden="true"
                />
                <span className="font-mono-code text-on-surface-variant">
                  {searchReady ? 'Public search configured' : 'Search not configured'}
                </span>
              </div>
            )}
          </div>
        </div>

        {searchReady === false && (
          <div className="border-t border-outline-variant/40 bg-warning-soft px-4 py-2 text-center text-[13px] text-warning sm:px-6">
            Public search is not configured. Add SERPAPI_KEY to enable reverse image search.
          </div>
        )}

        <nav
          className="flex gap-1 overflow-x-auto border-t border-outline-variant/30 px-4 py-2 md:hidden"
          aria-label="Mobile"
        >
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                  isActive
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="w-full pt-16">
        <Outlet />
      </main>

      <footer className="border-t border-outline-variant/40 bg-surface-container-lowest py-6">
        <div className="flex flex-col items-center justify-between gap-3 px-4 text-center text-[12px] text-on-surface-variant sm:px-6 md:flex-row md:text-left lg:px-[var(--spacing-margin-screen)]">
          <p>Visual similarity results are not identity proof. Use only authorized images.</p>
          <NavLink
            to="/responsible-use"
            className="font-medium text-on-surface hover:underline"
          >
            Responsible use
          </NavLink>
        </div>
      </footer>
    </div>
  )
}
