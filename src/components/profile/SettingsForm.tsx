import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsForm({ onCancel }: { onCancel: () => void }) {
    const { user, profile, refreshProfile } = useAuth();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [username, setUsername] = useState(profile?.username || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            // 1. Update public profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    username: username,
                    bio: bio,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Sync with Auth User Metadata (so it shows in Supabase Auth dashboard)
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (authError) {
                console.warn('Failed to sync auth metadata:', authError);
                // We don't throw here to avoid failing the UI if just metadata sync fails
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Refresh profile data in context
            await refreshProfile();

            // Allow user to see success message briefly before closing/reloading if desired
            setTimeout(() => {
                onCancel();
            }, 1000);

        } catch (err: any) {
            if (err.code === '23505') { // Unique violation
                setMessage({ type: 'error', text: 'Username already taken. Please choose another one.' });
            } else {
                setMessage({ type: 'error', text: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border-b-2 border-black p-8 mx-auto">
            <h2 className="text-xl font-bold mb-6">Edit Profile</h2>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            placeholder="username"
                            required
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-2">Only lowercase letters, numbers, and hyphens.</p>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <span className={`text-xs ${bio.length === 150 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                            {bio.length}/150
                        </span>
                    </div>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        maxLength={150}
                        className="w-full px-4 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Tell us a bit about yourself..."
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-2xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-black text-white rounded-2xl hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
