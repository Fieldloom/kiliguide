# KiliGuide

KiliGuide is a source-grounded smart-campus platform by KiliMind AI. It helps students, lecturers, department staff, and administrators find trusted university information, manage campus work, and receive support from the right office.

## Current platform features

### Smart campus interface

- Responsive university dashboard with modern, mobile-first design
- Grounded AI Assistant interface with source cards and confidence scores
- Document Center for official academic, finance, hostel, examination, and departmental resources
- Notice Board for campus updates and deadline announcements
- Interactive reminders: create and complete personal deadline reminders
- Support tickets: create tickets and view their department, status, and updates
- Profile and notification settings interface
- English / Kiswahili language switch control
- **OpenAPI Developer Portal**: Interactive `/developers` API documentation route for easy 3rd-party integration.

### Role-based portals

Each role has its own workspace at `/portal/[role]`:

| Role | Portal | Main responsibilities |
| --- | --- | --- |
| Student | `/portal/student` | Ask questions, view documents/notices, manage reminders, submit tickets |
| Lecturer | `/portal/lecturer` | Publish course updates, share resources, understand student questions |
| Department staff | `/portal/department` | Manage departmental notices/documents and assign support tickets |
| Administrator | `/portal/administrator` | Manage platform operations, users, knowledge-base health, and analytics |

### Advanced Multi-stage RAG Orchestrator

KiliGuide uses a sophisticated chat orchestrator pipeline to balance speed, cost, and accuracy when answering university questions:

1. **Automated Crawler (Python)**: A background Python ingestion service continuously scrapes university sitemaps, extracting deep web pages and embedded PDFs automatically.
2. **Document Ingestion**: Documents uploaded to Supabase (or scraped by the crawler) are chunked, embedded using Gemini Embedding 2 (768-dim), and stored in PostgreSQL using pgvector.
3. **Query Contextualization**: When a user asks a follow-up question, a fast LLM rewrites it into a standalone query using the conversation history.
4. **Semantic Caching**: The orchestrator checks the `query_cache` table for a >95% vector match. If found, it serves an instant response without querying the generation LLM.
5. **Hybrid Search & Context Compression**: It uses a hybrid search (semantic vector + keyword text match) to retrieve relevant chunks, automatically merging adjacent chunks from the same document to restore lost context.
6. **Confidence-based LLM Bypass**: For purely factual queries with a similarity score > 85%, the orchestrator skips the generation LLM entirely and serves the raw extracted text directly to the user.
7. **LLM Routing & Web Fallback**: If generation is needed, the orchestrator attempts to route to Groq (Llama-3.3) for ultra-fast inference, then falls back to NVIDIA NIM (Llama-3.1-70B), and seamlessly falls back to Gemini 2.5 Flash if both fail. If the internal knowledge base lacks the answer, the AI safely utilizes a **Web Search Fallback** to dynamically search trusted official educational sites.

### Python Automated Crawler & Ingestion Service

The `ingestion-service/` directory contains a robust, production-ready Python backend built on **FastAPI**. This service handles the heavy lifting of keeping the AI's knowledge base perfectly synchronized with the university website.

* **Sitemap Scraping:** Automatically reads and parses `sitemap.xml`.
* **Playwright SPA Rendering:** Uses headless Chromium to render JavaScript-heavy pages before scraping.
* **Smart PDF Extraction:** Automatically discovers linked `.pdf` files and parses their text using PyMuPDF and LlamaParse/NVIDIA Vision APIs.
* **Ghost Vector Deletion:** Cross-references the live sitemap with the Supabase database to automatically prune stale embeddings for deleted pages.
* **APScheduler:** Fully configurable background execution interval (e.g., runs every hour).

### Edge Functions

| Function | Purpose |
| --- | --- |
| `chat` | Source-grounded Gemini chat, web search fallback, source attribution, confidence scoring |
| `ingest-document` | Text chunking, Gemini embeddings, pgvector indexing, document processing status |
| `summarize-notice` | Concise Gemini notice summaries and important-date extraction |
| `publish-update` | Matches a new document/notice audience to registered users and creates in-app notifications |
| `analyze-timetable` | Privately converts a student's timetable into dated calendar events and reminders |
| `dispatch-event-reminders` | Delivers due in-app class reminders; schedule it every minute or two |
| `save-push-subscription` | Saves an authenticated user's device-specific browser push subscription |

## Technical stack

- Next.js 15, React 19, TypeScript, Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, Edge Functions
- pgvector for semantic retrieval
- Gemini API: Gemini Embedding 2 and Gemini 2.5 Flash
- Python 3.12, FastAPI, BeautifulSoup4, Trafilatura, Playwright (Ingestion Service)
- Vercel for frontend CI/CD deployment

## OpenAPI Developer Portal

KiliGuide now features a centralized **Developer Portal** located at `/developers`. 
This interactive portal uses `swagger-ui-react` to parse the `public/openapi.yaml` specification, allowing third-party developers, student organizations, and external university systems to safely consume the KiliGuide Chat API and Ingestion Webhooks.

## Database and security

The Supabase migration creates profiles, roles, departments, documents, chunks, embeddings, conversations, messages, reminders, notices, tickets, ticket messages, and crawled pages.

Row-Level Security is enabled for application data. The schema includes policies for user-owned records, ticket participants, administrators, active documents, document storage, and role checks. Never expose the Supabase service-role key or Gemini API key to the browser.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Install packages and start the development server:

   ```bash
   npm install
   npm run dev
   ```

4. Open `http://localhost:3000`.

To view the interactive API Documentation, navigate to `http://localhost:3000/developers`.

## Supabase configuration

1. Create a Supabase project.
2. Apply `supabase/migrations/20260717000000_kiliguide_schema.sql` and `20260801000000_add_crawled_pages.sql` through the Supabase CLI or SQL Editor.
3. Enable Email/Password authentication and configure permitted redirect URLs, including `http://localhost:3000/auth/callback` for development.
4. Add the frontend Supabase URL and anon key to `.env.local`.
5. Store server-only secrets in Supabase—not in `.env.local` committed to source control:

   ```bash
   supabase secrets set GEMINI_API_KEY=your-key
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Deployment & Version Control

KiliGuide uses a secure Continuous Deployment (CI/CD) pipeline integrated with GitHub and Vercel.

1. **Staging Environment:** All active development happens on the `staging` branch, which Vercel automatically builds into a Preview URL.
2. **Production:** Once features are tested in staging, a Pull Request is merged into `main`, which instantly deploys to the live production domain.
3. **Secrets Management:** Environment variables (`.env.local` and `.env.vercel`) are strictly excluded via `.gitignore` and must be entered securely via the Vercel Dashboard.
