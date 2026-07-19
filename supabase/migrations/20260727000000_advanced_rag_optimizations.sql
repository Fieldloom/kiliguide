-- Advanced RAG Optimizations: Query Caching, Hybrid Search, Metadata Filtering

-- 1. Query Caching Table & Logic
create table if not exists public.query_cache (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  embedding vector(768) not null,
  answer text not null,
  sources jsonb default '[]',
  confidence numeric,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.query_cache enable row level security;
-- Service role ignores RLS, so no policies needed for backend-only access

create index if not exists query_cache_vector_idx on public.query_cache
using ivfflat (embedding vector_cosine_ops) with (lists=50);

create or replace function public.invalidate_query_cache()
returns trigger as $$
begin
  truncate table public.query_cache;
  return null;
end;
$$ language plpgsql;

drop trigger if exists tr_invalidate_cache_on_document on public.documents;
create trigger tr_invalidate_cache_on_document
after insert or update or delete on public.documents
execute function public.invalidate_query_cache();

drop trigger if exists tr_invalidate_cache_on_chunk on public.document_chunks;
create trigger tr_invalidate_cache_on_chunk
after insert or update or delete on public.document_chunks
execute function public.invalidate_query_cache();

create or replace function public.match_cached_query(
  query_embedding vector(768),
  match_threshold float default 0.95
)
returns table (
  id uuid,
  answer text,
  sources jsonb,
  confidence numeric,
  similarity float
)
language sql stable security definer
as $$
  select
    id, answer, sources, confidence,
    1 - (embedding <=> query_embedding) as similarity
  from public.query_cache
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit 1;
$$;


-- 2. Hybrid Search (BM25 + pgvector + RRF + Metadata Filtering)
alter table public.document_chunks
add column if not exists fts_tsvector tsvector generated always as (to_tsvector('english', content)) stored;

create index if not exists document_chunks_fts_idx on public.document_chunks using gin (fts_tsvector);

create or replace function public.hybrid_search_chunks(
  query_text text,
  query_embedding vector(768),
  metadata_filter jsonb default '{}',
  match_count int default 6,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 60
)
returns table(
  chunk_id uuid,
  content text,
  document_id uuid,
  title text,
  page_number int,
  chunk_index int,
  similarity float
)
language sql stable security definer
as $$
with fts as (
  select
    dc.id,
    rank() over (order by ts_rank(dc.fts_tsvector, websearch_to_tsquery('english', query_text)) desc) as rank_ix
  from public.document_chunks dc
  join public.documents d on dc.document_id = d.id
  where d.status = 'active'
    and dc.fts_tsvector @@ websearch_to_tsquery('english', query_text)
    and (metadata_filter = '{}'::jsonb or d.metadata @> metadata_filter)
  limit 100
),
semantic as (
  select
    e.chunk_id as id,
    rank() over (order by e.embedding <=> query_embedding) as rank_ix,
    1 - (e.embedding <=> query_embedding) as sim
  from public.embeddings e
  join public.document_chunks dc on dc.id = e.chunk_id
  join public.documents d on dc.document_id = d.id
  where d.status = 'active'
    and (metadata_filter = '{}'::jsonb or d.metadata @> metadata_filter)
  order by e.embedding <=> query_embedding
  limit 100
)
select
  dc.id as chunk_id,
  dc.content,
  d.id as document_id,
  d.title,
  dc.page_number,
  dc.chunk_index,
  merged.sim as similarity
from (
  select
    coalesce(s.id, f.id) as id,
    coalesce(1.0 / (rrf_k + f.rank_ix), 0.0) * full_text_weight +
    coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight as score,
    coalesce(s.sim, 0.0) as sim
  from semantic s
  full outer join fts f on s.id = f.id
  order by score desc
  limit match_count
) merged
join public.document_chunks dc on dc.id = merged.id
join public.documents d on d.id = dc.document_id
order by merged.score desc;
$$;
