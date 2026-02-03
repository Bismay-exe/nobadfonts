import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ProfileHeader from '../components/profile/ProfileHeader';
import FontGrid from '../components/profile/FontGrid';
import SettingsForm from '../components/profile/SettingsForm';
import AnalyticsDashboard from '../components/profile/AnalyticsDashboard';
import type { Font } from '../types/font';
import { Type, Image as ImageIcon } from 'lucide-react';

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
                <div className="bg-white border-y border-black rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black uppercase">Become a Contributor</h3>
                        <p className="text-gray-600 font-medium">
                            {profile.membership_status === 'pending'
                                ? "Your request is under review by our admins."
                                : profile.membership_status === 'rejected'
                                    ? "Your previous request was not approved."
                                    : "Upload some fonts and share them with the community."
                            }
                        </p>
                    </div>

                    {profile.membership_status === 'pending' ? (
                        <div className="px-6 py-3 bg-yellow-100 text-yellow-800 font-bold rounded-xl border-2 border-yellow-400 uppercase tracking-wide">
                            Request Pending
                        </div>
                    ) : (
                        <button
                            onClick={handleRequestAccess}
                            disabled={requestLoading}
                            className="px-6 py-3 bg-[#BDF522] hover:bg-[#a9db1e] text-black font-black uppercase rounded-xl border-2 border-black transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {requestLoading ? 'Requesting...' : (profile.membership_status === 'rejected' ? 'Request Again' : 'Request Access')}
                        </button>
                    )}
                </div>
            )}

            {!isEditing && (
                <>
                    {/* Tabs */}
                    <div className="flex flex-col md:flex-row gap-2 md:gap-0">
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`flex-1 px-6 py-4 text-lg font-bold border-y md:border-r border-black rounded-3xl md:rounded-r-none transition-colors ${activeTab === 'favorites'
                                ? 'bg-[#FFC900]'
                                : 'bg-white'
                                }`}
                        >
                            My Favorites
                        </button>

                        <div className="flex md:flex-col bg-gray-100 p-1 rounded-3xl md:rounded-none border-y border-black items-center justify-center">
                            <button
                                onClick={() => setViewMode('font')}
                                className={`p-3 aspect-square rounded-full transition-all ${viewMode === 'font'
                                    ? 'bg-black text-white shadow-sm'
                                    : 'text-gray-500 hover:text-black'
                                    }`}
                                title="Font View"
                            >
                                <Type size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('image')}
                                className={`p-3 aspect-square rounded-full transition-all ${viewMode === 'image'
                                    ? 'bg-black text-white shadow-sm'
                                    : 'text-gray-500 hover:text-black'
                                    }`}
                                title="Image View"
                            >
                                <ImageIcon size={16} />
                            </button>
                        </div>

                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex-1 px-6 py-4 text-lg font-bold border-y md:border-x border-black rounded-3xl md:rounded-none transition-colors ${activeTab === 'analytics'
                                ? 'bg-[#ff90e8]' // Pink to match admin/member vibe
                                : 'bg-white'
                                }`}
                        >
                            Analytics
                        </button>

                        <button
                            onClick={() => setActiveTab('downloads')}
                            className={`flex-1 px-6 py-4 text-lg font-bold border-y border-l rounded-3xl md:rounded-l-none border-black transition-colors ${activeTab === 'downloads'
                                ? 'bg-[#04ff96]'
                                : 'bg-white'
                                }`}
                        >
                            My Download History
                        </button>
                    </div>

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
