import MaterialIcon from '../components/MaterialIcon'

const sections = [
  {
    icon: 'shield',
    title: 'Before you search',
    items: [
      'Use only images you own, have permission to process, or are authorized to review.',
      'Do not use FaceTrace for stalking, harassment, or unauthorized surveillance.',
      'Confirm that your use complies with applicable laws and platform terms.',
    ],
  },
  {
    icon: 'info',
    title: 'Understanding results',
    items: [
      'Visual similarity is not proof of identity.',
      'Results depend on publicly indexed content and provider availability.',
      'Some websites restrict automated access to candidate images.',
      'Missing API credentials produce real error messages — not fabricated results.',
    ],
  },
  {
    icon: 'fingerprint',
    title: 'Blockchain records',
    items: [
      'The local blockchain stores tamper-evident metadata fingerprints only.',
      'Biometric embedding vectors are not written to the blockchain.',
      'Records can be independently verified by recalculating the SHA-256 fingerprint.',
      'This is a local simulated ledger — not Ethereum or any public mainnet.',
    ],
  },
]

export default function ResponsibleUsePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-[var(--spacing-margin-screen)]">
      <section className="mb-8">
        <span className="section-label">Policy</span>
        <h1 className="mt-1 text-2xl font-semibold text-on-surface">Responsible use</h1>
        <p className="mt-2 text-[13px] text-on-surface-variant">
          FaceTrace is designed for authorized visual evidence review — not surveillance or identity
          confirmation.
        </p>
      </section>

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high">
                <MaterialIcon name={section.icon} size={18} />
              </div>
              <h2 className="text-lg font-semibold text-on-surface">{section.title}</h2>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-[13px] leading-relaxed text-on-surface-variant">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
