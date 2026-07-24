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

### Role-based portals

Each role has its own workspace at `/portal/[role]`:

| Role | Portal | Main responsibilities |
| --- | --- | --- |
| Student | `/portal/student` | Ask questions, view documents/notices, manage reminders, submit tickets |
| Lecturer | `/portal/lecturer` | Publish course updates, share resources, understand student questions |
| Department staff | `/portal/department` | Manage departmental notices/documents and assign support tickets |
| Administrator | `/portal/administrator` | Manage platform operations, users, knowledge-base health, and analytics |

The user-role model is in place. When Supabase Auth is connected, navigation and access will be enforced from each user’s `user_roles` record.

### Advanced Multi-stage RAG Orchestrator

KiliGuide uses a sophisticated chat orchestrator pipeline to balance speed, cost, and accuracy when answering university questions:

1. **Document Ingestion**: Documents uploaded to Supabase are chunked, embedded using Gemini Embedding 2 (768-dim), and stored in PostgreSQL using pgvector.
2. **Query Contextualization**: When a user asks a follow-up question, a fast LLM rewrites it into a standalone query using the conversation history.
3. **Semantic Caching**: The orchestrator checks the `query_cache` table for a >95% vector match. If found, it serves an instant response without querying the generation LLM.
4. **Hybrid Search & Context Compression**: It uses a hybrid search (semantic vector + keyword text match) to retrieve relevant chunks, automatically merging adjacent chunks from the same document to restore lost context.
5. **Confidence-based LLM Bypass**: For purely factual queries with a similarity score > 85%, the orchestrator skips the generation LLM entirely and serves the raw extracted text directly to the user.
6. **LLM Routing & Generation**: If generation is needed, the orchestrator attempts to route to Groq (Llama-3.3) for ultra-fast inference, then falls back to NVIDIA NIM (Llama-3.1-70B), and seamlessly falls back to Gemini 2.5 Flash if both fail. The response includes sources and confidence scores.

### Edge Functions

| Function | Purpose |
| --- | --- |
| `chat` | Source-grounded Gemini chat, source attribution, confidence scoring, conversation logging |
| `ingest-document` | Text chunking, Gemini embeddings, pgvector indexing, document processing status |
| `summarize-notice` | Concise Gemini notice summaries and important-date extraction |
| `publish-update` | Matches a new document/notice audience to registered users and creates in-app notifications |
| `analyze-timetable` | Privately converts a student's timetable into dated calendar events and reminders |
| `dispatch-event-reminders` | Delivers due in-app class reminders; schedule it every minute or two |
| `save-push-subscription` | Saves an authenticated user's device-specific browser push subscription |

### Audience-aware update workflow

During registration, profiles can carry programme, study year, campus, department, and role data. Administrators add an `audience` to a document or notice—for example, students in a specific programme/year or a specific department. If `notify_on_ready` is enabled, ingestion automatically calls `publish-update` after indexing. It matches eligible profiles, creates deduplicated in-app notifications, and respects the document audience rather than broadcasting to everyone.

### Private personal timetable automation

Students can upload a timetable to the private `personal-resources` bucket. `analyze-timetable` uses Gemini to extract and expand classes across a specified semester date range, creates private calendar events, and adds an in-app reminder (30 minutes by default). Their timetable remains private: it is never inserted into the shared RAG knowledge base or available to other users. Schedule `dispatch-event-reminders` with Supabase Cron to create class alarms shortly before each event.

KiliGuide is also a PWA. Users can visit `/notifications`, choose **Enable class alarms**, and grant browser permission. The service worker receives Web Push messages and displays operating-system notifications even when the web app is closed. Configure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in Vercel and `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` as Supabase Edge Function secrets.

### Optional Python LangGraph service

`rag_service/` contains a Python/FastAPI alternative for the chat RAG pipeline. It uses LangGraph to make the workflow explicit: retrieve official chunks → deterministic evidence gate → answer or refuse. Use it when you want Python deployment, graph tracing, and a foundation for future approval or ticket-routing workflows. See [`rag_service/README.md`](rag_service/README.md).

## Technical stack

- Next.js 15, React 19, TypeScript, Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, Edge Functions
- pgvector for semantic retrieval
- Gemini API: Gemini Embedding 2 and Gemini 2.5 Flash
- Vercel for frontend deployment

## Database and security

The Supabase migration creates profiles, roles, departments, documents, chunks, embeddings, conversations, messages, reminders, notices, tickets, and ticket messages.

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

The UI can be explored without credentials using preview data. Authentication and live data activate after Supabase is configured.

## Supabase configuration

1. Create a Supabase project.
2. Apply `supabase/migrations/20260717000000_kiliguide_schema.sql` through the Supabase CLI or SQL Editor.
3. Enable Email/Password authentication and configure permitted redirect URLs, including `http://localhost:3000/auth/callback` for development.
4. Add the frontend Supabase URL and anon key to `.env.local`.
5. Store server-only secrets in Supabase—not in `.env.local` committed to source control:

   ```bash
   supabase secrets set GEMINI_API_KEY=your-key
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

6. Deploy functions:

   ```bash
   supabase functions deploy chat
   supabase functions deploy ingest-document
   supabase functions deploy summarize-notice
   supabase functions deploy publish-update
   supabase functions deploy analyze-timetable
   supabase functions deploy dispatch-event-reminders
   supabase functions deploy save-push-subscription
   ```

7. After the initial administrator has signed up, run `supabase/scripts/assign_initial_administrator.sql` once in the Supabase SQL Editor. This is a one-time bootstrap action, not a permanent email-based privilege rule.

## Document ingestion contract

Upload the original PDF, DOCX, or TXT file to the private `documents` Storage bucket, create the corresponding row in `documents`, extract text using a worker or trusted server process, then call `ingest-document` with:

```json
{ "documentId": "uuid", "text": "Extracted document text", "pageNumber": 1 }
```

For large documents, process text extraction and ingestion in a background queue. Reprocessing a document safely replaces its existing chunks before recreating embeddings.

## Deployment

1. Deploy the Next.js app to Vercel.
2. Add the production Supabase URL and anon key to Vercel environment variables.
3. Deploy Supabase Edge Functions and set their server-only secrets.
4. Add the Vercel production URL to Supabase Auth redirect URLs.
5. Run `npm run build` before release.

## Important implementation status

The interface, role portals, schema, RLS foundation, Gemini RAG functions, and frontend API contracts are implemented. To make every interface live, connect the Supabase project, deploy the functions, and wire each screen to the real records. Production roles should be assigned by administrators through `user_roles`, never chosen by users at sign-up.
