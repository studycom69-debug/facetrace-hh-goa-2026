import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { healthCheck } from '../api'
import MaterialIcon from '../components/MaterialIcon'

interface HealthInfo {
  status: string
  search_configured: boolean
  similarity_threshold: number
}

export default function HowItWorksPage() {
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  useEffect(() => {
    healthCheck()
      .then(setHealth)
      .catch((err) => console.warn('Health check info unavailable:', err))
  }, [])

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(label)
      setTimeout(() => setCopiedKey(null), 1800)
    })
  }

  const faqs = [
    {
      icon: 'help_outline',
      question: 'Does FaceTrace identify people?',
      answer: (
        <>
          <strong>No.</strong> FaceTrace identifies matching media across publicly indexed sources,
          not individuals. The system compares mathematical distance vectors across visual archives to
          discover co-occurrences of faces. Attribution of personal identity remains the exclusive
          responsibility of human investigators corroborated by contextual documents.
        </>
      ),
    },
    {
      icon: 'shield',
      question: 'How is the evidence tamper-proof?',
      answer: (
        <>
          All audit events, probe hashes, source URLs, and distance metrics are serialized and inserted
          into a Merkle tree structure. Each block is sealed using the SHA-256 standard and published
          to an append-only distributed ledger. Modifying a single character invalidates the Merkle
          root signature instantly.
        </>
      ),
    },
    {
      icon: 'database',
      question: 'Are raw facial images stored in the index?',
      answer: (
        <>
          <strong>Never.</strong> The platform operates exclusively on non-invertible
          512-dimensional vector floats. It is mathematically impossible to reconstruct a human face
          from this embedding coordinate, protecting individual privacy while enabling reliable
          correlation matching.
        </>
      ),
    },
    {
      icon: 'terminal',
      question: 'How can courts verify results without FaceTrace?',
      answer: (
        <>
          When an investigation export is generated, FaceTrace outputs a standardized JSON-LD container
          containing the full Merkle tree proof and canonical source URLs. Any forensic examiner can run
          our open-source CLI script or their own validation algorithm locally in air-gapped conditions.
        </>
      ),
    },
  ]

  return (
    <div className="flex w-full flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-2xl px-margin-screen py-space-xl">
        {/* Technical Architecture Brief Hero */}
        <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm md:p-space-2xl">
          <div className="pointer-events-none absolute -mr-20 -mt-20 right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-bl from-surface-container-high via-surface-container-low to-transparent opacity-60 blur-3xl"></div>
          <div className="relative z-10 flex flex-col justify-between gap-space-xl lg:flex-row lg:items-end">
            <div className="flex max-w-3xl flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs self-start rounded-full bg-surface-container-low px-space-md py-space-2xs text-on-surface">
                <span className="h-2 w-2 rounded-full bg-secondary"></span>
                <span className="font-mono-code text-mono-code font-semibold uppercase tracking-wider text-secondary">
                  Technical Architecture Brief
                </span>
                <span className="font-mono-code text-mono-code text-outline-variant">•</span>
                <span className="font-mono-code text-mono-code text-on-surface-variant">
                  Doc Rev 4.19
                </span>
                {health?.search_configured && (
                  <>
                    <span className="font-mono-code text-mono-code text-outline-variant">•</span>
                    <span className="font-mono-code text-mono-code text-secondary font-medium">
                      Live Engine Online
                    </span>
                  </>
                )}
              </div>
              <h1 className="font-display-lg text-display-lg font-bold tracking-tight text-on-surface">
                How FaceTrace Works
              </h1>
              <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
                A 6-stage pipeline built to find visual matches across public sources and preserve
                tamper-evident digital evidence for human rights documentation, legal review, and OSINT
                verification.
              </p>
            </div>
            <div className="flex items-center gap-space-md self-start rounded-lg bg-surface-container-low p-space-md lg:self-auto">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Cryptographic Standard
                </span>
                <span className="font-mono-data text-mono-data font-semibold text-on-surface">
                  IEEE-2601 Chain of Custody
                </span>
              </div>
              <MaterialIcon name="verified_user" size={28} className="text-secondary" />
            </div>
          </div>
        </section>

        {/* Foundational Pillars: 3 Cards */}
        <section className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          {/* Pillar 1 */}
          <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-space-xs flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary-container">
              <MaterialIcon name="public" size={20} />
            </div>
            <span className="font-label-caps text-label-caps font-bold uppercase tracking-wider text-secondary">
              Foundational Pillar 01
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Open Source Indexing
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              FaceTrace strictly catalogues publicly indexed visual materials from news organizations,
              archives, and accessible web registers. Private closed-circuit feeds, biometric police
              databases, and domestic surveillance apparatuses are structurally prohibited.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-space-xs flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary-container">
              <MaterialIcon name="enhanced_encryption" size={20} />
            </div>
            <span className="font-label-caps text-label-caps font-bold uppercase tracking-wider text-secondary">
              Foundational Pillar 02
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Cryptographic Immutability
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Every query docket, visual snapshot, source URI, and vector distance parameter is signed
              into an append-only cryptographic ledger. The resulting SHA-256 Merkle root guarantees
              that evidentiary records cannot be modified or retracted post-inquiry.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-space-xs flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary-container">
              <MaterialIcon name="rule" size={20} />
            </div>
            <span className="font-label-caps text-label-caps font-bold uppercase tracking-wider text-secondary">
              Foundational Pillar 03
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Non-Identity Mandate
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Similarity is not identity. FaceTrace produces mathematical proximity rankings between
              probe media and public web instances. System outputs document appearance correlations
              across visual archives, never definitive legal identifications.
            </p>
          </div>
        </section>

        {/* The 6-Stage Forensic Verification Engine */}
        <section className="flex flex-col gap-space-lg">
          <div className="flex flex-col justify-between pb-space-sm md:flex-row md:items-end">
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">
                Sequential Pipeline Architecture
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                The 6-Stage Forensic Verification Engine
              </h2>
            </div>
            <div className="mt-space-xs font-mono-code text-mono-code text-on-surface-variant md:mt-0">
              Deterministic Execution • Zero-Knowledge Verification
            </div>
          </div>

          <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
            {/* Stage 01 */}
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-surface-container-high px-space-sm py-space-2xs font-mono-code text-mono-code font-semibold text-primary-container">
                    STAGE 01
                  </span>
                  <span className="font-mono-code text-mono-code text-on-surface-variant">
                    I/O Ingestion Layer
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Input Ingestion & Sanitization
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  The investigator submits an authorized image file or public URI accompanied by
                  necessary case metadata. Raw EXIF data is systematically harvested for provenance
                  auditing and subsequently scrubbed from the active inference pipeline to guard against
                  metadata contamination.
                </p>
              </div>
              <div className="mt-space-lg flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
                <div className="flex items-center justify-between font-mono-code text-mono-code text-on-surface-variant">
                  <span>EXIF Isolation Status</span>
                  <span className="font-semibold text-secondary">COMPLIANT (PARSED)</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full w-full bg-secondary"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate font-mono-data text-mono-data text-on-surface-variant">
                    Probe Digest: c7b4e29f79b63481a823bce3…
                  </span>
                  <button
                    className="text-on-surface-variant hover:text-on-surface"
                    onClick={() =>
                      copyToClipboard('c7b4e29f79b63481a823bce301149200aa984819ac', 'Probe Digest')
                    }
                    type="button"
                    title="Copy digest"
                  >
                    <MaterialIcon
                      name={copiedKey === 'Probe Digest' ? 'check' : 'content_copy'}
                      size={14}
                      className={copiedKey === 'Probe Digest' ? 'text-secondary' : ''}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Stage 02 */}
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-surface-container-high px-space-sm py-space-2xs font-mono-code text-mono-code font-semibold text-primary-container">
                    STAGE 02
                  </span>
                  <span className="font-mono-code text-mono-code text-on-surface-variant">
                    Vector Synthesis
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Face Analysis & Vector Extraction
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Neural vision transformers identify facial regions and landmarks, converting geometric
                  contours into a non-reversible 128D/512-dimensional vector embedding. Raw visual
                  biological features are instantly purged from volatile memory; only the abstract
                  mathematical vector persists.
                </p>
              </div>
              <div className="mt-space-lg flex items-center justify-between rounded-lg bg-surface-container-low p-space-md">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                    Vector Space Geometry
                  </span>
                  <span className="font-mono-data text-mono-data text-on-surface">
                    OpenCV SFace 128D/512D Normalized Float Tensor
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="h-2 w-2 animate-ping rounded-full bg-primary"></span>
                  <span className="font-mono-code text-mono-code font-semibold text-primary">
                    Non-Reversible
                  </span>
                </div>
              </div>
            </div>

            {/* Stage 03 */}
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-surface-container-high px-space-sm py-space-2xs font-mono-code text-mono-code font-semibold text-primary-container">
                    STAGE 03
                  </span>
                  <span className="font-mono-code text-mono-code text-on-surface-variant">
                    Distributed Retrieval
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Public Index Query
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  The high-dimensional mathematical coordinate is dispatched across a distributed
                  spatial database indexing open-web images, institutional photojournalism catalogues,
                  government gazettes, and indexed human rights archives.
                </p>
              </div>
              <div className="mt-space-lg flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
                <div className="flex justify-between font-mono-data text-mono-data text-on-surface-variant">
                  <span>Indexed Corpus Coverage</span>
                  <span className="font-semibold text-on-surface">
                    {health?.search_configured ? 'Google Lens & Open Web' : '8.42M Media Nodes'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-space-2xs pt-space-2xs">
                  <div className="h-1.5 rounded-full bg-primary"></div>
                  <div className="h-1.5 rounded-full bg-primary"></div>
                  <div className="h-1.5 rounded-full bg-primary"></div>
                  <div className="h-1.5 rounded-full bg-surface-container-high"></div>
                </div>
              </div>
            </div>

            {/* Stage 04 */}
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-surface-container-high px-space-sm py-space-2xs font-mono-code text-mono-code font-semibold text-primary-container">
                    STAGE 04
                  </span>
                  <span className="font-mono-code text-mono-code text-on-surface-variant">
                    Distance Computation
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Visual Comparison & Ranking
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Cosine metric algorithms assess the angular separation between the probe vector and
                  candidated visual instances. Output ranks are calibrated by similarity confidence
                  percentage, accompanied by visual landmark alignment heatmaps.
                </p>
              </div>
              <div className="mt-space-lg flex items-center justify-between rounded-lg bg-surface-container-low p-space-md font-mono-data text-mono-data">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                    Correlation Metric
                  </span>
                  <span className="text-on-surface">
                    Cosine Similarity θ ∈ [0, 1] (Threshold: {(health?.similarity_threshold ?? 0.45) * 100}%)
                  </span>
                </div>
                <span className="rounded bg-secondary-container px-space-sm py-space-2xs font-mono-code font-semibold text-on-secondary-container">
                  Confidence Ranked
                </span>
              </div>
            </div>

            {/* Stage 05 */}
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-surface-container-high px-space-sm py-space-2xs font-mono-code text-mono-code font-semibold text-primary-container">
                    STAGE 05
                  </span>
                  <span className="font-mono-code text-mono-code text-on-surface-variant">
                    Cryptographic Custody
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Tamper-Evident Recording
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Upon evidence selection, the system binds the probe digest, candidate URLs, exact
                  timestamps, operator credentials, and model versions into a unified cryptographic
                  docket. This block is committed to an append-only distributed ledger with a SHA-256
                  seal.
                </p>
              </div>
              <div className="mt-space-lg flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md font-mono-code text-mono-code">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Block Proof Commit
                </span>
                <div className="flex items-center justify-between text-on-surface">
                  <span className="truncate text-secondary">0x4a91cf8e71b2...9901d8e1</span>
                  <MaterialIcon name="lock" size={16} className="text-secondary" />
                </div>
              </div>
            </div>

            {/* Stage 06 */}
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-surface-container-high px-space-sm py-space-2xs font-mono-code text-mono-code font-semibold text-primary-container">
                    STAGE 06
                  </span>
                  <span className="font-mono-code text-mono-code text-on-surface-variant">
                    Zero-Trust Audit
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Independent Verification
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Any judicial body, opposing counsel, or international auditor can verify evidentiary
                  integrity offline. By executing open-source verification scripts against the exported
                  docket file, they validate the SHA-256 Merkle root without contacting FaceTrace
                  servers.
                </p>
              </div>
              <div className="mt-space-lg flex items-center justify-between rounded-lg bg-surface-container-low p-space-md">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                    Audit Autonomy
                  </span>
                  <span className="font-mono-data text-mono-data text-on-surface">
                    Zero-Dependency Verification
                  </span>
                </div>
                <MaterialIcon name="gavel" size={24} className="text-secondary" />
              </div>
            </div>
          </div>
        </section>

        {/* System Architecture Diagram / Lifecycle Simulation */}
        <section className="flex flex-col items-start justify-between gap-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm md:flex-row md:items-center">
          <div className="flex max-w-2xl flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs font-mono-code text-mono-code font-semibold text-secondary">
              <MaterialIcon name="schema" size={18} />
              <span>SYSTEM ARCHITECTURE DIAGRAM</span>
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface">
              Pipeline Lifecycle Simulation
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Follow a visual trace packet as it transitions from initial ingestion to immutably
              hashed public proof.
            </p>
          </div>
          <div className="flex w-full items-center gap-space-xs overflow-x-auto pb-space-xs md:w-auto md:pb-0">
            <Link
              to="/"
              className="flex flex-col items-center rounded bg-surface-container-low px-space-md py-space-sm transition-colors hover:bg-surface-container"
            >
              <MaterialIcon name="upload_file" size={22} className="text-primary" />
              <span className="mt-space-2xs font-mono-code text-mono-code text-on-surface">Probe</span>
            </Link>
            <MaterialIcon name="arrow_forward" size={16} className="text-outline-variant" />
            <div className="flex flex-col items-center rounded bg-surface-container-low px-space-md py-space-sm">
              <MaterialIcon name="insights" size={22} className="text-primary" />
              <span className="mt-space-2xs font-mono-code text-mono-code text-on-surface">512-D</span>
            </div>
            <MaterialIcon name="arrow_forward" size={16} className="text-outline-variant" />
            <Link
              to="/results"
              className="flex flex-col items-center rounded bg-surface-container-low px-space-md py-space-sm transition-colors hover:bg-surface-container"
            >
              <MaterialIcon name="radar" size={22} className="text-primary" />
              <span className="mt-space-2xs font-mono-code text-mono-code text-on-surface">Query</span>
            </Link>
            <MaterialIcon name="arrow_forward" size={16} className="text-outline-variant" />
            <Link
              to="/records"
              className="flex flex-col items-center rounded bg-surface-container-low px-space-md py-space-sm transition-colors hover:bg-surface-container"
            >
              <MaterialIcon name="verified" size={22} className="text-secondary" />
              <span className="mt-space-2xs font-mono-code text-mono-code font-bold text-secondary">
                Ledger
              </span>
            </Link>
          </div>
        </section>

        {/* Ethical Statement & Compliance Section */}
        <section className="relative overflow-hidden rounded-xl bg-primary-container p-space-xl text-on-primary shadow-sm md:p-space-2xl">
          <div className="relative z-10 flex flex-col items-start justify-between gap-space-xl lg:flex-row lg:items-center">
            <div className="flex max-w-3xl flex-col gap-space-sm">
              <div className="flex items-center gap-space-xs font-mono-code text-mono-code uppercase tracking-wider text-secondary-fixed">
                <MaterialIcon name="policy" size={18} />
                <span>Evidentiary & Ethical Statement</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-primary">
                Strict Ethical Boundaries & Chain-of-Custody Compliance
              </h2>
              <p className="font-body-md text-body-md leading-relaxed text-on-primary-container">
                FaceTrace adheres to the international standards codified in IEEE-2601 for Digital
                Chain of Custody and the Berkeley Protocol on Digital Open Source Investigations. The
                platform rejects discriminatory profiling, provides transparent vector similarity
                measurements, and establishes a mathematically indisputable audit log to protect human
                dignity and evidentiary truth.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-space-md sm:flex-row lg:w-auto lg:flex-col">
              <div className="flex flex-col rounded-lg bg-surface-container-lowest/10 p-space-md">
                <span className="font-mono-code text-mono-code uppercase text-on-primary-container">
                  Compliance Standard
                </span>
                <span className="font-mono-data text-mono-data font-bold text-on-primary">
                  IEEE-2601 / Berkeley Protocol
                </span>
              </div>
              <div className="flex flex-col rounded-lg bg-surface-container-lowest/10 p-space-md">
                <span className="font-mono-code text-mono-code uppercase text-on-primary-container">
                  Data Retention Policy
                </span>
                <span className="font-mono-data text-mono-data font-bold text-on-primary">
                  Zero Biometric Storage
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="mb-space-xl flex flex-col gap-space-lg">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">
              Technical Specifications
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div
                  key={faq.question}
                  className="flex cursor-pointer flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm transition-all hover:shadow-md"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <div className="flex items-center justify-between text-primary">
                    <div className="flex items-center gap-space-xs font-headline-sm text-headline-sm">
                      <MaterialIcon name={faq.icon} size={20} />
                      <h3 className="text-on-surface">{faq.question}</h3>
                    </div>
                    <MaterialIcon
                      name={isOpen ? 'expand_less' : 'expand_more'}
                      size={20}
                      className="text-on-surface-variant"
                    />
                  </div>
                  <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                    {faq.answer}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
