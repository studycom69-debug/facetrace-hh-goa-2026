import MaterialIcon from '../components/MaterialIcon'

const pipeline = [
  {
    step: '1',
    icon: 'face',
    title: 'Face analysis',
    body: 'OpenCV YuNet detects a single face and SFace generates a secure embedding fingerprint.',
  },
  {
    step: '2',
    icon: 'travel_explore',
    title: 'Public web search',
    body: 'SerpApi Google Lens submits the image and returns publicly indexed visual matches.',
  },
  {
    step: '3',
    icon: 'compare',
    title: 'Candidate comparison',
    body: 'Accessible candidate images are downloaded, analyzed, and scored by visual similarity.',
  },
  {
    step: '4',
    icon: 'fingerprint',
    title: 'Fingerprinting',
    body: 'Selected evidence metadata is canonicalized and hashed with SHA-256.',
  },
  {
    step: '5',
    icon: 'database',
    title: 'Blockchain recording',
    body: 'The fingerprint is stored in a local tamper-evident blockchain ledger.',
  },
  {
    step: '6',
    icon: 'verified_user',
    title: 'Independent verification',
    body: 'Any reviewer can recalculate the fingerprint and validate chain integrity.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
      <section className="mb-10 max-w-3xl">
        <span className="section-label">Documentation</span>
        <h1 className="mt-1 text-2xl font-semibold text-on-surface">How FaceTrace works</h1>
        <p className="mt-2 text-[13px] text-on-surface-variant">
          A transparent pipeline from authorized image input to tamper-evident verification record.
        </p>
      </section>

      <div className="card mb-8 p-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center">
          {['Authorized image', 'Public search results', 'Verification record'].map((label, i) => (
            <div key={label} className="flex items-center gap-4">
              {i > 0 && (
                <MaterialIcon name="arrow_forward" className="hidden text-on-surface-variant md:block" />
              )}
              <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-6 py-4 text-center text-[13px] font-medium text-on-surface">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pipeline.map((item) => (
          <article key={item.step} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high">
                <MaterialIcon name={item.icon} size={18} />
              </div>
              <p className="font-mono-code text-secondary">Step {item.step}</p>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-on-surface">{item.title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-surface-container-low p-5 text-[13px] text-on-surface-variant">
        Visual similarity indicates how closely two images resemble each other. It does not prove a
        person&apos;s identity.
      </div>
    </div>
  )
}
