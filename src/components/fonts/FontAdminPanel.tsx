import { useState } from 'react';
import { Upload, X, Save, Trash2, FileType, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface FontAdminProps {
    fontId: string;
    initialGalleryImages: string[];
    onUpdate: () => void;
    onClose: () => void;
}

export default function FontAdminPanel({ fontId, initialGalleryImages, onUpdate, onClose }: FontAdminProps) {
    const [uploading, setUploading] = useState(false);
    const [galleryImages, setGalleryImages] = useState(initialGalleryImages);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleRemovePending = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExisting = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setUploading(true);
        try {
            const uploadedUrls: string[] = [];

            // 1. Upload new files
            for (const file of pendingFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${fontId}/${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('font-previews') // Assuming bucket name
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('font-previews').getPublicUrl(fileName);
                uploadedUrls.push(data.publicUrl);
            }

            // 2. Update Database
            const finalImages = [...galleryImages, ...uploadedUrls];

            // Assuming we update the 'gallery_images' array column
            const { error: dbError } = await supabase
                .from('fonts')
                .update({ gallery_images: finalImages })
                .eq('id', fontId);

            if (dbError) throw dbError;

            onUpdate();
            onClose();

        } catch (error) {
            console.error('Error updating gallery:', error);
            alert('Failed to update gallery');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h2 className="text-xl font-bold text-white">Manage Gallery</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-8">

                    {/* Existing Images */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Current Images</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {galleryImages.map((url, idx) => (
                                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group border border-white/10 bg-black/50">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => handleRemoveExisting(idx)} className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Uploads */}
                    {(pendingFiles.length > 0) && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider">Ready to Upload</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {pendingFiles.map((file, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center">
                                        {file.type.startsWith('image') ? (
                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-50" />
                                        ) : (
                                            <FileType size={32} className="text-emerald-500" />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <button onClick={() => handleRemovePending(idx)} className="p-2 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dropzone / Upload Trigger */}
                    <label className="w-full aspect-4/1 border-2 border-dashed border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                        <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={24} className="text-zinc-400 group-hover:text-white" />
                        </div>
                        <p className="text-zinc-500 font-medium">Click to add images</p>
                    </label>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={uploading}
                        className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
}
