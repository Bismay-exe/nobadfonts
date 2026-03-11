import { useState } from 'react';
import { Settings, LogOut, Globe, Twitter, Instagram, Linkedin, Coffee, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileHeaderProps {
    onEditClick: () => void;
    isEditing: boolean;
}

export default function ProfileHeader({ onEditClick, isEditing }: ProfileHeaderProps) {
    const { user, profile, signOut } = useAuth();

    const [isExpanded, setIsExpanded] = useState(false);

    if (!user) return null;

    const bioLines = profile?.bio ? profile.bio.split('\n').length : 0;
    const showReadMore = (profile?.bio && profile.bio.length > 150) || bioLines > 5;

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar */}
                <div className="w-48 h-48 rounded-full flex items-center justify-center text-3xl font-bold text-white/80 overflow-hidden shrink-0">
                    <img src='/profile/profile.png' alt="User" className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="grow text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-2">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-bold text-white/85">{profile?.full_name || 'Fontique User'}</h1>
                            {profile?.username && (
                                <p className="text-white/60 font-mono text-sm">@{profile.username}</p>
                            )}
                            <p className="text-white/60 text-sm">{user.email}</p>

                            {/* Social Links */}
                            <div className="flex flex-wrap gap-3 mt-3 justify-center md:justify-start">
                                {profile?.website && (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full border border-white/10 hover:border-black transition-colors text-gray-600 hover:text-black hover:-translate-y-1 hover:shadow-md">
                                        <Globe size={18} />
                                    </a>
                                )}
                                {profile?.behance && (
                                    <a href={profile.behance} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full border border-white/10 hover:border-black transition-colors text-gray-600 hover:text-[#1769ff] hover:-translate-y-1 hover:shadow-md">
                                        <Palette size={18} />
                                    </a>
                                )}
                                {profile?.twitter && (
                                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full border border-white/10 hover:border-black transition-colors text-gray-600 hover:text-[#1DA1F2] hover:-translate-y-1 hover:shadow-md">
                                        <Twitter size={18} />
                                    </a>
                                )}
                                {profile?.instagram && (
                                    <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full border border-white/10 hover:border-black transition-colors text-[#E1306C] hover:-translate-y-1 hover:shadow-md">
                                        <Instagram size={18} />
                                    </a>
                                )}
                                {profile?.linkedin && (
                                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full border border-white/10 hover:border-black transition-colors text-gray-600 hover:text-[#0077b5] hover:-translate-y-1 hover:shadow-md">
                                        <Linkedin size={18} />
                                    </a>
                                )}
                                {profile?.paypal_me && (
                                    <a href={`https://paypal.me/${profile.paypal_me}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-50 rounded-full border border-indigo-200 hover:border-indigo-600 transition-colors text-indigo-600 hover:text-indigo-700 hover:-translate-y-1 hover:shadow-md ml-2" title="Donation Link Active">
                                        <Coffee size={18} />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onEditClick}
                                className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/10 rounded-lg hover:bg-gray-50 hover:text-black transition-colors text-sm font-medium"
                            >
                                <Settings size={16} />
                                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                            </button>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-500/15 border border-red-500/15 text-red-500 rounded-lg hover:bg-red-600/30 hover:text-red-300 transition-colors text-sm font-medium"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>

                    {profile?.bio && (
                        <div>
                            <p className={`text-white/80 mt-2 max-w-2xl whitespace-pre-wrap ${!isExpanded ? 'line-clamp-5' : ''}`}>
                                {profile.bio}
                            </p>
                            {showReadMore && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-sm font-bold text-gray-500 hover:text-black mt-1"
                                >
                                    {isExpanded ? 'Show less' : '...more'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
