-- Crawl queue table to track which URLs have been indexed and their status
CREATE TABLE IF NOT EXISTS public.crawl_queue (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url         text NOT NULL UNIQUE,
  domain      text NOT NULL,
  title       text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'crawling', 'done', 'failed', 'skipped')),
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  error       text,
  discovered_at   timestamptz NOT NULL DEFAULT now(),
  last_crawled_at timestamptz,
  retry_count     int NOT NULL DEFAULT 0
);

-- Index for fast status queries
CREATE INDEX IF NOT EXISTS crawl_queue_status_idx ON public.crawl_queue(status, discovered_at);
CREATE INDEX IF NOT EXISTS crawl_queue_domain_idx ON public.crawl_queue(domain);

-- Row Level Security
ALTER TABLE public.crawl_queue ENABLE ROW LEVEL SECURITY;

-- Only admins/super_admin can view/modify crawl queue
CREATE POLICY "admins read crawl_queue"
  ON public.crawl_queue FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admins manage crawl_queue"
  ON public.crawl_queue FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Summary view for admin dashboard
CREATE OR REPLACE VIEW public.crawl_summary AS
SELECT
  domain,
  COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
  COUNT(*) FILTER (WHERE status = 'crawling') AS crawling,
  COUNT(*) FILTER (WHERE status = 'done')     AS done,
  COUNT(*) FILTER (WHERE status = 'failed')   AS failed,
  COUNT(*) FILTER (WHERE status = 'skipped')  AS skipped,
  COUNT(*)                                    AS total,
  MAX(last_crawled_at)                        AS last_crawled_at
FROM public.crawl_queue
GROUP BY domain;
