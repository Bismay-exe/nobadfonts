import { CheckCircle2, XCircle, ShieldCheck, ExternalLink, Info, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cleanUrl } from '../../utils/urlHelper';
import type { Font } from '../../types/font';
import type { Database } from '../../types/database.types';

type FontResearch = Database['public']['Tables']['font_research']['Row'];

interface LicenseInfoProps {
    font: Font;
    research?: FontResearch | null;
}

export default function LicenseInfo({ font, research }: LicenseInfoProps) {
    const licenseType = font.license_type || 'SIL Open Font License (OFL 1.1)';
    const isCommercial = font.commercial_use ?? (
        licenseType.toLowerCase().includes('ofl') || 
        licenseType.toLowerCase().includes('100% free') || 
        licenseType.toLowerCase().includes('public domain')
    );

    // Check if AI-verified license differs from uploader-selected
    const hasLicenseMismatch = research?.license_type_verified &&
        research.license_type_verified.toLowerCase() !== licenseType.toLowerCase() &&
        research.research_status !== 'pending';

    return (
        <div className="bg-[rgb(var(--color-card,var(--color-muted)))] border border-[rgb(var(--color-foreground)/0.05)] rounded-[2.5rem] p-8 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between gap-2 mb-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-[rgb(var(--color-highlight))] shrink-0" size={22} />
                        <h3 className="font-bold text-2xl text-[rgb(var(--color-foreground))] uppercase tracking-wider">
                            License
                        </h3>
                    </div>
                    <span className={`text-xs font-mono uppercase px-3 py-1 rounded-full font-bold ${
                        isCommercial
                            ? 'bg-[rgb(var(--color-highlight)/0.15)] text-[rgb(var(--color-foreground))] border border-[rgb(var(--color-highlight)/0.3)]'
                            : 'bg-[rgb(var(--color-warning)/0.15)] text-[rgb(var(--color-foreground))] border border-[rgb(var(--color-warning)/0.3)]'
                    }`}>
                        {isCommercial ? 'Commercial OK' : 'Personal Only'}
                    </span>
                </div>

                <div className="mb-6 bg-[rgb(var(--color-background)/0.5)] p-4 rounded-2xl border border-[rgb(var(--color-foreground)/0.08)]">
                    <span className="text-xs text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider font-mono block mb-1">
                        Assigned License
                    </span>
                    <p className="font-bold text-base text-[rgb(var(--color-foreground))] leading-snug">
                        {licenseType}
                    </p>
                </div>

                {/* AI License Mismatch Note */}
                {hasLicenseMismatch && (
                    <div className="mb-4 p-3 rounded-xl bg-[rgb(var(--color-warning)/0.08)] border border-[rgb(var(--color-warning)/0.2)] flex items-start gap-2">
                        <Info size={14} className="text-[rgb(var(--color-warning))] mt-0.5 shrink-0" />
                        <p className="text-xs text-[rgb(var(--color-foreground)/0.7)]">
                            AI research suggests this font uses <strong className="text-[rgb(var(--color-foreground))]">{research!.license_type_verified}</strong>. Verify before commercial use.
                        </p>
                    </div>
                )}

                {/* AI Confidence Badge */}
                {research?.confidence && research.confidence !== 'none' && research.research_status !== 'pending' && (
                    <div className="mb-4 flex items-center gap-2">
                        <Sparkles size={12} className="text-[rgb(var(--color-highlight))]" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))]">
                            AI Confidence: {research.confidence}
                        </span>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--color-foreground)/0.03)] text-sm">
                        <span className="text-[rgb(var(--color-muted-foreground))] font-medium">Personal Use</span>
                        <div className="flex items-center gap-1.5 font-bold text-[rgb(var(--color-foreground))]">
                            <CheckCircle2 size={16} className="text-[rgb(var(--color-highlight))]" />
                            <span>Permitted</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--color-foreground)/0.03)] text-sm">
                        <span className="text-[rgb(var(--color-muted-foreground))] font-medium">Commercial Projects</span>
                        <div className="flex items-center gap-1.5 font-bold text-[rgb(var(--color-foreground))]">
                            {isCommercial ? (
                                <>
                                    <CheckCircle2 size={16} className="text-[rgb(var(--color-highlight))]" />
                                    <span>Permitted</span>
                                </>
                            ) : (
                                <>
                                    <XCircle size={16} className="text-[rgb(var(--color-destructive))]" />
                                    <span className="text-[rgb(var(--color-destructive))]">License Required</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--color-foreground)/0.03)] text-sm">
                        <span className="text-[rgb(var(--color-muted-foreground))] font-medium">Web / App Embedding</span>
                        <div className="flex items-center gap-1.5 font-bold text-[rgb(var(--color-foreground))]">
                            <CheckCircle2 size={16} className="text-[rgb(var(--color-highlight))]" />
                            <span>Supported (.woff2)</span>
                        </div>
                    </div>
                </div>

                {/* License Evidence from AI */}
                {research?.license_evidence && research.research_status !== 'pending' && (
                    <div className="mt-4 p-3 rounded-xl bg-[rgb(var(--color-foreground)/0.03)] border border-[rgb(var(--color-foreground)/0.05)]">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))] mb-1.5">
                            License Evidence
                        </p>
                        <p className="text-xs text-[rgb(var(--color-foreground)/0.6)] italic leading-relaxed">
                            "{research.license_evidence}"
                        </p>
                    </div>
                )}
            </div>

            <div className="pt-6 mt-6 border-t border-[rgb(var(--color-foreground)/0.08)] flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-[rgb(var(--color-muted-foreground))]">
                    Verify terms before client work
                </span>
                <div className="flex items-center gap-3">
                    {/* View License Link from AI research */}
                    {cleanUrl(research?.license_url) && research?.research_status !== 'pending' && (
                        <a
                            href={cleanUrl(research!.license_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold flex items-center gap-1 text-[rgb(var(--color-highlight))] hover:underline underline-offset-4"
                        >
                            View License <ExternalLink size={12} />
                        </a>
                    )}
                    <Link
                        to="/legal/terms"
                        className="text-xs font-bold flex items-center gap-1 text-[rgb(var(--color-foreground))] hover:underline underline-offset-4"
                    >
                        Terms & Guidelines <ExternalLink size={12} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
