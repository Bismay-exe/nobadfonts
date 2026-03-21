import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database.types';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
    font_count?: number;
};

export default function Members() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [topMembers, setTopMembers] = useState<Profile[]>([]);
    const [otherMembers, setOtherMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Handle scroll restoration for async content
    useEffect(() => {
        if (!loading) {
            import('../components/layout/ScrollRestoration').then(({ scrollPositions }) => {
                // Just aggressively restore if we have a key match
                const savedPosition = scrollPositions.get(location.key);
                if (savedPosition !== undefined) {
                    // Small timeout helps ensure layout is really stable
                    requestAnimationFrame(() => {
                        window.scrollTo(0, savedPosition);
                    });
                }
            });
        }
    }, [loading, location.key]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch eligible profiles (members and admins)
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['member', 'admin']);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                setLoading(false);
                return;
            }

            // 2. Fetch all published fonts to count them
            // Note: Efficiently fetching just uploaded_by column
            const { data: fonts, error: fontsError } = await supabase
                .from('fonts')
                .select('uploaded_by')
                .eq('is_published', true);

            if (fontsError) {
                console.error('Error fetching fonts:', fontsError);
            }

            // 3. Aggregate counts locally
            const fontCounts: Record<string, number> = {};
            fonts?.forEach(font => {
                if (font.uploaded_by) {
                    fontCounts[font.uploaded_by] = (fontCounts[font.uploaded_by] || 0) + 1;
                }
            });

            // 4. Merge counts into profiles and sort by count (descending)
            const membersWithCounts = profiles.map(profile => ({
                ...profile,
                font_count: fontCounts[profile.id] || 0
            })).sort((a, b) => (b.font_count || 0) - (a.font_count || 0));

            // 5. Split into Top 3 and Others
            if (membersWithCounts.length > 0) {
                setTopMembers(membersWithCounts.slice(0, 3));
                setOtherMembers(membersWithCounts.slice(3));
            } else {
                setTopMembers([]);
                setOtherMembers([]);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    // Role Check
    if (!profile || (profile.role !== 'member' && profile.role !== 'admin')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[84.4vh] rounded-4xl text-center p-8 space-y-6">
                <div className="bg-[rgb(var(--color-destructive)/0.1)] p-6 rounded-full border-2 border-[rgb(var(--color-destructive)/0.2)]">
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
                    <button disabled className="px-6 py-3 border-2 border-[rgb(var(--color-foreground))] text-[rgb(var(--color-foreground))] rounded-xl font-bold opacity-50 cursor-not-allowed">
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

    return (
        <div className="mx-auto">
            <div className='p-2 md:p-6 border-b border-[rgb(var(--color-border))]'>

                {/* Top 3 Section */}
                {topMembers.length > 0 && (
                    <div className="px-4 py-12 md:py-20">
                        <div className="flex items-center md:items-end justify-center gap-4 md:gap-16 lg:gap-24">
                            {/* Rank 2 */}
                            {topMembers[1] && (
                                <div className="order-1 scale-80 md:scale-100 pb-4">
                                    <MemberCard member={topMembers[1]} rank={2} />
                                </div>
                            )}

                            {/* Rank 1 */}
                            {topMembers[0] && (
                                <div className="order-2 transform -translate-y-12 scale-110 md:scale-125 z-10">
                                    <MemberCard member={topMembers[0]} rank={1} />
                                </div>
                            )}

                            {/* Rank 3 */}
                            {topMembers[2] && (
                                <div className="order-3 scale-80 md:scale-100 pb-2">
                                    <MemberCard member={topMembers[2]} rank={3} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Other Members Section */}
            {otherMembers.length > 0 && (
                <div>
                    <div className="overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <tbody className="divide-y-2 divide-[rgb(var(--color-foreground)/0.1)]">
                                {otherMembers.map((member, index) => (
                                    <tr key={member.id}>
                                        <td className="px-2 py-4">
                                            <div className="relative flex items-center gap-4">
                                                <Link to={`/members/${member.username || member.id}`} className="w-12 h-12 relative">
                                                    <div className="w-14 h-14 bg-[rgb(var(--color-foreground)/0.05)] rounded-full border-2 border-[rgb(var(--color-foreground))] overflow-hidden shrink-0">
                                                        {member.avatar_url ? (
                                                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-black text-[rgb(var(--color-muted-foreground))]">
                                                                {member.full_name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[rgb(var(--color-highlight))] rounded-full border border-[rgb(var(--color-foreground))] flex items-center justify-center font-black text-[rgb(var(--color-background))] text-xs">
                                                            #{index + 4}
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div>
                                                    <div className="font-bold text-sm md:text-lg text-[rgb(var(--color-foreground))]">{member.full_name}</div>
                                                    <div className="flex gap-2">
                                                        <span className={`
                                                        inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-[rgb(var(--color-foreground))]
                                                        ${member.role === 'admin' ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))]' : 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))]'}
                                                        `}>
                                                            {member.role}
                                                        </span>
                                                        <div className="text-sm font-bold text-[rgb(var(--color-muted-foreground))]">{member.font_count} Uploads</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden md:block p-4 text-right">
                                            <Link
                                                to={`/members/${member.username || member.id}`}
                                                className="inline-flex gap-2 items-center px-6 py-3 border-2 border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-background))] font-bold rounded-full hover:bg-[rgb(var(--color-foreground))] transition-colors"
                                            >
                                                View Profile <ArrowUpRight size={22} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {topMembers.length === 0 && otherMembers.length === 0 && (
                <div className="text-center py-20 bg-[rgb(var(--color-card))] rounded-4xl border-2 border-dashed border-[rgb(var(--color-foreground)/0.2)]">
                    <p className="text-xl font-bold text-[rgb(var(--color-muted-foreground))]">No active members found yet.</p>
                </div>
            )}
        </div>
    );
}

const MemberCard = ({ member, rank }: { member: Profile, rank?: number }) => (
    <Link to={`/members/${member.username || member.id}`} className="block group">
        <div className="relative flex flex-col items-center transition-all duration-300">
            {/* Rank Badge for Top 3 */}
            {rank && (
                <div className={`
                    absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 border-[rgb(var(--color-foreground))] flex items-center justify-center font-black text-xs z-20 shadow-lg
                    ${rank === 1 ? 'bg-[#FFD700] text-black scale-110' : ''}
                    ${rank === 2 ? 'bg-[#C0C0C0] text-black' : ''}
                    ${rank === 3 ? 'bg-[#CD7F32] text-white' : ''}
                `}>
                    #{rank}
                </div>
            )}

            <div className="w-24 h-24 md:w-28 md:h-28 mb-3 relative">
                <div className={`
                    w-full h-full rounded-full border-4 border-[rgb(var(--color-foreground))] overflow-hidden transition-all duration-300
                    group-hover:shadow-[0_0_20px_rgba(var(--color-foreground),0.1)] group-hover:scale-105
                    ${rank === 1 ? 'border-[rgb(var(--color-highlight))]' : ''}
                `}>
                    {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-3xl text-[rgb(var(--color-muted-foreground))] uppercase bg-[rgb(var(--color-foreground)/0.05)]">
                            {member.full_name.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Crown for #1 */}
                {rank === 1 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl animate-bounce pointer-events-none">
                        👑
                    </div>
                )}
            </div>

            <div className="text-center">
                <h2 className="text-lg font-bold text-[rgb(var(--color-foreground))] group-hover:text-[rgb(var(--color-primary))] transition-colors line-clamp-1">
                    {member.full_name}
                </h2>
                <p className="text-[rgb(var(--color-muted-foreground))] font-bold text-[10px] uppercase tracking-wider">
                    {member.font_count} Uploads
                </p>
                {/* Role Indicator */}
                <div className={cn(
                    "mt-2 inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-black uppercase border-2 border-[rgb(var(--color-foreground))] shadow-[2px_2px_0px_0px_rgba(var(--color-foreground),1)]",
                    member.role === 'admin' ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))]' : 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))]'
                )}>
                    {member.role}
                </div>
            </div>
        </div>
    </Link>
);
