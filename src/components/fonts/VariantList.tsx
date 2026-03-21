import { ArrowUp, ArrowDown, Download, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { VARIANT_NAMES } from './FileManager';
import { useState, useEffect } from 'react';

interface VariantListProps {
    font: any;
    profile: any;
    variantPreviewText: string;
    variantPreviewSize: number;
    downloadFont: (url: string, filename: string) => Promise<void>;
}

export default function VariantList({ 
    font, 
    profile, 
    variantPreviewText, 
    variantPreviewSize, 
    downloadFont 
}: VariantListProps) {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [reorderTrigger, setReorderTrigger] = useState(0);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => {
            if (activeDropdown) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown]);

    const handleMoveVariant = async (variantId: string, direction: 'up' | 'down', currentSortedVariants: any[]) => {
        if (!font || !profile || profile.role !== 'admin') return;

        const index = currentSortedVariants.findIndex(v => v.id === variantId);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentSortedVariants.length) return;

        const newOrder = [...currentSortedVariants];
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

        newOrder.forEach((v, i) => {
            v.order_index = i;
        });

        setReorderTrigger(prev => prev + 1);

        try {
            await Promise.all(
                newOrder.map((v, i) =>
                    supabase.from('font_variants').update({ order_index: i }).eq('id', v.id)
                )
            );
        } catch (error) {
            console.error("Failed to reorder variants", error);
        }
    };

    if (!font.font_variants || font.font_variants.length === 0) return null;

    const variants = font.font_variants.slice();
    const isAllCustom = variants.every((v: any) => !VARIANT_NAMES.includes(v.variant_name));

    const sortedVariants = variants.sort((a: any, b: any) => {
        if (typeof a.order_index === 'number' && typeof b.order_index === 'number') {
            return a.order_index - b.order_index;
        }
        if (typeof a.order_index === 'number') return -1;
        if (typeof b.order_index === 'number') return 1;

        if (isAllCustom) {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else {
            const getWeight = (name: string) => {
                const n = name.toLowerCase();
                if (n.includes('thin')) return 100;
                if (n.includes('extra light') || n.includes('extralight')) return 200;
                if (n.includes('light')) return 300;
                if (n.includes('regular')) return 400;
                if (n.includes('medium')) return 500;
                if (n.includes('semi bold') || n.includes('semibold')) return 600;
                if (n.includes('extra bold') || n.includes('extrabold')) return 800;
                if (n.includes('bold')) return 700;
                if (n.includes('black') || n.includes('heavy')) return 900;
                return 400;
            };
            const weightA = getWeight(a.variant_name);
            const weightB = getWeight(b.variant_name);

            if (weightA !== weightB) return weightB - weightA;

            const isItalicA = a.variant_name.toLowerCase().includes('italic');
            const isItalicB = b.variant_name.toLowerCase().includes('italic');
            if (isItalicA !== isItalicB) return isItalicA ? 1 : -1;

            return 0;
        }
    });

    return (
        <div className='overflow-hidden'>
            {reorderTrigger >= 0 && sortedVariants.map((variant: any, index: number) => (
                <div key={variant.id} className="py-2 md:py-4 border-b md:border-b-2 border-[rgb(var(--color-foreground)/0.1)] transition-all group">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] md:text-[12px] font-mono font-bold uppercase tracking-wider text-[rgb(var(--color-foreground)/0.6)] bg-[rgb(var(--color-foreground)/0.05)] px-3 py-1 rounded-full border border-[rgb(var(--color-foreground)/0.05)]">{variant.variant_name}</span>
                            {profile?.role === 'admin' && (
                                <div className="flex gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleMoveVariant(variant.id, 'up', sortedVariants)}
                                        disabled={index === 0}
                                        className="p-1 bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-foreground)/0.1)] rounded-md text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] transition-colors disabled:opacity-30 disabled:hover:bg-[rgb(var(--color-foreground)/0.5)] disabled:hover:text-[rgb(var(--color-foreground))]"
                                        title="Move Up"
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleMoveVariant(variant.id, 'down', sortedVariants)}
                                        disabled={index === sortedVariants.length - 1}
                                        className="p-1 bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-foreground)/0.1)] rounded-md text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] transition-colors disabled:opacity-30 disabled:hover:bg-[rgb(var(--color-background)/0.5)] disabled:hover:text-[rgb(var(--color-foreground))]"
                                        title="Move Down"
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="relative group/dropdown">
                            <div className="hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {(['ttf', 'otf', 'woff', 'woff2'] as const).map(format => {
                                    const url = variant[`${format}_url` as keyof typeof variant] as string;
                                    if (url) {
                                        return (
                                            <button
                                                key={format}
                                                onClick={() => downloadFont(url, `${font.name}-${variant.variant_name}.${format}`)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--color-background)/0.5)] border border-[rgb(var(--color-foreground)/0.2)] rounded-full text-[10px] font-bold uppercase hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] transition-colors cursor-pointer"
                                                title={`Download ${format.toUpperCase()}`}
                                            >
                                                <Download size={12} /> {format}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            <div className="md:hidden">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdown(activeDropdown === variant.id ? null : variant.id);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-foreground)/0.1)] rounded-full text-[10px] font-bold uppercase hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] transition-colors"
                                >
                                    <Download size={12} /> <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === variant.id ? 'rotate-180' : ''}`} />
                                </button>

                                <div className={`absolute right-0 top-full mt-2 w-32 bg-[rgb(var(--color-background)/0.05)] backdrop-blur-2xl border border-[rgb(var(--color-foreground)/0.1)] divide-y divide-[rgb(var(--color-foreground)/0.1)] rounded-xl overflow-hidden transition-all shadow-xl z-20 flex flex-col origin-top-right transform ${activeDropdown === variant.id ? 'opacity-100 visible scale-100 pointer-events-auto' : 'opacity-0 invisible scale-95 pointer-events-none'}`}>
                                    {(['ttf', 'otf', 'woff', 'woff2'] as const).map(format => {
                                        const url = variant[`${format}_url` as keyof typeof variant] as string;
                                        if (url) {
                                            return (
                                                <button
                                                    key={format}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadFont(url, `${font.name}-${variant.variant_name}.${format}`);
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="flex items-center justify-between w-full px-4 py-3 text-xs font-bold uppercase text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-colors text-left"
                                                >
                                                    <span>{format}</span>
                                                    <Download size={14} className="opacity-50" />
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <p
                        style={{
                            fontFamily: `'font-${font.id}-${variant.variant_name}'`,
                            fontSize: `${variantPreviewSize}px`,
                            lineHeight: 1.2
                        }}
                        className="wrap-break-word transition-all duration-200 w-full text-[rgb(var(--color-foreground))]"
                    >
                        {variantPreviewText || `${font.name} ${variant.variant_name}`}
                    </p>
                </div>
            ))}
        </div>
    );
}
