import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import { motion } from 'framer-motion';
import ProfileHeader from '../components/profile/ProfileHeader';
import SettingsForm from '../components/profile/SettingsForm';
import SEO from '../components/shared/SEO';

export default function Profile() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'favorites' | 'downloads' | 'settings' | 'analytics'>('favorites');
    const [isEditing, setIsEditing] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    const handleRequestAccess = useCallback(async () => {
        if (!user) return;
        setRequestLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ membership_status: 'pending' })
                .eq('id', user.id);

            if (error) throw error;
            await refreshProfile();
        } catch (error) {
            console.error('Error requesting access:', error);
            await Toast.show({ text: 'Failed to request access. Please try again.', duration: 'short' });
        } finally {
            setRequestLoading(false);
        }
    }, [user, refreshProfile]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                if (activeTab === 'favorites') {
                    const { error } = await supabase
                        .from('favorites')
                        .select('font_id, fonts (*, font_variants(*))')
                        .eq('user_id', user.id);

                    if (error) throw error;
                    // Format data: Extract the font object from the joined response
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
            }
        };

        fetchData();
    }, [user, activeTab]);

    const handleEditClick = useCallback(() => {
        setIsEditing(prev => {
            const next = !prev;
            if (next) setActiveTab('settings');
            else setActiveTab('favorites');
            return next;
        });
    }, []);

    if (loading) return <div className="w-screen h-screen flex justify-center items-center bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]">Loading...</div>;
    if (!user) return <Navigate to="/auth" replace />;

    return (
        <>
            <div className="relative flex flex-col gap-4">
                <SEO title="User Profile | NoBadFonts" noindex url="/profile" />

                <div className={`fixed left-0 top-0 righ-0 w-full zrounded-t-4xl overflow-hidden ${isEditing ? 'hidden' : 'hidden'}`}>
                    <img src="https://img.magnific.com/free-photo/side-view-asian-model-close-up_23-2148239994.jpg?t=st=1790712645~exp=1790716245~hmac=5c9dfd9224f63db4a7494e92f3ac4441725c3aeaeed577a2064225bda8e8fbe9&w=1480" alt="" className='w-full min-h-[50vh] max- h-screen zh-full object-cover zobject-top' />
                    {/* <div className="hidden absolute inset-0 w-full h-full backdrop-blur-md mask-[linear-gradient(to_bottom,transparent_0%,black_70%,black_100%)] bg-linear-to-b from-transparent zvia-[rgb(var(--color-background)/0.7)] to-[rgb(var(--color-background))]" /> */}
                    <div className="absolute inset-0 w-full h-full backdrop-blur-3xl mask-[linear-gradient(to_bottom,transparent_0%,black_70%,black_100%)]"
                        style={{
                            backgroundImage: `
                            url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://w3.org"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="2.8" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.04"/%3E%3C/svg%3E'), 
                            linear-gradient(to bottom, transparent, rgb(var(--color-background) / 0.7), rgb(var(--color-background)))
                        `
                        }}
                    />
                </div>

                <ProfileHeader isEditing={isEditing} onEditClick={handleEditClick} />

                <div>
                    {/* Membership Status Section */}
                    {!isEditing && profile?.role === 'user' && (
                        <div className="bg-[rgb(var(--color-foreground)/0.1)] border border-[rgb(var(--color-foreground)/0.1)] rounded-4xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black uppercase">Become a Contributor</h3>
                                <p className="text-[rgb(var(--color-muted-foreground))] font-medium">
                                    {profile.membership_status === 'pending'
                                        ? "Your request is under review by our admins."
                                        : profile.membership_status === 'rejected'
                                            ? "Your previous request was not approved."
                                            : "Upload some fonts and share them with the community."
                                    }
                                </p>
                            </div>

                            {profile.membership_status === 'pending' ? (
                                <div className="px-6 py-3 bg-[rgb(var(--color-muted))] text-[rgb(var(--color-muted-foreground))] font-bold rounded-xl border-2 border-[rgb(var(--color-border))] uppercase tracking-wide">
                                    Request Pending
                                </div>
                            ) : (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        await Haptics.impact({ style: ImpactStyle.Medium });
                                        handleRequestAccess();
                                    }}
                                    disabled={requestLoading}
                                    className="px-6 py-3 bg-[rgb(var(--color-highlight))] hover:opacity-80 text-[rgb(var(--color-background))] font-black uppercase rounded-xl border-2 border-[rgb(var(--color-background))] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(rgb(var(--color-background)),1)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {requestLoading ? 'Requesting...' : (profile.membership_status === 'rejected' ? 'Request Again' : 'Request Access')}
                                </motion.button>
                            )}
                        </div>
                    )}

                    {/* {!isEditing && (
                    <FontGrid
                        fonts={favorites}
                        loading={dataLoading}
                        emptyMessage="You haven't favorited any fonts yet."
                    />
                )} */}

                    {/* {(isEditing || activeTab === 'settings') && (
                    <SettingsForm onCancel={() => {
                        setIsEditing(false);
                        setActiveTab('favorites');
                    }} />
                )} */}

                </div>
            </div>

            <div className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out ${isEditing ? ' z-10 ztranslate-y-0 bg-[rgb(var(--color-foreground)/0.3)] backdrop-blur-sm opacity-100 scale-100' : '-z-10 ztranslate-y-400 bg-transparent opacity-0 zscale-0'}`}>
            <div className={`${isEditing ? 'scale-100' : 'scale-0'} transition-all duration-300 ease-in-out`}>
                <SettingsForm onCancel={() => {
                    setIsEditing(false);
                    setActiveTab('favorites');
                }} />
            </div>
            </div>

        </>
    );
}