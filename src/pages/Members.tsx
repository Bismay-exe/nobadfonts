import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
    font_count?: number;
};

export default function Members() {
    const [topMembers, setTopMembers] = useState<Profile[]>([]);
    const [otherMembers, setOtherMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

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

    const MemberCard = ({ member, rank }: { member: Profile, rank?: number }) => (
        <Link to={`/members/${member.id}`} className="block group h-full">
            <div className={`
                bg-white border-2 border-black rounded-3xl p-6 relative h-full flex flex-col items-center transition-all duration-200
                hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1
                ${rank === 1 ? 'bg-yellow-50 border-yellow-400' : ''}
            `}>
                {/* Rank Badge for Top 3 */}
                {rank && (
                    <div className={`
                        absolute -top-4 -right-4 w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black text-lg z-10
                        ${rank === 1 ? 'bg-[#BDF522] text-black scale-125' : ''}
                        ${rank === 2 ? 'bg-[#ff9651]' : ''}
                        ${rank === 3 ? 'bg-[#fffc67]' : ''}
                    `}>
                        #{rank}
                    </div>
                )}

                <div className="w-24 h-24 mb-4 relative">
                    <div className="w-full h-full bg-gray-100 rounded-full border-2 border-black overflow-hidden">
                        {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-3xl text-gray-300 uppercase">
                                {member.full_name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-black ${member.role === 'admin' ? 'bg-[#FF90E8]' : 'bg-[#BDF522]'}`} />
                    <div className={`
                        absolute -top-4 -left-4 w-10 h-10 -rotate-45 flex items-center justify-center font-black text-4xl z-10
                        ${rank === 1 ? 'block' : 'hidden'}
                        ${rank === 2 ? 'block' : ''}
                        ${rank === 3 ? 'block' : ''}
                    `}>
                        👑
                    </div>
                </div>

                <h2 className="text-xl font-bold text-center mb-1 group-hover:text-[#7B46F8] transition-colors line-clamp-1">
                    {member.full_name}
                </h2>

                <p className="text-gray-500 font-bold text-sm mb-4">
                    {member.font_count} Uploads
                </p>

                <div className="mt-auto pt-2">
                    <span className={`
                        inline-block px-3 py-1 rounded-full text-xs font-bold uppercase border border-black
                        ${member.role === 'admin' ? 'bg-[#FF90E8] text-black' : 'bg-[#BDF522] text-black'}
                    `}>
                        {member.role}
                    </span>
                </div>
            </div>
        </Link>
    );

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
    );

    return (
        <div className="mx-auto">
            <div className='bg-[#fff8da] rounded-3xl p-2 md:p-6 border-y-2 border-black'>

                {/* Top 3 Section */}
                {topMembers.length > 0 && (
                    <div className="px-4 py-8">
                        <h2 className="text-2xl font-bold pb-12 flex items-center gap-2">
                            <span className="text-3xl">👑</span> Top Contributors
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Display order matches array slice: 1st, 2nd, 3rd */}
                            {topMembers.map((member, index) => (
                                <div key={member.id} className={index === 0 ? 'md:-mt-6' : ''}>
                                    <MemberCard member={member} rank={index + 1} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Other Members Section */}
            {otherMembers.length > 0 && (
                <div>
                    <div className="bg-white border-b-2 border-black rounded-3xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <tbody className="divide-y-2 divide-gray-100">
                                {otherMembers.map((member, index) => (
                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="hidden p-4 w-16 text-center font-black text-gray-400 text-xl font-mono">
                                            #{index + 4}
                                        </td>
                                        <td className="p-4">
                                            <div className="relative flex items-center gap-4">
                                                <Link to={`/members/${member.id}`} className="w-12 h-12 relative">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-black overflow-hidden shrink-0">
                                                        {member.avatar_url ? (
                                                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-black text-gray-400">
                                                                {member.full_name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <td className="absolute -top-2 -right-2 w-7 h-7 bg-[#BDF522] rounded-full border-2 border-black flex items-center justify-center font-black text-xs">
                                                            #{index + 4}
                                                        </td>
                                                    </div>
                                                </Link>
                                                <div>
                                                    <div className="font-bold text-sm md:text-lg">{member.full_name}</div>
                                                    <div className="flex gap-2">
                                                        <span className={`
                                                        inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-black
                                                        ${member.role === 'admin' ? 'bg-[#FF90E8] text-black' : 'bg-[#BDF522] text-black'}
                                                        `}>
                                                            {member.role}
                                                        </span>
                                                        <div className="text-sm font-bold text-gray-500">{member.font_count} Uploads</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden md:block p-4 text-right">
                                            <Link
                                                to={`/members/${member.id}`}
                                                className="inline-block px-6 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors"
                                            >
                                                View Profile
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
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300">
                    <p className="text-xl font-bold text-gray-400">No active members found yet.</p>
                </div>
            )}
        </div>
    );
}
