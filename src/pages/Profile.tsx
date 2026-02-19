import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ProfileHeader from '../components/profile/ProfileHeader';
import FontGrid from '../components/profile/FontGrid';
import SettingsForm from '../components/profile/SettingsForm';
import AnalyticsDashboard from '../components/profile/AnalyticsDashboard';
import type { Font } from '../types/font';
import { Type, Image as ImageIcon, Heart, Download as DownloadIcon, BarChart2 } from 'lucide-react';
import SEO from '../components/shared/SEO';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'favorites' | 'downloads' | 'settings' | 'analytics'>('favorites');
    const [isEditing, setIsEditing] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');

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
            alert('Failed to request access. Please try again.');
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
                    const formattedFonts = data?.map((item: any) => item.fonts) as Font[];
                    setFavorites(formattedFonts || []);
                } else if (activeTab === 'downloads') {
                    const { data, error } = await supabase
                        .from('downloads')
                        .select('font_id, fonts (*)')
                        .eq('user_id', user.id)
                        .order('downloaded_at', { ascending: false });

                    if (error) throw error;
                    const fontsList = data?.map((item: any) => item.fonts) as Font[];
                    const uniqueFonts = Array.from(new Map(fontsList?.map(item => [item['id'], item])).values());
                    setDownloads(uniqueFonts || []);
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

    const tabs = [
        { id: 'favorites', label: 'Favorites', icon: Heart, color: 'text-red-500' },
        { id: 'downloads', label: 'Downloads', icon: DownloadIcon, color: 'text-[#BDF522]' },
        { id: 'analytics', label: 'Analytics', icon: BarChart2, color: 'text-[#FF90E8]' }
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
            <SEO title="My Profile" />

            <ProfileHeader isEditing={isEditing} onEditClick={handleEditClick} />

            {/* Membership Status Section */}
            {!isEditing && profile?.role === 'user' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black uppercase text-white mb-2">Become a Creator</h3>
                        <p className="text-zinc-400 font-medium max-w-xl">
                            {profile.membership_status === 'pending'
                                ? "Your request is under review by our admins. Hang tight!"
                                : profile.membership_status === 'rejected'
                                    ? "Your request was unfortunately not approved at this time."
                                    : "Join our community of designers. Upload your fonts and share them with the world."
                            }
                        </p>
                    </div>

                    <div className="relative z-10">
                        {profile.membership_status === 'pending' ? (
                            <div className="px-6 py-3 bg-yellow-500/10 text-yellow-500 font-bold rounded-xl border border-yellow-500/30 uppercase tracking-wilder flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                Request Pending
                            </div>
                        ) : (
                            <button
                                onClick={handleRequestAccess}
                                disabled={requestLoading}
                                className="px-8 py-4 bg-[#BDF522] text-black font-black uppercase rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(189,245,34,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {requestLoading ? 'Requesting...' : (profile.membership_status === 'rejected' ? 'Request Again' : 'Request Access')}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {!isEditing ? (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Tab Navigation */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                            <div className="flex p-1 bg-zinc-900 border border-white/10 rounded-full">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all uppercase tracking-wider",
                                            activeTab === tab.id
                                                ? "bg-white text-black shadow-lg"
                                                : "text-zinc-500 hover:text-white"
                                        )}
                                    >
                                        <tab.icon size={16} className={activeTab === tab.id ? tab.color : ""} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab !== 'analytics' && (
                                <div className="flex bg-zinc-900 p-1 rounded-full border border-white/10">
                                    <button
                                        onClick={() => setViewMode('font')}
                                        className={cn(
                                            "p-3 rounded-full transition-all",
                                            viewMode === 'font' ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                                        )}
                                        title="Font View"
                                    >
                                        <Type size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('image')}
                                        className={cn(
                                            "p-3 rounded-full transition-all",
                                            viewMode === 'image' ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                                        )}
                                        title="Image View"
                                    >
                                        <ImageIcon size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Content Area */}

                        {activeTab === 'favorites' && (
                            <FontGrid
                                fonts={favorites}
                                loading={dataLoading}
                                emptyMessage="You haven't favorited any fonts yet."
                                viewMode={viewMode}
                            />
                        )}

                        {activeTab === 'downloads' && (
                            <FontGrid
                                fonts={downloads}
                                loading={dataLoading}
                                emptyMessage="You haven't downloaded any fonts yet."
                                viewMode={viewMode}
                            />
                        )}

                        {activeTab === 'analytics' && (
                            <AnalyticsDashboard />
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <SettingsForm onCancel={() => {
                            setIsEditing(false);
                            setActiveTab('favorites');
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
