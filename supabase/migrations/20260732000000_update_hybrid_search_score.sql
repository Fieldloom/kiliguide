-- Fix Hybrid Search to expose the RRF score
DROP FUNCTION IF EXISTS public.hybrid_search_chunks;
CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_text text,
  query_embedding vector(768),
  p_institution_id uuid,
  metadata_filter jsonb default '{}',
  match_count int default 6,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 60
)
RETURNS TABLE(
  chunk_id uuid,
  content text,
  document_id uuid,
  title text,
  page_number int,
  chunk_index int,
  similarity float,
  score float
)
LANGUAGE sql stable security definer
AS $$
WITH fts AS (
  SELECT
    dc.id,
    rank() over (order by ts_rank(dc.fts_tsvector, websearch_to_tsquery('english', query_text)) desc) as rank_ix
  FROM public.document_chunks dc
  JOIN public.documents d ON dc.document_id = d.id
  WHERE d.status = 'active'
    AND d.institution_id = p_institution_id
    AND dc.fts_tsvector @@ websearch_to_tsquery('english', query_text)
    AND (metadata_filter = '{}'::jsonb or d.metadata @> metadata_filter)
  LIMIT 100
),
semantic AS (
  SELECT
    e.chunk_id as id,
    rank() over (order by e.embedding <=> query_embedding) as rank_ix,
    1 - (e.embedding <=> query_embedding) as sim
  FROM public.embeddings e
  JOIN public.document_chunks dc ON dc.id = e.chunk_id
  JOIN public.documents d ON dc.document_id = d.id
  WHERE d.status = 'active'
    AND d.institution_id = p_institution_id
    AND (metadata_filter = '{}'::jsonb or d.metadata @> metadata_filter)
  ORDER BY e.embedding <=> query_embedding
  LIMIT 100
)
SELECT
  dc.id as chunk_id,
  dc.content,
  d.id as document_id,
  d.title,
  dc.page_number,
  dc.chunk_index,
  merged.sim as similarity,
  merged.score as score
FROM (
  SELECT
    coalesce(s.id, f.id) as id,
    coalesce(1.0 / (rrf_k + f.rank_ix), 0.0) * full_text_weight +
    coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight as score,
    coalesce(s.sim, 0.0) as sim
  FROM semantic s
  FULL OUTER JOIN fts f ON s.id = f.id
  ORDER BY score DESC
  LIMIT match_count
) merged
JOIN public.document_chunks dc ON dc.id = merged.id
JOIN public.documents d ON d.id = dc.document_id
ORDER BY merged.score DESC;
$$;
