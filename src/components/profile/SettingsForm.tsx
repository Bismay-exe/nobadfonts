import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Plus, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export const NOBADFONTS_AVATARS = [
    'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf1&backgroundColor=0ea5e9',
    'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf2&backgroundColor=8b5cf6',
    'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf3&backgroundColor=f59e0b',
    'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf4&backgroundColor=10b981',
    'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf5&backgroundColor=ef4444',
    'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf6&backgroundColor=ec4899',
    'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf7&backgroundColor=f97316',
    'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf8&backgroundColor=06b6d4',
];

function getSocialIcon(url: string) {
    if (!url) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m-1 17.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41c0 2.08-.8 3.97-2.1 5.39" />
            </svg>
        );
    }
    const lower = url.toLowerCase();
    if (lower.includes('instagram.com')) {
        return <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAABsFBMVEVHcEx6Gft+F/x0FPyBDPORB+WnAt69AN/IANzSANrVANDpEKtpGv52FvjhANfhAMnbBLfVBJGHGP2YF/ueAu+zAPDrALTtA6quMNrKWuPhYtzvVMHvILzuAMbMf+z+3/3/////9//vd9v5AbryAqWuGvrxr9371vf2tePwp9/vnuD/+//+ArP9AJ395vrTRNPucMLwAo7HG/fxFM39wPHtPZ38AoXjGfD6E7TsJ6rzI5PzV6P7AXX9FpDtocvxZJ79AGTwrb39EGf8InX87PPxHGv+E3j8H1vugJX7KlLxZJH1u8v7M1X2Kz78M0XwbF79Kmbyu6/9OTD9QUPwWGf//vPrQlr0NGj7AFn0imzySCL7Szb4yb/7QiT8UBL+Wi3+7Nn1BEbzz6b5Ww79ZiL0dUf11bD8eyj6aAH+dg/+bh3zFUX93OjymjH9ign8hQT5hRj8fQ32t2f/+djypEz5kAL22539dwf+mQL5ogD3zmHzn4r4Go77Yyv/qgT+sAL5rwD5vzL1yVr6mAf9tgD9vQD/xAD/KnD2lwD8ygD+OGP/LGv+rQ3+uQj/ywL7VDI4+UxjAAAAkHRSTlMAXMb/////////xl0Kz///zgv//////8r//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8X/////xl3//////8/////OC//PClzG/8UUwjnzAAACFUlEQVR4ATXQRbobRxhG4fO16q8moZmZPQkz0wayg3CygHBGnmYjwTV4FpqamRl1o3u7pWqVoR+fYb3FAiQBQiDaAaQJiK4WW6JFARiS7joe2qBdPRbCAAR4IY0AabxMiMdJC32gZuLavYqylVaHnf97pEjLYdndZVNSqXWC3CSfZVpCO+FenvR1ru9py6tq2XjYgEt6vd5Y6OyOVeSPIr87jGl515GbM9gTwrmd1zfk1coLbKqqtbfWhpDkARLg5kSpbbjVc9fMriVcXXHVYhR4F2DVvXnfWHVZscDGcVWzjDUX8JBcv25Aj3hH2bIs63gtAeAczm3qULFeGtc79Hg8W1gW/GMmyX2xBsyvjGnTeO/LKsrTlvg8AbwZ2MNnQbuoRUscDM3s+XoQ0rSXb9IGvwbKNeAcdCFTTE7tL8edcnZ4v6DTrizLEnDOFt46fCeJtw/vKO9bTouNBCMzW2kfjA4fHr22rDJPQQEhcWb95+f2qPnw5ZeHsTFTsVWdawF9bFBN1khiiQ7TGaGKydG3J+fdPX0hMv35oQTUSmrqWZiMDu7ZfkL39FU69+jX58tVwC0ANz3I0yHM45K+qXxHqL7wH096vlx/YbF2Cy/rp/sFXkKqIIN7JPfnVNVD/FscmHgvQBCJoY6LnXo6C1X96ncOK2fQfkqDXIwsRj+DN4SAn1U5wGDWxDidNqGe7r9zAB4A0j29NbySqvYAAAAASUVORK5CYII=" alt="" className="w-5 h-5 rounded-sm object-contain" />;
    }
    if (lower.includes('behance.net')) {
        return <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAeFBMVEUFWP8AVv8ATP8ASv8AUf+lt/+ywf9lhf8ARv8AU/8AQP/y9f////91kv/q8P8ARP/S2v9ujf/l7P8ASP8yZv8ATv+5xv9nh//M1f+Spv/BzP/Y3/+4xP+ZrP+su/8AJv8AN/8APf/f5v8AL/8oX/88af9Qd/+Kof8IPKxZAAAAvUlEQVR4Ac3RRQKDMAAAwZLgLO5ab///w7qgZxZnLpHNcspsa0UhHwl1CqWmP9IM8/5hPfpD2+GVLlX38fT8P/QIQteNIFYUVUnSB/1h5qdmDqq6KYDS76Mt0oratqBuoBX/yCMnjjuq7S6BHkZZljkQR9RVlYGh/mG2l7ENbYQXRdEhynvoq+rRoykoj/bxdB5OJdShzME4lSDHi1Cbfseji/pF2WWPOuM+vfjcdldVnVl4KxXp8patFhe6ATwRD2y5uYPGAAAAAElFTkSuQmCC" alt="" className="w-5 h-5 rounded-sm object-contain" />;
    }
    if (lower.includes('twitter.com') || lower.includes('x.com')) {
        return <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAAqUlEQVR4AdXQEQwCUQDG8b87pFkcRmGuyfFpFB+HuZ20/DA4yndLHj17dHJ08G/V1qp7vvWjT77t28cfKlIIMS54KmPa8uli35l4WGvNtyQ7G2CmF37M7WncQe+NidKW5CyYyDhboY5kRZelLshz5OyevK0dySVZNz1iT07r0LkpbJmqdcUoJyt+VVrAxkB0NRnzKhysGQfevt++mgavfOpi844hhFjyf+4xHWjgrPr73gAAAABJRU5ErkJggg==" alt="" className="w-5 h-5 rounded-sm object-contain" />;
    }
    if (lower.includes('linkedin.com')) {
        return <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBjUaECkUKy_fw68AQN07BBrtcAksp-iuJ_Ow_FYXc6w&s" alt="" className="w-5 h-5 rounded-sm object-contain" />;
    }
    if (lower.includes('dribbble.com')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2m6.605 4.61a8.5 8.5 0 0 1 1.93 5.314c-.281-.054-3.101-.629-5.943-.271c-.065-.141-.12-.293-.184-.445a25 25 0 0 0-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362M12 3.475c2.17 0 4.154.813 5.662 2.148c-.152.216-1.443 1.941-4.48 3.08c-1.399-2.57-2.95-4.675-3.189-5A8.7 8.7 0 0 1 12 3.475m-3.633.803a54 54 0 0 1 3.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.58 8.58 0 0 1 4.729-5.975M3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215q.371.694.717 1.402l-.336.085c-4.474 1.44-6.858 5.37-7.061 5.702A8.5 8.5 0 0 1 3.453 12.01m3.138 7.053c.137-.235 3.139-5.317 6.772-6.379a22 22 0 0 0-.042-.085a56 56 0 0 1 1.713 6.062A8.5 8.5 0 0 1 12 20.547a8.5 8.5 0 0 1-5.408-1.484m7.644-.959a53 53 0 0 0-1.596-5.703c2.677-.413 5.03.26 5.317.345a8.6 8.6 0 0 1-3.721 5.358" />
            </svg>
        );
    }
    if (lower.includes('github.com')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
                <path fill="currentColor" fillRule="evenodd" d="M8 .2A8 8 0 0 0 5.47 15.79c.4.074.546-.173.546-.385c0-.19-.007-.693-.01-1.36c-2.226.483-2.695-1.073-2.695-1.073c-.364-.924-.889-1.17-.889-1.17c-.726-.496.055-.486.055-.486c.803.056 1.226.824 1.226.824c.713 1.222 1.872.869 2.328.664c.072-.517.279-.869.508-1.069c-1.776-.202-3.644-.888-3.644-3.953c0-.874.312-1.588.823-2.147c-.082-.202-.357-1.016.078-2.117c0 0 .672-.215 2.2.82A7.7 7.7 0 0 1 8 4.068c.68.004 1.364.092 2.003.27c1.527-1.035 2.198-.82 2.198-.82c.436 1.101.162 1.915.08 2.117c.513.559.822 1.273.822 2.147c0 3.073-1.87 3.749-3.653 3.947c.287.247.543.735.543 1.481c0 1.07-.01 1.933-.01 2.196c0 .214.144.463.55.384A8 8 0 0 0 8 .2" />
            </svg>
        );
    }
    if (lower.includes('youtube.com')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M23.498 6.186a3.02 3.02 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.02 3.02 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.02 3.02 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.02 3.02 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814M9.545 15.568V8.432L15.818 12z" />
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m-1 17.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41c0 2.08-.8 3.97-2.1 5.39" />
        </svg>
    );
}

export default function SettingsForm({ isOpen, onCancel }: { isOpen?: boolean; onCancel: () => void }) {
    const { user, profile, refreshProfile } = useAuth();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [username, setUsername] = useState(profile?.username || '');
    const [bio, setBio] = useState(profile?.bio || '');

    // Profile Picture State
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarUrlChoice, setAvatarUrlChoice] = useState<string | null>(null);
    const [avatarRemoved, setAvatarRemoved] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    // Social & Info
    const [website, setWebsite] = useState(profile?.website || '');

    const getInitialSocials = useCallback(() => {
        const list = [
            profile?.instagram,
            profile?.behance,
            profile?.twitter,
            profile?.linkedin,
        ].filter(Boolean) as string[];
        return list.length > 0 ? list : [''];
    }, [profile]);

    const [socialLinks, setSocialLinks] = useState<string[]>(getInitialSocials);
    const [paypalMe, setPaypalMe] = useState(profile?.paypal_me || '');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    const pathRef = useRef<SVGPathElement>(null);

    // Default Email / Account photo
    const emailDefaultAvatar =
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture ||
        `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user?.email || 'User')}&backgroundColor=18181b`;

    // Keep initial values in sync when modal opens
    useEffect(() => {
        if (isOpen && profile) {
            setFullName(profile.full_name || '');
            setUsername(profile.username || '');
            setBio(profile.bio || '');
            setWebsite(profile.website || '');
            const initialList = [
                profile.instagram,
                profile.behance,
                profile.twitter,
                profile.linkedin,
            ].filter(Boolean) as string[];
            setSocialLinks(initialList.length > 0 ? initialList : ['']);
            setPaypalMe(profile.paypal_me || '');
            setAvatarFile(null);
            setAvatarPreview(null);
            setAvatarUrlChoice(null);
            setAvatarRemoved(false);
            setShowAvatarModal(false);
            setMessage(null);
            setShowUnsavedWarning(false);
        }
    }, [isOpen, profile]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const hasUnsavedChanges = useCallback(() => {
        const initialList = [
            profile?.instagram,
            profile?.behance,
            profile?.twitter,
            profile?.linkedin,
        ].filter(Boolean) as string[];
        const currentFiltered = socialLinks.map(s => s.trim()).filter(Boolean);
        const socialsChanged =
            initialList.length !== currentFiltered.length ||
            initialList.some((url, i) => url !== currentFiltered[i]);

        return (
            fullName !== (profile?.full_name || '') ||
            username !== (profile?.username || '') ||
            bio !== (profile?.bio || '') ||
            website !== (profile?.website || '') ||
            socialsChanged ||
            paypalMe !== (profile?.paypal_me || '') ||
            avatarFile !== null ||
            avatarUrlChoice !== null ||
            avatarRemoved
        );
    }, [fullName, username, bio, website, socialLinks, paypalMe, avatarFile, avatarUrlChoice, avatarRemoved, profile]);

    const handleAttemptClose = useCallback(() => {
        if (hasUnsavedChanges()) {
            setShowUnsavedWarning(true);
        } else {
            onCancel();
        }
    }, [hasUnsavedChanges, onCancel]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            // 1. Handle profile picture upload / preset selection / removal
            let newAvatarUrl: string | undefined | null = undefined;
            if (avatarFile) {
                const ext = avatarFile.name.split('.').pop() || 'png';
                const path = `${user.id}/avatar-${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(path, avatarFile, { upsert: true });
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
                newAvatarUrl = publicUrl;
            } else if (avatarUrlChoice !== null) {
                newAvatarUrl = avatarUrlChoice;
            } else if (avatarRemoved) {
                newAvatarUrl = null;
            }

            // 2. Parse social links into existing database schema columns
            let instagram: string | null = null;
            let behance: string | null = null;
            let twitter: string | null = null;
            let linkedin: string | null = null;

            socialLinks.forEach(link => {
                const clean = link.trim();
                if (!clean) return;
                const lower = clean.toLowerCase();
                if (lower.includes('instagram.com')) {
                    instagram = clean;
                } else if (lower.includes('behance.net')) {
                    behance = clean;
                } else if (lower.includes('twitter.com') || lower.includes('x.com')) {
                    twitter = clean;
                } else if (lower.includes('linkedin.com')) {
                    linkedin = clean;
                } else {
                    // Fallback to first vacant slot
                    if (!instagram) instagram = clean;
                    else if (!twitter) twitter = clean;
                    else if (!behance) behance = clean;
                    else if (!linkedin) linkedin = clean;
                }
            });

            // 3. Update public profile with valid schema fields
            const updatePayload: any = {
                full_name: fullName,
                username: username,
                bio: bio,
                website: website.trim() || null,
                instagram,
                behance,
                twitter,
                linkedin,
                paypal_me: paypalMe.trim() || null,
                updated_at: new Date().toISOString(),
            };
            if (newAvatarUrl !== undefined) {
                updatePayload.avatar_url = newAvatarUrl;
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .update(updatePayload)
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 4. Sync with Auth User Metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (authError) {
                console.warn('Failed to sync auth metadata:', authError);
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Refresh profile data in context
            await refreshProfile();

            setTimeout(() => {
                onCancel();
            }, 1000);

        } catch (err: any) {
            if (err.code === '23505') {
                setMessage({ type: 'error', text: 'Username already taken. Please choose another one.' });
            } else {
                setMessage({ type: 'error', text: err.message });
            }
        } finally {
            setLoading(false);
        }
    }, [user, fullName, username, bio, website, socialLinks, paypalMe, avatarFile, avatarUrlChoice, avatarRemoved, refreshProfile, onCancel]);

    if (isOpen === false) return null;

    const currentDisplayAvatar = avatarPreview || avatarUrlChoice || (avatarRemoved ? null : profile?.avatar_url) || '/profile/profile.png';
    const canRemoveAvatar = !!avatarPreview || !!avatarUrlChoice || (!avatarRemoved && !!profile?.avatar_url);

    const modal = (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-200 flex items-center justify-center p-4 md:p-6 font-inter-tight tracking-wide"
            onClick={(e) => {
                if (e.target === overlayRef.current) handleAttemptClose();
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-foreground/5 backdrop-blur-sm" />

            {/* Panel */}
            <div className="relative w-full max-w-xl bg-card-background rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-border/40">
                    <div className="flex items-center justify-between text-3xl font-inter-tight font-medium tracking-wide">
                        <h2 className="text-foreground ml-3">Edit Profile</h2>
                        <button
                            type="button"
                            onClick={handleAttemptClose}
                            className="p-2 flex items-center justify-center rounded-full hover:bg-foreground/8 transition-colors duration-300 ease-in-out text-muted hover:text-foreground cursor-pointer"
                        >
                            <X />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-5 py-6 custom-scrollbar">
                    {message && (
                        <div className={`p-4 rounded-xl mb-6 font-medium ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className='flex flex-col sm:flex-row justify-center items-center gap-6'>
                            <div className='relative'>
                                <img
                                    src={currentDisplayAvatar}
                                    alt={profile?.full_name ? `${profile.full_name}'s avatar` : 'User profile avatar'}
                                    className='w-44 h-44 object-cover rounded-full ring-3 ring-border'
                                />

                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setAvatarFile(file);
                                            setAvatarPreview(URL.createObjectURL(file));
                                            setAvatarUrlChoice(null);
                                            setAvatarRemoved(false);
                                            setShowAvatarModal(false);
                                        }
                                    }}
                                />

                                <div className="absolute inset-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowAvatarModal(true)}
                                        className="h-full w-full flex justify-center items-center p-2.5 bg-transparent hover:bg-background/40 text-transparent hover:text-foreground rounded-full transition-all duration-300 ease-in-out cursor-pointer shadow-lg"
                                        title={canRemoveAvatar ? "Change photo" : "Add photo"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M9.75 13a2.25 2.25 0 1 1 4.5 0a2.25 2.25 0 0 1-4.5 0" />
                                            <path fill="currentColor" fillRule="evenodd" d="M7.474 7.642A3.14 3.14 0 0 1 10.616 4.5h2.768a3.14 3.14 0 0 1 3.142 3.142a.03.03 0 0 0 .026.029l2.23.18c.999.082 1.82.82 2.007 1.805a22.1 22.1 0 0 1 .104 7.613l-.097.604a2.505 2.505 0 0 1-2.27 2.099l-1.943.157a56.6 56.6 0 0 1-9.166 0l-1.943-.157a2.505 2.505 0 0 1-2.27-2.1l-.097-.603c-.407-2.525-.371-5.1.104-7.613a2.226 2.226 0 0 1 2.007-1.804l2.23-.181a.03.03 0 0 0 .026-.029M12 9.25a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="absolute right-1 bottom-1 flex gap-1.5">
                                    {canRemoveAvatar && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAvatarFile(null);
                                                setAvatarPreview(null);
                                                setAvatarUrlChoice(null);
                                                setAvatarRemoved(true);
                                            }}
                                            onMouseEnter={() => {
                                                if (pathRef.current) {
                                                    pathRef.current.style.d = `path("M9.774 5L3.758 3.94l.174-.986a.5.5 0 0 1 .58-.405L18.411 5h.088h-.087l1.855.327a.5.5 0 0 1 .406.58l-.174.984l-2.09-.368l-.8 13.594A2 2 0 0 1 15.615 22H8.386a2 2 0 0 1-1.997-1.883L5.59 6.5h12.69zH5.5zM9 9l.5 9H11l-.4-9zm4.5 0l-.5 9h1.5l.5-9zm-2.646-7.871l3.94.694a.5.5 0 0 1 .405.58l-.174.984l-4.924-.868l.174-.985a.5.5 0 0 1 .58-.405z")`;
                                                }
                                            }}
                                            onMouseLeave={() => {
                                                if (pathRef.current) {
                                                    pathRef.current.style.d = "";
                                                }
                                            }}
                                            className="flex p-2.5 bg-background text-foreground hover:text-warning ring-2 ring-card-background rounded-full transition-colors duration-500 ease-in-out cursor-pointer shadow-lg"
                                            title="Remove photo"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                                <path
                                                    ref={pathRef}
                                                    fill="currentColor"
                                                    fillRule="evenodd"
                                                    className='transition-all duration-300 ease-in-out'
                                                    d="m18.412 6.5l-.801 13.617A2 2 0 0 1 15.614 22H8.386a2 2 0 0 1-1.997-1.883L5.59 6.5H3.5v-1A.5.5 0 0 1 4 5h16a.5.5 0 0 1 .5.5v1zM10 2.5h4a.5.5 0 0 1 .5.5v1h-5V3a.5.5 0 0 1 .5-.5M9 9l.5 9H11l-.4-9zm4.5 0l-.5 9h1.5l.5-9z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="w-full sm:w-auto space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-muted/60 mb-1.5 pl-2 tracking-wider uppercase">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 border border-border/80 rounded-2xl outline-none bg-background/50 focus:border-accent transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted/60 mb-1.5 pl-2 tracking-wider uppercase">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40 font-bold">@</span>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            className="w-full pl-8 pr-4 py-3 border border-border/80 rounded-2xl outline-none font-mono bg-background/50 focus:border-accent transition-colors"
                                            placeholder="username"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted/50 font-mono mt-1.5 ml-2">Only lowercase letters, numbers, and hyphens.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5 pl-2">
                                <label className="block text-sm font-medium text-muted/60 tracking-wider uppercase">Portfolio &amp; Socials</label>
                                {socialLinks.length < 4 && (
                                    <button
                                        type="button"
                                        onClick={() => setSocialLinks(prev => [...prev, ''])}
                                        className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus size={14} /> Add another social
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {/* Personal Website */}
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32">
                                            <g fill="currentColor">
                                                <path d="M27.527 4.318c-3.09-3.09-8.12-3.09-11.21 0l-4 4q-.34.345-.63.72a9.1 9.1 0 0 1 3.84-.131q.387.068.77.17l.009.062l2.421-2.421a4.52 4.52 0 0 1 6.4 0c1.76 1.77 1.77 4.64 0 6.4l-4 4c-.76.76-1.73 1.17-2.72 1.28c-1.31.14-2.68-.27-3.68-1.28a4.5 4.5 0 0 1-1.24-2.417a3.25 3.25 0 0 0-1.886.91l-1.086 1.087a7.9 7.9 0 0 0 1.812 2.82a7.86 7.86 0 0 0 4.21 2.19a7.99 7.99 0 0 0 7-2.2l4-4c3.08-3.07 3.08-8.1-.01-11.19" />
                                                <path d="M19.528 23.538q.35-.356.646-.742a9.25 9.25 0 0 1-3.851.143h-.001a9 9 0 0 1-.83-.186l-2.375 2.375a4.52 4.52 0 0 1-6.4 0a4.52 4.52 0 0 1 0-6.4l4-4c.76-.76 1.73-1.17 2.72-1.28c1.31-.14 2.68.27 3.68 1.28a4.5 4.5 0 0 1 1.242 2.416a3.25 3.25 0 0 0 1.885-.91l1.086-1.087a7.9 7.9 0 0 0-1.812-2.82a7.86 7.86 0 0 0-4.21-2.19a7.9 7.9 0 0 0-4.61.56c-.86.38-1.67.92-2.38 1.63l-4 4c-3.09 3.09-3.09 8.12 0 11.21s8.12 3.09 11.21 0z" />
                                            </g>
                                        </svg>
                                    </span>
                                    <input
                                        type="url"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-border/80 rounded-2xl outline-none bg-background/50 focus:border-accent transition-colors"
                                        placeholder="Personal Website URL"
                                    />
                                </div>

                                {/* Dynamic Social Links List */}
                                {socialLinks.map((link, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/60 flex items-center justify-center">
                                                {getSocialIcon(link)}
                                            </span>
                                            <input
                                                type="url"
                                                value={link}
                                                onChange={(e) => {
                                                    const updated = [...socialLinks];
                                                    updated[idx] = e.target.value;
                                                    setSocialLinks(updated);
                                                }}
                                                className="w-full pl-11 pr-4 py-3 border border-border/80 rounded-2xl outline-none bg-background/50 focus:border-accent transition-colors"
                                                placeholder="Social link (Instagram, Behance, Twitter/X, LinkedIn...)"
                                            />
                                        </div>
                                        {socialLinks.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSocialLinks(prev => prev.filter((_, i) => i !== idx));
                                                }}
                                                className="p-3 text-muted hover:text-warning hover:bg-foreground/5 rounded-2xl transition-colors cursor-pointer shrink-0"
                                                title="Remove social link"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted/60 mb-1.5 pl-2 tracking-wider uppercase">Donations</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40 font-bold">paypal.me/</span>
                                <input
                                    type="text"
                                    value={paypalMe}
                                    onChange={(e) => setPaypalMe(e.target.value)}
                                    className="w-full pl-28 pr-4 py-3 border border-border/80 rounded-2xl outline-none bg-background/50 focus:border-accent transition-colors"
                                    placeholder="username"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 bg-foreground text-background text-lg rounded-xl hover:opacity-90 transition-all duration-300 ease-in-out shadow-lg disabled:opacity-50 font-inter-tight font-medium tracking-wider cursor-pointer"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
                <div
                    className="fixed inset-0 z-210 flex items-center justify-center p-4 bg-foreground/15 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setShowAvatarModal(false)}
                >
                    <div
                        className="bg-card-background border border-border/80 rounded-4xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-border/40 pb-4">
                            <div>
                                <h3 className="text-2xl font-inter-tight font-medium tracking-wide text-foreground">
                                    Profile Picture
                                </h3>
                                <p className="text-xs text-muted/70 mt-0.5">
                                    Keep your email photo, pick a preset avatar, or upload custom.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAvatarModal(false)}
                                className="p-2 flex items-center justify-center rounded-full hover:bg-foreground/8 transition-colors text-muted hover:text-foreground cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Option 1: Default Image of User's Email ID */}
                        <div className="space-y-2">
                            <span className="block text-xs font-semibold text-muted/60 tracking-wider uppercase pl-1">
                                Email Account Default Photo
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setAvatarUrlChoice(emailDefaultAvatar);
                                    setAvatarFile(null);
                                    setAvatarPreview(null);
                                    setAvatarRemoved(false);
                                    setShowAvatarModal(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-4 p-3 rounded-2xl border transition-all text-left cursor-pointer",
                                    currentDisplayAvatar === emailDefaultAvatar
                                        ? "border-accent bg-accent/5 ring-2 ring-accent/30"
                                        : "border-border/80 hover:border-foreground/30 hover:bg-foreground/4"
                                )}
                            >
                                <img
                                    src={emailDefaultAvatar}
                                    alt="Email default avatar"
                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-border shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground text-sm">
                                            Keep Your Default Email ID Profile Pic
                                        </span>
                                        {currentDisplayAvatar === emailDefaultAvatar && (
                                            <span className="text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted truncate mt-0.5">
                                        {user?.email || 'Default profile image'}
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Option 2: Provided Avatars from NoBadFonts */}
                        <div className="space-y-2">
                            <span className="block text-xs font-semibold text-muted/60 tracking-wider uppercase pl-1">
                                NoBadFonts Avatars
                            </span>
                            <div className="grid grid-cols-4 gap-2.5">
                                {NOBADFONTS_AVATARS.map((url, idx) => {
                                    const isSelected = currentDisplayAvatar === url;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setAvatarUrlChoice(url);
                                                setAvatarFile(null);
                                                setAvatarPreview(null);
                                                setAvatarRemoved(false);
                                                setShowAvatarModal(false);
                                            }}
                                            className={cn(
                                                "aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 p-1 bg-background/50 cursor-pointer",
                                                isSelected
                                                    ? "border-accent shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
                                                    : "border-border/60 hover:border-foreground/30"
                                            )}
                                            title={`NoBadFonts Avatar ${idx + 1}`}
                                        >
                                            <img
                                                src={url}
                                                alt={`Avatar ${idx + 1}`}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Option 3: Custom Profile Image */}
                        <div className="space-y-2 pt-2 border-t border-border/40">
                            <span className="block text-xs font-semibold text-muted/60 tracking-wider uppercase pl-1">
                                Custom Profile Image
                            </span>
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-accent hover:text-accent text-foreground transition-all duration-200 cursor-pointer bg-background/40 hover:bg-accent/5 font-medium text-sm group"
                            >
                                <Upload size={18} className="text-muted group-hover:text-accent transition-colors" />
                                <span>Upload photo from your device</span>
                            </button>
                            <p className="text-[11px] text-muted/50 text-center">
                                Supports JPG, PNG, WebP or GIF
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Unsaved Changes Confirmation Modal (matches site UI) */}
            {showUnsavedWarning && (
                <div className="fixed inset-0 z-210 flex items-center justify-center p-4 bg-foreground/10 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card-background border border-border/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
                        <h3 className="text-xl font-bold text-foreground">Unsaved Changes</h3>
                        <p className="text-sm text-muted">
                            You have unsaved changes. Are you sure you want to discard them and close?
                        </p>
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => setShowUnsavedWarning(false)}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-border/80 text-foreground font-medium text-sm hover:bg-foreground/5 transition-colors cursor-pointer"
                            >
                                Keep Editing
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUnsavedWarning(false);
                                    onCancel();
                                }}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-warning text-background font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
    return createPortal(modal, document.body);
}
