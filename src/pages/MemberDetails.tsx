import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import FontCard from '../components/fonts/FontCard';
import type { Database } from '../types/database.types';
import type { FontFilterParams } from '../types/font';
import { ArrowLeft, Image as Globe, Twitter, Instagram, Linkedin, Coffee, Palette } from 'lucide-react';
import { Masonry } from 'masonic';
import { useWindowSize } from '../hooks/useWindowSize';
import Filters from '../components/fonts/Filters';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Font = Database['public']['Tables']['fonts']['Row'];

const MasonryCard = ({ data }: { data: any }) => (
    <FontCard
        font={data}
        viewMode={data.viewMode}
        customText={data.customText}
        isExpanded={data.isExpanded}
        onToggle={data.onToggle}
    />
);

export default function MemberDetails() {
    const { id } = useParams();
    const { profile: currentUserProfile } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [fonts, setFonts] = useState<Font[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedFontId, setExpandedFontId] = useState<string | null>(null);
    const { width } = useWindowSize();

    // Filter & View State
    const [filters, setFilters] = useState<FontFilterParams>({ query: '', categories: [], sortBy: 'newest' });
    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');
    const [customText, setCustomText] = useState('');
    const [globalExpanded, setGlobalExpanded] = useState(false);
    const [bulkToggleVersion, setBulkToggleVersion] = useState(0);
    const [isBulkToggling, setIsBulkToggling] = useState(false);
    const bulkToggleTimeoutRef = useRef<any>(null);

    const navigate = useNavigate();

    const handleFiltersChange = useCallback((f: FontFilterParams) => setFilters(f), []);
    const handleViewModeChange = useCallback((v: 'font' | 'image') => setViewMode(v), []);
    const handleCustomTextChange = useCallback((t: string) => setCustomText(t), []);

    const handleToggleAll = useCallback(() => {
        setGlobalExpanded(prev => !prev);
        setBulkToggleVersion(v => v + 1);
        setIsBulkToggling(true);
        if (bulkToggleTimeoutRef.current) clearTimeout(bulkToggleTimeoutRef.current);
        bulkToggleTimeoutRef.current = setTimeout(() => setIsBulkToggling(false), 450);
        setExpandedFontId(null);
    }, []);

    const goBack = useCallback(() => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/members');
        }
    }, [navigate]);

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
                .select('*, font_variants(*)')
                .eq('uploaded_by', profileData.id)
                .eq('is_published', true);

            if (fontsError) console.error('Error fetching fonts:', fontsError);
            else setFonts(fontsData || []);

            setLoading(false);
        };

        fetchData();
    }, [id]);

    const columns =
        width > 1280 ? 4 :
            width > 1024 ? 3 :
                width > 640 ? 2 :
                    1;

    const filteredFonts = useMemo(() => {
        let result = [...fonts];
        if (filters.query) {
            const q = filters.query.toLowerCase();
            result = result.filter(f =>
                f.name.toLowerCase().includes(q) ||
                (f.tags && f.tags.some((t: string) => t.toLowerCase().includes(q)))
            );
        }
        if (filters.categories && filters.categories.length > 0) {
            result = result.filter(f =>
                f.tags && filters.categories!.some(cat => f.tags?.includes(cat))
            );
        }
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case 'popular': return (b.favorites_count || 0) - (a.favorites_count || 0);
                case 'newest': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                case 'alpha': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });
        return result;
    }, [fonts, filters]);

    const masonryItems = useMemo(() =>
        filteredFonts
            .filter(f => f && f.id)
            .map(f => {
                const cardProps = globalExpanded
                    ? { isExpanded: true, onToggle: undefined }
                    : { isExpanded: expandedFontId === f.id, onToggle: () => setExpandedFontId(expandedFontId === f.id ? null : f.id) };
                return { ...f, viewMode, customText, ...cardProps, bulkToggleVersion };
            })
    , [filteredFonts, viewMode, customText, expandedFontId, globalExpanded, bulkToggleVersion]);

    // Role Check
    if (!currentUserProfile || (currentUserProfile.role !== 'member' && currentUserProfile.role !== 'admin')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[84.4vh]  rounded-4xl text-center p-8 space-y-6">
                <div className="bg-[rgb(var(--color-destructive)/0.1)] p-6 rounded-full">
                    <div className="text-6xl text-[rgb(var(--color-destructive))]">🔒</div>
                </div>
                <h1 className="text-4xl font-black uppercase text-[rgb(var(--color-foreground))]">Access Restricted</h1>
                <p className="text-xl text-[rgb(var(--color-muted-foreground))] max-w-lg">
                    Viewing members is currently restricted to approved <strong>Members</strong> and <strong>Admins</strong>.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/')} className="px-6 py-3 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-xl font-bold hover:scale-105 transition-transform">
                        Go Home
                    </button>
                    {/* Placeholder for future "Request Access" feature */}
                    <button disabled className="px-6 py-3 border-2 border-[rgb(var(--color-border))] text-[rgb(var(--color-foreground))] rounded-xl font-bold opacity-50 cursor-not-allowed">
                        Request Access
                    </button>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--color-foreground))]"></div>
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
            <div className="border-b border-[rgb(var(--color-border))] rounded-4xl md:px-8 pt-24 pb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <button onClick={goBack} className="absolute top-8 left-2 md:left-4 flex items-center text-sm font-bold text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] mb-8 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Members
                </button>
                <div className="w-48 h-48 bg-[rgb(var(--color-muted))] rounded-full border-2 border-[rgb(var(--color-border))] overflow-hidden shrink-0 z-10">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-4xl text-[rgb(var(--color-muted-foreground)/0.4)] uppercase">
                            {profile.full_name.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="text-center md:text-left z-10">
                    <h1 className="text-4xl md:text-5xl font-black uppercase mb-3">{profile.full_name}</h1>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center">
                        <span className={`
                            px-4 py-1.5 rounded-full font-bold text-sm uppercase border border-[rgb(var(--color-border))]
                            ${profile.role === 'admin' ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))]' : 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))]'}
                        `}>
                            {profile.role}
                        </span>
                        <span className="text-[rgb(var(--color-muted-foreground))] font-mono text-sm">
                            Uploaded {fonts.length} Font{fonts.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Social Links */}
                    <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                        {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-card))] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] hover:-translate-y-1 hover:shadow-md">
                                <Globe size={20} />
                            </a>
                        )}
                        {profile.behance && (
                            <a href={profile.behance} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-card))] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[rgb(var(--color-muted-foreground))] hover:text-[#1769ff] hover:-translate-y-1 hover:shadow-md">
                                <Palette size={20} />
                            </a>
                        )}
                        {profile.twitter && (
                            <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-card))] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[rgb(var(--color-muted-foreground))] hover:text-[#1DA1F2] hover:-translate-y-1 hover:shadow-md">
                                <Twitter size={20} />
                            </a>
                        )}
                        {profile.instagram && (
                            <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-card))] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[rgb(var(--color-muted-foreground))] hover:text-[#E1306C] hover:-translate-y-1 hover:shadow-md">
                                <Instagram size={20} />
                            </a>
                        )}
                        {profile.linkedin && (
                            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-[rgb(var(--color-card))] rounded-full border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors text-[rgb(var(--color-muted-foreground))] hover:text-[#0077b5] hover:-translate-y-1 hover:shadow-md">
                                <Linkedin size={20} />
                            </a>
                        )}
                    </div>

                    {profile.bio && (
                        <div>
                            <p className={`mt-4 text-[rgb(var(--color-muted-foreground))] max-w-lg font-medium whitespace-pre-wrap ${!isExpanded ? 'line-clamp-5' : ''}`}>
                                {profile.bio}
                            </p>
                            {(profile.bio.length > 150 || profile.bio.split('\n').length > 5) && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-sm font-bold text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] mt-1"
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
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] font-bold rounded-xl hover:opacity-90 transition-all hover:shadow-[4px_4px_0px_0px_rgb(var(--color-foreground))] hover:-translate-y-1"
                            >
                                <Coffee size={20} />
                                Buy me a coffee
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <aside className="w-full shrink-0 transition-all duration-300 ease-in-out">
                <Filters
                    filters={filters}
                    onChange={handleFiltersChange}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    showExpandToggle={true}
                    allExpanded={globalExpanded}
                    onToggleAll={handleToggleAll}
                    customText={customText}
                    onCustomTextChange={handleCustomTextChange}
                />
            </aside>

            {fonts.length > 0 ? (
                <div className={`masonic-grid ${isBulkToggling ? 'is-bulk-toggling' : ''}`}>
                    <Masonry
                        items={masonryItems}
                        columnCount={columns}
                        columnGutter={24}
                        render={MasonryCard}
                    />
                </div>
            ) : (
                <div className="text-center py-24 bg-[rgb(var(--color-muted)/0.3)] rounded-4xl border-2 border-dashed border-[rgb(var(--color-border))]">
                    <p className="text-xl font-bold text-[rgb(var(--color-muted-foreground))]">This member hasn't uploaded any fonts yet.</p>
                </div>
            )}
        </div >
    );
}
