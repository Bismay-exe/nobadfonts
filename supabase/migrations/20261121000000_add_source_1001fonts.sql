-- Add source_1001fonts column to font_processing_queue
-- Stores the 1001fonts.com page URL when a font is imported from that source.
-- Used by enrich-from-1001fonts.js to scrape gallery images + download zip.

ALTER TABLE font_processing_queue
  ADD COLUMN IF NOT EXISTS source_1001fonts TEXT;

COMMENT ON COLUMN font_processing_queue.source_1001fonts IS
  '1001fonts.com font page URL — set when the queue item was created via the 1001fonts import workflow. '
  'The pipeline uses this to auto-scrape gallery images and confirm the zip URL.';
