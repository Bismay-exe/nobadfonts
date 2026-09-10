import { CheckCircle2, XCircle, ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Font } from '../../types/font';

interface LicenseInfoProps {
    font: Font;
}

export default function LicenseInfo({ font }: LicenseInfoProps) {
    const licenseType = font.license_type || 'SIL Open Font License (OFL 1.1)';
    const isCommercial = font.commercial_use ?? (
        licenseType.toLowerCase().includes('ofl') || 
        licenseType.toLowerCase().includes('100% free') || 
        licenseType.toLowerCase().includes('public domain')
    );

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
            </div>

            <div className="pt-6 mt-6 border-t border-[rgb(var(--color-foreground)/0.08)] flex items-center justify-between">
                <span className="text-xs text-[rgb(var(--color-muted-foreground))]">
                    Verify terms before client work
                </span>
                <Link
                    to="/legal/terms"
                    className="text-xs font-bold flex items-center gap-1 text-[rgb(var(--color-foreground))] hover:underline underline-offset-4"
                >
                    Terms & Guidelines <ExternalLink size={12} />
                </Link>
            </div>
        </div>
    );
}
