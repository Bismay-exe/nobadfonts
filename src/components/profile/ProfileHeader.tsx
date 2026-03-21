import { useState, memo } from 'react';
import { Settings, LogOut, Globe, Twitter, Instagram, Linkedin, Coffee, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileHeaderProps {
    onEditClick: () => void;
    isEditing: boolean;
}

export default memo(function ProfileHeader({ onEditClick, isEditing }: ProfileHeaderProps) {
    const { user, profile, signOut } = useAuth();

    const [isExpanded, setIsExpanded] = useState(false);

    if (!user) return null;

    const bioLines = profile?.bio ? profile.bio.split('\n').length : 0;
    const showReadMore = (profile?.bio && profile.bio.length > 150) || bioLines > 5;

    return (
        <div className="py-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar */}
                <div className="w-48 h-48 rounded-full flex items-center justify-center text-3xl font-bold text-[rgb(var(--color-foreground)/0.8)] overflow-hidden shrink-0">
                    <img src='/profile/profile.png' alt="User" className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="grow text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-2">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-bold text-[rgb(var(--color-foreground)/0.85)]">{profile?.full_name || 'Fontique User'}</h1>
                            {profile?.username && (
                                <p className="text-[rgb(var(--color-muted-foreground))] font-mono text-sm">@{profile.username}</p>
                            )}
                            <p className="text-[rgb(var(--color-muted-foreground))] text-sm">{user.email}</p>

                            {/* Social Links */}
                            <div className="flex flex-wrap gap-3 mt-3 justify-center md:justify-start">
                                {profile?.website && (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-muted)/0.1)] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] hover:-translate-y-1 hover:shadow-md">
                                        <Globe size={18} />
                                    </a>
                                )}
                                {profile?.behance && (
                                    <a href={profile.behance} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-muted)/0.1)] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[rgb(var(--color-muted-foreground))] hover:text-[#1769ff] hover:-translate-y-1 hover:shadow-md">
                                        <Palette size={18} />
                                    </a>
                                )}
                                {profile?.twitter && (
                                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-muted)/0.1)] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[rgb(var(--color-muted-foreground))] hover:text-[#1DA1F2] hover:-translate-y-1 hover:shadow-md">
                                        <Twitter size={18} />
                                    </a>
                                )}
                                {profile?.instagram && (
                                    <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-muted)/0.1)] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[#E1306C] hover:-translate-y-1 hover:shadow-md">
                                        <Instagram size={18} />
                                    </a>
                                )}
                                {profile?.linkedin && (
                                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-muted)/0.1)] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[rgb(var(--color-muted-foreground))] hover:text-[#0077b5] hover:-translate-y-1 hover:shadow-md">
                                        <Linkedin size={18} />
                                    </a>
                                )}
                                {profile?.paypal_me && (
                                    <a href={`https://paypal.me/${profile.paypal_me}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-accent)/0.1)] rounded-full border border-[rgb(var(--color-accent)/0.2)] hover:border-[rgb(var(--color-accent))] transition-colors text-[rgb(var(--color-accent))] hover:brightness-110 hover:-translate-y-1 hover:shadow-md ml-2" title="Donation Link Active">
                                        <Coffee size={18} />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onEditClick}
                                className="flex items-center space-x-2 px-4 py-2 bg-[rgb(var(--color-muted)/0.1)] border border-[rgb(var(--color-border))] rounded-lg hover:bg-[rgb(var(--color-muted)/0.2)] hover:text-[rgb(var(--color-foreground))] transition-colors text-sm font-medium"
                            >
                                <Settings size={16} />
                                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                            </button>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center space-x-2 px-4 py-2 bg-[rgb(var(--color-destructive)/0.15)] border border-[rgb(var(--color-destructive)/0.15)] text-[rgb(var(--color-destructive))] rounded-lg hover:bg-[rgb(var(--color-destructive)/0.3)] hover:brightness-110 transition-colors text-sm font-medium"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>

                    {profile?.bio && (
                        <div>
                            <p className={`text-[rgb(var(--color-foreground)/0.8)] mt-2 max-w-2xl whitespace-pre-wrap ${!isExpanded ? 'line-clamp-5' : ''}`}>
                                {profile.bio}
                            </p>
                            {showReadMore && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-sm font-bold text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] mt-1"
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
});
