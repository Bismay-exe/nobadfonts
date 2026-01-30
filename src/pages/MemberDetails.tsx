import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FontCard from '../components/fonts/FontCard';
import type { Database } from '../types/database.types';
import { ArrowLeft, Type, Image as ImageIcon } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Font = Database['public']['Tables']['fonts']['Row'];

export default function MemberDetails() {
    const { id } = useParams();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [fonts, setFonts] = useState<Font[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                setLoading(false);
                return;
            }
            setProfile(profileData);

            // Fetch fonts uploaded by this member
            const { data: fontsData, error: fontsError } = await supabase
                .from('fonts')
                .select('*')
                .eq('uploaded_by', id)
                .eq('is_published', true);

            if (fontsError) console.error('Error fetching fonts:', fontsError);
            else setFonts(fontsData || []);

            setLoading(false);
        };

        fetchData();
    }, [id]);

    const navigate = useNavigate();

    const goBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/members');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
    );

    if (!profile) return (
        <div className="mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl font-black mb-4">Member Not Found</h1>
            <Link to="/members" className="text-blue-600 hover:underline">Back to Members</Link>
        </div>
    );

    return (
        <div className="mx-auto">


            {/* Header Profile Section */}
            <div className="bg-white border-b border-black rounded-3xl px-8 pt-24 pb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <button onClick={goBack} className="absolute top-8 left-8 flex items-center text-sm font-bold hover:text-gray-600 mb-8 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Members
                </button>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#BDF522] rounded-full blur-[60px] opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
                <div className="w-32 h-32 bg-gray-100 rounded-full border-2 border-black overflow-hidden shrink-0 z-10">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-4xl text-gray-300 uppercase">
                            {profile.full_name.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="text-center md:text-left z-10">
                    <h1 className="text-4xl md:text-5xl font-black uppercase mb-3">{profile.full_name}</h1>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center">
                        <span className={`
                            px-4 py-1.5 rounded-full font-bold text-sm uppercase border border-black
                            ${profile.role === 'admin' ? 'bg-[#FF90E8] text-black' : 'bg-[#BDF522] text-black'}
                        `}>
                            {profile.role}
                        </span>
                        <span className="text-gray-500 font-mono text-sm">
                            Uploaded {fonts.length} Font{fonts.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {profile.bio && <p className="mt-4 text-gray-600 max-w-lg font-medium">{profile.bio}</p>}
                </div>
            </div>



            {/* Fonts Header with Toggle */}
            <div className="flex justify-between items-center my-8 px-4">
                <h2 className="text-3xl font-black uppercase flex flex-col items-start">
                    Uploaded Fonts
                    <span className="text-gray-500 font-mono text-sm font-normal">Total {fonts.length} Font{fonts.length !== 1 ? 's' : ''}</span>
                </h2>
                <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200">
                    <button
                        onClick={() => setViewMode('font')}
                        className={`p-2 rounded-full transition-all ${viewMode === 'font'
                            ? 'bg-black text-white shadow-sm'
                            : 'text-gray-500 hover:text-black'
                            }`}
                        title="Font View"
                    >
                        <Type size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('image')}
                        className={`p-2 rounded-full transition-all ${viewMode === 'image'
                            ? 'bg-black text-white shadow-sm'
                            : 'text-gray-500 hover:text-black'
                            }`}
                        title="Image View"
                    >
                        <ImageIcon size={16} />
                    </button>
                </div>
            </div>

            <div className="columns-1 md:columns-3 lg:columns-5 gap-0">
                {fonts.map(font => (
                    <div key={font.id} className="mb-4 break-inside-avoid">
                        <FontCard font={font} viewMode={viewMode} />
                    </div>
                ))}
            </div>

            {
                fonts.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300">
                        <p className="text-xl font-bold text-gray-400">This member hasn't uploaded any fonts yet.</p>
                    </div>
                )
            }
        </div >
    );
}
