# Backend API Handbook (`backend`)

Production backend API for structured portfolio data used by the RAG agentic orchestration layer.

This service provides authenticated domain endpoints for:
- team members and related insights
- investments and investment insights
- sector profiles
- consultation records
- document archive export
- scrape simulation payloads

---

## Table Of Contents

1. [Purpose](#purpose)
2. [Service Architecture](#service-architecture)
3. [Runtime Request Pipeline](#runtime-request-pipeline)
4. [Source Layout](#source-layout)
5. [API Surface](#api-surface)
6. [Data Model](#data-model)
7. [Configuration](#configuration)
8. [Local Development](#local-development)
9. [Containerization And Deployment](#containerization-and-deployment)
10. [Operational Playbook](#operational-playbook)
11. [Security Hardening Checklist](#security-hardening-checklist)
12. [Troubleshooting](#troubleshooting)

---

## Purpose

`backend` is the domain data service for the RAG platform. It is intentionally narrow:
- exposes curated portfolio-related APIs
- persists and queries data in MongoDB
- offers a documents ZIP endpoint for RAG indexing bootstrap
- is consumed by `rag_system/clients/backend_api.py`

```mermaid
graph LR
  RAG[RAG Service] --> BE[Backend API]
  BE --> DB[(MongoDB)]
  BE --> DOCS[(documents folder)]
```

---

## Service Architecture

```mermaid
graph TB
  App[app.ts]
  Auth[auth route /auth/token]
  Middleware[bearerAuth middleware]

  Ping[ping route]
  Team[team routes]
  Invest[investment routes]
  Sector[sector routes]
  Consult[consultation routes]
  Docs[documents route]
  Scrape[scrape route]

  Models[Mongoose models]
  Mongo[(MongoDB)]
  Seed[seed.ts]

  App --> Auth
  App --> Middleware
  Middleware --> Ping
  Middleware --> Team
  Middleware --> Invest
  Middleware --> Sector
  Middleware --> Consult
  Middleware --> Docs
  Middleware --> Scrape

  Team --> Models
  Invest --> Models
  Sector --> Models
  Consult --> Models
  Models --> Mongo
  App --> Seed
  Seed --> Mongo
```

Core behavior in `src/app.ts`:
- loads env vars
- connects DB (`connectDB`)
- seeds data (`seedData`)
- initializes OpenAPI docs via `swagger-jsdoc`
- mounts unprotected `/auth`
- enforces auth middleware on all remaining routes

---

## Runtime Request Pipeline

```mermaid
sequenceDiagram
  autonumber
  participant C as Caller
  participant E as Express
  participant A as bearerAuth
  participant R as Route Handler
  participant M as MongoDB

  C->>E: HTTP request
  E->>A: validate Authorization header
  A-->>E: allow or 401
  E->>R: route execution
  R->>M: query/findOne/find
  M-->>R: JSON document(s)
  R-->>C: response payload
```

### Startup Lifecycle

```mermaid
flowchart TD
  Start[Process start] --> Env[dotenv config]
  Env --> Connect[connectDB function call]
  Connect --> Seed[seedData function call]
  Seed --> Listen[app.listen function call]
  Listen --> Ready[Serving HTTP + /docs]
```

---

## Source Layout

```text
backend/
├── src/
│   ├── app.ts
│   ├── db.ts
│   ├── seed.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── models/
│   │   ├── TeamMember.ts
│   │   ├── Investment.ts
│   │   ├── Sector.ts
│   │   └── Consultation.ts
│   └── routes/
│       ├── auth.ts
│       ├── ping.ts
│       ├── documents.ts
│       ├── team.ts
│       ├── investments.ts
│       ├── sectors.ts
│       ├── consultations.ts
│       └── scrape.ts
├── documents/
├── Dockerfile
├── package.json
└── .env.example
```

---

## API Surface

Base local URL: `http://localhost:3456`

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/auth/token` | No | Returns demo token currently used by middleware. |

### Core

| Method | Path | Required Query | Description |
|---|---|---|---|
| `GET` | `/ping` | none | Returns authenticated user details from middleware context. |
| `GET` | `/api/documents/download` | none | Streams a ZIP of backend documents. |
| `GET` | `/api/team` | `name` | Team member profile without insights. |
| `GET` | `/api/team/insights` | `name` | Team member related insights only. |
| `GET` | `/api/investments` | `company_name` | Investment profile without insights. |
| `GET` | `/api/investments/insights` | `company_name` | Investment insights only. |
| `GET` | `/api/sectors` | `sector` | Sector profile details. |
| `GET` | `/api/consultations` | `name` | Consultations matching consultant name text. |
| `GET` | `/api/scrape` | `url` | Fake scrape payload for orchestration testing. |

Swagger UI:
- `GET /docs`

```mermaid
graph LR
  Token[auth/token] --> Authd[/Bearer middleware/]
  Authd --> Ping[api/ping]
  Authd --> Team[api/team*]
  Authd --> Invest[api/investments*]
  Authd --> Sector[api/sectors]
  Authd --> Consult[api/consultations]
  Authd --> Docs[api/documents/download]
  Authd --> Scrape[api/scrape]
```

---

## Data Model

Collections are represented by Mongoose models in `src/models/*`.

```mermaid
erDiagram
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
    string[] sectors
  }

  INVESTMENT_INSIGHT {
    string date
    string title
    string url
  }

  SECTOR {
    string sector
    string description
    string[] companies
    string[] investment_team
  }

  CONSULTATION {
    string date
    string company_name
    string consultation_details
    number hours
  }

  TEAM_MEMBER ||--o{ TEAM_INSIGHT : has
  INVESTMENT ||--o{ INVESTMENT_INSIGHT : has
```

### Seed Behavior

`src/seed.ts` loads faker data if corresponding collections are empty:
- 100 team members
- 200 investments
- 50 sectors
- 300 consultations

This makes local/prototype environments usable without manual import.

---

## Configuration

Environment values (`backend/.env.example`):

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | No | `mongodb://localhost:27017/rag_db` | MongoDB connection URI |
| `PORT` | No | `3456` | HTTP server port |

Local `.env` example:

```bash
MONGO_URI=mongodb://localhost:27017/rag_db
PORT=3456
```

---

## Local Development

Install and run:

```bash
cd backend
npm ci
npm run dev
```

Build TypeScript:

```bash
npm run build
```

Start compiled output:

```bash
node dist/app.js
```

Health smoke:

```bash
curl -s http://localhost:3456/auth/token
```

---

## Containerization And Deployment

`backend/Dockerfile` uses two stages:
1. Builder stage compiles TypeScript to `dist/`
2. Runtime stage installs production dependencies and runs `node dist/app.js`

```mermaid
graph LR
  Src[src/*.ts] --> Build[npm run build]
  Build --> Dist[dist/*.js]
  Dist --> Runtime[node:18-alpine runtime]
  Runtime --> Expose[Port 3456]
```

Standalone container run:

```bash
docker build -t rag-backend ./backend
docker run --rm -p 3456:3456 --env-file backend/.env rag-backend
```

---

## Operational Playbook

Recommended probes:

```bash
curl -f http://localhost:3456/auth/token
curl -f -H "Authorization: Bearer psJN7z3J9q" "http://localhost:3456/ping"
curl -f -H "Authorization: Bearer psJN7z3J9q" "http://localhost:3456/api/team?name=John%20Doe"
```

Runtime observability:
- startup logs include DB connect and docs URL
- route handlers return explicit 400/404/500 responses
- Swagger UI reflects route annotations

---

## Security Hardening Checklist

Current auth is static-token middleware (`src/middleware/auth.ts`) and is suitable only for controlled environments.

Before internet-facing production, implement:
1. JWT or OAuth2 validation with issuer/audience checks.
2. Secret storage via managed vault, not inline literals.
3. Rate limiting and abuse protection at ingress/API gateway.
4. Request validation and response schema enforcement for all routes.
5. Structured audit logging and SIEM forwarding.
6. IP allowlist or private networking between `rag_system` and `backend`.

```mermaid
flowchart TD
  Current[Static bearer token] --> Upgrade1[JWT verification]
  Upgrade1 --> Upgrade2[Gateway policy + rate limits]
  Upgrade2 --> Upgrade3[Secret manager integration]
  Upgrade3 --> Upgrade4[Audit logging + monitoring]
```

---

## Troubleshooting

| Symptom | Likely Cause | Resolution |
|---|---|---|
| `401 Unauthorized` for domain routes | missing or wrong bearer token | call `/auth/token` then retry with `Authorization` header |
| startup exits after DB connect attempt | invalid `MONGO_URI` | verify credentials/network and container DNS |
| `/api/documents/download` returns 500 | missing `documents/` folder | ensure folder exists and is copied into image |
| empty responses for profile lookups | seed data not present or query mismatch | check collection counts and query parameter spelling |
| Swagger missing route docs | route annotations not parsed | ensure file path pattern `./src/routes/*.ts` still valid |

```mermaid
flowchart TD
  Issue[Backend failure] --> AuthCheck{401?}
  AuthCheck -->|Yes| Token[Validate bearer token]
  AuthCheck -->|No| DataCheck{404/empty?}
  DataCheck -->|Yes| Seed[Check DB + seed status]
  DataCheck -->|No| Infra[Check Mongo connectivity/logs]
  Seed --> Retry[Retry request]
  Infra --> Retry
```
