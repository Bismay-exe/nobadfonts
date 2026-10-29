import { X, Save, Type, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Toast } from '@capacitor/toast';
import { cn } from '../../lib/utils';

interface StagedChange {
    variantId: string;
    format: string;
    action: 'replace' | 'delete';
    file?: File;
    variantName?: string;
}

interface NewVariant {
    id: string;
    name: string;
    isCustom: boolean;
    files: { ttf: File | null; otf: File | null; woff: File | null; woff2: File | null };
}

interface FileManagerProps {
    font: any;
    user: any;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const VARIANT_NAMES = [
    'Regular', 'Italic', 'Bold', 'Bold Italic', 'Light', 'Light Italic',
    'Medium', 'Medium Italic', 'SemiBold', 'SemiBold Italic',
    'ExtraBold', 'ExtraBold Italic', 'Black', 'Black Italic',
    'Thin', 'Thin Italic', 'ExtraLight', 'ExtraLight Italic'
];

export default function FileManager({ font, user, onClose, onSaveSuccess }: FileManagerProps) {
    const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([]);
    const [addedVariants, setAddedVariants] = useState<NewVariant[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleStageChange = (
        action: 'replace' | 'delete',
        format: string,
        file?: File,
        variantId?: string,
        variantName?: string
    ) => {
        if (!variantId) return;
        setStagedChanges(prev => {
            const filtered = prev.filter(c => !(c.variantId === variantId && c.format === format));
            return [...filtered, { variantId, format, action, file, variantName }];
        });
    };

    const addStdVariantToState = () => {
        const existingNames = font?.font_variants?.map((v: any) => v.variant_name) || [];
        setAddedVariants(prev => {
            const allUsedNames = [...existingNames, ...prev.map(v => v.name)];
            const firstAvailableName = VARIANT_NAMES.find(n => !allUsedNames.includes(n)) || 'Regular';
            return [...prev, {
                id: Math.random().toString(36).substring(7),
                name: firstAvailableName,
                isCustom: false,
                files: { ttf: null, otf: null, woff: null, woff2: null }
            }];
        });
    };

    const addCustomVariantToState = () => {
        setAddedVariants(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            name: 'New Custom Variant',
            isCustom: true,
            files: { ttf: null, otf: null, woff: null, woff2: null }
        }]);
    };

    const updateAddedVariantName = (id: string, name: string) => {
        setAddedVariants(prev => prev.map(v => v.id === id ? { ...v, name } : v));
    };

    const updateAddedVariantFile = (id: string, format: keyof NewVariant['files'], file: File | null) => {
        setAddedVariants(prev => prev.map(v => v.id === id ? { ...v, files: { ...v.files, [format]: file } } : v));
    };

    const removeAddedVariant = (id: string) => {
        setAddedVariants(prev => prev.filter(v => v.id !== id));
    };

    const executeBatchChanges = async () => {
        if (!font || !user) return;
        const totalChanges = stagedChanges.length + addedVariants.length;
        if (totalChanges === 0) {
            onClose();
            return;
        }

        if (!confirm(`Save ${totalChanges} changes?`)) return;

        setIsSaving(true);
        try {
            // Process existing file changes
            for (const change of stagedChanges) {
                let publicUrl: string | null = null;

                if (change.action === 'replace' && change.file) {
                    const fileName = `${Date.now()}-${change.file.name}`;
                    const path = `${font.uploaded_by}/${font.slug}/variants/${change.variantName}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('fonts')
                        .upload(path, change.file, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data } = supabase.storage.from('fonts').getPublicUrl(path);
                    publicUrl = data.publicUrl;
                }

                if (change.action === 'delete') {
                    const variant = font.font_variants?.find((v: any) => v.id === change.variantId);
                    const urlToDelete = variant?.[`${change.format}_url`];

                    if (urlToDelete) {
                        const urlObj = new URL(urlToDelete);
                        const pathParts = urlObj.pathname.split('/public/fonts/');
                        if (pathParts.length > 1) {
                            await supabase.storage.from('fonts').remove([decodeURIComponent(pathParts[1])]);
                        }
                    }
                }

                const updateData: any = { [`${change.format}_url`]: publicUrl };
                const { error } = await supabase.from('font_variants').update(updateData).eq('id', change.variantId);
                if (error) throw error;
            }

            // Auto-delete variants where all formats (ttf, otf, woff, woff2) are removed
            const variantDeleteMap = new Map<string, Set<string>>();
            for (const change of stagedChanges) {
                if (change.action === 'delete') {
                    if (!variantDeleteMap.has(change.variantId)) {
                        variantDeleteMap.set(change.variantId, new Set());
                    }
                    variantDeleteMap.get(change.variantId)!.add(change.format);
                }
            }
            for (const [variantId, deletedFormats] of variantDeleteMap) {
                const variant = font.font_variants?.find((v: any) => v.id === variantId);
                if (!variant) continue;
                const allFormats = ['ttf', 'otf', 'woff', 'woff2'];
                const allGone = allFormats.every(fmt => {
                    const isDeleted = deletedFormats.has(fmt);
                    const wasAlreadyMissing = !variant[`${fmt}_url`];
                    const isReplaced = stagedChanges.some(c => c.variantId === variantId && c.format === fmt && c.action === 'replace');
                    return (isDeleted || wasAlreadyMissing) && !isReplaced;
                });
                if (allGone) {
                    const { error } = await supabase.from('font_variants').delete().eq('id', variantId);
                    if (error) throw error;
                }
            }

            // Process new variants
            for (const variant of addedVariants) {
                if (!Object.values(variant.files).some(f => f !== null)) continue;

                const uploadUrls: any = {};
                const fileSizes: any = {};

                for (const [format, file] of Object.entries(variant.files)) {
                    if (file) {
                        const fileName = `${Date.now()}-${file.name}`;
                        const path = `${font.uploaded_by}/${font.slug}/variants/${variant.name}/${fileName}`;
                        const { error: uploadError } = await supabase.storage.from('fonts').upload(path, file);
                        if (uploadError) throw uploadError;
                        const { data } = supabase.storage.from('fonts').getPublicUrl(path);
                        uploadUrls[`${format}_url`] = data.publicUrl;
                        fileSizes[`file_size_${format}`] = file.size;
                    }
                }

                const { error } = await supabase.from('font_variants').insert({
                    font_id: font.id,
                    variant_name: variant.name,
                    ...uploadUrls,
                    ...fileSizes
                });
                if (error) throw error;
            }

            await Toast.show({ text: 'All changes saved successfully!', duration: 'short' });
            onSaveSuccess();
        } catch (error: any) {
            console.error("Batch save error:", error);
            await Toast.show({ text: "Error saving changes: " + error.message, duration: 'long' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card-background border border-foreground/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">Manage Variants & Files</h2>
                    <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-foreground/10 rounded-full transition-colors duration-300 ease-in-out"><X /></button>
                </div>

                {/* Variants List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                            <Type size={16} /> Variants
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={addCustomVariantToState}
                                className="text-xs bg-foreground/5 text-foreground border border-foreground/10 px-4 py-2 rounded-full font-bold hover:bg-foreground/10 transition-colors duration-300 ease-in-out cursor-pointer"
                            >
                                + Custom
                            </button>
                            <button
                                onClick={addStdVariantToState}
                                className="text-xs bg-accent text-background px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(var(--color-highlight),0.2)] cursor-pointer"
                            >
                                + Standard
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {font.font_variants?.map((variant: any) => (
                            <div key={variant.id} className="p-5 bg-background/50 rounded-2xl border border-foreground/5 space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-foreground/5">
                                    <span className="font-bold text-foreground text-lg tracking-wide">{variant.variant_name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-accent/50 uppercase border border-accent/20 bg-accent/5 px-2 py-0.5 rounded shadow-inner"> Existing </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                ['woff2', 'woff', 'ttf', 'otf'].forEach(fmt => {
                                                    handleStageChange('delete', fmt, undefined, variant.id, variant.variant_name);
                                                });
                                            }}
                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 text-warning border border-warning/20 rounded-full text-[10px] font-bold uppercase hover:bg-warning/20 transition-colors duration-300 ease-in-out cursor-pointer"
                                            title="Delete entire variant"
                                        >
                                            <Trash2 size={12} /> Delete Variant
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {['woff2', 'woff', 'ttf', 'otf'].map(format => {
                                        const staged: any = stagedChanges.find(c => c.variantId === variant.id && c.format === format);
                                        const isPendingDelete = staged?.action === 'delete';

                                        return (
                                            <div key={format} className="relative group">
                                                <label className={cn(
                                                    "flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-sm cursor-pointer transition-all h-full",
                                                    isPendingDelete
                                                        ? "border-warning/30 bg-warning/10 text-warning/50 opacity-50"
                                                        : (staged?.file)
                                                            ? "border-success/50 bg-success/10 text-success shadow-[0_0_15px_rgba(var(--color-success)/0.1)]"
                                                            : (variant as any)[`${format}_url`]
                                                                ? "border-foreground/10 bg-card-background text-foreground/70 hover:bg-foreground/15 shadow-inner"
                                                                : "border-dashed border-foreground/10 bg-foreground/5 text-muted hover:border-foreground/30 hover:text-foreground/70"
                                                )}>
                                                    <span className="uppercase font-bold text-xs tracking-wider">{format}</span>
                                                    <span className="text-[9px] uppercase font-bold opacity-70">
                                                        {isPendingDelete ? 'Deleting' : staged?.file ? 'Modified' : (variant as any)[`${format}_url`] ? 'Installed' : 'Upload'}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept={`.${format}`}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleStageChange('replace', format, file, variant.id, variant.variant_name);
                                                        }}
                                                    />
                                                </label>

                                                {((variant as any)[`${format}_url`] || staged?.file) && !isPendingDelete && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault(); e.stopPropagation();
                                                            handleStageChange('delete', format, undefined, variant.id, variant.variant_name);
                                                        }}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-warning text-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg"
                                                        title="Remove File"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                                {isPendingDelete && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault(); e.stopPropagation();
                                                            setStagedChanges(prev => prev.filter(c => !(c.variantId === variant.id && c.format === format)));
                                                        }}
                                                        className="absolute -top-2 -right-2 p-1 text-[9px] font-bold uppercase bg-muted text-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-80 shadow-lg px-2"
                                                    >
                                                        Undo
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Added New Variants UI */}
                        {addedVariants.map(variant => (
                            <div key={variant.id} className="p-5 bg-success/5 rounded-2xl border border-success/30 space-y-4 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 shadow-[0_0_20px_rgba(var(--color-success)/0.05)]">
                                <div className="absolute top-0 left-0 w-1 h-full bg-success shadow-[0_0_10px_rgba(var(--color-success)/0.5)]"></div>
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center pb-3 border-b border-foreground/5">
                                    <div className="w-full md:w-1/3">
                                        {variant.isCustom ? (
                                            <input
                                                type="text"
                                                value={variant.name}
                                                onChange={(e) => updateAddedVariantName(variant.id, e.target.value)}
                                                className="bg-transparent border-b border-foreground/20 text-foreground font-bold text-lg tracking-wide focus:border-success outline-none pb-1 w-full placeholder:text-muted transition-colors duration-300 ease-in-out"
                                                placeholder="Variant Name"
                                                autoFocus
                                            />
                                        ) : (
                                            <select
                                                value={variant.name}
                                                onChange={(e) => updateAddedVariantName(variant.id, e.target.value)}
                                                className="bg-card-background border border-foreground/10 text-foreground font-bold text-lg tracking-wide rounded-xl px-3 py-2 w-full focus:outline-none focus:border-success/50 appearance-none shadow-inner"
                                            >
                                                {VARIANT_NAMES.filter(name => name === variant.name || !addedVariants.some(v => v.name === name)).map(name => (
                                                    <option key={name} value={name}>{name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <button onClick={() => removeAddedVariant(variant.id)} className="ml-auto text-muted hover:text-warning hover:scale-110 transition-transform p-1 bg-foreground/5 rounded-full"><X size={16} /></button>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {(['ttf', 'otf', 'woff', 'woff2'] as const).map(fmt => (
                                        <div key={fmt} className="relative">
                                            {variant.files[fmt] ? (
                                                <div className="flex items-center justify-between border border-success/50 bg-success/10 text-success rounded-xl p-3 text-xs font-bold shadow-[0_0_15px_rgba(var(--color-success)/0.1)]">
                                                    <span className="truncate max-w-20 uppercase tracking-widest">{variant.files[fmt]?.name || fmt}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateAddedVariantFile(variant.id, fmt, null)}
                                                        className="hover:scale-110 transition-transform"
                                                    >
                                                        <Trash2 size={14} className="text-success hover:text-warning" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center gap-1 border border-dashed border-foreground/20 bg-foreground/5 text-muted rounded-xl p-3 text-xs font-bold cursor-pointer hover:border-success/50 hover:text-success transition-all">
                                                    <span className="uppercase tracking-widest">{fmt}</span>
                                                    <span className="text-[9px] opacity-70"><Plus size={10} className="inline mb-0.5" /> UPLOAD</span>
                                                    <input type="file" className="hidden" accept={`.${fmt}`} onChange={(e) => updateAddedVariantFile(variant.id, fmt, e.target.files?.[0] || null)} />
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 pt-6 pb-2 border-t border-foreground/10 flex justify-end gap-3 bg-card-background">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-full font-bold bg-foreground/5 border border-foreground/10 text-foreground hover:bg-foreground/10 transition-colors duration-300 ease-in-out"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={executeBatchChanges}
                        disabled={stagedChanges.length === 0 && addedVariants.length === 0 || isSaving}
                        className="px-8 py-3 rounded-full font-bold bg-accent text-background hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 shadow-[0_0_20px_rgba(var(--color-highlight)/0.2)] disabled:shadow-none"
                    >
                        {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
