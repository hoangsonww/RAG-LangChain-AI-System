# RAG AI Portfolio Support Platform: Architecture Reference

This document is the technical source of truth for system design, runtime behavior, and production operating model for the RAG AI Portfolio Support platform.

---

## Table Of Contents

1. [Design Goals](#design-goals)
2. [Technology Stack](#technology-stack)
3. [System Context](#system-context)
4. [Container Architecture](#container-architecture)
5. [RAG Service Internal Architecture](#rag-service-internal-architecture)
6. [Backend Service Architecture](#backend-service-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Data Model](#data-model)
9. [Primary Execution Flows](#primary-execution-flows)
10. [Security Model](#security-model)
11. [Deployment Topologies](#deployment-topologies)
12. [Scalability And Reliability](#scalability-and-reliability)
13. [Observability And Operations](#observability-and-operations)
14. [Failure Modes And Recovery](#failure-modes-and-recovery)
15. [Request Context Propagation Model](#request-context-propagation-model)
16. [State Placement Strategy](#state-placement-strategy)
17. [CI/CD And Release Control Plane](#cicd-and-release-control-plane)
18. [Known Constraints](#known-constraints)
19. [Extension Points](#extension-points)
20. [Related Documents](#related-documents)

---

## Design Goals

### Functional goals

- Deliver source-backed responses from portfolio content.
- Enrich responses with structured backend API data via tool chaining.
- Support multiple retrieval strategies for varied query patterns.
- Provide a modern chat UX with streaming and traceability.

### Non-functional goals

- Production-operable runtime with health/readiness/liveness endpoints.
- Traceable requests using `X-Request-ID`.
- Deployable across local Docker, AWS EKS, and OCI OKE.
- Progressive delivery support (rolling/canary/blue-green).

### Overall RAG System Design Illustration

<p align="center">
  <img src="resources/RAG_System_Diagram.JPG" alt="RAG System Diagram" width="100%"/>
</p>

---

## Technology Stack

This architecture covers the full technology inventory used across application services, retrieval runtime, frontend, infrastructure, and delivery tooling.

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
  UI[React Frontend] --> API[RAG Flask API]
  API --> RET[LangChain Retrieval Stack]
  API --> AGENT[Agentic Orchestrator]
  AGENT --> BE[Express Backend]
  BE --> MDB[MongoDB]
  API --> CHROMA[Chroma + BM25 + FAISS]
  DEVOPS[Docker + K8s + Terraform + Argo] --> API
  DEVOPS --> BE
  DEVOPS --> UI
```

---

## System Context

```mermaid
graph TB
    User[End User]
    FE[Frontend Web App]
    RAG[RAG API Service]
    BE[Backend API Service]
    Mongo[(MongoDB)]
    Chroma[(Chroma Persisted Collection)]
    Files[(Uploads + Logs)]

    User --> FE
    FE --> RAG
    RAG --> BE
    BE --> Mongo
    RAG --> Chroma
    RAG --> Files
```

### Bounded responsibilities

| Boundary | Responsibility |
|---|---|
| `frontend` | User interface and interaction orchestration |
| `rag-app` | Chat API, retrieval orchestration, tool chaining, response synthesis |
| `backend` | Structured domain APIs and document export |
| `mongodb` | Backend persistence |

---

## Container Architecture

```mermaid
graph LR
    subgraph Client
      Browser
    end

    subgraph Application
      Frontend[frontend - React + Vite/NGINX]
      RagApp[rag-app - Flask + Socket.IO]
      Backend[backend - Express]
    end

    subgraph Data
      Mongo[(MongoDB)]
      Redis[(Redis - infra optional)]
      Chroma[(chroma_db)]
      Uploads[(uploads)]
      Logs[(logs)]
    end

    Browser --> Frontend
    Frontend --> RagApp
    RagApp --> Backend
    Backend --> Mongo
    RagApp --> Chroma
    RagApp --> Uploads
    RagApp --> Logs
    RagApp -. optional infra cache path .-> Redis
```

### Runtime port map

| Service | Internal Port | External Port (default) |
|---|---:|---:|
| `frontend` | `80` (nginx build) / `3000` (vite dev) | `3000` |
| `rag-app` | `5000` | `5000` |
| `backend` | `3456` | `3456` |
| `mongodb` | `27017` | `27017` |
| `redis` | `6379` | `6379` |

---

## RAG Service Internal Architecture

Primary code roots:
- `rag_system/api/factory.py`
- `rag_system/services/chat_service.py`
- `rag_system/engine.py`
- `rag_system/services/agentic_orchestrator.py`
- `rag_system/clients/backend_api.py`
- `rag_system/storage/*`

```mermaid
graph TB
    API[Flask API Layer]
    WS[Socket.IO Event Handlers]
    CS[ChatService]

    SS[InMemorySessionStore]
    RC[ResponseCache]
    RL[InMemoryRateLimiter]

    ENG[AdvancedRAGEngine]
    RET[Retrievers - Vector/BM25/Ensemble]
    RER[CrossEncoder Reranker]
    LLM[LLMChain + Ollama]

    ORCH[AgenticApiOrchestrator]
    CLIENT[BackendApiClient]

    API --> CS
    WS --> CS

    API --> RL
    CS --> SS
    CS --> RC
    CS --> ENG

    ENG --> RET
    ENG --> RER
    ENG --> LLM
    ENG --> ORCH

    ORCH --> CLIENT
```

### API middleware behavior

`rag_system/api/factory.py` implements:
- Request start timing
- Request ID assignment and response echo (`X-Request-ID`)
- Optional gateway auth for non-public paths
- In-memory rate limiting for `/api/*`
- Structured JSON errors

Public endpoints exempted from gateway checks:
- `/livez`
- `/readyz`
- `/health`
- `/openapi.json`

### Retrieval strategies

Defined via enum and routed in `engine.py`:
- `semantic`
- `hybrid`
- `multi_query`
- `decomposed`

```mermaid
flowchart TD
    Q[Query] --> STRAT{Strategy}
    STRAT -->|semantic| S1[Vector retrieval]
    STRAT -->|hybrid| H1[Ensemble retrieval]
    STRAT -->|multi_query| M1[Query variants]
    STRAT -->|decomposed| D1[Sub-query decomposition]

    M1 --> H1
    D1 --> H1

    S1 --> RR{enable_reranking}
    H1 --> RR

    RR -->|true| R1[CrossEncoder rerank]
    RR -->|false| R2[Use retrieval scores]

    R1 --> P[Prompt assembly]
    R2 --> P
    P --> G[LLM generation]
```

### Agentic orchestration flow

`AgenticApiOrchestrator`:
- plans calls from query/entities/context
- executes backend tools
- appends follow-up calls from response-derived cues
- emits execution trace with status (`ok`, `empty`, `error`)

```mermaid
flowchart LR
    E[Extract entities] --> PLAN[Plan tool calls]
    PLAN --> EXEC[Execute via BackendApiClient]
    EXEC --> TRACE[Record call trace]
    EXEC --> FUP[Generate follow-up calls]
    FUP --> EXEC
    TRACE --> OUT[api_chain_trace + api_data]
```

---

## Backend Service Architecture

Primary code roots:
- `backend/src/app.ts`
- `backend/src/routes/*`
- `backend/src/models/*`
- `backend/src/db.ts`

### Route groups

- auth: `/auth/token` (unprotected)
- auth-protected domain routes:
  - `/ping`
  - `/api/documents/download`
  - `/api/team`
  - `/api/team/insights`
  - `/api/investments`
  - `/api/investments/insights`
  - `/api/sectors`
  - `/api/consultations`
  - `/api/scrape`

### Auth behavior

Bearer middleware enforces token equality (current demo token behavior). Replace with production identity integration for hardened deployments.

### Backend request flow

```mermaid
sequenceDiagram
    autonumber
    participant Caller
    participant App as Express App
    participant Auth as Bearer Middleware
    participant Route as Route Handler
    participant DB as MongoDB

    Caller->>App: GET /api/team?name=...
    App->>Auth: validate Authorization header
    Auth-->>App: pass/fail
    App->>Route: invoke route handler
    Route->>DB: query model
    DB-->>Route: result
    Route-->>Caller: JSON payload
```

---

## Frontend Architecture

Primary code roots:
- `frontend/src/App.tsx`
- `frontend/src/components/ChatInterface.tsx`
- `frontend/src/lib/api.ts`
- `frontend/vite.config.ts`

### Key behavior

- API client via Axios with request-ID injection.
- Optional gateway token forwarding (`VITE_API_GATEWAY_TOKEN`).
- Socket.IO streaming + REST fallback.
- Session management UI and persisted client preferences.
- Tool trace + source citation visualization.

### Frontend interaction model

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Sending: User submits message
    Sending --> Streaming: Socket chunk events
    Sending --> AwaitingRest: REST response path
    Streaming --> Completed: response_complete
    AwaitingRest --> Completed: /api/chat response
    Sending --> Error: transport or API error
    Streaming --> Error: websocket error
    Error --> Idle: user retries
    Completed --> Idle
```

### Vite proxy routing (dev)

During local dev, frontend proxies:
- `/api/*`
- `/health`, `/readyz`, `/livez`
- `/openapi.json`
- `/socket.io`

to `http://localhost:5000`.

<p align="center">
  <img src="frontend/public/ui.png" alt="Chat Interface Screenshot" width="100%"/>
</p>

---

## Data Model

### Backend domain model (Mongo)

```mermaid
erDiagram
    TEAM_MEMBER ||--o{ TEAM_INSIGHT : has
    INVESTMENT ||--o{ INVESTMENT_INSIGHT : has

    TEAM_MEMBER {
      string name
      string role
      string bio
      string personal_quote
    }

    TEAM_INSIGHT {
      string title
      string date
      string link
    }

    INVESTMENT {
      string company_name
      string location
      string website
      string sectors
    }

    INVESTMENT_INSIGHT {
      string date
      string title
      string url
    }

    SECTOR {
      string sector
      string description
      string companies
      string investment_team
    }

    CONSULTATION {
      string date
      string company_name
      string consultation_details
      number hours
    }
```

### RAG app state model (in-memory + filesystem)

| Store | Type | Scope |
|---|---|---|
| Session store | in-memory | process-local |
| Response cache | in-memory | process-local |
| Rate limiter | in-memory | process-local |
| Vector index | Chroma persisted directory | node-local filesystem/PV |
| Uploads | filesystem | node-local filesystem/PV |

---

## Primary Execution Flows

### REST chat flow

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant API as /api/chat
    participant CS as ChatService
    participant ENG as AdvancedRAGEngine
    participant ORCH as Agentic Orchestrator
    participant BE as Backend API

    FE->>API: POST /api/chat
    API->>CS: validate + route
    CS->>ENG: query(strategy)
    ENG->>ENG: retrieve_documents
    ENG->>ORCH: call_api_chain
    ORCH->>BE: tool endpoints
    BE-->>ORCH: JSON results
    ORCH-->>ENG: api_data + trace
    ENG-->>CS: response + sources
    CS-->>API: result metadata
    API-->>FE: success payload
```

### WebSocket streaming flow

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend Socket
    participant WS as Socket.IO Server
    participant CS as ChatService

    FE->>WS: chat_message{query,strategy,session_id}
    WS->>FE: thinking
    WS->>FE: status (retrieval progress)
    WS->>CS: process_chat
    CS-->>WS: full response payload
    loop chunked streaming
      WS->>FE: response_chunk
    end
    WS->>FE: response_complete{sources,metadata,api_chain_trace}
```

### Upload and indexing flow

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant API as /api/upload
    participant CS as ChatService
    participant ENG as RAG Engine
    participant FS as Filesystem

    FE->>API: multipart/form-data (file)
    API->>CS: upload_document
    CS->>FS: save file to uploads/
    CS->>ENG: ingest_uploaded_file(path)
    ENG->>ENG: parse + chunk + add_documents
    ENG-->>CS: added_chunks
    CS-->>API: filename/stored_as/added_chunks
    API-->>FE: success response
```

---

## Security Model

### Current controls

- Backend bearer token middleware (demo/static token behavior).
- Optional gateway bearer auth on RAG API.
- Request ID trace propagation (`X-Request-ID`).
- In-memory rate limiting on RAG `/api/*`.
- K8s manifests include ingress TLS-ready definitions and network policies.

### Security boundaries

```mermaid
graph LR
    Internet --> Ingress[Ingress / LB TLS Termination]
    Ingress --> Frontend
    Ingress --> RagApp
    RagApp --> Backend
    Backend --> Mongo

    classDef ext fill:#f8d7da,stroke:#842029,color:#842029;
    classDef int fill:#d1e7dd,stroke:#0f5132,color:#0f5132;
    class Internet ext;
    class Ingress,Frontend,RagApp,Backend,Mongo int;
```

### Production hardening recommendations

- Replace demo bearer auth with real identity/authz stack.
- Externalize secrets to cloud secret manager + operator.
- Centralize audit logs and retention policy.
- Add WAF/rate controls at edge in addition to app-level checks.

---

## Deployment Topologies

### Local Docker topology

```mermaid
graph TB
    Browser --> FE[frontend container]
    FE --> RAG[rag-app container]
    RAG --> BE[backend container]
    BE --> MDB[mongodb container]
    RAG --> V1[(chroma_db volume)]
    RAG --> V2[(uploads volume)]
    RAG --> V3[(logs volume)]
```

### Kubernetes topology (conceptual)

```mermaid
graph TB
    subgraph Ingress
      ING[Ingress Controller]
    end

    subgraph Namespace rag-system
      FE[frontend Deployment]
      RA[rag-app Deployment]
      BE[backend Deployment]
      MDB[mongodb StatefulSet]
      RED[redis StatefulSet]
      PVC[(PVCs)]
    end

    ING --> FE
    ING --> RA
    FE --> RA
    RA --> BE
    BE --> MDB
    RA --> PVC
    MDB --> PVC
    RED --> PVC
```

### Progressive delivery state machine

```mermaid
stateDiagram-v2
    [*] --> Apply
    Apply --> Observe
    Observe --> Smoke
    Smoke --> Promote: healthy
    Smoke --> Abort: unhealthy
    Promote --> Monitor
    Abort --> Rollback
    Monitor --> [*]
    Rollback --> [*]
```

---

## Scalability And Reliability

### Current scaling posture

- Frontend/backend support horizontal scaling with deployment replicas + HPA.
- `rag-app` can scale horizontally only with careful storage/session/cache externalization.

### Critical scale coupling points

- Session store is process-local memory.
- Response cache is process-local memory.
- Rate limiter is process-local memory.
- Vector/upload directories require shared storage semantics for multi-replica behavior.

### Reliability controls in place

- readiness/liveness probes
- startup sequencing in compose/k8s
- PDB manifests for service availability maintenance
- rollout scripts for controlled release actions

---

## Observability And Operations

### Built-in observability signals

- Request-level structured logs (method/path/status/latency/request_id)
- Health endpoints for synthetic checks
- `X-Request-ID` in responses
- API trace payload from agentic orchestration (`api_chain_trace`)

### Operational scripts

- root command dispatcher: `scripts/system.sh`
- deploy actions: `deploy/scripts/rollout.sh`
- endpoint smoke: `deploy/scripts/smoke-test.sh`

### Day-2 command map

| Goal | Command |
|---|---|
| full local setup | `scripts/system.sh setup` |
| run quality gate | `scripts/system.sh test` |
| local health checks | `scripts/system.sh health` |
| local smoke chat | `scripts/system.sh smoke` |
| deploy rollout apply | `deploy/scripts/rollout.sh <strategy> <cloud> apply` |
| rollout status | `deploy/scripts/rollout.sh <strategy> <cloud> status` |
| promote/abort | `deploy/scripts/rollout.sh <strategy> <cloud> promote|abort <service>` |

---

## Failure Modes And Recovery

```mermaid
flowchart TD
    X[Incident Detected] --> T{Type}
    T -->|Availability| A[Probe failures / service down]
    T -->|Latency| L[High p95/p99]
    T -->|Correctness| C[Bad response / wrong enrichment]

    A --> A1[Check rollout status + pod logs]
    L --> L1[Inspect retrieval path + backend dependency latency]
    C --> C1[Inspect api_chain_trace + source payload]

    A1 --> R[Rollback/Abort rollout]
    L1 --> R
    C1 --> R

    R --> V[Run smoke tests]
    V --> S[Stabilize and postmortem]
```

Recommended recovery order:
1. Stop blast radius (`abort`/rollback strategy).
2. Re-establish health endpoints.
3. Validate chat and tools via smoke checks.
4. Capture request IDs and traces for root-cause analysis.

---

## Request Context Propagation Model

The platform uses request-context propagation for observability, tracing, and support diagnostics.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Browser/Caller
    participant FE as Frontend
    participant RAG as RAG API
    participant BE as Backend API

    Client->>FE: user action
    FE->>RAG: HTTP request + X-Request-ID
    RAG->>RAG: attach/normalize request_id in request context
    RAG-->>FE: response + X-Request-ID (+ rate headers when enabled)
    RAG->>BE: backend API call with bearer auth
    BE-->>RAG: domain payload/error
    FE-->>Client: render response or surfaced error with request_id
```

Operational implications:
- request IDs can be correlated across UI reports, API logs, and rollout windows
- rate-limit metadata can drive client retry behavior
- `api_chain_trace` plus request IDs enables tool-call-level triage

---

## State Placement Strategy

Current architecture intentionally keeps some state local for simplicity, with an explicit evolution path for horizontally consistent scaling.

### Current placement

| State | Current location | Shared across replicas | Production implication |
|---|---|---|---|
| session history | process memory | No | conversation continuity is instance-local |
| response cache | process memory | No | cache efficiency degrades with scale-out |
| rate limit counters | process memory | No | limits are not globally enforced |
| vector index | local PV/filesystem | Partial | failover/scale requires storage discipline |
| uploads | local PV/filesystem | Partial | stateless scale requires shared object storage |

### Evolution path

```mermaid
flowchart LR
    M1[In-memory stores] --> M2[Redis-backed shared state]
    F1[Local PV vector/uploads] --> F2[Shared/object storage + managed vector service]
    M2 --> H[Horizontal scale consistency]
    F2 --> H
```

Recommended sequence:
1. externalize session/cache/rate limit to shared Redis
2. decouple uploads from node-local storage
3. move vector persistence to shared or managed infrastructure
4. scale `rag-app` replicas with deterministic behavior guarantees

---

## CI/CD And Release Control Plane

```mermaid
flowchart TD
    Commit[Commit/Merge] --> CI[CI checks + tests]
    CI --> Build[Build backend/rag-app/frontend images]
    Build --> Registry[ECR/OCIR push with immutable tags]
    Registry --> Deploy[rollout.sh apply selected overlay]
    Deploy --> Observe[rollout status + metrics + logs]
    Observe --> Smoke[smoke-test.sh endpoint validation]
    Smoke --> Decision{Healthy?}
    Decision -->|Yes| Promote[rollout promote]
    Decision -->|No| Abort[rollout abort + rollback]
    Promote --> Close[Release report + runbook updates]
    Abort --> Incident[Incident response + corrective action]
```

Control points:
- pre-release quality gate: `scripts/system.sh test`
- rollout orchestration: `deploy/scripts/rollout.sh`
- release validation: `deploy/scripts/smoke-test.sh`
- promotion prerequisite checklist: `deploy/docs/PRODUCTION_CHECKLIST.md`

---

## Known Constraints

- In-memory stores are not shared across replicas.
- RAG stateful assets require shared storage strategy for strict multi-replica consistency.
- Canary/blue-green operations depend on Argo Rollouts installation and cluster permissions.
- Backend auth is currently a demo token model and must be replaced for high-security production requirements.

---

## Extension Points

### High-value extensions

- Externalize session/cache/rate limit to Redis.
- Replace backend auth with OIDC/JWT verification.
- Add centralized metrics/tracing (OpenTelemetry pipeline).
- Add asynchronous ingestion queue for large file processing.
- Introduce model provider abstraction for non-Ollama managed inference backends.

### Extension dependency map

```mermaid
graph LR
    OBS[Observability stack] --> API[rag-app + backend]
    AUTH[OIDC/JWT auth] --> API
    REDIS[Shared Redis] --> SESS[session/cache/rate stores]
    QUEUE[Async ingest queue] --> UPLOAD[api/upload pipeline]
    MODEL[Managed model endpoint] --> LLM[response generation]
```

---

## Related Documents

- Platform overview: [`README.md`](README.md)
- Agentic RAG design: [`AGENTIC_RAG.md`](AGENTIC_RAG.md)
- Operator runbook: [`QUICKSTART.md`](QUICKSTART.md)
- Deployment docs:
  - `deploy/README.md`
  - `deploy/k8s/README.md`
  - `deploy/docs/PROGRESSIVE_DELIVERY.md`
  - `deploy/docs/PRODUCTION_CHECKLIST.md`
- Unified API contract: [`openapi.yaml`](openapi.yaml)
