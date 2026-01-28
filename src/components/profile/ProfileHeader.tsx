import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileHeaderProps {
    onEditClick: () => void;
    isEditing: boolean;
}

export default function ProfileHeader({ onEditClick, isEditing }: ProfileHeaderProps) {
    const { user, profile, signOut } = useAuth();

    if (!user) return null;

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
                            <p className="text-gray-500">{user.email}</p>
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
                        <p className="text-gray-600 mt-2 max-w-2xl">{profile.bio}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
