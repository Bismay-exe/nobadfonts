import { useCallback } from 'react';
import { X, Download, Link as LinkIcon, Twitter, Facebook, MessageCircle, Linkedin, Pin as PinIcon, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toast } from '@capacitor/toast';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string | null;
    fontName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, imageSrc, fontName }) => {
    if (!isOpen || !imageSrc) return null;

    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedText = encodeURIComponent(`Check out ${fontName} on Fontique!`);

    const handleDownload = useCallback(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        const link = document.createElement('a');
        link.download = `fontique-${fontName.toLowerCase().replace(/\s+/g, '-')}-card.png`;
        link.href = imageSrc;
        link.click();
    }, [fontName, imageSrc]);

    const handleCopyLink = useCallback(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        navigator.clipboard.writeText(currentUrl);
        await Toast.show({
            text: 'Link copied to clipboard!',
            duration: 'short'
        });
    }, [currentUrl]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[rgb(var(--color-background)/0.6)] backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative z-10 bg-[rgb(var(--color-background))] rounded-4xl p-6 md:p-8 max-w-4xl w-full shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black uppercase">Share Font</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[rgb(var(--color-muted)/0.1)] rounded-full transition-colors"
                    >
                        <X />
                    </button>
                </div>

                {/* Image Preview */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-[rgb(var(--color-border))] bg-[rgb(var(--color-muted)/0.05)] aspect-1200/630 group">
                    <img
                        src={imageSrc}
                        alt="Share Card"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4">
                    {/* Primary Action */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownload}
                        className="scale-100 w-full py-4 bg-[rgb(var(--color-highlight))] hover:brightness-110 text-[rgb(var(--color-background))] font-black uppercase rounded-xl border-2 border-[rgb(var(--color-foreground))] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgb(var(--color-foreground))] flex items-center justify-center gap-2 text-lg"
                    >
                        <Download size={24} />
                        Download Image
                    </motion.button>

                    {/* Secondary Actions (Socials) */}
                    <div className="md:grid md:grid-cols-7 flex gap-2 md:gap-4 overflow-x-auto">
                        <a
                            href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted)/0.05)] transition-all text-[rgb(var(--color-muted-foreground))] hover:text-green-600"
                        >
                            <MessageCircle size={24} />
                            <span className="text-xs font-bold uppercase">WhatsApp</span>
                        </a>
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted)/0.05)] transition-all text-[rgb(var(--color-muted-foreground))] hover:text-blue-400"
                        >
                            <Twitter size={24} />
                            <span className="text-xs font-bold uppercase">Twitter</span>
                        </a>
                        <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted)/0.05)] transition-all text-[rgb(var(--color-muted-foreground))] hover:text-blue-700"
                        >
                            <Facebook size={24} />
                            <span className="text-xs font-bold uppercase">Facebook</span>
                        </a>
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted)/0.05)] transition-all text-[rgb(var(--color-muted-foreground))] hover:text-blue-600"
                        >
                            <Linkedin size={24} />
                            <span className="text-xs font-bold uppercase">LinkedIn</span>
                        </a>
                        <a
                            href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted)/0.05)] transition-all text-[rgb(var(--color-muted-foreground))] hover:text-red-600"
                        >
                            <PinIcon size={24} />
                            <span className="text-xs font-bold uppercase">Pinterest</span>
                        </a>
                        <a
                            href={`https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted)/0.05)] transition-all text-[rgb(var(--color-muted-foreground))] hover:text-orange-600"
                        >
                            <MessageSquare size={24} />
                            <span className="text-xs font-bold uppercase">Reddit</span>
                        </a>
 
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleCopyLink}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted)/0.05)] transition-all text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                        >
                            <LinkIcon size={24} />
                            <span className="text-xs font-bold uppercase">Copy Link</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
