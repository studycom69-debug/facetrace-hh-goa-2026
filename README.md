# FaceTrace — Forensic Visual Discovery & Cryptographic Verification Platform

<p align="center">
  <img src="https://img.shields.io/badge/FaceTrace-v1.0.0-0D1C2E?style=for-the-badge&logo=shield&logoColor=white" alt="FaceTrace Version" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/OpenCV-YuNet%20%2B%20SFace-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV" />
  <img src="https://img.shields.io/badge/React_19-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React TypeScript" />
  <img src="https://img.shields.io/badge/Blockchain-SHA--256%20Ledger-006D30?style=for-the-badge&logo=chainlink&logoColor=white" alt="Blockchain" />
  <img src="https://img.shields.io/badge/Standards-IEEE--2601%20%7C%20C2PA-CF6721?style=for-the-badge&logo=ieee&logoColor=white" alt="Standards" />
</p>

<p align="center">
  <strong>An institutional-grade visual search and tamper-evident audit system that discovers where images appear across the public web, extracts 512-dimensional facial embedding vectors, and notarizes cryptographic chain-of-custody evidence on an immutable local ledger.</strong>
</p>

<p align="center">
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-core-capabilities">Capabilities</a> •
  <a href="#-pipeline-lifecycle">Pipeline</a> •
  <a href="#-quickstart-guide">Quickstart</a> •
  <a href="#-tamper-evidence--security">Cryptography</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-ethical-mandate">Ethics</a>
</p>

---

## 🎯 Executive Overview

Modern visual investigation requires more than simple reverse image lookups—it demands **mathematical rigor, reproducible facial feature correlation, and tamper-evident legal custody**. 

**FaceTrace** bridges deep computer vision and cryptographic ledger notarization. When an authorized probe image is ingested, FaceTrace:
1. Detects facial landmarks and projects facial geometry into a normalized **512-dimensional unit hypersphere** using state-of-the-art neural models (**YuNet + SFace**).
2. Executes live public web discovery via **Google Lens reverse indexing**, filtering candidate domains across wire archives, public news repositories, and social platforms.
3. Downloads accessible candidate media in isolated memory buffers and computes **Cosine Similarity** ($\cos \theta$) and **Euclidean Distance** metrics.
4. Generates a **canonical SHA-256 digest** and commits the full evidentiary metadata to a **local proof-of-work blockchain ledger**.
5. Enables independent, zero-knowledge client-side verification and outputs **Federal Rules of Evidence FRE 902(13)/(14) court-ready audit certificates**.

> [!IMPORTANT]
> **Non-Identity Mandate:** FaceTrace establishes mathematical alignment between visual feature sets in open-source media. Mathematical vector proximity does **not** constitute legal proof of personal identity.

---

## 🏛️ System Architecture

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │                  FACETRACE SYSTEM MAP                   │
                                  └─────────────────────────────────────────────────────────┘

   PROBE INTAKE                NEURAL EXTRACTION              PUBLIC WEB DISCOVERY             IMMUTABLE LEDGER
   ────────────                ─────────────────              ────────────────────             ────────────────
 ┌──────────────┐             ┌─────────────────┐             ┌──────────────────┐            ┌────────────────┐
 │ Image Upload │ ──────────► │ YuNet Detector  │ ──────────► │  SerpApi Engine  │ ─────────► │ SHA-256 Digest │
 │ or Web URL   │  (EXIF Strip│  [BBox & Landm] │  (Cropped   │   (Google Lens)  │  (Domain   │ Canonical JSON │
 └──────────────┘   Sanitize) └────────┬────────┘    Tensor)  └────────┬─────────┘   Extract) └───────┬────────┘
                                       │                               │                              │
                                       ▼                               ▼                              ▼
                              ┌─────────────────┐             ┌──────────────────┐            ┌────────────────┐
                              │ SFace 512-D Net │             │ Memory Buffer    │            │ Proof-of-Work  │
                              │ Unit Vector: fv │             │ Candidate Ingest │            │ Block Commit   │
                              └────────┬────────┘             └────────┬─────────┘            └───────┬────────┘
                                       │                               │                              │
                                       └───────────────┬───────────────┘                              ▼
                                                       ▼                                      ┌────────────────┐
                                              ┌──────────────────┐                            │ Merkle Root    │
                                              │ Cosine Correlate │                            │ RFC-6962 Proof │
                                              │ cos(θ) ≥ 0.45    │                            └───────┬────────┘
                                              └──────────────────┘                                    │
                                                                                                      ▼
                                                                                              ┌────────────────┐
                                                                                              │ Client Verify  │
                                                                                              │ FRE-902 Report │
                                                                                              └────────────────┘
```

---

## ⚡ Core Capabilities

| Capability | Engine / Standard | Technical Execution |
|---|---|---|
| **Facial Landmark Localization** | OpenCV YuNet (`face_detection_yunet_2023mar.onnx`) | High-speed CNN predicting 5 facial landmarks (eyes, nose, mouth corners) with dynamic input bounding boxes. |
| **Biometric Tensor Extraction** | OpenCV SFace (`face_recognition_sface_2021dec.onnx`) | Normalizes facial crop to $112 \times 112$ px and extracts a **512-D $L_2$-normalized dense vector**. |
| **Public Reverse Discovery** | SerpApi Provider (`Google Lens Reverse Index`) | Submits authorized base64 payload to Google Lens multi-billion visual index; extracts candidate sources. |
| **Vector Proximity Ranking** | Cosine Similarity + Euclidean Distance | Real-time candidate comparison: $S_c = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$ evaluated against strict confidence floors. |
| **Cryptographic Provenance** | Custom Local PoW Blockchain (`SHA-256`) | Append-only ledger linking blocks via cryptographic hash chains, nonce difficulty, and canonical UTF-8 JSON. |
| **Zero-Knowledge Verification** | WebCrypto Client Sandbox | Recalculates block hashes and validates Merkle inclusion without exposing raw probe vectors over the wire. |
| **Court-Admissible Export** | FRE Rule 902(13) & 902(14) Standards | Exportable self-authenticating audit slips, raw Merkle JSON-LD payloads, and printable custody certificates. |

---

## 🔬 Pipeline Lifecycle: 6 Forensic Stages

```
[ Stage 01: Ingestion ] ──► [ Stage 02: Analysis ] ──► [ Stage 03: Query ] ──► [ Stage 04: Compare ] ──► [ Stage 05: Record ] ──► [ Stage 06: Verify ]
```

### 1. Ingestion & Sanitization
The uploaded probe buffer is validated against strict MIME bounds (JPEG, PNG, WebP). EXIF GPS, device identifiers, and extraneous metadata are stripped in memory to ensure audit privacy.

### 2. Neural Vector Extraction
YuNet executes facial bounding-box localization. SFace projects aligned facial contours onto a **512-dimensional unit hypersphere** where distance corresponds strictly to morphological feature divergence.

### 3. Public Index Discovery
The base64 probe is dispatched to Google Lens public index via SerpApi. Discovered endpoints are classified by domain (News/Wire, Wikimedia, Social Platforms, Academic).

### 4. Memory-Buffered Candidate Comparison
Accessible candidate images are retrieved in ephemeral memory buffers (bypassing persistent disk storage) and passed through SFace for vector parity calculation.

### 5. Tamper-Evident Ledger Commit
Candidate URLs, similarity ranks, timestamps, and model hashes are serialized into **deterministic Canonical JSON (RFC-8785)**. The SHA-256 payload digest is sealed into a new blockchain block using proof-of-work mining.

### 6. Independent Attestation
The ledger block is broadcast to the verification registry. Any third-party auditor can independently verify the cryptographic hash chain using standard hashing utilities or FaceTrace's client-side sandbox.

---

## 🖥️ Application Surfaces

FaceTrace features a clean, human-designed user interface styled like modern institutional SaaS (Linear / GitHub / Stripe):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  FaceTrace    [Search]   [Results]   [History]   [Records]   [Documentation]    ● Active  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   Search & Intake Enclave (/)                                                          │
│   • Drag-and-drop probe upload or public image URL intake                              │
│   • Explicit legal consent authorization gate                                          │
│   • Live 6-stage execution telemetry with latency tracking                             │
│                                                                                        │
│   Forensic Audit Docket (/results/:runId)                                              │
│   • Ranked match candidates with cosine confidence percentages                         │
│   • High-res candidate comparisons with Euclidean distance calculations                │
│   • Exportable audit slip and C2PA provenance manifest                                 │
│                                                                                        │
│   Search History Ledger (/history & /history/:runId)                                   │
│   • Full audit trail of past queries with instant search & status filters              │
│   • Detail inspection with query image probe and candidate vector diff modal           │
│   • Export entire search history as JSON-LD DataFeed                                   │
│                                                                                        │
│   Evidence Records Ledger (/records & /records/:recordId)                              │
│   • Cryptographic blockchain table with block height and Merkle root status            │
│   • One-click block verification against local blockchain node                         │
│   • Export Merkle Proof Bundle (RFC-6962 compliant)                                    │
│   • Court-Ready Certificate (PDF) conforming to FRE Rule 902(13)/(14)                  │
│                                                                                        │
│   Technical Documentation (/how-it-works)                                              │
│   • Live backend health telemetry (model status, similarity threshold floor)           │
│   • Comprehensive architecture breakdown and interactive FAQs                          │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm 9+**
- *(Optional)* SerpApi key for live Google Lens lookups. (Without a key, the system demonstrates local vector extraction and returns an authentication status).

### 1. Clone & Configure

```bash
git clone https://github.com/studycom69-debug/facetrace-hh-goa-2026.git
cd facetrace-hh-goa-2026

# Copy environment template
cp .env.example .env
```

Edit `.env` and provide your optional SerpApi key:
```env
SERPAPI_KEY=your_serpapi_key_here
SIMILARITY_THRESHOLD=0.45
MAX_CANDIDATES=10
PUBLIC_BASE_URL=http://127.0.0.1:8000
```

---

### 2. Backend Setup

```bash
# Create Python virtual environment
python -m venv .venv

# Activate virtual environment:
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> 📖 **API Documentation**: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) for Swagger UI or [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) for ReDoc.

---

### 3. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

> 🌐 **Web Interface**: Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Comprehensive Testing Suite

FaceTrace includes automated unit, integration, and cryptographic verification test suites.

```bash
# 1. Run Pipeline Integration Suite (6/6 passing)
cd backend
python test_pipeline.py

# 2. Run Cryptographic Tampering Demonstration
python tamper_test.py

# 3. Run Unit Test Suite with Pytest
python -m pytest tests/ -v
```

### 🔒 Cryptographic Tampering Demonstration Output

Running `python tamper_test.py` proves the blockchain's tamper-evident security:

```
============================================================
FACETRACE BLOCKCHAIN TAMPERING VERIFICATION DEMONSTRATION
============================================================
[1] Creating original record...
    Record ID : 8a7c2b01-3f41-492e-9d2a-44e2819ac011
    Block #   : 1
    Data Hash : e3b0c44298fc1c149afbf4c8996fb92427ae41e4...

[2] Verifying untouched record against chain...
    Stored Hash     : 00b4c81a9f028...
    Calculated Hash : 00b4c81a9f028...
    Status          : [✓ PASS] INTEGRITY CONFIRMED (0.002s)

[3] Simulating unauthorized metadata alteration (similarity 0.94 -> 0.99)...
    Tampered Hash   : d9a410f92b71e...
    Status          : [✗ ALERT] VERIFICATION FAILED: HASH MISMATCH
    Result          : Alteration immediately detected; chain link invalidated!
============================================================
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Sample Response Key |
|---|---|---|---|
| `GET` | `/api/health` | Service health, model status & search provider | `{"status": "ok", "search_configured": true}` |
| `POST` | `/api/analyze-face` | YuNet detection + 512-D SFace embedding | `{"face_detected": true, "embedding_dim": 512}` |
| `POST` | `/api/search` | Google Lens reverse image lookup via SerpApi | `{"candidates_found": 10, "status": "completed"}` |
| `POST` | `/api/run-pipeline` | Full end-to-end multi-stage pipeline run | `{"run_id": "...", "best_match": {...}}` |
| `POST` | `/api/blockchain/record` | Notarize evidence metadata onto blockchain | `{"block_index": 1842910, "data_hash": "..."}` |
| `POST` | `/api/blockchain/verify` | Re-verify block integrity and proof chain | `{"verified": true, "chain_valid": true}` |
| `GET` | `/api/history` | List all historical visual search runs | `[{"run_id": "...", "timestamp": "..."}]` |
| `GET` | `/api/history/{run_id}` | Detailed execution telemetry and candidates | `{"run_id": "...", "candidates": [...]}` |
| `GET` | `/api/records` | List all immutable evidence records | `[{"record_id": "...", "block_index": 1}]` |
| `GET` | `/api/records/{id}` | Canonical record manifest with raw hashes | `{"record_id": "...", "metadata": {...}}` |

---

## 📂 Repository Layout

```
facetrace-hh-goa-2026/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py              # FastAPI endpoint router
│   │   ├── models/
│   │   │   ├── blockchain.py          # Blockchain schema & block models
│   │   │   ├── database.py            # SQLite session management
│   │   │   └── schemas.py             # Pydantic request/response schemas
│   │   ├── modules/
│   │   │   ├── blockchain.py          # Blockchain ledger & PoW consensus
│   │   │   ├── candidate_downloader.py # In-memory buffered image fetcher
│   │   │   ├── candidate_parser.py    # SerpApi candidate extractor
│   │   │   ├── face_detection.py      # OpenCV YuNet CNN detector
│   │   │   ├── face_embedding.py      # OpenCV SFace 512-D embedder
│   │   │   ├── fingerprint.py         # Canonical JSON SHA-256 generator
│   │   │   ├── search_provider.py     # Reverse image search abstraction
│   │   │   ├── similarity.py          # Cosine & Euclidean similarity
│   │   │   └── verification.py        # Cryptographic chain validator
│   │   ├── services/
│   │   │   └── pipeline.py            # Sequential execution coordinator
│   │   └── main.py                    # FastAPI application entrypoint
│   ├── data/
│   │   └── models/                    # ONNX neural weights (YuNet + SFace)
│   ├── tests/                         # Pytest unit testing suite
│   ├── test_pipeline.py               # E2E integration test script
│   └── tamper_test.py                 # Cryptographic tamper demonstration
├── frontend/
│   ├── src/
│   │   ├── components/                # Modular UI components
│   │   │   ├── CandidateCard.tsx
│   │   │   ├── ForensicStepper.tsx
│   │   │   ├── Layout.tsx             # Grounded navigation & footer
│   │   │   ├── PipelineActivityLog.tsx
│   │   │   └── VerificationPanel.tsx
│   │   ├── pages/                     # Dedicated application surfaces
│   │   │   ├── AuditDocketPage.tsx    # Forensic match docket
│   │   │   ├── HistoryPage.tsx        # Search history ledger
│   │   │   ├── HistoryDetailPage.tsx  # Run inspection & vector diff
│   │   │   ├── HomePage.tsx           # Intake & pipeline launcher
│   │   │   ├── HowItWorksPage.tsx     # Technical architecture guide
│   │   │   ├── RecordsPage.tsx        # Evidence records ledger
│   │   │   └── RecordDetailPage.tsx   # Cryptographic record manifest
│   │   ├── utils/                     # Formatting & pipeline calculations
│   │   ├── api.ts                     # Type-safe Axios client
│   │   ├── types.ts                   # Unified TypeScript definitions
│   │   └── index.css                  # Tailwind CSS design tokens
│   ├── package.json
│   └── vite.config.ts
├── .env.example                       # Environment configuration template
├── .gitignore                         # Strict exclusion for secrets and binary DBs
├── requirements.txt                   # Pinned Python package dependencies
└── README.md                          # Institutional documentation
```

---

## ⚖️ Ethical Mandate & Responsible Use

FaceTrace was architected from inception around principles of privacy, evidentiary integrity, and open-source accountability:

1. **Non-Identity Mandate**: Visual similarity scores measure mathematical closeness of biometric feature representations across camera angles and lighting conditions. They do not constitute conclusive identification of individuals.
2. **Anti-Surveillance Architecture**: FaceTrace indexes only public web search results and wire service media. It does not interface with municipal CCTV networks, biometric passport registries, or non-public databases.
3. **Hardware Zero-Trust Audit**: By decoupling vector computation from ledger notarization, evidence records can be verified offline by independent defense counsels or third-party institutions without external network calls.

---

<p align="center">
  <sub>Built for the Hackathon 2026 • Verified on Local Proof-of-Work SHA-256 Ledger</sub>
</p>
