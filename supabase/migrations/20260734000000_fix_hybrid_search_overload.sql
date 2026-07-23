-- Drop the incorrectly ordered signature created in migration 33
DROP FUNCTION IF EXISTS public.hybrid_search_chunks(text, vector(768), int, uuid, jsonb);

-- Drop the correct signature from migration 32 so we can cleanly recreate it
DROP FUNCTION IF EXISTS public.hybrid_search_chunks(text, vector(768), uuid, jsonb, int, float, float, int);

-- Recreate with the correct signature from 32, but the updated body from 33
CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_text text,
  query_embedding vector(768),
  p_institution_id uuid,
  metadata_filter jsonb default '{}'::jsonb,
  match_count int default 6,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 60
)
RETURNS TABLE (
    chunk_id uuid,
    content text,
    document_id uuid,
    title text,
    page_number int,
    chunk_index int,
    similarity float,
    score float
)
LANGUAGE sql
STABLE
AS $$
WITH vector_matches AS (
    SELECT 
        e.chunk_id,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM public.embeddings e
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count * 2
),
fts_matches AS (
    SELECT 
        dc.id AS chunk_id,
        ts_rank_cd(to_tsvector('english', dc.content), plainto_tsquery('english', query_text)) AS rank
    FROM public.document_chunks dc
    WHERE to_tsvector('english', dc.content) @@ plainto_tsquery('english', query_text)
    ORDER BY rank DESC
    LIMIT match_count * 2
),
rrf AS (
    SELECT 
        COALESCE(v.chunk_id, f.chunk_id) AS chunk_id,
        COALESCE(v.similarity, 0.0) AS similarity,
        COALESCE(1.0 / (rrf_k + ROW_NUMBER() OVER(ORDER BY v.similarity DESC)), 0.0) * semantic_weight +
        COALESCE(1.0 / (rrf_k + ROW_NUMBER() OVER(ORDER BY f.rank DESC)), 0.0) * full_text_weight AS rrf_score
    FROM vector_matches v
    FULL OUTER JOIN fts_matches f ON v.chunk_id = f.chunk_id
)
SELECT 
    r.chunk_id,
    dc.content,
    d.id AS document_id,
    d.title,
    dc.page_number,
    dc.chunk_index,
    r.similarity,
    r.rrf_score AS score
FROM rrf r
JOIN public.document_chunks dc ON dc.id = r.chunk_id
JOIN public.documents d ON d.id = dc.document_id
WHERE d.status = 'active'
    AND d.institution_id = p_institution_id
    AND (
      metadata_filter = '{}'::jsonb 
      OR (
        (metadata_filter->>'department' IS NULL OR d.metadata->>'department' = metadata_filter->>'department' OR d.metadata->>'department' = 'all' OR d.metadata->>'department' IS NULL)
        AND
        (metadata_filter->>'audience' IS NULL OR d.metadata->>'audience' = metadata_filter->>'audience' OR d.metadata->>'audience' = 'all' OR d.metadata->>'audience' IS NULL)
      )
    )
ORDER BY r.rrf_score DESC
LIMIT match_count;
$$;
