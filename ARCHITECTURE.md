# RAG AI System Architecture Documentation

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Architecture](#component-architecture)
  - [Frontend/Client Layer](#frontendclient-layer)
  - [RAG Processing Pipeline](#rag-processing-pipeline)
  - [Backend API Layer](#backend-api-layer)
  - [Data Layer](#data-layer)
- [Data Flow Architecture](#data-flow-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Technology Stack](#technology-stack)
- [Design Patterns and Principles](#design-patterns-and-principles)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)

---

## System Overview

This project implements a comprehensive **Retrieval-Augmented Generation (RAG)** system for portfolio support. The system combines document retrieval, vector embeddings, dynamic entity extraction, and external API integration to provide intelligent, context-aware responses using Large Language Models (LLMs).

### Key Capabilities

- **Document Processing**: Downloads, extracts, and indexes MasterClass documents
- **Vector Similarity Search**: Uses FAISS for efficient document retrieval
- **Dynamic Entity Extraction**: Regex-based extraction of people, companies, sectors, and URLs
- **API Enrichment**: Integrates external data sources for comprehensive responses
- **Conversational Memory**: Maintains context across multi-turn conversations
- **Multiple Interfaces**: CLI, Jupyter Notebook, and REST API endpoints

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[User Interface]
        B[CLI Interface]
        C[Jupyter Notebook]
        D[HTTP Client]
    end

    subgraph "Application Layer"
        E[Flask API Server]
        F[RAG Processing Engine]
        G[Conversation Manager]
    end

    subgraph "AI/ML Layer"
        H[Ollama LLM<br/>llama2]
        I[HuggingFace Embeddings<br/>all-MiniLM-L6-v2]
        J[FAISS Vector Store]
    end

    subgraph "Backend Services"
        K[Express API Server]
        L[Authentication Middleware]
        M[Swagger Documentation]
    end

    subgraph "Data Sources"
        N[(MongoDB)]
        O[Document Repository<br/>ZIP Files]
        P[External Web Sources]
    end

    A --> E
    B --> F
    C --> F
    D --> E

    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
    F --> K

    K --> L
    K --> M
    K --> N

    F --> O
    F --> P
```

### Architecture Layers

1. **Client Layer**: Multiple interfaces for user interaction (CLI, notebook, API clients)
2. **Application Layer**: Core RAG processing logic and Flask API server
3. **AI/ML Layer**: Language models, embeddings, and vector storage
4. **Backend Services**: Express API for data enrichment and authentication
5. **Data Sources**: MongoDB, document repositories, and external web sources

---

## Component Architecture

### Frontend/Client Layer

```mermaid
graph LR
    subgraph "Interaction Modes"
        A[CLI Interface<br/>Python Script]
        B[Jupyter Notebook<br/>Google Colab]
        C[REST API Client<br/>HTTP/JSON]
    end

    subgraph "Features"
        D[Interactive Console]
        E[Conversation History]
        F[Error Handling]
    end

    A --> D
    A --> E
    B --> D
    B --> E
    C --> F

    D --> G[RAG Engine]
    E --> G
    F --> G
```

#### Components

- **CLI Interface** (`rag_langchain_ai_system.py`): Terminal-based interactive conversation loop
- **Jupyter Notebook** (`RAG_LangChain_AI_System.ipynb`): Notebook environment for experimentation
- **Flask API** (`flask_api.py`): RESTful endpoint for programmatic access

---

### RAG Processing Pipeline

```mermaid
graph TB
    A[User Query] --> B{Query Type Detection}

    B -->|Greeting| C[Return Preset Response]
    B -->|Complex Query| D[Document Retrieval]

    D --> E[FAISS Vector Search<br/>Top-K Similarity]

    E --> F[Entity Extraction]
    F --> G{Extract Entities}

    G -->|Person Name| H[Call Team API]
    G -->|Company Name| I[Call Investments API]
    G -->|Sector| J[Call Sectors API]
    G -->|URL| K[Call Scrape API]
    G -->|Consultation| L[Call Consultations API]

    H --> M[Aggregate API Data]
    I --> M
    J --> M
    K --> M
    L --> M

    M --> N[Build LLM Prompt]
    E --> N
    O[Conversation History] --> N

    N --> P[Ollama LLM<br/>Generate Response]
    P --> Q[Update Conversation History]
    Q --> R[Return Response]

    C --> R
```

#### Processing Steps

1. **Query Analysis**: Detect query type (greeting, simple, or complex)
2. **Document Retrieval**: FAISS similarity search for relevant chunks
3. **Entity Extraction**: Regex patterns to identify key entities
4. **API Enrichment**: Call external APIs based on extracted entities
5. **Prompt Construction**: Combine context, API data, and conversation history
6. **LLM Generation**: Ollama generates contextual response
7. **Memory Update**: Append to conversation history

---

### Backend API Layer

```mermaid
graph TB
    subgraph "Express Backend API"
        A[Express App Server<br/>Port 3456]

        B[Swagger UI<br/>/docs]
        C[Auth Routes<br/>/auth/token]
        D[Protected Routes]

        A --> B
        A --> C
        A --> D

        subgraph "Authentication"
            E[Bearer Token Middleware]
            C --> E
            D --> E
        end

        subgraph "API Endpoints"
            F[ping<br/>Health Check]
            G[api/team<br/>Team Profiles]
            H[api/investments<br/>Investment Data]
            I[api/sectors<br/>Sector Info]
            J[api/consultations<br/>Consultation Data]
            K[api/scrape<br/>Web Scraping]
            L[api/documents<br/>Document Download]
        end

        D --> F
        D --> G
        D --> H
        D --> I
        D --> J
        D --> K
        D --> L

        subgraph "Data Models"
            M[TeamMember Model]
            N[Investment Model]
            O[Sector Model]
            P[Consultation Model]
        end

        G --> M
        H --> N
        I --> O
        J --> P

        M --> Q[(MongoDB)]
        N --> Q
        O --> Q
        P --> Q
    end
```

#### Backend Components

- **Express Server**: Node.js/TypeScript API server
- **Authentication**: Bearer token-based authentication
- **Swagger Documentation**: Auto-generated API documentation
- **MongoDB Integration**: Mongoose ORM for data persistence
- **Route Handlers**: Modular route controllers for each endpoint

---

### Data Layer

```mermaid
erDiagram
    TEAM_MEMBER ||--o{ INSIGHT : has
    TEAM_MEMBER {
        string name PK
        string role
        string bio
        string personal_quote
    }
    INSIGHT {
        string title
        string date
        string link
    }

    INVESTMENT {
        string company_name PK
        string sector
        string description
        string investment_date
        float amount
    }

    SECTOR {
        string name PK
        string description
        string market_size
        array companies
    }

    CONSULTATION {
        string consultant_name PK
        string company
        string date
        string topic
        string notes
    }

    DOCUMENT_CHUNK {
        int id PK
        string filename
        string content
        array embedding
        int chunk_index
    }
```

#### Data Models

1. **TeamMember**: Portfolio team profiles with related insights
2. **Investment**: Portfolio company investment details
3. **Sector**: Market sector information and trends
4. **Consultation**: Consultation history and notes
5. **DocumentChunk**: Embedded text chunks from MasterClass documents

---

## Data Flow Architecture

### Query Processing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Flask API
    participant R as RAG Engine
    participant V as FAISS Store
    participant L as Ollama LLM
    participant E as Express API
    participant M as MongoDB

    U->>F: POST /chat {query}
    F->>R: Process Query

    R->>V: Similarity Search
    V-->>R: Top-K Documents

    R->>R: Extract Entities<br/>(Regex Patterns)

    par API Enrichment
        R->>E: GET /api/team?name=...
        E->>M: Query TeamMember
        M-->>E: Member Data
        E-->>R: Team Profile

        R->>E: GET /api/investments?company=...
        E->>M: Query Investment
        M-->>E: Investment Data
        E-->>R: Investment Info

        R->>E: GET /api/sectors?sector=...
        E->>M: Query Sector
        M-->>E: Sector Data
        E-->>R: Sector Info
    end

    R->>R: Build Prompt<br/>(Docs + API + History)

    R->>L: Generate Response
    L-->>R: LLM Output

    R->>R: Update History
    R-->>F: Response
    F-->>U: JSON Response
```

### Document Indexing Flow

```mermaid
sequenceDiagram
    participant S as System Startup
    participant E as Express API
    participant D as Document Processor
    participant T as Text Splitter
    participant H as HuggingFace Embeddings
    participant V as FAISS Vector Store

    S->>E: GET /api/documents/download
    E-->>S: documents.zip

    S->>D: Extract ZIP
    D->>D: Read .txt Files

    loop For Each Document
        D->>T: Split into Chunks<br/>(500 chars, 100 overlap)
        T-->>D: Text Chunks[]

        D->>H: Encode Chunks
        H-->>D: Embeddings[]
    end

    D->>V: Build Index
    V-->>D: FAISS Index Ready

    D-->>S: Indexing Complete
    S->>S: Ready for Queries
```

---

## Deployment Architecture

### Google Colab Deployment

```mermaid
graph TB
    subgraph "Google Colab Environment"
        A[Colab Notebook<br/>T4 GPU Runtime]

        subgraph "Setup Phase"
            B[Install colab-xterm]
            C[Launch XTerm Terminal]
            D[Install Ollama CLI]
            E[Pull llama2 Model]
        end

        subgraph "Runtime Services"
            F[Ollama Server<br/>Background Process]
            G[Flask App<br/>Port 5000]
            H[ngrok Tunnel<br/>Public HTTPS]
        end

        subgraph "Python Environment"
            I[langchain_community]
            J[faiss-cpu]
            K[sentence-transformers]
            L[pyngrok]
        end

        A --> B --> C --> D --> E
        E --> F
        A --> I
        A --> J
        A --> K
        A --> L

        F --> G
        G --> H
        L --> H
    end

    subgraph "External Services"
        M[Express API<br/>Render.com]
        N[MongoDB Atlas]
        O[Internet Clients]
    end

    H <--> O
    G <--> M
    M <--> N
```

### Production Deployment (Render.com)

```mermaid
graph TB
    subgraph "Render.com Cloud"
        A[Express API Service]
        B[Environment Variables<br/>.env]
        C[Auto-Deploy from Git]

        A --> B
        C --> A
    end

    subgraph "MongoDB Atlas"
        D[(Production Database)]
        E[Automated Backups]
        F[Connection String]
    end

    subgraph "Client Access"
        G[Public HTTPS Endpoint<br/>rag-langchain-ai-system.onrender.com]
        H[Swagger UI<br/>/docs]
    end

    A <--> D
    D --> E
    B --> F
    A --> G
    A --> H

    I[GitHub Repository] --> C
```

---

## Technology Stack

### Core Technologies

```mermaid
mindmap
  root((RAG AI System))
    Backend
      Express.js
      TypeScript
      Node.js
      MongoDB/Mongoose
      Swagger/OpenAPI

    AI/ML
      LangChain
      Ollama
      HuggingFace
      FAISS
      llama2 Model
      all-MiniLM-L6-v2

    Frontend/Interface
      Flask
      Jupyter/Colab
      Python CLI
      ngrok

    DevOps
      Docker
      Render.com
      GitHub Actions
      Makefile

    Data Processing
      Text Splitter
      Regex Entity Extraction
      Vector Embeddings
      Web Scraping
```

### Technology Matrix

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **LLM** | Ollama (llama2) | Natural language generation |
| **Embeddings** | HuggingFace (all-MiniLM-L6-v2) | Text vectorization |
| **Vector DB** | FAISS | Similarity search |
| **Backend API** | Express.js + TypeScript | RESTful services |
| **Database** | MongoDB + Mongoose | Data persistence |
| **RAG Framework** | LangChain | Document processing pipeline |
| **API Server** | Flask + Python | RAG endpoint exposure |
| **Documentation** | Swagger UI | API documentation |
| **Tunneling** | ngrok | Colab public access |
| **Deployment** | Render.com, Docker | Cloud hosting |

---

## Design Patterns and Principles

### Architectural Patterns

```mermaid
graph TB
    subgraph "Design Patterns"
        A[Retrieval-Augmented<br/>Generation Pattern]
        B[Repository Pattern<br/>MongoDB Models]
        C[Middleware Pattern<br/>Auth/Logging]
        D[Strategy Pattern<br/>Entity Extractors]
        E[Factory Pattern<br/>API Clients]
        F[Singleton Pattern<br/>Vector Store]
    end

    subgraph "SOLID Principles"
        G[Single Responsibility<br/>Modular Routes]
        H[Open/Closed<br/>Extensible Endpoints]
        I[Dependency Injection<br/>DB Connection]
        J[Interface Segregation<br/>API Contracts]
    end

    subgraph "Best Practices"
        K[Error Handling]
        L[Logging & Monitoring]
        M[Input Validation]
        N[Rate Limiting]
        O[Documentation]
    end

    A --> G
    B --> G
    C --> M
    D --> H
    E --> I
    F --> G

    style A fill:#cfe2ff
    style G fill:#d1e7dd
    style K fill:#fff3cd
```

### Key Design Decisions

1. **Modular Architecture**: Separate concerns (routes, models, middleware)
2. **Stateless API**: RESTful design for horizontal scalability
3. **In-Memory Vector Store**: FAISS for fast retrieval (trade-off: not persistent)
4. **Bearer Authentication**: Simple token-based security
5. **Error-First Handling**: Graceful degradation with fallback messages
6. **Conversation Memory**: Client-side state management (global variable)

---

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        A[Bearer Token Authentication]
        B[Environment Variables<br/>Secrets Management]
        C[Input Validation<br/>Query Parameters]
        D[HTTPS/TLS<br/>Transport Security]
        E[CORS Configuration]
        F[Rate Limiting<br/>Future Enhancement]
    end

    subgraph "API Security Flow"
        G[Client Request] --> H{Has Bearer Token?}
        H -->|No| I[401 Unauthorized]
        H -->|Yes| J{Valid Token?}
        J -->|No| I
        J -->|Yes| K[Access Granted]
        K --> L{Input Valid?}
        L -->|No| M[400 Bad Request]
        L -->|Yes| N[Process Request]
    end

    subgraph "Data Security"
        O[MongoDB Access Control]
        P[Connection String Encryption]
        Q[No Hardcoded Secrets]
    end

    A --> H
    D --> G
```

### Security Measures

- **Authentication**: Bearer token required for all protected endpoints
- **Environment Variables**: Sensitive data stored in `.env` files (not committed)
- **HTTPS**: Enforced in production (Render.com automatic)
- **Input Validation**: Query parameter sanitization
- **Error Messages**: Generic errors to avoid information leakage
- **MongoDB**: Connection string encryption and access control

---

## Scalability Considerations

### Horizontal Scaling Strategy

```mermaid
graph TB
    subgraph "Load Balancer"
        A[Nginx/AWS ALB]
    end

    subgraph "API Instances"
        B[Flask Instance 1]
        C[Flask Instance 2]
        D[Flask Instance N]
    end

    subgraph "Backend API Cluster"
        E[Express Instance 1]
        F[Express Instance 2]
        G[Express Instance N]
    end

    subgraph "Data Layer"
        H[(MongoDB Replica Set)]
        I[Redis Cache<br/>Future Enhancement]
        J[S3/Object Storage<br/>Documents]
    end

    subgraph "AI/ML Services"
        K[Ollama Service 1<br/>GPU Instance]
        L[Ollama Service 2<br/>GPU Instance]
        M[Shared FAISS Index<br/>Read-Only]
    end

    A --> B
    A --> C
    A --> D

    B --> E
    C --> F
    D --> G

    E --> H
    F --> H
    G --> H

    B --> K
    C --> L
    D --> M

    B --> J
    C --> J
    D --> J
```

### Scalability Challenges and Solutions

| Challenge | Current Limitation | Solution |
|-----------|-------------------|----------|
| **Vector Store** | In-memory FAISS (single instance) | Migrate to persistent vector DB (Pinecone, Weaviate) |
| **LLM Latency** | Single Ollama instance | Load-balanced LLM service with queueing |
| **Conversation State** | Global variable (not distributed) | Redis or database-backed session store |
| **Document Updates** | Manual re-indexing | Automated indexing pipeline with webhooks |
| **API Rate Limiting** | No rate limiting | Implement Redis-based rate limiter |
| **Monitoring** | Basic logging | Add Prometheus + Grafana dashboards |

### Performance Optimization

```mermaid
graph LR
    subgraph "Current Performance"
        A[~2-5s Query Response]
        B[In-Memory FAISS<br/>Fast Retrieval]
        C[Direct API Calls<br/>No Caching]
    end

    subgraph "Optimization Strategies"
        D[Caching Layer<br/>Redis]
        E[Batch Embeddings<br/>GPU Optimization]
        F[Async API Calls<br/>Parallel Requests]
        G[Connection Pooling<br/>MongoDB]
        H[CDN for Documents<br/>S3 + CloudFront]
    end

    A --> D
    B --> E
    C --> F
    C --> G
    C --> H
```

---

## Entity Extraction Architecture

```mermaid
graph TB
    A[User Query + History] --> B[Entity Extractor]

    B --> C{Regex Pattern Matching}

    C -->|Person Pattern| D["consult/profile/team with <Name>"]
    C -->|Company Pattern| E["company <CompanyName>"]
    C -->|Sector Pattern| F["sector of <Sector>"]
    C -->|URL Pattern| G["https?://..."]

    D --> H[API Router]
    E --> H
    F --> H
    G --> H

    H --> I{Route to API}

    I -->|Person| J[/api/team<br/>/api/consultations/]
    I -->|Company| K[/api/investments/]
    I -->|Sector| L[/api/sectors/]
    I -->|URL| M[/api/scrape/]

    J --> N[Aggregate Results]
    K --> N
    L --> N
    M --> N

    N --> O[Enriched Context<br/>for LLM]
```

---

## API Endpoint Architecture

```mermaid
graph TB
    subgraph "API Endpoints by Category"
        A[Authentication]
        B[Health Check]
        C[Documents]
        D[Team Management]
        E[Investments]
        F[Sectors]
        G[Consultations]
        H[Web Scraping]
    end

    A --> A1[POST /auth/token<br/>Generate Bearer Token]

    B --> B1[GET /ping<br/>Verify Credentials]

    C --> C1[GET /api/documents/download<br/>Download MasterClass ZIP]

    D --> D1[GET /api/team?name=...<br/>Team Member Profile]
    D --> D2[GET /api/team/insights?name=...<br/>Member Insights]

    E --> E1[GET /api/investments?company_name=...<br/>Investment Details]
    E --> E2[GET /api/investments/insights?company_name=...<br/>Investment Insights]

    F --> F1[GET /api/sectors?sector=...<br/>Sector Information]

    G --> G1[GET /api/consultations?name=...<br/>Consultation History]

    H --> H1[GET /api/scrape?url=...<br/>Scrape URL Content]
```

---

## Conversation Memory Architecture

```mermaid
stateDiagram-v2
    [*] --> Initialized: System Startup

    Initialized --> WaitingForQuery: Ready

    WaitingForQuery --> ProcessingQuery: User Input

    ProcessingQuery --> RetrievingDocs: Query Received
    RetrievingDocs --> ExtractingEntities: Documents Retrieved
    ExtractingEntities --> CallingAPIs: Entities Extracted
    CallingAPIs --> GeneratingResponse: API Data Aggregated

    GeneratingResponse --> UpdatingHistory: LLM Response Generated

    UpdatingHistory --> WaitingForQuery: History Updated

    UpdatingHistory --> [*]: Exit/Quit

    note right of UpdatingHistory
        Conversation history format:
        "User: <query>\nAssistant: <response>\n..."
        Stored in global variable or session
    end note

    note right of ProcessingQuery
        History passed to:
        1. Entity extraction
        2. LLM prompt construction
    end note
```

---

## Error Handling and Resilience

```mermaid
graph TB
    A[Request Received] --> B{Input Valid?}

    B -->|No| C[400 Bad Request<br/>Missing Parameters]
    B -->|Yes| D[Process Request]

    D --> E{API Call Success?}

    E -->|Network Error| F[Retry with Exponential Backoff]
    E -->|404 Not Found| G[Return Friendly Message<br/>'No data found for...']
    E -->|500 Server Error| H[Log Error + Return Generic Message]
    E -->|Success| I[Process API Data]

    F --> J{Max Retries?}
    J -->|No| E
    J -->|Yes| G

    I --> K{LLM Call Success?}

    K -->|Error| L[Return Fallback Response<br/>'Sorry, I encountered an error...']
    K -->|Success| M[Return LLM Response]

    M --> N[200 OK]
    C --> O[Return Error JSON]
    G --> P[Return Note in Context]
    H --> O
    L --> O
```

---

## Future Enhancements

### Roadmap

```mermaid
timeline
    title RAG System Enhancement Roadmap

    section Phase 1 - Q1 2025
        Persistent Vector DB : Migrate to Pinecone/Weaviate
        Redis Caching : API response caching
        Rate Limiting : Protect against abuse

    section Phase 2 - Q2 2025
        Multi-tenant Support : User-specific contexts
        Advanced Analytics : Query patterns + insights
        Real-time Indexing : Webhook-based document updates

    section Phase 3 - Q3 2025
        Fine-tuned Models : Domain-specific LLM
        GraphQL API : Flexible querying
        WebSocket Support : Streaming responses

    section Phase 4 - Q4 2025
        Multi-modal RAG : Image + PDF support
        Voice Interface : Speech-to-text integration
        Mobile App : iOS/Android clients
```

### Enhancement Priorities

```mermaid
quadrantChart
    title Feature Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact

    quadrant-1 High Priority
    quadrant-2 Quick Wins
    quadrant-3 Low Priority
    quadrant-4 Strategic Investments

    Redis Caching: [0.3, 0.8]
    Rate Limiting: [0.2, 0.7]
    Persistent Vector DB: [0.7, 0.9]
    Multi-tenant Support: [0.8, 0.8]
    Advanced Analytics: [0.6, 0.6]
    Real-time Indexing: [0.7, 0.7]
    Fine-tuned Models: [0.9, 0.9]
    GraphQL API: [0.6, 0.5]
    WebSocket Support: [0.5, 0.6]
    Multi-modal RAG: [0.9, 0.8]
    Voice Interface: [0.7, 0.5]
    Mobile App: [0.8, 0.6]
```

---

## Conclusion

This RAG AI System demonstrates a production-ready architecture that combines modern AI/ML techniques with robust backend services. The modular design enables easy extension and scaling while maintaining clean separation of concerns.

### Key Architectural Strengths

- **Modular Design**: Clear separation between RAG engine, API services, and data layer
- **Flexible Interfaces**: Multiple access methods (CLI, notebook, API)
- **API-First Approach**: RESTful design with comprehensive documentation
- **Error Resilience**: Graceful degradation with fallback responses
- **Extensible Framework**: Easy to add new entity types and API endpoints

### Areas for Improvement

- **State Management**: Migrate from global variables to distributed session store
- **Vector Store**: Implement persistent, distributed vector database
- **Caching**: Add Redis layer for API responses and embeddings
- **Monitoring**: Enhanced observability with metrics and tracing
- **Testing**: Comprehensive unit, integration, and load testing

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-08
**Author**: David Nguyen
**Repository**: [RAG-AI-System-Portfolio-Support](https://github.com/hoangsonww/RAG-AI-System-Portfolio-Support)
