import { useAuth } from '../../contexts/AuthContext';
import { Camera, Edit2, Shield, User, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
// import { motion } from 'framer-motion';

interface ProfileHeaderProps {
    isEditing: boolean;
    onEditClick: () => void;
}

export default function ProfileHeader({ isEditing, onEditClick }: ProfileHeaderProps) {
    const { user, profile, refreshProfile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to update avatar');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative mb-12">
            {/* Cover / Background decoration */}
            <div className="h-48 md:h-64 rounded-3xl overflow-hidden relative bg-zinc-900 border border-white/10">
                <div className="absolute inset-0 bg-linear-to-r from-[#BDF522]/20 via-purple-500/20 to-[#04ff96]/20 opacity-50 blur-3xl"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>

            <div className="px-6 md:px-10 -mt-16 md:-mt-20 relative flex flex-col md:flex-row items-end gap-6">

                {/* Avatar */}
                <div className="relative group">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-black bg-zinc-800 overflow-hidden shadow-2xl relative">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-900">
                                <User size={48} />
                            </div>
                        )}

                        {/* Upload Overlay */}
                        <button
                            onClick={handleAvatarClick}
                            disabled={uploading}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={32} />}
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                    {/* Role Badge */}
                    <div className="absolute bottom-2 right-2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 flex items-center gap-1 shadow-lg">
                        <Shield size={12} className={profile?.role === 'admin' ? 'text-[#FFC900]' : 'text-[#04ff96]'} />
                        <span className="uppercase">{profile?.role || 'Member'}</span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{profile?.full_name || 'Anonymous User'}</h1>
                    <p className="text-zinc-400 font-medium">@{profile?.username || user?.email?.split('@')[0]}</p>
                </div>

                {/* Actions */}
                <div className="mb-4">
                    <button
                        onClick={onEditClick}
                        className={`
                            px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all
                            ${isEditing
                                ? 'bg-white text-black hover:bg-zinc-200'
                                : 'bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800'
                            }
                        `}
                    >
                        <Edit2 size={16} />
                        {isEditing ? 'Done Editing' : 'Edit Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}
