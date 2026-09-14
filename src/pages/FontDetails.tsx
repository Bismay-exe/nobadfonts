import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import SocialShareCard from '../components/fonts/SocialShareCard';
import ShareModal from '../components/fonts/ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useFont } from '../hooks/useFont';
import FontTester from '../components/fonts/FontTester';
import type { Font } from '../types/font';
import SEO from '../components/shared/SEO';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import FileManager from '../components/fonts/FileManager';
import { createFontZipPackage, triggerBlobDownload } from '../utils/zipBuilder';
import FontResearchPanel from '../components/admin/FontResearchPanel';
import type { Database } from '../types/database.types';
import {
    FontDetailsNav,
    FontHeroHeader,
    FontGalleryHero,
    FontTags,
    FontAdminControls,
    FontVariantSection,
    FontIntegrationSection,
    FontGlyphMapSection,
    FontSimilarSection,
    FontEditorialDetails,
    FontJsonToolbar,
} from '../components/font-details';

export default function FontDetails() {
    const { id } = useParams();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const { font, setFont, loading, error, isFavorited, setIsFavorited } = useFont(id);
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    // Social Share State
    const [shareLoading, setShareLoading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareImageSrc, setShareImageSrc] = useState<string | null>(null);
    const [activeOgVariantId, setActiveOgVariantId] = useState<string | null>(font?.og_image_variant_id || null);
    const shareRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (font?.og_image_variant_id) {
            setActiveOgVariantId(font.og_image_variant_id);
        }
    }, [font?.og_image_variant_id]);

    // Admin File Edit State
    const [isEditingFiles, setIsEditingFiles] = useState(false);

    // Similar Fonts State
    const [similarFonts, setSimilarFonts] = useState<Font[]>([]);

    // AI Research State
    type FontResearchRow = Database['public']['Tables']['font_research']['Row'];
    type FontSourceRow = Database['public']['Tables']['font_sources']['Row'];
    const [fontResearch, setFontResearch] = useState<FontResearchRow | null>(null);
    const [fontSources, setFontSources] = useState<FontSourceRow[]>([]);

    useEffect(() => {
        if (!font || !font.category) return;

        // Increment Views
        const incrementViews = async () => {
            const viewedKey = `viewed_${font.id}`;
            if (sessionStorage.getItem(viewedKey)) return;

            await supabase.rpc('increment_font_views', { font_id: font.id });
            sessionStorage.setItem(viewedKey, 'true');
        };
        incrementViews();

        const fetchSimilar = async () => {
            const { data } = await supabase.rpc('search_fonts', {
                sort_by: 'trending',
                filter_category: font.category
            });

            if (data) {
                const similar = (data as any[])
                    .filter(f => f.id !== font.id)
                    .slice(0, 4);
                setSimilarFonts(similar as Font[]);
            }
        };
        fetchSimilar();

        // Fetch AI research data
        const fetchResearch = async () => {
            const { data: research } = await supabase
                .from('font_research')
                .select('*')
                .eq('font_id', font.id)
                .maybeSingle();

            if (research) {
                setFontResearch(research);
                const { data: sources } = await supabase
                    .from('font_sources')
                    .select('*')
                    .eq('research_id', research.id)
                    .order('source_tier', { ascending: true });
                setFontSources(sources || []);
            }
        };
        fetchResearch();
    }, [font?.id]);

    // Load Web Fonts
    useEffect(() => {
        if (!font) return;

        const loadFont = async (family: string, url: string, format?: string) => {
            try {
                const source = `url(${url})` + (format ? ` format('${format}')` : '');
                const fontFace = new FontFace(family, source);
                const loadedFace = await fontFace.load();
                document.fonts.add(loadedFace);
                return true;
            } catch (err) {
                console.error(`Failed to load font ${family}:`, err);
                return false;
            }
        };

        // Load main font
        const getFontSource = (f: typeof font) => {
            if (f.font_variants && f.font_variants.length > 0) {
                const regular = f.font_variants.find(v => v.variant_name === 'Regular');
                if (regular) {
                    if (regular.woff2_url) return { url: regular.woff2_url, format: 'woff2' };
                    if (regular.woff_url) return { url: regular.woff_url, format: 'woff' };
                    if (regular.ttf_url) return { url: regular.ttf_url, format: 'truetype' };
                    if (regular.otf_url) return { url: regular.otf_url, format: 'opentype' };
                }
            }

            if (f.woff2_url) return { url: f.woff2_url, format: 'woff2' };
            if (f.woff_url) return { url: f.woff_url, format: 'woff' };
            if (f.ttf_url) return { url: f.ttf_url, format: 'truetype' };
            if (f.otf_url) return { url: f.otf_url, format: 'opentype' };

            if (f.font_variants && f.font_variants.length > 0) {
                const anyVariant = f.font_variants[0];
                if (anyVariant.woff2_url) return { url: anyVariant.woff2_url, format: 'woff2' };
                if (anyVariant.woff_url) return { url: anyVariant.woff_url, format: 'woff' };
                if (anyVariant.ttf_url) return { url: anyVariant.ttf_url, format: 'truetype' };
                if (anyVariant.otf_url) return { url: anyVariant.otf_url, format: 'opentype' };
            }

            return null;
        };

        const mainSource = getFontSource(font);
        if (mainSource) {
            loadFont(`font-${font.id}`, mainSource.url, mainSource.format).then(success => {
                if (success) setIsFontLoaded(true);
            });
            loadFont(`custom-font-${font.slug}`, mainSource.url, mainSource.format);
        }

        // Load variant fonts
        font.font_variants?.forEach(variant => {
            let variantSource = null;
            if (variant.woff2_url) variantSource = { url: variant.woff2_url, format: 'woff2' };
            else if (variant.woff_url) variantSource = { url: variant.woff_url, format: 'woff' };
            else if (variant.ttf_url) variantSource = { url: variant.ttf_url, format: 'truetype' };
            else if (variant.otf_url) variantSource = { url: variant.otf_url, format: 'opentype' };

            if (variantSource) {
                const variantFamily = `font-${font.id}-${variant.variant_name}`;
                loadFont(variantFamily, variantSource.url, variantSource.format);
            }
        });
    }, [font]);

    const handleFavorite = async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        if (!user) {
            navigate('/auth');
            return;
        }
        if (!font) return;

        const newStatus = !isFavorited;
        setIsFavorited(newStatus);

        try {
            if (newStatus) {
                const { error } = await supabase
                    .from('favorites')
                    .insert({ font_id: font.id, user_id: user.id });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('font_id', font.id);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating favorite:', error);
            setIsFavorited(!newStatus);
            await Toast.show({ text: 'Failed to update favorites', duration: 'short' });
        }
    };

    const handleShare = async () => {
        if (!shareRef.current || !font) return;
        setShareLoading(true);

        try {
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 100));

            const { toPng } = await import('html-to-image');
            const dataUrl = await toPng(shareRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                width: 1200,
                height: 800,
            });

            setShareImageSrc(dataUrl);
            setShowShareModal(true);
        } catch (err) {
            console.error('Failed to generate image', err);
            await Toast.show({ text: 'Failed to generate share card.', duration: 'short' });
        } finally {
            setShareLoading(false);
        }
    };

    const downloadFont = async (url: string, filename: string) => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        if (!font || !url) return;

        try {
            if (user) {
                await supabase.from('downloads').insert({
                    font_id: font.id,
                    user_id: user.id
                }).then(({ error }) => {
                    if (error) console.error("Failed to track download", error);
                });
            }

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Download check failed:', error);
            await Toast.show({ text: 'Failed to download font.', duration: 'short' });
        }
    };

    const [isDownloadingZip, setIsDownloadingZip] = useState(false);
    const [zipStatusText, setZipStatusText] = useState('');

    const handleDownloadZip = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!font || isDownloadingZip) return;
        await Haptics.impact({ style: ImpactStyle.Medium });
        setIsDownloadingZip(true);
        setZipStatusText('Preparing...');

        try {
            if (user) {
                await supabase.from('downloads').insert({
                    font_id: font.id,
                    user_id: user.id
                }).then(({ error }) => {
                    if (error) console.error("Failed to track download", error);
                });
            }

            const zipBlob = await createFontZipPackage(font, (status) => {
                setZipStatusText(status);
            });

            const safeName = font.slug || font.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            triggerBlobDownload(zipBlob, `${safeName}.zip`);

            await Toast.show({ text: 'ZIP package downloaded!', duration: 'short' });
        } catch (err) {
            console.error('ZIP package generation failed:', err);
            await Toast.show({ text: 'Packaging failed. Downloading primary font file.', duration: 'short' });
            if (font.woff2_url || font.ttf_url || font.otf_url) {
                const fallbackUrl = font.woff2_url || font.ttf_url || font.otf_url || '';
                const ext = font.woff2_url ? 'woff2' : (font.ttf_url ? 'ttf' : 'otf');
                downloadFont(fallbackUrl, `${font.name}.${ext}`);
            }
        } finally {
            setIsDownloadingZip(false);
            setZipStatusText('');
        }
    };

    // Scroll Detection
    const [isScrolled, setIsScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 5);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
    if (error || !font) return <div className="container mx-auto px-4 py-8">Font not found</div>;

    const fontSlug = font.slug || id;
    const fontCanonicalUrl = `/fonts/${fontSlug}`;
    const fontSchema = [
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: 'https://nobadfonts.in'
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Fonts',
                    item: 'https://nobadfonts.in/fonts'
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: font.name,
                    item: `https://nobadfonts.in${fontCanonicalUrl}`
                }
            ]
        },
        {
            '@type': 'CreativeWork',
            '@id': `https://nobadfonts.in${fontCanonicalUrl}#font`,
            name: font.name,
            headline: `${font.name} font family by ${font.designer}`,
            description: `Download ${font.name}, a ${font.tags ? font.tags.join(', ') : 'modern'} font by ${font.designer}. Available now in WOFF2, TTF, and OTF on NoBadFonts.`,
            creator: {
                '@type': 'Person',
                name: font.designer
            },
            publisher: {
                '@type': 'Organization',
                name: 'NoBadFonts',
                url: 'https://nobadfonts.in'
            },
            license: font.license_type || 'SIL Open Font License (OFL 1.1)',
            image: font.preview_image_url || 'https://nobadfonts.in/banner/banner.png',
            genre: font.category || 'Typography',
            keywords: font.tags?.join(', ') || 'free fonts, typography, webfonts',
            fileFormat: ['font/woff2', 'font/ttf', 'font/otf'],
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                category: font.commercial_use ? 'Commercial & Personal Use' : 'Personal Use Only'
            }
        }
    ];

    const ogImage =
        font.og_image_url ||
        (font.gallery_images && font.gallery_images.length > 0 ? font.gallery_images[0] : null) ||
        'https://nobadfonts.in/banner/banner.png';

    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] relative selection:bg-[rgb(var(--color-highlight))] selection:text-[rgb(var(--color-background))]">
            <SEO
                title={`${font.name} by ${font.designer}`}
                description={`Download ${font.name}, a ${font.tags ? font.tags.join(', ') : 'unique'} font${font.designer ? ` by ${font.designer}` : ''}. Free ZIP package includes WOFF2, TTF/OTF, LICENSE.txt, and README.txt on NoBadFonts.`}
                image={ogImage}
                imageAlt={`${font.name} typography preview specimen by ${font.designer}`}
                url={fontCanonicalUrl}
                keywords={font.tags || []}
                author={font.designer}
                schema={fontSchema}
            />

            {/* Navigation & Sticky Scroll Header */}
            <FontDetailsNav
                font={font}
                user={user}
                profile={profile}
                isScrolled={isScrolled}
                shareLoading={shareLoading}
                isDownloadingZip={isDownloadingZip}
                onShare={handleShare}
                onDownloadZip={handleDownloadZip}
            />

            <div className="max-w-480 mx-auto pt-16 md:pt-24 px-4 md:px-8 space-y-6 md:space-y-12">
                {/* 1. Hero Header */}
                <FontHeroHeader
                    font={font}
                    isFavorited={isFavorited}
                    shareLoading={shareLoading}
                    isDownloadingZip={isDownloadingZip}
                    zipStatusText={zipStatusText}
                    onFavorite={handleFavorite}
                    onShare={handleShare}
                    onDownloadZip={handleDownloadZip}
                />

                {/* Gallery / Specimen Display */}
                <FontGalleryHero font={font} isFontLoaded={isFontLoaded} />

                {/* Tags & Categories */}
                <FontTags tags={font.tags} />

                {/* Admin Controls */}
                <FontAdminControls
                    font={font}
                    user={user}
                    profile={profile}
                    onEditFiles={() => setIsEditingFiles(true)}
                />

                {/* Hidden Share Card for Image Generation */}
                <div className="absolute -left-2499.75 -top-2499.75">
                    <SocialShareCard
                        ref={shareRef}
                        font={font}
                        aspectRatio="share"
                        selectedVariantId={activeOgVariantId || font.og_image_variant_id}
                    />
                </div>

                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    imageSrc={shareImageSrc}
                    fontName={font.name}
                />

                {/* 2. Variant Previews */}
                <FontVariantSection
                    font={font}
                    profile={profile}
                    downloadFont={downloadFont}
                    onVariantOgChange={setActiveOgVariantId}
                    onFontUpdated={(updatedFields) => {
                        setFont(prev => prev ? { ...prev, ...updatedFields } : null);
                        if (updatedFields.og_image_variant_id) {
                            setActiveOgVariantId(updatedFields.og_image_variant_id);
                        }
                    }}
                />

                {/* 3. Editorial Details & Taxonomy */}
                <div className="pt-4 space-y-4">
                    {profile?.role === 'admin' && (
                        <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-[rgb(var(--color-foreground)/0.08)]">
                            <span className="font-mono text-xs uppercase tracking-widest text-[rgb(var(--color-muted-foreground))]">
                                Typography Specs &amp; Taxonomy (Admin)
                            </span>
                            <FontJsonToolbar
                                font={font}
                                research={fontResearch}
                                profile={profile}
                                onFontUpdated={(updated) => setFont(prev => prev ? { ...prev, ...updated } : null)}
                                onResearchUpdated={(updated) => setFontResearch(updated)}
                            />
                        </div>
                    )}
                    <FontEditorialDetails font={font} research={fontResearch} />
                </div>

                {/* 3.5 Admin: AI Research Panel */}
                {profile?.role === 'admin' && font && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                            <h2 className="text-2xl font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))]">
                                AI Research
                            </h2>
                            <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                        </div>
                        <FontResearchPanel
                            fontId={font.id}
                            fontName={font.name}
                            research={fontResearch}
                            sources={fontSources}
                            onResearchComplete={async () => {
                                const { data: research } = await supabase
                                    .from('font_research')
                                    .select('*')
                                    .eq('font_id', font.id)
                                    .maybeSingle();
                                if (research) {
                                    setFontResearch(research);
                                    const { data: sources } = await supabase
                                        .from('font_sources')
                                        .select('*')
                                        .eq('research_id', research.id)
                                        .order('source_tier', { ascending: true });
                                    setFontSources(sources || []);
                                }
                            }}
                        />
                    </div>
                )}

                {/* 4. Type Tester */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))]">
                            Type Tester
                        </h2>
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                    </div>
                    <FontTester font={font} />
                </div>

                {/* 5. Integration & Stats */}
                <FontIntegrationSection font={font} research={fontResearch} />

                {/* 6. Glyph Map */}
                <FontGlyphMapSection font={font} isFontLoaded={isFontLoaded} />

                {/* 7. Similar Fonts */}
                <FontSimilarSection similarFonts={similarFonts} />
            </div>

            {/* Admin File Manager Overlay */}
            {profile?.role === 'admin' && isEditingFiles && (
                <FileManager
                    font={font}
                    user={user}
                    onClose={() => setIsEditingFiles(false)}
                    onSaveSuccess={() => {
                        setIsEditingFiles(false);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
