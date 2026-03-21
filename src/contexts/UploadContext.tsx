import { createContext, useContext, useState, type ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { runWoff2Compress } from '../utils/woff2';

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

    // updateTask removed as it was only used inside queueWoff2Conversion now

    // runWoff2Compress moved to utils/woff2.ts

    const queueWoff2Conversion = useCallback(async (fontId: string, slug: string, variants: { id: string; name: string; files: { ttf: File | null; otf: File | null } }[]) => {
        // ... (rest of the function remains same, just wrapped)
        console.log("queueWoff2Conversion called", { fontId, slug, variantsCount: variants.length });
        const newTasks: ConversionTask[] = variants.map(v => ({
            id: v.id,
            fontName: slug,
            variantName: v.name,
            status: 'pending',
            progress: 0,
            slug: slug
        }));

        setTasks(prev => [...prev, ...newTasks]);

        for (const variant of variants) {
            const taskId = variant.id;
            const updateTaskInternal = (id: string, updates: Partial<ConversionTask>) => {
                setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
            };
            
            updateTaskInternal(taskId, { status: 'converting', progress: 0 });

            try {
                const sourceFile = variant.files.ttf || variant.files.otf;
                if (!sourceFile) {
                    updateTaskInternal(taskId, { status: 'error', error: 'No source file found' });
                    continue;
                }

                const buffer = await sourceFile.arrayBuffer();
                const uint8Buffer = new Uint8Array(buffer);
                const woff2Buffer = await runWoff2Compress(uint8Buffer);

                const woff2Blob = new Blob([woff2Buffer as any], { type: 'font/woff2' });
                const woff2File = new File([woff2Blob], `${sourceFile.name.split('.')[0]}.woff2`, { type: 'font/woff2' });

                updateTaskInternal(taskId, { status: 'uploading', progress: 50 });

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

                updateTaskInternal(taskId, { status: 'uploading', progress: 80 });

                const { error: updateError } = await supabase
                    .from('font_variants')
                    .update({
                        woff2_url: publicUrl,
                        file_size_woff2: woff2File.size
                    })
                    .eq('font_id', fontId)
                    .eq('variant_name', variant.name);

                if (updateError) throw updateError;

                updateTaskInternal(taskId, { status: 'completed', progress: 100 });

            } catch (err: any) {
                console.error("WOFF2 Conversion Error:", err);
                updateTaskInternal(taskId, { status: 'error', error: err.message });
            }
        }
    }, []);

    const clearCompletedTasks = useCallback(() => {
        setTasks(prev => prev.filter(t => t.status !== 'completed'));
    }, []);

    const value = useMemo(() => ({
        tasks,
        queueWoff2Conversion,
        clearCompletedTasks
    }), [tasks, queueWoff2Conversion, clearCompletedTasks]);

    return (
        <UploadContext.Provider value={value}>
            {children}
        </UploadContext.Provider>
    );
};

export const useUpload = () => {
    const context = useContext(UploadContext);
    if (!context) throw new Error('useUpload must be used within an UploadProvider');
    return context;
};
