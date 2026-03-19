import { CheckCircle2, XCircle } from 'lucide-react';
import type { Font } from '../../types/font';

interface LicenseInfoProps {
    font: Font;
}

export default function LicenseInfo({ font }: LicenseInfoProps) {
    return (
        <div className="bg-[rgb(var(--color-muted)/0.05)] rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">License Information</h3>
            <div className="mb-4">
                <span className="text-sm text-[rgb(var(--color-muted-foreground))] uppercase tracking-wide">License Type</span>
                <p className="font-medium text-[rgb(var(--color-foreground))]">{font.license_type || 'Standard License'}</p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle2 size={18} className="text-[rgb(var(--color-highlight))]" />
                    <span>Personal Use</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    {font.commercial_use ? (
                        <CheckCircle2 size={18} className="text-[rgb(var(--color-highlight))]" />
                    ) : (
                        <XCircle size={18} className="text-[rgb(var(--color-destructive))]" />
                    )}
                    <span>Commercial Use</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle2 size={18} className="text-[rgb(var(--color-highlight))]" />
                    <span>Web Use</span>
                </div>
            </div>

            <button className="mt-6 text-[rgb(var(--color-accent))] text-sm font-medium hover:underline">
                Read Full License
            </button>
        </div>
    );
}
