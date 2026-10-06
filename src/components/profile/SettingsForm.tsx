import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsForm({ isOpen, onCancel }: { isOpen?: boolean, onCancel: () => void }) {
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
    const overlayRef = useRef<HTMLDivElement>(null);

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

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
    }, [user, fullName, username, bio, website, behance, twitter, instagram, linkedin, paypalMe, refreshProfile, onCancel]);

    if (isOpen === false) return null;

    const modal = (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-200 flex items-center justify-center p-4 md:p-6 font-inter-tight tracking-wide"
            onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-foreground/5 backdrop-blur-sm" />

            {/* Panel */}
            <div className="relative w-full max-w-xl bg-background/80 backdrop-blur-2xl rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-border/40">
                  <div className="flex items-center justify-between text-3xl font-inter-tight font-medium tracking-wide">
                    <h2 className="text-foreground ml-3">Edit Profile</h2>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="p-2 flex items-center justify-center rounded-full hover:bg-foreground/8 transition-colors duration-300 ease-in-out text-muted hover:text-foreground"
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

                        <div>
                            <div className="flex justify-between items-center mb-1.5 px-2">
                                <label className="block text-sm font-medium text-muted/60 tracking-wider uppercase">Bio</label>
                                <span className={`text-xs ${bio.length === 150 ? 'text-warning font-bold' : 'text-muted/50'}`}>
                                    {bio.length}/150
                                </span>
                            </div>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                maxLength={150}
                                className="w-full px-4 py-3 border border-border/80 rounded-2xl outline-none resize-none bg-background/50 focus:border-accent transition-colors"
                                placeholder="Tell us a bit about yourself..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted/60 mb-1.5 pl-2 tracking-wider uppercase">Portfolio & Socials</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full px-4 py-3 border border-border/80 rounded-2xl outline-none bg-background/50 focus:border-accent transition-colors"
                                    placeholder="Personal Website URL"
                                />
                                <input
                                    type="url"
                                    value={behance}
                                    onChange={(e) => setBehance(e.target.value)}
                                    className="w-full px-4 py-3 border border-border/80 rounded-2xl outline-none bg-background/50 focus:border-accent transition-colors"
                                    placeholder="Behance URL"
                                />
                                <input
                                    type="url"
                                    value={twitter}
                                    onChange={(e) => setTwitter(e.target.value)}
                                    className="w-full px-4 py-3 border border-border/80 rounded-2xl outline-none bg-background/50 focus:border-accent transition-colors"
                                    placeholder="Twitter/X URL"
                                />
                                <input
                                    type="url"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    className="w-full px-4 py-3 border border-border/80 rounded-2xl outline-none bg-background/50 focus:border-accent transition-colors"
                                    placeholder="Instagram URL"
                                />
                                <input
                                    type="url"
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                    className="w-full px-4 py-3 border border-border/80 rounded-2xl outline-none bg-background/50 focus:border-accent transition-colors"
                                    placeholder="LinkedIn URL"
                                />
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
                            {/* <button
                                type="button"
                                onClick={onCancel}
                                disabled={loading}
                                className="px-6 py-2.5 text-muted hover:bg-foreground/5 rounded-xl transition-colors duration-300 ease-in-out font-medium"
                            >
                                Cancel
                            </button> */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 bg-foreground text-background text-lg rounded-xl hover:opacity-90 transition-all duration-300 ease-in-out shadow-lg disabled:opacity-50 font-inter-tight font-medium tracking-wider"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
    return createPortal(modal, document.body);
}
