import { createHash } from 'node:crypto';
const FORMATS = new Set(['ttf','otf','woff','woff2']);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function assertKey(batchId,key){if(typeof key!=='string'||!key.startsWith(`staging/font-processing/${batchId}/`)||key.includes('..'))throw Error('Storage key is outside batch staging prefix');}
export function createSupabasePublishingAdapter({supabase,bucket='fonts'}){
 if(!supabase?.storage||typeof supabase.rpc!=='function')throw Error('A configured Supabase client is required');
 return {
  async stageAsset(asset,key){
   assertKey(key.split('/')[2],key);const storage=supabase.storage.from(bucket),expected=asset.sha256.toLowerCase();
   const existing=await storage.download(key);
   if(!existing.error&&existing.data){const bytes=Buffer.from(await existing.data.arrayBuffer()),digest=hash(bytes);if(digest!==expected||bytes.length!==asset.sizeBytes){const e=Error(`Immutable staging key contains different bytes: ${key}`);e.stagedObjectMayExist=true;e.stagedKey=key;throw e;}return {sha256:digest,sizeBytes:bytes.length};}
   const ext=asset.fileName.split('.').pop().toLowerCase(),types={ttf:'font/ttf',otf:'font/otf',woff:'font/woff',woff2:'font/woff2'};
   const upload=await storage.upload(key,asset.bytes,{contentType:types[ext]||'application/octet-stream',upsert:false,cacheControl:'31536000'});
   const check=await storage.download(key);if(check.error||!check.data){const e=Error(`Storage stage outcome is uncertain: ${upload.error?.message||check.error?.message||key}`);e.stagedObjectMayExist=true;e.stagedKey=key;throw e;}
   const bytes=Buffer.from(await check.data.arrayBuffer()),digest=hash(bytes);if(digest!==expected||bytes.length!==asset.sizeBytes){const e=Error(`Read-back verification failed: ${key}`);e.stagedObjectMayExist=true;e.stagedKey=key;throw e;}return {sha256:digest,sizeBytes:bytes.length};
  },
  async publishRows(rows,{batchId,idempotencyKey}){
   if(idempotencyKey!==`font-processing:${batchId}`)throw Error('Invalid publishing idempotency key');
   const payload=rows.map(row=>{assertKey(batchId,row.staging_key);const format=String(row.format||'').toLowerCase().replace(/^\./,'');if(!FORMATS.has(format))throw Error(`Unsupported font format: ${row.format}`);if(!row.font_id||!String(row.variant_name||'').trim())throw Error('Each row requires font_id and variant_name');if(!Number.isSafeInteger(row.size_bytes)||row.size_bytes<=0)throw Error('Each row requires positive size_bytes');const {data}=supabase.storage.from(bucket).getPublicUrl(row.staging_key);if(!data?.publicUrl)throw Error('Missing public URL');return {font_id:row.font_id,variant_name:String(row.variant_name).trim(),format,staging_key:row.staging_key,public_url:data.publicUrl,size_bytes:row.size_bytes};});
   const canonical=payload.slice().sort((a,b)=>[a.font_id,a.variant_name,a.format,a.staging_key].join('|').localeCompare([b.font_id,b.variant_name,b.format,b.staging_key].join('|'))),manifest=hash(Buffer.from(JSON.stringify(canonical)));
   const {data,error}=await supabase.rpc('publish_font_processing_batch',{p_batch_id:batchId,p_idempotency_key:idempotencyKey,p_manifest_sha256:manifest,p_rows:payload});if(error)throw Error(`Atomic font publish RPC failed: ${error.message}`);if(data?.committed!==true)throw Error('Atomic publish RPC did not confirm commit');return {committed:true,manifestSha256:manifest,idempotentReplay:data.idempotent_replay===true};
  },
  async deleteStaged(keys){if(!Array.isArray(keys)||!keys.length)return;if(keys.some(k=>typeof k!=='string'||!k.startsWith('staging/font-processing/')||k.includes('..')))throw Error('Refusing cleanup outside staging prefix');const {error}=await supabase.storage.from(bucket).remove(keys);if(error)throw Error(`Staged cleanup failed: ${error.message}`);},
  async recordBatch(r){const {data,error}=await supabase.rpc('record_font_processing_batch_state',{p_batch_id:r.batchId,p_status:r.status,p_idempotency_key:`font-processing:${r.batchId}`,p_asset_count:r.assetCount,p_row_count:r.rowCount,p_staged_keys:r.stagedKeys||[],p_phase:r.phase||null,p_error:r.error||r.cleanupError||null});if(error)throw Error(`Publishing audit write failed: ${error.message}`);return data;}
 };
}
