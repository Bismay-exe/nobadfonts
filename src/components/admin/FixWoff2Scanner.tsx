import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { runWoff2Compress } from '../../utils/woff2';
import { RefreshCw } from 'lucide-react';

export const FixWoff2Scanner = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState({ fixed: 0, generated: 0, errors: 0 });

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 50));

    const scanAndFix = async () => {
        setLoading(true);
        setLogs([]);
        setStats({ fixed: 0, generated: 0, errors: 0 });
        setProgress(0);

        try {
            // 1. Fetch Variants needing fix
            addLog("Scanning database for missing WOFF2...");
            const { data: variants, error } = await supabase
                .from('font_variants')
                .select(`
                    id, 
                    variant_name, 
                    woff2_url, 
                    ttf_url, 
                    otf_url,
                    font_id,
                    fonts (
                        slug,
                        user_id,
                        uploaded_by
                    )
                `)
                .is('woff2_url', null);

            if (error) throw error;
            if (!variants || variants.length === 0) {
                addLog("No variants found missing WOFF2.");
                setLoading(false);
                return;
            }

            const totalCount = variants.length;
            setTotal(totalCount);
            addLog(`Found ${totalCount} variants missing WOFF2. Starting fix process...`);

            let processed = 0;

            for (const variant of variants) {
                const font = variant.fonts as any; // Type assertion since join returns array or object depending on query
                const fontSlug = font?.slug;
                const userId = font?.uploaded_by || font?.user_id; // Handle both cases if schema changed

                if (!fontSlug || !userId) {
                    addLog(`Error: Missing font metadata for variant ${variant.id}`);
                    setStats(s => ({ ...s, errors: s.errors + 1 }));
                    processed++;
                    setProgress((processed / totalCount) * 100);
                    continue;
                }

                const variantSlug = variant.variant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const fileName = `${fontSlug}-${variantSlug}.woff2`;
                const filePath = `${userId}/${fontSlug}/variants/${variant.variant_name}/${fileName}`;

                try {
                    // Step A: Check User's Storage
                    const { data: listData } = await supabase.storage
                        .from('fonts')
                        .list(`${userId}/${fontSlug}/variants/${variant.variant_name}`);

                    const fileExists = listData?.some(f => f.name === fileName);

                    if (fileExists) {
                        // Link Existing
                        const { data: { publicUrl } } = supabase.storage
                            .from('fonts')
                            .getPublicUrl(filePath);

                        // We can't easily get size without metadata call or re-download, 
                        // but listData has metadata.
                        const fileMeta = listData?.find(f => f.name === fileName);
                        const size = fileMeta?.metadata?.size || 0;


                        await supabase
                            .from('font_variants')
                            .update({
                                woff2_url: publicUrl,
                                file_size_woff2: size
                            })
                            .eq('id', variant.id);

                        addLog(`Linked existing WOFF2 for ${fontSlug} - ${variant.variant_name}`);
                        setStats(s => ({ ...s, fixed: s.fixed + 1 }));

                    } else {
                        // Step B: Generate from Source
                        const sourceUrl = variant.ttf_url || variant.otf_url;
                        if (!sourceUrl) {
                            addLog(`Skipped ${fontSlug} - ${variant.variant_name}: No source TTF/OTF.`);
                            setStats(s => ({ ...s, errors: s.errors + 1 }));
                            continue;
                        }

                        addLog(`Generating WOFF2 for ${fontSlug} - ${variant.variant_name}...`);

                        // Download Source
                        const response = await fetch(sourceUrl);
                        if (!response.ok) throw new Error(`Failed to fetch source: ${response.statusText}`);
                        const blob = await response.blob();
                        const buffer = await blob.arrayBuffer();

                        // Convert
                        const woff2Buffer = await runWoff2Compress(new Uint8Array(buffer));
                        const woff2File = new File([woff2Buffer as any], fileName, { type: 'font/woff2' });

                        // Upload
                        const { error: uploadError } = await supabase.storage
                            .from('fonts')
                            .upload(filePath, woff2File, { upsert: true });

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('fonts')
                            .getPublicUrl(filePath);

                        // Update DB
                        await supabase
                            .from('font_variants')
                            .update({
                                woff2_url: publicUrl,
                                file_size_woff2: woff2File.size
                            })
                            .eq('id', variant.id);

                        addLog(`Generated & Uploaded WOFF2 for ${fontSlug} - ${variant.variant_name}`);
                        setStats(s => ({ ...s, generated: s.generated + 1 }));
                    }

                } catch (err: any) {
                    console.error(err);
                    addLog(`Error processing ${fontSlug}: ${err.message}`);
                    setStats(s => ({ ...s, errors: s.errors + 1 }));
                } finally {
                    processed++;
                    setProgress((processed / totalCount) * 100);
                }
            }

            addLog("Batch processing complete.");

        } catch (err: any) {
            console.error(err);
            addLog(`Critical Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#EEEFEB] border-y border-black rounded-4xl p-6">
            <h3 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
                <RefreshCw size={20} /> Admin: Fix Missing WOFF2
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Scans database for variants missing WOFF2 files. Checks storage for existing files to link,
                or generates new WOFF2 files from source TTF/OTF if missing.
            </p>

            {!loading ? (
                <button
                    onClick={scanAndFix}
                    className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-800 transition-colors"
                >
                    Start Scan & Fix
                </button>
            ) : (
                <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#BDF522] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                        <span>Progress: {Math.round(progress)}%</span>
                        <span>{Math.round((progress / 100) * total)} / {total} items</span>
                    </div>
                </div>
            )}

            {(stats.fixed > 0 || stats.generated > 0 || stats.errors > 0) && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-green-100 p-3 rounded-xl text-center">
                        <div className="text-2xl font-black text-green-600">{stats.fixed}</div>
                        <div className="text-xs font-bold text-green-800 uppercase">Linked</div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl text-center">
                        <div className="text-2xl font-black text-blue-600">{stats.generated}</div>
                        <div className="text-xs font-bold text-blue-800 uppercase">Generated</div>
                    </div>
                    <div className="bg-red-100 p-3 rounded-xl text-center">
                        <div className="text-2xl font-black text-red-600">{stats.errors}</div>
                        <div className="text-xs font-bold text-red-800 uppercase">Errors</div>
                    </div>
                </div>
            )}

            {logs.length > 0 && (
                <div className="mt-4 p-4 bg-black text-green-400 font-mono text-xs rounded-xl h-48 overflow-y-auto">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1">{">"} {log}</div>
                    ))}
                </div>
            )}
        </div>
    );
};
