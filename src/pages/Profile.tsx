import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import { motion } from 'framer-motion';
import ProfileHeader from '../components/profile/ProfileHeader';
import FontGrid from '../components/profile/FontGrid';
import SettingsForm from '../components/profile/SettingsForm';
import AnalyticsDashboard from '../components/profile/AnalyticsDashboard';
import type { Font } from '../types/font';

export default function Profile() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'favorites' | 'downloads' | 'settings' | 'analytics'>('favorites');
    const [isEditing, setIsEditing] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    const [favorites, setFavorites] = useState<Font[]>([]);
    const [downloads, setDownloads] = useState<Font[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    const handleRequestAccess = async () => {
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
    };

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setDataLoading(true);
            try {
                if (activeTab === 'favorites') {
                    const { data, error } = await supabase
                        .from('favorites')
                        .select('font_id, fonts (*)')
                        .eq('user_id', user.id);

                    if (error) throw error;
                    // Format data: Extract the font object from the joined response
                    const formattedFonts = data.map((item: any) => item.fonts) as Font[];
                    setFavorites(formattedFonts);
                } else if (activeTab === 'downloads') {
                    const { data, error } = await supabase
                        .from('downloads')
                        .select('font_id, fonts (*)')
                        .eq('user_id', user.id)
                        .order('downloaded_at', { ascending: false });

                    if (error) throw error;
                    const fontsList = data.map((item: any) => item.fonts) as Font[];
                    const uniqueFonts = Array.from(new Map(fontsList.map(item => [item['id'], item])).values());
                    setDownloads(uniqueFonts);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setDataLoading(false);
            }
        };

        fetchData();
    }, [user, activeTab]);

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/auth" replace />;

    const handleEditClick = () => {
        setIsEditing(!isEditing);
        if (!isEditing) setActiveTab('settings');
        else setActiveTab('favorites');
    };

    return (
        <div className="mx-auto">
            <ProfileHeader isEditing={isEditing} onEditClick={handleEditClick} />

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

            {!isEditing && (
                <>
                    {/* Tabs */}
                    <div className="flex flex-col md:flex-row gap-2 md:gap-0">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                                await Haptics.impact({ style: ImpactStyle.Light });
                                setActiveTab('favorites');
                            }}
                            className={`flex-1 px-6 py-4 text-lg font-bold border-y md:border-r border-[rgb(var(--color-background))] rounded-4xl md:rounded-r-none transition-colors ${activeTab === 'favorites'
                                ? 'bg-[rgb(var(--color-gold-1))]'
                                : 'bg-[rgb(var(--color-surface,var(--color-muted)))]'
                                }`}
                        >
                            My Favorites
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                                await Haptics.impact({ style: ImpactStyle.Light });
                                setActiveTab('analytics');
                            }}
                            className={`flex-1 px-6 py-4 text-lg font-bold border-y md:border-x border-[rgb(var(--color-background))] rounded-4xl md:rounded-none transition-colors ${activeTab === 'analytics'
                                ? 'bg-[rgb(var(--color-accent))]' // Pink to match admin/member vibe
                                : 'bg-[rgb(var(--color-surface,var(--color-muted)))]'
                                }`}
                        >
                            Analytics
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                                await Haptics.impact({ style: ImpactStyle.Light });
                                setActiveTab('downloads');
                            }}
                            className={`flex-1 px-6 py-4 text-lg font-bold border-y border-l rounded-4xl md:rounded-l-none border-[rgb(var(--color-background))] transition-colors ${activeTab === 'downloads'
                                ? 'bg-[rgb(189_245_34)]' // Using raw highlight or success
                                : 'bg-[rgb(var(--color-surface,var(--color-muted)))]'
                                }`}
                        >
                            My Download History
                        </motion.button>
                    </div>

                    {activeTab === 'favorites' && (
                        <FontGrid
                            fonts={favorites}
                            loading={dataLoading}
                            emptyMessage="You haven't favorited any fonts yet."
                        />
                    )}

                    {activeTab === 'downloads' && (
                        <FontGrid
                            fonts={downloads}
                            loading={dataLoading}
                            emptyMessage="You haven't downloaded any fonts yet."
                        />
                    )}

                    {activeTab === 'analytics' && (
                        <div className="pt-8 px-4">
                            <AnalyticsDashboard />
                        </div>
                    )}
                </>
            )}

            {(isEditing || activeTab === 'settings') && (
                <SettingsForm onCancel={() => {
                    setIsEditing(false);
                    setActiveTab('favorites');
                }} />
            )}
        </div>
    );
}
