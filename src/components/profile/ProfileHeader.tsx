import { useState } from 'react';
import { Settings, LogOut } from 'lucide-react';
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
        <div className="bg-white rounded-3xl shadow-sm border-b-2 border-black p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-100 to-purple-100 flex items-center justify-center text-3xl font-bold text-gray-700 overflow-hidden shrink-0">
                    <img src='/profile/profile.png' alt="User" className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="grow text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mb-2">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'Fontique User'}</h1>
                            {profile?.username && (
                                <p className="text-gray-500 font-mono text-sm">@{profile.username}</p>
                            )}
                            <p className="text-gray-500 text-sm">{user.email}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onEditClick}
                                className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                <Settings size={16} />
                                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                            </button>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center space-x-2 px-4 py-2 border border-red-100 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>

                    {profile?.bio && (
                        <div>
                            <p className={`text-gray-600 mt-2 max-w-2xl whitespace-pre-wrap ${!isExpanded ? 'line-clamp-5' : ''}`}>
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
