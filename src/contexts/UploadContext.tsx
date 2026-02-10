import { createContext, useContext, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type ConversionTask = {
    id: string;
    fontName: string;
    variantName: string;
    status: 'pending' | 'converting' | 'uploading' | 'completed' | 'error';
    progress: number;
    error?: string;
    slug?: string;
};

type UploadContextType = {
    tasks: ConversionTask[];
    queueWoff2Conversion: (fontId: string, slug: string, variants: { id: string; name: string; files: { ttf: File | null; otf: File | null } }[]) => void;
    clearCompletedTasks: () => void;
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<ConversionTask[]>([]);

    const updateTask = (id: string, updates: Partial<ConversionTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const runWoff2Compress = async (buffer: Uint8Array): Promise<Uint8Array> => {
        return new Promise((resolve, reject) => {
            const compress = () => {
                try {
                    const Module = (window as any).Module;
                    if (!Module || !Module.compress) {
                        reject(new Error("Module.compress not found after load"));
                        return;
                    }
                    console.log("Custom compress: Executing compression...", Module);
                    const result = Module.compress(buffer);
                    if (!result) reject(new Error("Compression failed (returned null/false)"));
                    else resolve(result);
                } catch (e) {
                    reject(e);
                }
            };

            const Module = (window as any).Module;
            // Check if module is already loaded and ready
            if (Module && Module.compress) {
                console.log("Module already loaded");
                compress();
                return;
            }

            console.log("Loading wawoff2.js script...");
            // Check if script is already present but module not ready
            if (document.querySelector('script[src="/wawoff2.js"]')) {
                console.log("Script already present, waiting for module...");
                const checkModule = () => {
                    const M = (window as any).Module;
                    if (M && M.compress) {
                        compress();
                    } else {
                        setTimeout(checkModule, 100);
                    }
                };
                checkModule();
                return;
            }

            // Load script
            const script = document.createElement('script');
            script.src = '/wawoff2.js';
            script.async = true;

            script.onload = () => {
                console.log("wawoff2.js loaded, waiting for runtime...");
                // Wait for runtime initialized
                const checkModule = () => {
                    const M = (window as any).Module;
                    // Emscripten generic check
                    if (M && (M.calledRun || M.runtimeInitialized || M.compress)) {
                        console.log("Module initialized!");
                        compress();
                    } else if (M) {
                        // Some emscripten builds need onRuntimeInitialized assignment
                        if (!M.onRuntimeInitialized && !M.calledRun) {
                            console.log("Hooking onRuntimeInitialized");
                            M.onRuntimeInitialized = () => {
                                console.log("onRuntimeInitialized fired");
                                compress();
                            };
                            // Safety check
                            setTimeout(checkModule, 500);
                        } else {
                            setTimeout(checkModule, 100);
                        }
                    } else {
                        setTimeout(checkModule, 100);
                    }
                };
                checkModule();
            };

            script.onerror = () => reject(new Error("Failed to load wawoff2.js"));
            document.body.appendChild(script);
        });
    };

    const queueWoff2Conversion = async (fontId: string, slug: string, variants: { id: string; name: string; files: { ttf: File | null; otf: File | null } }[]) => {
        console.log("queueWoff2Conversion called", { fontId, slug, variantsCount: variants.length });
        // Create initial tasks
        const newTasks: ConversionTask[] = variants.map(v => ({
            id: v.id,
            fontName: slug, // Using slug as name for now or pass actual name
            variantName: v.name,
            status: 'pending',
            progress: 0,
            slug: slug
        }));

        setTasks(prev => [...prev, ...newTasks]);

        // Process each variant
        for (const variant of variants) {
            const taskId = variant.id;
            updateTask(taskId, { status: 'converting', progress: 0 });

            try {
                const sourceFile = variant.files.ttf || variant.files.otf;
                if (!sourceFile) {
                    updateTask(taskId, { status: 'error', error: 'No source file found' });
                    continue;
                }

                // 1. Convert
                const buffer = await sourceFile.arrayBuffer();
                const uint8Buffer = new Uint8Array(buffer);
                const woff2Buffer = await runWoff2Compress(uint8Buffer);

                const woff2Blob = new Blob([woff2Buffer as any], { type: 'font/woff2' });
                const woff2File = new File([woff2Blob], `${sourceFile.name.split('.')[0]}.woff2`, { type: 'font/woff2' });

                updateTask(taskId, { status: 'uploading', progress: 50 });

                // 2. Upload
                // Construct path: [user_id]/[slug]/variants/[VariantName]/[filename]
                // We need userId. We can get it from supabase session or pass it. 
                // Let's get generic session to be safe.
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("User not authenticated");

                const variantSlug = variant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const fileName = `${slug}-${variantSlug}.woff2`;
                const filePath = `${user.id}/${slug}/variants/${variant.name}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('fonts')
                    .upload(filePath, woff2File, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('fonts')
                    .getPublicUrl(filePath);

                updateTask(taskId, { status: 'uploading', progress: 80 });

                // 3. Update DB
                // We need to find the specific variant record for this font_id and variant_name
                const { error: updateError } = await supabase
                    .from('font_variants')
                    .update({
                        woff2_url: publicUrl,
                        file_size_woff2: woff2File.size
                    })
                    .eq('font_id', fontId)
                    .eq('variant_name', variant.name); // Assuming variant_name is unique per font

                if (updateError) throw updateError;

                updateTask(taskId, { status: 'completed', progress: 100 });

            } catch (err: any) {
                console.error("WOFF2 Conversion Error:", err);
                updateTask(taskId, { status: 'error', error: err.message });
            }
        }
    };

    const clearCompletedTasks = () => {
        setTasks(prev => prev.filter(t => t.status !== 'completed'));
    };

    return (
        <UploadContext.Provider value={{ tasks, queueWoff2Conversion, clearCompletedTasks }}>
            {children}
        </UploadContext.Provider>
    );
};

export const useUpload = () => {
    const context = useContext(UploadContext);
    if (!context) throw new Error('useUpload must be used within an UploadProvider');
    return context;
};
