import { CheckCircle2, XCircle } from 'lucide-react';
import type { Font } from '../../types/font';

interface LicenseInfoProps {
    font: Font;
}

export default function LicenseInfo({ font }: LicenseInfoProps) {
    return (
        <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">License Information</h3>
            <div className="mb-4">
                <span className="text-sm text-gray-500 uppercase tracking-wide">License Type</span>
                <p className="font-medium text-gray-900">{font.license_type || 'Standard License'}</p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle2 size={18} className="text-green-600" />
                    <span>Personal Use</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    {font.commercial_use ? (
                        <CheckCircle2 size={18} className="text-green-600" />
                    ) : (
                        <XCircle size={18} className="text-red-500" />
                    )}
                    <span>Commercial Use</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle2 size={18} className="text-green-600" />
                    <span>Web Use</span>
                </div>
            </div>

            <button className="mt-6 text-blue-600 text-sm font-medium hover:underline">
                Read Full License
            </button>
        </div>
    );
}
