import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, FileType, Edit2 } from 'lucide-react';
import { Toast } from '@capacitor/toast';
import { supabase } from '../../lib/supabase';
import GalleryEditor from '../fonts/GalleryEditor';
import type { Font } from '../../types/font';

interface FontAdminControlsProps {
    font: Font;
    user: any;
    profile: any;
    onEditFiles: () => void;
}

export default function FontAdminControls({
    font,
    user,
    profile,
    onEditFiles,
}: FontAdminControlsProps) {
    const navigate = useNavigate();
    const [isEditingGallery, setIsEditingGallery] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (profile?.role !== 'admin') return null;

    const handleDeleteFont = async () => {
        if (!font || isDeleting) return;
        if (!confirm('Are you sure you want to delete this font? This cannot be undone.')) return;

        setIsDeleting(true);
        try {
            const filePaths: string[] = [];

            const getPathFromUrl = (url: string) => {
                try {
                    const urlObj = new URL(url);
                    const pathParts = urlObj.pathname.split('/public/fonts/');
                    if (pathParts.length > 1) {
                        return decodeURIComponent(pathParts[1]);
                    }
                    return null;
                } catch {
                    return null;
                }
            };

            // Main font files
            (['woff2_url', 'woff_url', 'ttf_url', 'otf_url', 'zip_url'] as const).forEach(key => {
                const url = font[key as keyof typeof font] as string | null;
                if (url) {
                    const path = getPathFromUrl(url);
                    if (path) filePaths.push(path);
                }
            });

            // Images
            if (font.preview_image_url) {
                const path = getPathFromUrl(font.preview_image_url);
                if (path) filePaths.push(path);
            }
            if (font.gallery_images && Array.isArray(font.gallery_images)) {
                font.gallery_images.forEach(url => {
                    const path = getPathFromUrl(url);
                    if (path) filePaths.push(path);
                });
            }
            if (font.og_image_url) {
                const path = getPathFromUrl(font.og_image_url);
                if (path) filePaths.push(path);
            }

            // Check for any files inside og-images/{font.id} folder
            try {
                const { data: ogFiles } = await supabase.storage.from('fonts').list(`og-images/${font.id}`);
                if (ogFiles && Array.isArray(ogFiles)) {
                    ogFiles.forEach(f => {
                        if (f.name) {
                            const p = `og-images/${font.id}/${f.name}`;
                            if (!filePaths.includes(p)) filePaths.push(p);
                        }
                    });
                }
            } catch (err) {
                console.warn("Could not list og-images for font deletion cleanup:", err);
            }

            // Variant files
            if (font.font_variants && Array.isArray(font.font_variants)) {
                font.font_variants.forEach(variant => {
                    (['woff2_url', 'woff_url', 'ttf_url', 'otf_url'] as const).forEach(key => {
                        const url = variant[key as keyof typeof variant] as string | null;
                        if (url) {
                            const path = getPathFromUrl(url);
                            if (path) filePaths.push(path);
                        }
                    });
                });
            }

            // 2. Delete files from storage
            if (filePaths.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from('fonts')
                    .remove(filePaths);

                if (storageError) {
                    console.error("Storage delete error:", storageError);
                }
            }

            // 3. Delete database record
            const { error } = await supabase.from('fonts').delete().eq('id', font.id);
            if (error) throw error;

            await Toast.show({ text: 'Font and all associated files deleted successfully.', duration: 'short' });
            navigate('/');

        } catch (err: any) {
            console.error('Delete failed:', err);
            await Toast.show({ text: 'Error deleting font: ' + err.message, duration: 'long' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-muted rounded-3xl mb-8 border border-foreground/10 overflow-hidden mt-8">
            {!isEditingGallery ? (
                <div className="p-4 w-full flex justify-between items-center bg-card-background/50">
                    <span className="text-muted font-mono text-xs uppercase tracking-widest pl-2">
                        Admin Controls
                    </span>
                    <div className="flex gap-2 md:gap-4">
                        <button
                            onClick={handleDeleteFont}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-warning/10 text-warning border border-warning/20 rounded-full font-bold text-sm hover:opacity-80 transition-colors duration-300 ease-in-out disabled:opacity-50 cursor-pointer"
                        >
                            <Trash2 size={16} /> <span className="hidden md:inline">{isDeleting ? 'Deleting...' : 'Delete Font'}</span>
                        </button>
                        <button
                            onClick={onEditFiles}
                            className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border border-foreground/10 rounded-full font-bold text-sm hover:opacity-80 transition-colors duration-300 ease-in-out cursor-pointer"
                        >
                            <FileType size={16} /> Edit Files
                        </button>
                        <button
                            onClick={() => setIsEditingGallery(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full font-bold text-sm hover:opacity-80 transition-colors duration-300 ease-in-out cursor-pointer"
                        >
                            <Edit2 size={16} /> Edit Gallery
                        </button>
                    </div>
                </div>
            ) : (
                <GalleryEditor
                    font={font}
                    user={user}
                    initialImages={font.gallery_images || []}
                    initialSizes={font.gallery_image_sizes || []}
                    onClose={() => setIsEditingGallery(false)}
                    onSaveSuccess={() => {
                        setIsEditingGallery(false);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
