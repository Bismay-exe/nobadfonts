import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FontCard from '../components/fonts/FontCard';
import type { Database } from '../types/database.types';
import { ArrowLeft, Type, Image as ImageIcon, Globe, Twitter, Instagram, Linkedin, Coffee, Palette } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Font = Database['public']['Tables']['fonts']['Row'];

export default function MemberDetails() {
    const { id } = useParams();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [fonts, setFonts] = useState<Font[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            // Fetch profile
            // Fetch profile - smart check for ID (uuid) vs username (slug)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            const query = supabase
                .from('profiles')
                .select('*');

            if (isUuid) {
                query.eq('id', id);
            } else {
                query.eq('username', id);
            }

            const { data: profileData, error: profileError } = await query.single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                setLoading(false);
                return;
            }
            setProfile(profileData);

            // Fetch fonts uploaded by this member
            // We need the profile ID first, which we now have in profileData.id
            const { data: fontsData, error: fontsError } = await supabase
                .from('fonts')
                .select('*')
                .eq('uploaded_by', profileData.id)
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
            <div className={`border-b border-black rounded-4xl px-8 pt-24 pb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden ${profile.role === 'admin' ? 'bg-[#BDF522]' : 'bg-[#FF90E8]'}`}>
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

                    {/* Social Links */}
                    <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                        {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#EEEFEB] rounded-full border hover:border-black transition-colors text-gray-600 hover:text-black hover:-translate-y-1 hover:shadow-md">
                                <Globe size={20} />
                            </a>
                        )}
                        {profile.behance && (
                            <a href={profile.behance} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#EEEFEB] rounded-full border hover:border-black transition-colors text-gray-600 hover:text-[#1769ff] hover:-translate-y-1 hover:shadow-md">
                                <Palette size={20} />
                            </a>
                        )}
                        {profile.twitter && (
                            <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#EEEFEB] rounded-full border hover:border-black transition-colors text-gray-600 hover:text-[#1DA1F2] hover:-translate-y-1 hover:shadow-md">
                                <Twitter size={20} />
                            </a>
                        )}
                        {profile.instagram && (
                            <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#EEEFEB] rounded-full border hover:border-black transition-colors text-gray-600 hover:text-[#E1306C] hover:-translate-y-1 hover:shadow-md">
                                <Instagram size={20} />
                            </a>
                        )}
                        {profile.linkedin && (
                            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#EEEFEB] rounded-full border hover:border-black transition-colors text-gray-600 hover:text-[#0077b5] hover:-translate-y-1 hover:shadow-md">
                                <Linkedin size={20} />
                            </a>
                        )}
                    </div>

                    {profile.bio && (
                        <div>
                            <p className={`mt-4 text-gray-600 max-w-lg font-medium whitespace-pre-wrap ${!isExpanded ? 'line-clamp-5' : ''}`}>
                                {profile.bio}
                            </p>
                            {(profile.bio.length > 150 || profile.bio.split('\n').length > 5) && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-sm font-bold text-gray-500 hover:text-black mt-1"
                                >
                                    {isExpanded ? 'Show less' : '...more'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Donate Button */}
                    {profile.paypal_me && (
                        <div className="mt-6">
                            <a
                                href={`https://paypal.me/${profile.paypal_me}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0070BA] text-white font-bold rounded-xl hover:bg-[#003087] transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                            >
                                <Coffee size={20} />
                                Buy me a coffee
                            </a>
                        </div>
                    )}
                </div>
            </div>



            {/* Fonts Header with Toggle */}
            <div className={`flex justify-between items-center px-8 py-4 text-black rounded-4xl border-black border-y ${profile.role === 'admin' ? 'bg-[#ffbaf1]' : 'bg-[#BDF522]'}
                        `}>
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

            <div className="gap-0"
                style={{
                    columnWidth: 'clamp(220px, 20vw, 320px)',
                }}>
                {fonts.map(font => (
                    <div key={font.id} className="mb-4 break-inside-avoid">
                        <FontCard font={font} viewMode={viewMode} />
                    </div>
                ))}
            </div>
            {
                fonts.length === 0 && (
                    <div className="text-center py-24 bg-gray-50 rounded-4xl border-2 border-dashed border-gray-300">
                        <p className="text-xl font-bold text-gray-400">This member hasn't uploaded any fonts yet.</p>
                    </div>
                )
            }
        </div >
    );
}
