# FaceTrace

**Visual Discovery & Blockchain Verification**

FaceTrace is a visual similarity and evidence-discovery system. It accepts an authorized image, detects and encodes faces, searches the public web for visual matches, compares candidates using real similarity scores, and stores a SHA-256 fingerprint in a local tamper-evident blockchain for independent verification.

> **Important:** Visual similarity is not identity proof. Use only authorized, public-domain, or openly licensed images.

---

## What It Does

```
IMAGE INPUT
    ↓
FACE DETECTION (OpenCV YuNet)
    ↓
FACE EMBEDDING (OpenCV SFace)
    ↓
PUBLIC WEB SEARCH (SerpApi Google Lens)
    ↓
CANDIDATE DOWNLOAD & COMPARISON
    ↓
SIMILARITY RANKING
    ↓
SHA-256 FINGERPRINT
    ↓
LOCAL TAMPER-EVIDENT BLOCKCHAIN
    ↓
INDEPENDENT VERIFICATION
```

---

## Assignment Requirements Covered

| Requirement | Implementation |
|---|---|
| **1. Face detection and encoding** | OpenCV YuNet + SFace with real embedding vectors and fingerprints |
| **2. Genuine public web/reverse-image search** | SerpApi Google Lens via `SearchProvider` abstraction; base64 image submission |
| **3. Blockchain fingerprint and verification** | Custom local simulated blockchain with SHA-256, canonical JSON, tamper detection |
| **4. No hosted website required** | Runs locally via FastAPI + Vite dev servers |
| **5. GitHub-ready repository** | Complete structure, `.gitignore`, `.env.example`, tests, README |

---

## Architecture

```
FaceTrace/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # FastAPI endpoints
│   │   ├── modules/               # Testable pipeline modules
│   │   │   ├── face_detection.py
│   │   │   ├── face_embedding.py
│   │   │   ├── search_provider.py
│   │   │   ├── candidate_parser.py
│   │   │   ├── candidate_downloader.py
│   │   │   ├── similarity.py
│   │   │   ├── fingerprint.py
│   │   │   ├── blockchain.py
│   │   │   └── verification.py
│   │   ├── services/pipeline.py   # Orchestration
│   │   └── models/                # SQLAlchemy + Pydantic
│   ├── tests/                     # Unit tests
│   ├── test_pipeline.py           # Integration test script
│   └── tamper_test.py             # Tampering demonstration
├── frontend/                      # React + Vite + TypeScript + Tailwind
├── requirements.txt
└── .env.example
```

---

## Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional) SerpApi key for live reverse image search

### Backend

```bash
cd FaceTrace
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and add SERPAPI_KEY if available
```

### Frontend

```bash
cd frontend
npm install
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```env
SERPAPI_KEY=           # Required for live reverse image search
SIMILARITY_THRESHOLD=0.45
MAX_CANDIDATES=10
PUBLIC_BASE_URL=http://127.0.0.1:8000
```

**Never commit actual API keys.**

---

## How to Run

### Start Backend

```bash
cd backend
..\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: http://127.0.0.1:8000/docs

### Start Frontend

```bash
cd frontend
npm run dev
```

App: http://127.0.0.1:5173

---

## Testing

### Integration Pipeline Tests

```bash
cd backend
..\.venv\Scripts\python test_pipeline.py
```

Expected output: 6/6 tests PASS (search test passes with auth failure message when no API key).

### Tampering Demonstration

```bash
cd backend
..\.venv\Scripts\python tamper_test.py
```

Shows VERIFIED for original metadata and VERIFICATION FAILED for tampered metadata.

### Unit Tests

```bash
cd backend
..\.venv\Scripts\python -m pytest tests/ -v
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/analyze-face` | Face detection + embedding |
| POST | `/api/search` | Reverse image search |
| POST | `/api/run-pipeline` | Full end-to-end pipeline |
| POST | `/api/blockchain/record` | Create blockchain record |
| POST | `/api/blockchain/verify` | Verify a record |
| GET | `/api/history` | List all runs |
| GET | `/api/history/{run_id}` | Run details |
| GET | `/api/records` | List blockchain records |
| GET | `/api/records/{record_id}` | Record details |

---

## Blockchain Used

**Custom Local Simulated Tamper-Evident Blockchain**

- Persistent JSON ledger (`backend/data/blockchain.json`)
- Proof-of-work (2 leading zero difficulty)
- Each block contains: `block_index`, `timestamp`, `previous_hash`, `data_hash`, `nonce`, `block_hash`
- Metadata hashed via deterministic canonical JSON → SHA-256
- Chain linkage validated on verification
- **Not Ethereum or any public cryptocurrency network**

---

## Known Limitations

- Visual similarity is **not identity proof**
- Public search requires a valid `SERPAPI_KEY`; without it, the system returns a real authentication error
- Search results depend on provider availability and web indexing
- Some candidate websites block automated image downloading
- Social media platforms may restrict candidate image access
- Local blockchain is simulated/local — not a public network
- Only authorized/publicly appropriate images should be used

---

## Responsible Use

- Confirm permission before processing any image
- Do not use for surveillance, stalking, or harassment
- Treat similarity scores as visual evidence indicators, not identity confirmation

---

## License

For educational/assignment use. Ensure compliance with image rights and API terms of service.
