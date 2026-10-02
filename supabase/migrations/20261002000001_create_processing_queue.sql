-- Table to queue AI/GitHub automated downloads for the GitHub Actions worker
CREATE TABLE IF NOT EXISTS font_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    font_id UUID NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    download_urls JSONB NOT NULL, -- Array of variant objects { name, format, url }
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, error
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE font_processing_queue ENABLE ROW LEVEL SECURITY;

-- Allow admins and the service role to manage the queue
CREATE POLICY "Enable all for admins and service role" 
ON font_processing_queue
FOR ALL 
USING (
  auth.role() = 'service_role' OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'member'
);

-- Trigger to update updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON font_processing_queue 
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
