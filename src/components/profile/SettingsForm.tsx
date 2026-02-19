import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Save } from 'lucide-react';

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
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

            {message && (
                <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Username</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors font-mono"
                            placeholder="username"
                            required
                        />
                    </div>
                    <p className="text-xs text-zinc-600 mt-2">Only lowercase letters, numbers, and hyphens.</p>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Bio</label>
                        <span className={`text-xs ${bio.length === 150 ? 'text-red-500 font-bold' : 'text-zinc-600'}`}>
                            {bio.length}/150
                        </span>
                    </div>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        maxLength={150}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none resize-none transition-colors"
                        placeholder="Tell us a bit about yourself..."
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Portfolio & Socials</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors"
                            placeholder="Personal Website URL"
                        />
                        <input
                            type="url"
                            value={behance}
                            onChange={(e) => setBehance(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors"
                            placeholder="Behance URL"
                        />
                        <input
                            type="url"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors"
                            placeholder="Twitter/X URL"
                        />
                        <input
                            type="url"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors"
                            placeholder="Instagram URL"
                        />
                        <input
                            type="url"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors"
                            placeholder="LinkedIn URL"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Donations</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">paypal.me/</span>
                        <input
                            type="text"
                            value={paypalMe}
                            onChange={(e) => setPaypalMe(e.target.value)}
                            className="w-full bg-blue-500/10 border border-blue-500/30 rounded-xl pl-28 pr-4 py-3 text-white focus:border-blue-500/50 focus:outline-none transition-colors"
                            placeholder="username"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
