import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function processQueue() {
  console.log("Checking for pending font downloads...");
  
  // 1. Fetch pending items
  const { data: queueItems, error: fetchError } = await supabase
    .from('font_processing_queue')
    .select('*, fonts(uploaded_by)')
    .eq('status', 'pending');

  if (fetchError) {
    console.error("Failed to fetch queue items", fetchError);
    return;
  }

  if (!queueItems || queueItems.length === 0) {
    console.log("No pending items found.");
    return;
  }

  console.log(`Found ${queueItems.length} pending items.`);

  for (const item of queueItems) {
    try {
      console.log(`Processing font: ${item.slug} (ID: ${item.id})`);
      
      // Mark as processing
      await supabase.from('font_processing_queue').update({ status: 'processing' }).eq('id', item.id);

      const userId = item.fonts?.uploaded_by;
      if (!userId) throw new Error("Could not determine uploaded_by user_id");

      const downloadUrls = item.download_urls; // Array of { name, format, url }
      if (!Array.isArray(downloadUrls)) throw new Error("Invalid download_urls format");

      const tmpDir = path.join(process.cwd(), 'tmp_fonts', item.slug);
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      // Process each variant
      for (const variant of downloadUrls) {
        console.log(`  Processing variant: ${variant.name}`);
        
        const variantSlug = variant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const baseFilename = `${item.slug}-${variantSlug}`;
        
        let finalFiles = [];
        const formats = ['ttf', 'otf', 'woff', 'woff2'];

        for (const ext of formats) {
          if (variant[ext]) {
            console.log(`  Downloading .${ext} for ${variant.name}...`);
            const sourcePath = path.join(tmpDir, `${baseFilename}.${ext}`);
            await downloadFile(variant[ext], sourcePath);
            finalFiles.push({ path: sourcePath, format: ext });
          }
        }

        // If it has TTF or OTF, check if we need to generate WOFF2
        const hasTtfOrOtf = finalFiles.some(f => f.format === 'ttf' || f.format === 'otf');
        const hasWoff2 = finalFiles.some(f => f.format === 'woff2');
        
        if (hasTtfOrOtf && !hasWoff2) {
          console.log(`  Generating WOFF2 for ${variant.name}...`);
          const sourceFile = finalFiles.find(f => f.format === 'ttf') || finalFiles.find(f => f.format === 'otf');
          try {
            // Note: Requires woff2_compress binary available in the system
            execSync(`woff2_compress "${sourceFile.path}"`);
            const woff2Path = path.join(tmpDir, `${baseFilename}.woff2`);
            if (fs.existsSync(woff2Path)) {
              finalFiles.push({ path: woff2Path, format: 'woff2' });
            }
          } catch (err) {
            console.warn(`  Failed to generate WOFF2 for ${variant.name}:`, err.message);
          }
        }

        // Upload files to Supabase Storage and track sizes
        const variantData = {
          font_id: item.font_id,
          variant_name: variant.name
        };

        for (const file of finalFiles) {
          const storagePath = `${userId}/${item.slug}/variants/${variant.name}/${path.basename(file.path)}`;
          console.log(`  Uploading to storage: ${storagePath}`);
          
          const fileBuffer = fs.readFileSync(file.path);
          const fileSize = fs.statSync(file.path).size;
          
          const { error: uploadError } = await supabase.storage
            .from('fonts')
            .upload(storagePath, fileBuffer, {
              upsert: true,
              contentType: file.format === 'woff2' ? 'font/woff2' : 
                           file.format === 'ttf' ? 'font/ttf' : 
                           file.format === 'otf' ? 'font/otf' : 'application/octet-stream'
            });

          if (uploadError) throw new Error(`Upload failed for ${file.path}: ${uploadError.message}`);

          const { data: { publicUrl } } = supabase.storage.from('fonts').getPublicUrl(storagePath);
          
          variantData[`${file.format}_url`] = publicUrl;
          variantData[`file_size_${file.format}`] = fileSize;
        }

        // Upsert into font_variants
        // Wait, font_variants requires inserting per variant name
        const { data: existingVariant } = await supabase
          .from('font_variants')
          .select('id')
          .eq('font_id', item.font_id)
          .eq('variant_name', variant.name)
          .maybeSingle();

        if (existingVariant) {
          await supabase.from('font_variants').update(variantData).eq('id', existingVariant.id);
        } else {
          await supabase.from('font_variants').insert([variantData]);
        }
      }

      // Cleanup tmp dir
      fs.rmSync(tmpDir, { recursive: true, force: true });

      // Mark as completed
      await supabase.from('font_processing_queue').update({ status: 'completed' }).eq('id', item.id);
      console.log(`✅ Successfully processed font: ${item.slug}`);

    } catch (err) {
      console.error(`❌ Failed to process ${item.slug}:`, err);
      await supabase.from('font_processing_queue').update({ 
        status: 'error', 
        error_message: err.message || String(err) 
      }).eq('id', item.id);
    }
  }
}

processQueue()
  .then(() => {
    console.log("Queue processing finished.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
