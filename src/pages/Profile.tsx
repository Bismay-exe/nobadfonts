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
import { App } from '@capacitor/app';
import { Info, RefreshCw } from 'lucide-react';
import type { Font } from '../types/font';

export default function Profile() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'favorites' | 'downloads' | 'settings' | 'analytics' | 'about'>('favorites');
    const [appInfo, setAppInfo] = useState<{ version: string; build: string }>({ version: '...', build: '...' });
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

        const fetchAppInfo = async () => {
            const info = await App.getInfo();
            setAppInfo({ version: info.version, build: info.build });
        };

        fetchData();
        fetchAppInfo();
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                                await Haptics.impact({ style: ImpactStyle.Light });
                                setActiveTab('favorites');
                            }}
                            className={`px-6 py-4 text-lg font-bold border border-[rgb(var(--color-background))] rounded-2xl transition-colors ${activeTab === 'favorites'
                                ? 'bg-[rgb(var(--color-gold-1))] text-black'
                                : 'bg-[rgb(var(--color-surface,var(--color-muted)))]'
                                }`}
                        >
                            Favorites
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                                await Haptics.impact({ style: ImpactStyle.Light });
                                setActiveTab('analytics');
                            }}
                            className={`px-6 py-4 text-lg font-bold border border-[rgb(var(--color-background))] rounded-2xl transition-colors ${activeTab === 'analytics'
                                ? 'bg-[rgb(var(--color-accent))] text-white'
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
                            className={`px-6 py-4 text-lg font-bold border border-[rgb(var(--color-background))] rounded-2xl transition-colors ${activeTab === 'downloads'
                                ? 'bg-[rgb(189_245_34)] text-black' 
                                : 'bg-[rgb(var(--color-surface,var(--color-muted)))]'
                                }`}
                        >
                            Downloads
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                                await Haptics.impact({ style: ImpactStyle.Light });
                                setActiveTab('about');
                            }}
                            className={`px-6 py-4 text-lg font-bold border border-[rgb(var(--color-background))] rounded-2xl transition-colors ${activeTab === 'about'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                : 'bg-[rgb(var(--color-surface,var(--color-muted)))]'
                                }`}
                        >
                            About
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

                    {activeTab === 'about' && (
                        <div className="pt-8 px-4 flex flex-col items-center gap-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                                <Info className="w-12 h-12 text-white" />
                            </div>
                            
                            <div className="text-center">
                                <h3 className="text-2xl font-black uppercase mb-1">Fontique</h3>
                                <p className="text-[rgb(var(--color-muted-foreground))] font-medium">Professional Font Curator</p>
                            </div>

                            <div className="w-full max-w-sm bg-[rgb(var(--color-foreground)/0.05)] rounded-3xl p-6 border border-[rgb(var(--color-foreground)/0.1)]">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[rgb(var(--color-muted-foreground))] font-bold uppercase text-xs tracking-wider">Version</span>
                                    <span className="font-mono font-bold text-lg">{appInfo.version}</span>
                                </div>
                                <div className="flex justify-between items-center pb-6 border-b border-[rgb(var(--color-foreground)/0.1)]">
                                    <span className="text-[rgb(var(--color-muted-foreground))] font-bold uppercase text-xs tracking-wider">Build</span>
                                    <span className="font-mono font-bold text-lg">{appInfo.build}</span>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        await Haptics.impact({ style: ImpactStyle.Medium });
                                        window.dispatchEvent(new CustomEvent('check-app-update'));
                                    }}
                                    className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-2xl font-black uppercase tracking-wide hover:opacity-90 transition-all shadow-xl"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Check for Updates
                                </motion.button>
                            </div>

                            <p className="text-[rgb(var(--color-muted-foreground))] text-xs font-medium">
                                Made with ❤️ for designers
                            </p>
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
