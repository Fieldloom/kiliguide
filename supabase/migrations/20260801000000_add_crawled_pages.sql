CREATE TABLE IF NOT EXISTS crawled_pages (
    url TEXT PRIMARY KEY,
    lastmod TIMESTAMP WITH TIME ZONE,
    content_hash TEXT,
    last_crawled TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL
);

-- Ensure the existing global_documents table has a constraint we can use if needed,
-- but mainly we just need to ensure we can identify chunks by URL.
-- Assuming global_documents has 'url' in its metadata, we will manage deletion by URL from Python.

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS crawled_pages_status_idx ON crawled_pages (status);
CREATE INDEX IF NOT EXISTS crawled_pages_last_crawled_idx ON crawled_pages (last_crawled);

-- Allow authenticated users to view crawled pages (for a potential admin UI later)
ALTER TABLE crawled_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on crawled pages" ON crawled_pages FOR SELECT USING (true);
