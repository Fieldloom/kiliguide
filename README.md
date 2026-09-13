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
- **AI Image Generation**: Built-in support (`generate-image`) for rendering visual campus maps, structural diagrams, and instructional assets with user quota tracking.
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
[ Query Contextualization ] ──► (Rewrites multi-turn chat context into standalone query)
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
[ Multi-LLM Routing & Web Fallback ]
 ├─► Primary: Groq (Llama-3.3-70B)
 ├─► Secondary: NVIDIA NIM (Llama-3.1-70B)
 ├─► Tertiary: Gemini 2.5 Flash
 └─► External: Web Search Fallback (Official University & Educational Domains)
```

1. **Query Contextualization**: Fast LLM processing transforms conversational context into clear, standalone search vectors.
2. **Semantic Caching (`query_cache`)**: Queries with >95% vector similarity hit the semantic cache for sub-second responses.
3. **RRF Hybrid Search**: Combines dense pgvector cosine similarity with sparse PostgreSQL full-text search (`tsvector`) via Reciprocal Rank Fusion scoring to maximize retrieval recall.
4. **Contextual Compression & Chunk Merging**: Merges contiguous chunks from the same source document to preserve full context.
5. **Confidence-based LLM Bypass**: For factual queries scoring above 85% relevance, raw source text is returned immediately without LLM invocation.
6. **Multi-LLM Routing**: Automatically routes inference through **Groq (Llama-3.3)**, falling back to **NVIDIA NIM (Llama-3.1)**, and **Gemini 2.5 Flash**. Unresolved queries seamlessly invoke **Web Search Fallback**.

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
| `chat` | Multi-stage RAG chat orchestrator with RRF hybrid search, caching, LLM routing, and web fallback |
| `ingest-document` | Handles document processing, text chunking, Gemini embeddings, and pgvector insertion |
| `process-document` | Async pipeline worker for background document ingestion |
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
- **AI Models & API**: Gemini Embedding 2, Gemini 2.5 Flash, Groq (Llama-3.3-70B), NVIDIA NIM (Llama-3.1-70B)
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
