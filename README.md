# KiliGuide

KiliGuide is a multi-tenant, source-grounded smart-campus platform by KiliMind AI. It enables students, lecturers, department staff, administrators, and educational institutions to find trusted university information, manage campus workflows, parse academic timetables, and leverage next-generation RAG (Retrieval-Augmented Generation) intelligence.

---

## 🌟 Key Platform Features

### 🏢 Multi-Tenant Institution Infrastructure
- **Institution Registration (`/register-institution`)**: Educational institutions can apply to join the KiliGuide platform via a dedicated onboarding portal.
- **Admin Approval Workflow**: Automated onboarding stored procedures (`approve_institution_request`) establish isolated institution schemas, default settings, and administrative access.
- **Isolated Vector Search & Data Partitioning**: All knowledge base documents, chunks, notices, and tickets are strictly partitioned by `institution_id` with Row-Level Security (RLS).

### 🤖 Smart Campus & AI Interface
- **Responsive Dashboard**: Modern, mobile-first interface designed for fast access across mobile and desktop devices.
- **Grounded AI Assistant**: Interactive chat interface featuring verified source attribution cards, similarity score indicators, and confidence ratings.
- **Academic Resources Hub (`academic_resources`)**: Centralized module where Lecturers, Department Admins, Institution Admins, and Super Admins upload course materials, lecture notes, past exam papers, revision guides, and syllabi, immediately synced and downloadable by all students in their portal workspace.
- **In-App Resource Viewer (`AcademicResourceViewerModal`)**: In-app PDF/image document preview modal with zoom controls, pagination, and direct downloads.
- **Timetable AI Parsing (`analyze-timetable`)**: Converts uploaded student timetable images and documents into structured calendar events and automated push notification reminders.
- **Document Center**: Centralized repository for academic, financial, hostel, examination, and departmental documents.
- **Campus Notice Board & Auto-Summarization**: Instant updates with automatic Gemini-driven notice summaries and key deadline extraction.
- **Interactive Reminders & Personal Calendar**: Custom event tracking and class reminders delivered via Web Push notifications (`send-push`, `save-push-subscription`).
- **Support Ticket Escalation**: Multi-tier departmental support system with automated escalation (`escalate-ticket`) for high-priority tickets.
- **Localization**: Native English / Kiswahili language switching.
- **Developer Portal (`/developers`)**: Interactive Swagger UI rendering OpenAPI 3.0 specs for external system integrations.

---

## 👥 Role-Based Portals

Each platform role is provided with a dedicated workspace at `/portal/[role]`:

| Role | Portal Route | Main Capabilities & Responsibilities |
| --- | --- | --- |
| **Student** | `/portal/student` | AI campus assistant, personal calendar, timetable parser, document library, reminders, and ticket submission |
| **Lecturer** | `/portal/lecturer` | Publish course updates, upload academic materials, track student query patterns |
| **Department Staff** | `/portal/department` | Manage departmental notices/documents, assign and resolve support tickets, escalate unresolved issues |
| **Administrator** | `/portal/administrator` | Manage platform operations, review institution requests, audit RAG performance, oversee user RBAC and storage quotas |

---

## ⚡ Advanced Multi-Stage RAG Orchestrator

KiliGuide implements a state-of-the-art RAG pipeline designed for speed, cost efficiency, and high precision:

```
[ User Query ]
       │
       ▼
[ Smart 0-Token Fast-Path Contextualizer ] ──(Self-Contained Query)──► [ Skip LLM Rewriting (0 Tokens) ]
       │ (Ambiguous / Pronoun Follow-Up)
       ▼
[ Query Contextualization (Cerebras Llama-3.1-70B) ]
       │
       ▼
[ Semantic Caching (pgvector) ] ──(Similarity > 95%)──► [ Instant Cache Hit Response ]
       │ (Cache Miss)
       ▼
[ Reciprocal Rank Fusion (RRF) Hybrid Search ] ──► (Combines Dense Cosine Vectors + Sparse Full-Text tsvector)
       │
       ▼
[ Smart Metadata Filtering & Chunk Compression ] ──► (Filters by institution/dept & merges adjacent document chunks)
       │
       ▼
[ Confidence-based LLM Bypass ] ──(Score > 85%)──► [ Direct Extracted Text Response ]
       │ (Score < 85%)
       ▼
[ Multi-LLM Inference Hierarchy & Precision Citation Filter ]
 ├─► Primary Chat Engine: Cerebras (Llama-3.1-70B)
 ├─► Secondary Fallback: Groq (Llama-3.3-70B / GPT-OSS-120B)
 ├─► Tertiary Fallback: NVIDIA NIM (Llama-3.1-70B)
 ├─► Quaternary Fallback: Gemini 2.5 Flash / 2.0 Flash
 └─► Vision & Extraction Engine: Gemini Multimodal & NVIDIA Vision (Timetables, Scanned PDFs, Images)
```

1. **Smart 0-Token Fast-Path Contextualizer**: Evaluates incoming queries using lightweight regex heuristics. Self-contained queries skip LLM rewriting completely (0 tokens consumed, sub-millisecond overhead). Contextualization via **Cerebras (Llama-3.1-70B)** is reserved strictly for ambiguous follow-ups containing pronouns.
2. **Semantic Caching (`query_cache`)**: Queries with >95% vector similarity hit the semantic cache for sub-second responses.
3. **RRF Hybrid Search**: Combines dense pgvector cosine similarity with sparse PostgreSQL full-text search (`tsvector`) via Reciprocal Rank Fusion scoring to maximize retrieval recall.
4. **Contextual Compression & Chunk Merging**: Merges contiguous chunks from the same source document to preserve full context.
5. **Confidence-based LLM Bypass**: For factual queries scoring above 85% relevance, raw source text is returned immediately without LLM invocation.
6. **Multi-LLM Inference Hierarchy**: Serves chat completions through **Cerebras (Llama-3.1-70B)** as the primary high-speed engine, with multi-tier fallback through Groq, NVIDIA NIM, and Gemini.
7. **Precision Citation Filtering**: Post-processes LLM output to match explicit `[n]` citation tags against retrieved chunks, ensuring `sources` cards mention **only** the documents actually referenced in the answer text.
8. **Multi-Key & Multi-Model Vision Pipeline**: For scanned PDFs, image format document ingestion, and timetable parsing, Gemini Multimodal File API & inline base64 operate with key pool rotation (`GEMINI_API_KEY_1..5`) and exponential backoff on HTTP 503 high demand spikes.

---

## 🐍 Python Automated Crawler & Ingestion Service

Located in `ingestion-service/`, a FastAPI background service keeps the knowledge base continuously synchronized with live university web sources:

- **Sitemap Crawling**: Parses root `sitemap.xml` feeds for automated URL discovery.
- **Headless SPA Rendering**: Uses headless Chromium via **Playwright** to execute JavaScript and scrape dynamic web pages.
- **Smart PDF Extraction**: Discovers linked PDF assets and extracts structured content using **PyMuPDF** and **NVIDIA Vision APIs**.
- **Ghost Vector Pruning**: Identifies removed web pages and automatically purges stale vector embeddings from pgvector.
- **Scheduled Synchronization**: Configurable background execution using **APScheduler**.

---

## 🔌 Model Context Protocol (MCP) Integration

KiliGuide includes a standalone **MCP Server** (`mcp-server/`) enabling AI clients (such as Antigravity, Claude Desktop, Cursor, and custom agents) to securely interact with the campus ecosystem:

- **Knowledge Retrieval**: Exposes semantic vector search over campus documents and ingested websites.
- **Notice Queries**: Provides real-time feeds of active campus announcements and departmental notices.
- **Ticket Management**: Allows agents to inspect and update support ticket statuses programmatically.

---

## ⚡ Supabase Edge Functions

The application leverages **18 Supabase Edge Functions** for serverless execution:

| Function | Description / Purpose |
| --- | --- |
| `chat` | Multi-stage RAG chat orchestrator with Cerebras primary inference, RRF hybrid search, caching, and precision citation filtering |
| `ingest-document` | Handles document processing, text chunking, Gemini embeddings, and pgvector insertion |
| `process-document` | Multi-key, multi-model resilient worker for background document ingestion & vision OCR |
| `ingest-website` | Ingests crawled web pages into institution-scoped vector storage |
| `ingest-official-source` | Processes verified official university announcements and documents |
| `crawl-sitemap` | Triggers background crawling and queues discovered URLs |
| `summarize-notice` | Generates concise notice summaries and extracts deadline metadata using Gemini |
| `publish-update` | Matches notice target audiences with registered users to generate in-app notifications |
| `analyze-timetable` | Parses student timetable images/documents into structured calendar events |
| `analyze-timetable-metadata` | Extracts metadata, course codes, and locations from parsed timetables |
| `dispatch-event-reminders` | Cron function evaluating upcoming event deadlines to send push notifications |
| `save-push-subscription` | Registers and updates user Web Push device subscriptions |
| `send-push` | Dispatches Web Push notifications to user devices |
| `generate-image` | Generates visual campus diagrams and maps with quota tracking |
| `escalate-ticket` | Escalates stale or high-priority support tickets to department administrators |
| `get-vapid` | Serves public VAPID keys for Web Push authentication |
| `debug-db` | Provides diagnostic database and vector index health metrics |

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend & Database**: Supabase (Auth, PostgreSQL 15, Storage, Realtime, Edge Functions)
- **Vector Database**: PostgreSQL `pgvector` with HNSW indexing and RRF hybrid search
- **AI Models & Inference Engines**:
  - **Primary Chat Engine**: Cerebras AI (`llama3.1-70b`)
  - **Fallback Chat Engines**: Groq (`llama-3.3-70b`), NVIDIA NIM (`llama-3.1-70b`), Gemini 2.5/2.0 Flash
  - **Embeddings**: Gemini Embedding 2 (`gemini-embedding-2`, `text-embedding-004`)
  - **Document Vision & OCR**: Gemini File API / Inline Base64, NVIDIA Llama 3.2 Vision
- **Ingestion Backend**: Python 3.12, FastAPI, Playwright, BeautifulSoup4, PyMuPDF, APScheduler
- **Agent Protocols**: Model Context Protocol (MCP) server integration (`mcp-server/`)
- **API Specs**: OpenAPI 3.0 with Swagger UI (`/developers`)

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js 20+
- Python 3.12+ (for ingestion service)
- Supabase CLI

### Setup Instructions

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Provide your Supabase URL and anonymous key:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Database Migration**:
   Apply all schema migrations located in `supabase/migrations/`:
   ```bash
   supabase db reset
   # Or apply migrations individually via Supabase CLI
   ```

4. **Set Supabase Secrets**:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-gemini-key
   supabase secrets set GROQ_API_KEY=your-groq-key
   supabase secrets set NVIDIA_API_KEY=your-nvidia-key
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to access KiliGuide.
   Navigate to `http://localhost:3000/developers` to view the OpenAPI portal.

---

## 🚢 Deployment & CI/CD

KiliGuide uses automated Continuous Deployment via **Vercel** and **GitHub**:

- **Staging**: Pushes to the `staging` branch deploy automatically to Vercel preview environments for integration testing.
- **Production**: Merges into `main` trigger automated production builds and deployment.
- **Secrets Security**: Service keys and API tokens are configured exclusively through Vercel Environment Variables and Supabase Secrets vault.
