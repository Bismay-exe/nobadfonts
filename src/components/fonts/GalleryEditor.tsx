import { Trash2, MoveLeft, MoveRight, ImageIcon, Link as LinkIcon, Check, X, Save } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Toast } from '@capacitor/toast';

interface GalleryItem {
    id: string;
    url: string;
    size: number;
    file?: File;
    type: 'url' | 'file';
}

interface GalleryEditorProps {
    font: any;
    user: any;
    initialImages: string[];
    initialSizes: number[];
    onClose: () => void;
    onSaveSuccess: () => void;
}

export default function GalleryEditor({ font, user, initialImages, initialSizes, onClose, onSaveSuccess }: GalleryEditorProps) {
    const [galleryState, setGalleryState] = useState<GalleryItem[]>(
        initialImages.map((url, idx) => ({
            id: `existing-${idx}`,
            url,
            size: initialSizes[idx] || 0,
            type: 'url'
        }))
    );
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleRemoveGalleryItem = (index: number) => {
        setGalleryState(prev => prev.filter((_, i) => i !== index));
    };

    const handleMoveGalleryItem = (index: number, direction: 'left' | 'right') => {
        setGalleryState(prev => {
            const temp = [...prev];
            const targetIndex = direction === 'left' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= temp.length) return prev;
            [temp[index], temp[targetIndex]] = [temp[targetIndex], temp[index]];
            return temp;
        });
    };

    const handleAddGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files);
        setGalleryState(prev => [
            ...prev,
            ...newFiles.map(file => ({
                id: `new-${Date.now()}-${Math.random()}`,
                url: URL.createObjectURL(file),
                size: file.size,
                file,
                type: 'file' as const
            }))
        ]);
        e.target.value = '';
    };

    const handleAddGalleryUrl = () => {
        if (!urlInput.trim()) return;
        setGalleryState(prev => [
            ...prev,
            {
                id: `new-url-${Date.now()}`,
                url: urlInput.trim(),
                size: 0,
                type: 'url' as const
            }
        ]);
        setUrlInput('');
        setShowUrlInput(false);
    };

    const handleSaveGallery = async () => {
        if (!font || !user) return;
        if (!confirm('Save changes to gallery?')) return;

        setIsSaving(true);
        try {
            const finalUrls: string[] = [];
            const finalSizes: number[] = [];

            for (const item of galleryState) {
                if (item.type === 'file' && item.file) {
                    const filePath = `${font.uploaded_by}/${font.slug}/gallery/${Date.now()}-${item.file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from('fonts')
                        .upload(filePath, item.file, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('fonts')
                        .getPublicUrl(filePath);

                    finalUrls.push(publicUrl);
                    finalSizes.push(item.size);
                } else {
                    finalUrls.push(item.url);
                    finalSizes.push(item.size);
                }
            }

            const previewImageUrl = finalUrls.length > 0 ? finalUrls[0] : null;
            const fileSizeImagePreview = finalSizes.length > 0 ? finalSizes[0] : null;

            const { error: updateError } = await supabase
                .from('fonts')
                .update({
                    gallery_images: finalUrls,
                    gallery_image_sizes: finalSizes,
                    preview_image_url: previewImageUrl,
                    file_size_image_preview: fileSizeImagePreview
                })
                .eq('id', font.id);

            if (updateError) throw updateError;

            const originalImages = font.gallery_images || [];
            const deletedImages = originalImages.filter((url: string) => !finalUrls.includes(url));

            if (deletedImages.length > 0) {
                const getPathFromUrl = (url: string) => {
                    try {
                        const urlObj = new URL(url);
                        const pathParts = urlObj.pathname.split('/public/fonts/');
                        if (pathParts.length > 1) return decodeURIComponent(pathParts[1]);
                        return null;
                    } catch { return null; }
                };

                const pathsToDelete = deletedImages.map(getPathFromUrl).filter((p: string | null): p is string => p !== null);
                if (pathsToDelete.length > 0) {
                    await supabase.storage.from('fonts').remove(pathsToDelete);
                }
            }

            await Toast.show({ text: 'Gallery updated successfully!', duration: 'short' });
            onSaveSuccess();
        } catch (err: any) {
            console.error('Error saving gallery:', err);
            await Toast.show({ text: 'Failed to save gallery: ' + err.message, duration: 'long' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-[rgb(var(--color-card))] border-t border-[rgb(var(--color-foreground)/0.1)] p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-[rgb(var(--color-foreground))]">Edit Gallery Images</h3>
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveGallery}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] rounded-full font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                {galleryState.map((item, index) => (
                    <div key={item.id} className="relative group aspect-square bg-black rounded-xl border border-white/10 overflow-hidden">
                        <img src={item.url} alt="" className="w-full h-full object-cover" />

                        <div className="absolute inset-0 bg-[rgb(var(--color-background)/0.8)] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleMoveGalleryItem(index, 'left')}
                                    disabled={index === 0}
                                    className="p-1.5 bg-[rgb(var(--color-muted))] text-[rgb(var(--color-foreground))] rounded-full hover:opacity-80 disabled:opacity-50"
                                >
                                    <MoveLeft size={14} />
                                </button>
                                <button
                                    onClick={() => handleMoveGalleryItem(index, 'right')}
                                    disabled={index === galleryState.length - 1}
                                    className="p-1.5 bg-[rgb(var(--color-muted))] text-[rgb(var(--color-foreground))] rounded-full hover:opacity-80 disabled:opacity-50"
                                >
                                    <MoveRight size={14} />
                                </button>
                            </div>
                            <button
                                onClick={() => handleRemoveGalleryItem(index)}
                                className="p-1.5 bg-[rgb(var(--color-destructive)/0.2)] text-[rgb(var(--color-destructive))] border border-[rgb(var(--color-destructive)/0.5)] rounded-full hover:bg-[rgb(var(--color-destructive))] hover:text-[rgb(var(--color-background))] mt-1 transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                            {index === 0 && (
                                <span className="absolute top-2 left-2 bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    PREVIEW
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                <div className="aspect-square flex flex-col gap-2">
                    <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-700 rounded-xl hover:border-white/50 hover:bg-white/5 cursor-pointer transition-colors bg-black/20">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleAddGalleryFile}
                            className="hidden"
                        />
                        <ImageIcon className="text-zinc-500 mb-1" />
                        <span className="text-xs font-bold text-zinc-500">Upload Files</span>
                    </label>

                    {showUrlInput ? (
                        <div className="flex gap-1 h-8">
                            <input
                                type="url"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                placeholder="https://..."
                                className="flex-1 min-w-0 bg-[rgb(var(--color-background)/0.5)] border border-[rgb(var(--color-foreground)/0.2)] rounded-lg px-2 text-xs text-[rgb(var(--color-foreground))] focus:outline-none focus:border-[rgb(var(--color-highlight))]"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleAddGalleryUrl()}
                            />
                            <button onClick={handleAddGalleryUrl} className="bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] px-2 rounded-lg hover:opacity-80">
                                <Check size={12} />
                            </button>
                            <button onClick={() => setShowUrlInput(false)} className="bg-[rgb(var(--color-muted))] text-[rgb(var(--color-foreground))] px-2 rounded-lg hover:opacity-80">
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowUrlInput(true)}
                            className="h-8 flex items-center justify-center gap-1 border border-dashed border-zinc-700 rounded-xl hover:border-white/50 hover:bg-white/5 transition-colors bg-black/20 text-xs font-bold text-zinc-500"
                        >
                            <LinkIcon size={12} /> Add URL
                        </button>
                    )}
                </div>
            </div>
            <p className="text-xs text-zinc-500 italic text-center mt-4">
                Tip: The first image will be used as the main preview card.
            </p>
        </div>
    );
}
