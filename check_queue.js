import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wcegdxhvgwbeskaidlxr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZWdkeGh2Z3diZXNrYWlkbHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjI3OTQsImV4cCI6MjA4NTA5ODc5NH0.P_JY0RF6wVdPCDfWLlcor5l1CP3g4bLE5y4JWmZVOig';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueue() {
  const { data, error } = await supabase.from('font_processing_queue').select('*');
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

checkQueue();
