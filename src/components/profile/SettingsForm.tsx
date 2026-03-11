import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsForm({ onCancel }: { onCancel: () => void }) {
    const { user, profile, refreshProfile } = useAuth();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [username, setUsername] = useState(profile?.username || '');
    const [bio, setBio] = useState(profile?.bio || '');

    // Social & Info
    const [website, setWebsite] = useState(profile?.website || '');
    const [behance, setBehance] = useState(profile?.behance || '');
    const [twitter, setTwitter] = useState(profile?.twitter || '');
    const [instagram, setInstagram] = useState(profile?.instagram || '');
    const [linkedin, setLinkedin] = useState(profile?.linkedin || '');
    const [paypalMe, setPaypalMe] = useState(profile?.paypal_me || '');

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
                    website: website,
                    behance: behance,
                    twitter: twitter,
                    instagram: instagram,
                    linkedin: linkedin,
                    paypal_me: paypalMe,
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
        <div className="bg-white/5 rounded-xl md:rounded-4xl shadow-sm border border-white/5 p-2 md:p-4 lg:p-8 mx-auto">
            <h2 className="text-xl md:text-2xl font-bold my-6 px-2 text-center">Edit Profile</h2>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white/20 mb-1 pl-2">Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-white/10 rounded-xl outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/20 mb-1 pl-2">Username</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className="w-full pl-8 pr-4 py-2 border border-white/10 rounded-xl outline-none font-mono"
                            placeholder="username"
                            required
                        />
                    </div>
                    <p className="text-xs text-white/30 font-mono mt-1 ml-2">Only lowercase letters, numbers, and hyphens.</p>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1 px-2">
                        <label className="block text-sm font-medium text-white/20">Bio</label>
                        <span className={`text-xs ${bio.length === 150 ? 'text-red-500 font-bold' : 'text-white/40'}`}>
                            {bio.length}/150
                        </span>
                    </div>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        maxLength={150}
                        className="w-full px-4 py-2 border border-white/10 rounded-xl outline-none resize-none"
                        placeholder="Tell us a bit about yourself..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/20 mb-1 pl-2">Portfolio & Socials</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full px-4 py-2 border border-white/10 rounded-xl outline-none"
                            placeholder="Personal Website URL"
                        />
                        <input
                            type="url"
                            value={behance}
                            onChange={(e) => setBehance(e.target.value)}
                            className="w-full px-4 py-2 border border-white/10 rounded-xl outline-none"
                            placeholder="Behance URL"
                        />
                        <input
                            type="url"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            className="w-full px-4 py-2 border border-white/10 rounded-xl outline-none"
                            placeholder="Twitter/X URL"
                        />
                        <input
                            type="url"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className="w-full px-4 py-2 border border-white/10 rounded-xl outline-none"
                            placeholder="Instagram URL"
                        />
                        <input
                            type="url"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            className="w-full px-4 py-2 border border-white/10 rounded-xl outline-none"
                            placeholder="LinkedIn URL"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/20 mb-1 pl-2">Donations</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">paypal.me/</span>
                        <input
                            type="text"
                            value={paypalMe}
                            onChange={(e) => setPaypalMe(e.target.value)}
                            className="w-full pl-28 pr-4 py-2 border rounded-xl outline-none border-white/10"
                            placeholder="username"
                        />
                    </div>
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
