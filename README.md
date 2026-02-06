# RAG AI Portfolio Support Platform: Product And Operations Handbook

A comprehensive agentic RAG platform for portfolio intelligence, evidence-backed chat, and API-enriched responses.

This repository ships a complete application stack:
- `frontend` (`React + Vite + MUI`) for chat, strategy controls, sessions, and traceability.
- `rag-app` (`Flask + Socket.IO + LangChain`) for retrieval, orchestration, and response generation, with reranking support.
- `backend` (`Express + MongoDB`) for structured portfolio data APIs used by tool chaining.
- Deployment and operations assets for Docker, Kubernetes, progressive delivery, and Terraform.

<p align="center">
  <img src="resources/RAG_System_Diagram.JPG" alt="RAG System Diagram" width="100%"/>
</p>

---

## Table Of Contents

1. [Platform Overview](#platform-overview)
2. [Core Capabilities](#core-capabilities)
3. [Technology Stack](#technology-stack)
4. [Architecture Overview](#architecture-overview)
5. [Repository Layout](#repository-layout)
6. [Runtime Contracts](#runtime-contracts)
7. [End-To-End Data Lifecycle](#end-to-end-data-lifecycle)
8. [Quick Start](#quick-start)
9. [Configuration And Secrets](#configuration-and-secrets)
10. [API Surface](#api-surface)
11. [Operations Toolkit](#operations-toolkit)
12. [Deployment And Infrastructure](#deployment-and-infrastructure)
13. [Production Governance And Release Decision Model](#production-governance-and-release-decision-model)
14. [Testing And Quality Gates](#testing-and-quality-gates)
15. [Security And Production Notes](#security-and-production-notes)
16. [Further Reading & Resources](#further-reading--resources)
17. [Documentation Index](#documentation-index)

---

## Platform Overview

The platform is designed around a single product goal: **deliver high-confidence assistant responses grounded in retrieved documents and structured backend evidence**.

```mermaid
graph LR
    U[End User] --> FE[Frontend UI\nReact + Socket.IO]
    FE --> RAG[RAG API\nFlask + Chat Service]
    RAG --> RET[Retrieval Layer\nChroma + BM25 + Reranker]
    RAG --> ORCH[Agentic Orchestrator]
    ORCH --> BE[Backend API\nExpress]
    BE --> DB[(MongoDB)]
    RAG --> RESP[Source-backed Response + Trace]
    RESP --> FE
```

---

## Core Capabilities

- Multi-strategy retrieval:
  - `semantic`
  - `hybrid`
  - `multi_query`
  - `decomposed`
- Hybrid retrieval stack:
  - Chroma vector retrieval
  - BM25 lexical retrieval
  - optional cross-encoder reranking
- Agentic backend tool chaining:
  - team profile + insights
  - investment profile + insights
  - sector profile
  - consultations
  - scrape simulation
- OpenAI-compatible endpoint:
  - `POST /api/chat/completions`
- Real-time frontend UX:
  - streaming chunks over Socket.IO
  - REST fallback
  - session create/load/delete
  - source cards + tool trace panel
- Production controls:
  - request IDs (`X-Request-ID`)
  - optional gateway auth
  - in-memory rate limiting for `/api/*`
  - liveness/readiness/health endpoints

---

## Technology Stack

### Languages And Formats

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Bash](https://img.shields.io/badge/Bash-121011?style=for-the-badge&logo=gnubash&logoColor=white)
![HCL](https://img.shields.io/badge/HCL-Terraform%20Language-623CE4?style=for-the-badge)
![YAML](https://img.shields.io/badge/YAML-Configuration-CB171E?style=for-the-badge)
![Markdown](https://img.shields.io/badge/Markdown-Documentation-000000?style=for-the-badge&logo=markdown&logoColor=white)

### RAG, AI, And Python Runtime

![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white)
![Flask CORS](https://img.shields.io/badge/Flask--CORS-5.0-000000?style=for-the-badge)
![Flask SocketIO](https://img.shields.io/badge/Flask--SocketIO-5.4-010101?style=for-the-badge)
![Gunicorn](https://img.shields.io/badge/Gunicorn-23.0-499848?style=for-the-badge)
![Eventlet](https://img.shields.io/badge/Eventlet-0.36-333333?style=for-the-badge)
![LangChain](https://img.shields.io/badge/LangChain-0.3-0B3D2E?style=for-the-badge)
![LangChain Community](https://img.shields.io/badge/LangChain--Community-0.3-0B3D2E?style=for-the-badge)
![LangChain Core](https://img.shields.io/badge/LangChain--Core-0.3-0B3D2E?style=for-the-badge)
![LangChain Ollama](https://img.shields.io/badge/LangChain--Ollama-0.2-222222?style=for-the-badge)
![LangChain OpenAI](https://img.shields.io/badge/LangChain--OpenAI-0.2-10A37F?style=for-the-badge)
![LangChain HuggingFace](https://img.shields.io/badge/LangChain--HuggingFace-0.1-FFCC4D?style=for-the-badge)
![Ollama](https://img.shields.io/badge/Ollama-LLM%20Runtime-222222?style=for-the-badge)
![ChromaDB](https://img.shields.io/badge/ChromaDB-0.6-5A45FF?style=for-the-badge)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Index-005571?style=for-the-badge)
![Sentence Transformers](https://img.shields.io/badge/Sentence--Transformers-3.4-FFB000?style=for-the-badge)
![Transformers](https://img.shields.io/badge/Transformers-4.48-FFCC4D?style=for-the-badge)
![PyTorch](https://img.shields.io/badge/PyTorch-2.6-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![Rank BM25](https://img.shields.io/badge/Rank--BM25-0.2-4D4D4D?style=for-the-badge)
![Pydantic](https://img.shields.io/badge/Pydantic-2.10-E92063?style=for-the-badge)
![Pydantic Settings](https://img.shields.io/badge/Pydantic--Settings-2.8-E92063?style=for-the-badge)
![Requests](https://img.shields.io/badge/Requests-2.32-2A6DB0?style=for-the-badge)
![AIOHTTP](https://img.shields.io/badge/AIOHTTP-3.11-2C5BB4?style=for-the-badge)
![Tenacity](https://img.shields.io/badge/Tenacity-9.0-4D4D4D?style=for-the-badge)
![Redis Py](https://img.shields.io/badge/Redis--py-5.2-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Tiktoken](https://img.shields.io/badge/Tiktoken-0.8-333333?style=for-the-badge)
![Loguru](https://img.shields.io/badge/Loguru-0.7-0F4C81?style=for-the-badge)
![PyPDF](https://img.shields.io/badge/PyPDF-5.1-B31B1B?style=for-the-badge)
![python docx](https://img.shields.io/badge/python--docx-1.1-2B579A?style=for-the-badge)
![python pptx](https://img.shields.io/badge/python--pptx-1.0-D24726?style=for-the-badge)
![OpenPyXL](https://img.shields.io/badge/OpenPyXL-3.1-217346?style=for-the-badge)
![BeautifulSoup4](https://img.shields.io/badge/BeautifulSoup4-4.12-59666C?style=for-the-badge)
![lxml](https://img.shields.io/badge/lxml-5.3-0B4B6F?style=for-the-badge)
![Pyngrok](https://img.shields.io/badge/Pyngrok-7.2-1F6FEB?style=for-the-badge)

### Backend API Stack

![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-7.0-880000?style=for-the-badge)
![Swagger JSDoc](https://img.shields.io/badge/Swagger--JSDoc-6.2-85EA2D?style=for-the-badge)
![Swagger UI](https://img.shields.io/badge/Swagger--UI--Express-5.0-85EA2D?style=for-the-badge)
![Archiver](https://img.shields.io/badge/Archiver-5.3-4D4D4D?style=for-the-badge)
![Dotenv](https://img.shields.io/badge/dotenv-16.0-ECD53F?style=for-the-badge)
![Faker](https://img.shields.io/badge/Faker-5.5-9B59B6?style=for-the-badge)
![Nodemon](https://img.shields.io/badge/Nodemon-2.0-76D04B?style=for-the-badge)
![ts-node](https://img.shields.io/badge/ts--node-10.9-3178C6?style=for-the-badge)
![Prettier](https://img.shields.io/badge/Prettier-3.3-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)

### Frontend Stack

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![React DOM](https://img.shields.io/badge/React--DOM-18.3-61DAFB?style=for-the-badge)
![Material UI](https://img.shields.io/badge/MUI-6.3-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Emotion](https://img.shields.io/badge/Emotion-11.13-D26AC2?style=for-the-badge)
![Axios](https://img.shields.io/badge/Axios-1.7-5A29E4?style=for-the-badge)
![React Markdown](https://img.shields.io/badge/React--Markdown-9.0-111111?style=for-the-badge)
![React Syntax Highlighter](https://img.shields.io/badge/React--Syntax--Highlighter-15.6-222222?style=for-the-badge)
![Socket.IO Client](https://img.shields.io/badge/Socket.IO--Client-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![UUID](https://img.shields.io/badge/UUID-11.0-4D4D4D?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![NGINX](https://img.shields.io/badge/NGINX-Proxy-009639?style=for-the-badge&logo=nginx&logoColor=white)

### Data, Infra, And Operations

![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-6BA539?style=for-the-badge&logo=swagger&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containers-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker--Compose-Orchestration-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Kustomize](https://img.shields.io/badge/Kustomize-Overlay%20Management-326CE5?style=for-the-badge)
![Argo Rollouts](https://img.shields.io/badge/Argo--Rollouts-Progressive%20Delivery-EF7B4D?style=for-the-badge)
![Terraform](https://img.shields.io/badge/Terraform-IaC-623CE4?style=for-the-badge&logo=terraform&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-Cloud-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)
![Amazon EKS](https://img.shields.io/badge/Amazon--EKS-Kubernetes-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Amazon ECR](https://img.shields.io/badge/Amazon--ECR-Registry-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Amazon VPC](https://img.shields.io/badge/Amazon--VPC-Network-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![AWS KMS](https://img.shields.io/badge/AWS--KMS-Encryption-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![OCI](https://img.shields.io/badge/Oracle%20Cloud%20Infrastructure-Cloud-C74634?style=for-the-badge)
![Oracle OKE](https://img.shields.io/badge/Oracle--OKE-Kubernetes-C74634?style=for-the-badge)
![Oracle VCN](https://img.shields.io/badge/Oracle--VCN-Network-C74634?style=for-the-badge)

### Quality And Developer Tooling

![Pytest](https://img.shields.io/badge/Pytest-8.3-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)
![Pytest Asyncio](https://img.shields.io/badge/Pytest--Asyncio-0.24-0A9EDC?style=for-the-badge)
![Black](https://img.shields.io/badge/Black-24.10-000000?style=for-the-badge)
![Type Checking](https://img.shields.io/badge/TypeScript--Typecheck-tsc-3178C6?style=for-the-badge)

```mermaid
graph LR
  subgraph App
    FE[React + Vite + MUI]
    RAG[Flask + LangChain + Ollama]
    BE[Express + Mongoose]
  end
  subgraph Data
    C[ChromaDB + BM25 + FAISS]
    M[MongoDB]
    R[Redis]
  end
  subgraph Platform
    D[Docker + Compose]
    K[Kubernetes + Kustomize + Argo Rollouts]
    T[Terraform AWS/OCI]
  end
  FE --> RAG
  RAG --> C
  RAG --> BE
  BE --> M
  RAG -. optional .-> R
  D --> K
  T --> K
```

---

## Architecture Overview

### High-Level Service Topology

```mermaid
graph TB
  subgraph Client
    Browser[Browser]
  end

  subgraph App
    FE[frontend\nVite/NGINX]
    RAG[rag-app\nFlask + Socket.IO]
    BE[backend\nExpress]
  end

  subgraph Data
    Mongo[(MongoDB)]
    Chroma[(Chroma Persist Dir)]
    Uploads[(Uploads)]
    Logs[(Logs)]
  end

  Browser --> FE
  FE --> RAG
  RAG --> BE
  BE --> Mongo
  RAG --> Chroma
  RAG --> Uploads
  RAG --> Logs
```

### Request Lifecycle (REST Chat)

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant FE as Frontend
    participant RAG as RAG API
    participant ENG as RAG Engine
    participant ORCH as Agentic Orchestrator
    participant BE as Backend API

    User->>FE: Submit query + strategy
    FE->>RAG: POST /api/chat
    RAG->>ENG: retrieve_documents(strategy)
    ENG->>ORCH: plan + execute tool calls
    ORCH->>BE: /api/team, /api/investments, ...
    BE-->>ORCH: JSON payloads
    ORCH-->>ENG: api_data + api_chain_trace
    ENG-->>RAG: response + sources + metadata
    RAG-->>FE: success payload
    FE-->>User: rendered answer + citations + trace
```

### Retrieval Strategy Routing

```mermaid
flowchart TD
    Q[Incoming Query] --> S{Strategy}
    S -->|semantic| A[Vector Retriever]
    S -->|hybrid| B[Ensemble Retriever\nVector + BM25]
    S -->|multi_query| C[Generate alternatives\nthen hybrid retrieval]
    S -->|decomposed| D[Decompose query\nthen hybrid retrieval]

    A --> RR{Reranking enabled?}
    B --> RR
    C --> RR
    D --> RR

    RR -->|yes| X[Cross-Encoder Rerank]
    RR -->|no| Y[Use raw retrieval order]
    X --> G[LLM Response Generation]
    Y --> G
```

### Progressive Delivery Modes

```mermaid
graph LR
    A[Rolling Overlay] --> A1[deploy/k8s/overlays/aws]
    A --> A2[deploy/k8s/overlays/oci]

    B[Canary Overlay] --> B1[deploy/k8s/overlays/aws-canary]
    B --> B2[deploy/k8s/overlays/oci-canary]

    C[Blue-Green Overlay] --> C1[deploy/k8s/overlays/aws-bluegreen]
    C --> C2[deploy/k8s/overlays/oci-bluegreen]
```

---

## Repository Layout

```text
.
├── backend/                    # Express + MongoDB API service
├── frontend/                   # React/Vite chat application
├── rag_system/                 # Flask RAG app (API, engine, services, storage)
├── scripts/                    # Unified local/dev/build/test/deploy wrappers
├── deploy/                     # K8s overlays, rollout scripts, runbooks
├── infra/terraform/            # AWS/OCI infrastructure definitions
├── tests/                      # Python tests
├── run.py                      # Canonical local Python entrypoint
├── Dockerfile                  # Root production RAG container definition
├── Dockerfile.rag              # RAG image variant used by compose/deploy docs
├── docker-compose.yml          # Local full-stack compose environment
├── openapi.yaml                # Unified API contract (RAG + backend)
├── QUICKSTART.md               # End-to-end operator quickstart
└── ARCHITECTURE.md             # Deep technical architecture
```

---

## Runtime Contracts

### Service Ports

| Service | Port | Purpose |
|---|---:|---|
| `frontend` | `3000` | Browser UI |
| `rag-app` | `5000` | RAG API + Socket.IO |
| `backend` | `3456` | Portfolio data API + Swagger docs |
| `mongodb` | `27017` | Backend persistence |
| `redis` | `6379` | Optional infra cache service |

### Component Responsibilities

| Layer | Primary Responsibility |
|---|---|
| `frontend` | User interaction, streaming UX, sessions, trace/citation rendering |
| `rag-app/api` | Request handling, auth/rate-limit hooks, health endpoints |
| `rag-app/services` | Session/cache management, query flow orchestration |
| `rag-app/engine` | Retrieval + rerank + prompt construction + response generation |
| `rag-app/clients` | Backend API tool client wrappers |
| `backend` | Structured domain data APIs for agentic enrichment |

---

## End-To-End Data Lifecycle

### Ingestion, Retrieval, Enrichment, And Delivery

```mermaid
flowchart TD
  SourceDocs[backend/documents + uploaded files] --> Parse[Document parsing\nTXT/PDF/DOCX/MD]
  Parse --> Chunk[Chunking + metadata]
  Chunk --> Index[Vector index - Chroma\n+ BM25 corpus]
  Query[User query] --> Strategy[Retrieval strategy selection]
  Strategy --> Retrieve[Semantic/Hybrid/Multi-query/Decomposed retrieval]
  Retrieve --> Rerank[Cross-encoder reranking]
  Rerank --> Evidence[Top evidence bundle]
  Evidence --> Agent[Agentic orchestrator]
  Agent --> Tools[Backend API tool chain]
  Tools --> Compose[Prompt composition + context fusion]
  Compose --> LLM[LLM response generation]
  LLM --> Output[Response + citations + tool trace]
  Output --> Session[Session store + response cache]
```

### Runtime State Matrix

| State | Current Placement | Durability | Scale Consideration |
|---|---|---|---|
| Session history | In-memory (`rag_system/storage/session_store.py`) | process-local | externalize for multi-replica consistency |
| Response cache | In-memory LRU (`rag_system/storage/response_cache.py`) | process-local TTL | externalize for shared cache hit rate |
| Rate limiting | In-memory sliding window (`rag_system/storage/rate_limiter.py`) | process-local | move to distributed limiter for global enforcement |
| Vector data | `chroma_db` filesystem/PV | persisted on mounted volume | requires shared/managed vector strategy for horizontal scale |
| Upload artifacts | `uploads` filesystem/PV | persisted on mounted volume | requires shared object storage for stateless scaling |

---

## Quick Start

For full operator-level guidance, use [`QUICKSTART.md`](QUICKSTART.md).

### Option 1: Unified Script CLI (recommended)

```bash
scripts/system.sh setup
scripts/system.sh dev-up --setup
scripts/system.sh health
scripts/system.sh smoke
scripts/system.sh dev-down
```

### Option 2: Docker Compose

```bash
docker compose up -d
docker compose ps
```

Endpoints:
- Frontend: `http://localhost:3000`
- RAG API: `http://localhost:5000`
- Backend docs: `http://localhost:3456/docs`

Stop:

```bash
docker compose down
```

### Option 3: Manual Local (3 terminals)

Backend:

```bash
cd backend
cp .env.example .env  # first time only
npm install
npm run dev
```

RAG API (repo root):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## Configuration And Secrets

### RAG Runtime (`rag_system/config.py`)

Key runtime inputs:
- API linkage: `API_BASE_URL`, `API_TOKEN`, `API_TIMEOUT_SECONDS`
- Gateway auth: `ENABLE_GATEWAY_AUTH`, `API_GATEWAY_TOKEN`
- Retrieval controls: `TOP_K`, `CHUNK_SIZE`, `CHUNK_OVERLAP`, `ENABLE_RERANKING`, `ENABLE_HYBRID_SEARCH`
- CORS and upload constraints: `CORS_ORIGINS`, `MAX_CONTENT_LENGTH_MB`, `ALLOWED_UPLOAD_EXTENSIONS`
- Session/cache/rate controls: `MAX_SESSION_MESSAGES`, `RESPONSE_CACHE_SIZE`, `RATE_LIMIT_REQUESTS_PER_MINUTE`

### Backend Runtime (`backend/.env`)

Required:
- `MONGO_URI` (defaults to `mongodb://localhost:27017/rag_db` if unset in current code)
- `PORT` (default `3456`)

Template file:
- `backend/.env.example`

### Frontend Runtime (`Vite`)

Optional variables:
- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`
- `VITE_API_GATEWAY_TOKEN`

### Production Security Baseline

- Never commit live secrets to git.
- Use cloud secret manager integration for Kubernetes deployments.
- Rotate gateway/API tokens by release window.
- Enforce TLS termination at ingress/load balancer.

---

## API Surface

### RAG API (port `5000`)

- Health and contract:
  - `GET /health`
  - `GET /livez`
  - `GET /readyz`
  - `GET /openapi.json`
- Chat:
  - `POST /api/chat`
  - `POST /api/chat/completions`
- Session lifecycle:
  - `POST /api/session`
  - `GET /api/session/<session_id>`
  - `DELETE /api/session/<session_id>`
  - `GET /api/sessions`
- Knowledge and metadata:
  - `POST /api/upload`
  - `GET /api/strategies`
  - `GET /api/system/info`
  - `GET /api/tools`

### Backend API (port `3456`)

- Auth bootstrap:
  - `GET /auth/token`
- Protected domain routes:
  - `GET /ping`
  - `GET /api/documents/download`
  - `GET /api/team`
  - `GET /api/team/insights`
  - `GET /api/investments`
  - `GET /api/investments/insights`
  - `GET /api/sectors`
  - `GET /api/consultations`
  - `GET /api/scrape`

Unified OpenAPI contract:
- [`openapi.yaml`](openapi.yaml)

---

## Operations Toolkit

### Root Scripts

Primary operator entrypoint:

```bash
scripts/system.sh help
```

Mapped workflows:
- setup: `scripts/system.sh setup`
- local lifecycle: `dev-up`, `dev-down`, `dev-status`, `dev-logs`
- quality gates: `build`, `test`, `health`, `smoke`
- docker lifecycle: `docker-up`, `docker-down`, `docker-logs`
- deployment wrappers: `deploy`, `deploy-smoke`

### Day-2 Operations Flow

```mermaid
flowchart LR
    A[Code/Config Change] --> B[scripts/system.sh test]
    B --> C[scripts/system.sh health]
    C --> D[Build/Push Images]
    D --> E[rollout.sh apply]
    E --> F[rollout.sh status]
    F --> G[smoke-test.sh]
    G --> H{Pass?}
    H -->|Yes| I[promote]
    H -->|No| J[abort / rollback]
```

---

## Deployment And Infrastructure

### Kubernetes + Progressive Delivery

- Base manifests: `deploy/k8s/base`
- Rolling overlays: `deploy/k8s/overlays/aws`, `deploy/k8s/overlays/oci`
- Canary overlays: `deploy/k8s/overlays/aws-canary`, `deploy/k8s/overlays/oci-canary`
- Blue-green overlays: `deploy/k8s/overlays/aws-bluegreen`, `deploy/k8s/overlays/oci-bluegreen`

Rollout helper:

```bash
deploy/scripts/rollout.sh <strategy> <cloud> <action> [service]
```

Examples:

```bash
deploy/scripts/rollout.sh rolling aws apply
deploy/scripts/rollout.sh canary aws status
deploy/scripts/rollout.sh bluegreen oci promote all
```

Live smoke validation:

```bash
deploy/scripts/smoke-test.sh https://rag.example.com
```

### Terraform

- AWS stack: `infra/terraform/aws`
  - EKS + VPC + ECR + optional canary node group
- OCI stack: `infra/terraform/oci`
  - OKE + VCN + optional canary node pool

```mermaid
graph TD
    TF[Terraform Apply] --> CLUSTER[EKS / OKE Cluster]
    TF --> REGISTRY[ECR / OCIR]
    REGISTRY --> IMAGES[backend, rag-app, frontend images]
    IMAGES --> K8S[Overlay apply via rollout.sh]
    K8S --> LIVE[Ingress endpoint]
    LIVE --> SMOKE[smoke-test.sh]
```

---

## Production Governance And Release Decision Model

```mermaid
flowchart TD
  Change[Code/Config/Image Change] --> Gate1[Static checks + tests]
  Gate1 --> Gate2[Build + image publication]
  Gate2 --> Gate3[Secrets/config validation]
  Gate3 --> Apply[Apply rollout strategy]
  Apply --> Observe[Observe probes + metrics + logs]
  Observe --> Smoke[Run smoke tests]
  Smoke --> Decision{Release healthy?}
  Decision -->|Yes| Promote[Promote rollout]
  Decision -->|No| Abort[Abort and rollback]
  Promote --> Post[Post-deploy verification + report]
  Abort --> PostMortem[Incident analysis + corrective action]
```

Release strategies supported:
- Rolling (`deploy/k8s/overlays/aws`, `deploy/k8s/overlays/oci`)
- Canary (`deploy/k8s/overlays/aws-canary`, `deploy/k8s/overlays/oci-canary`)
- Blue-green (`deploy/k8s/overlays/aws-bluegreen`, `deploy/k8s/overlays/oci-bluegreen`)

Primary release controls:
- `deploy/scripts/rollout.sh`
- `deploy/scripts/smoke-test.sh`
- `scripts/system.sh test|health|smoke`

---

## Testing And Quality Gates

We provide a unified test and quality gate script for local and CI use. It comprehensively runs all unit tests, type checks, and production builds for both backend and frontend components.

### Unified Gate

```bash
scripts/system.sh test
```

What it runs:
- Python tests (`pytest -q`)
- backend TypeScript build (`npm run build`)
- frontend typecheck (`npm run typecheck`)
- frontend production build (`npm run build`)

### Additional Checks

```bash
scripts/system.sh health
scripts/system.sh smoke
```

---

## Security And Production Notes

- Backend bearer auth currently uses a demo/static token behavior by default (`/auth/token` route and middleware logic); treat it as non-production auth unless replaced by real identity integration.
- RAG gateway auth is optional and controlled by `ENABLE_GATEWAY_AUTH` + `API_GATEWAY_TOKEN`.
- Current rate limiting and session/cache stores are in-memory and process-local.
- Enable hardened ingress, secret management, and centralized telemetry before multi-tenant production rollout.

---

## Further Reading & Resources

If you want to learn more about the concepts and technologies used in this project, as well as essential AI and RAG principles, check out the following resources:

- [AI Agents & Assistants](resources/AI_Agents_Assistants.ipynb)
- [AI and Businesses](resources/AI_and_Businesses.ipynb)
- [Confusion Matrix for LLM Outputs](resources/Confusion_Matrix.ipynb)
- [Data Science Pipeline with a Business Problem](resources/Data_Science_Pipeline.ipynb)
- [Decision Trees & Ensemble Learning](resources/Decision_Trees_Ensemble_Learning.ipynb)
- [Deep Learning & Neural Networks](resources/Deep_Learning_Neural_Networks.ipynb)
- [k-Nearest Neighbors Algorithm](resources/k-Nearest-Neighbors.ipynb)
- [LLM Mining for Customer Experience](resources/LLM_Mining_CX.ipynb)
- [Regression Analysis & Linear Models](resources/Regression.ipynb)
- [Representation Learning & Dimensionality Reduction for Recommender Systems](resources/Representation_Learning_Recommender.ipynb)
- [Retrieval Augmented Generation (RAG) Concepts](resources/Retrieval_Augmented_Generation.ipynb)
- [Unstructured Data Textual Analysis](resources/Unstructured_Data_Textual_Analysis.ipynb)
- [Storytelling with Data](resources/Storytelling_with_Data.pdf)
- [Synthetic Experts](resources/Synthetic_Experts.pdf)

---

## Documentation Index

- [QUICKSTART.md](QUICKSTART.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [deploy/README.md](deploy/README.md)
- [deploy/k8s/README.md](deploy/k8s/README.md)
- [deploy/docs/PROGRESSIVE_DELIVERY.md](deploy/docs/PROGRESSIVE_DELIVERY.md)
- [deploy/docs/PRODUCTION_CHECKLIST.md](deploy/docs/PRODUCTION_CHECKLIST.md)
- [scripts/README.md](scripts/README.md)
- [openapi.yaml](openapi.yaml)
