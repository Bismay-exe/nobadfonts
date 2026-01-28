import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ProfileHeader from '../components/profile/ProfileHeader';
import FontGrid from '../components/profile/FontGrid';
import SettingsForm from '../components/profile/SettingsForm';
import type { Font } from '../types/font';

export default function Profile() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<'favorites' | 'downloads' | 'settings'>('favorites');
    const [isEditing, setIsEditing] = useState(false);

    const [favorites, setFavorites] = useState<Font[]>([]);
    const [downloads, setDownloads] = useState<Font[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            setDataLoading(true);
            try {
                if (activeTab === 'favorites') {
                    const { data, error } = await supabase
                        .from('favorites')
                        .select('fonts(*)')
                        .eq('user_id', user!.id)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    // Flatten the response
                    setFavorites(data?.map((item: any) => item.fonts) || []);
                } else if (activeTab === 'downloads') {
                    const { data, error } = await supabase
                        .from('downloads')
                        .select('fonts(*)')
                        .eq('user_id', user!.id)
                        .order('downloaded_at', { ascending: false });

                    if (error) throw error;
                    // Flatten the response and dedup by ID if needed (though downloads are logs)
                    // For a list of unique downloaded fonts, we might want to group. 
                    // But simply showing history is fine.
                    setDownloads(data?.map((item: any) => item.fonts) || []);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setDataLoading(false);
            }
        }

        if (activeTab !== 'settings') {
            fetchData();
        }
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

            {!isEditing && (
                <>
                    {/* Tabs */}
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`w-full px-6 py-4 text-lg font-bold border-y border-r rounded-3xl border-black transition-colors ${activeTab === 'favorites'
                                    ? 'bg-[#FFC900]'
                                    : 'bg-white'
                                }`}
                        >
                            My Favorites
                        </button>
                        <button
                            onClick={() => setActiveTab('downloads')}
                            className={`w-full px-6 py-4 text-lg font-bold border-y border-l rounded-3xl border-black transition-colors ${activeTab === 'downloads'
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
                        />
                    )}

                    {activeTab === 'downloads' && (
                        <FontGrid
                            fonts={downloads}
                            loading={dataLoading}
                            emptyMessage="You haven't downloaded any fonts yet."
                        />
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
