-- Fix match_document_chunks to use SECURITY DEFINER so it bypasses RLS on the embeddings table.
-- The chat edge function calls this RPC using the service role, but the function language
-- was 'sql stable' which runs in the caller's security context, blocking the embeddings join.
create or replace function public.match_document_chunks(
  query_embedding vector(768),
  match_count int default 6
)
returns table(
  chunk_id uuid,
  content text,
  document_id uuid,
  title text,
  page_number int,
  similarity float
)
language sql
stable
security definer
as $$
  select
    dc.id,
    dc.content,
    d.id,
    d.title,
    dc.page_number,
    1 - (e.embedding <=> query_embedding)
  from public.embeddings e
  join public.document_chunks dc on dc.id = e.chunk_id
  join public.documents d on d.id = dc.document_id
  where d.status = 'active'
  order by e.embedding <=> query_embedding
  limit match_count
$$;
