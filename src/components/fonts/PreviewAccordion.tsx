import { useState } from 'react';
import { ChevronRight, ChevronLeft, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PreviewAccordionProps {
    images: string[];
}

export function PreviewAccordion({ images }: PreviewAccordionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    if (!images || images.length === 0) return null;

    const nextImage = () => setActiveIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="relative w-full h-full group">
            {/* Main Image */}
            <div className="w-full h-full relative overflow-hidden bg-black/50">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={activeIndex}
                        src={images[activeIndex]}
                        alt={`Preview ${activeIndex + 1}`}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    />
                </AnimatePresence>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-60"></div>
            </div>

            {/* Navigation Controls */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black border border-white/10"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black border border-white/10"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            idx === activeIndex ? "w-8 bg-white" : "bg-white/30 hover:bg-white/50"
                        )}
                    />
                ))}
            </div>

            {/* Lightbox Trigger */}
            <button
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black border border-white/10"
            >
                <Maximize2 size={20} />
            </button>


            {/* Lightbox Modal */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-6 right-6 p-4 text-white/50 hover:text-white transition-colors"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X size={32} />
                        </button>

                        <div className="relative w-full h-full max-w-7xl flex items-center justify-center" onClick={e => e.stopPropagation()}>
                            <img
                                src={images[activeIndex]}
                                alt="Fullcsreen preview"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />

                            {/* Lightbox Nav */}
                            <button
                                onClick={prevImage}
                                className="absolute left-0 p-4 text-white/50 hover:text-white transition-colors"
                            >
                                <ChevronLeft size={48} />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-0 p-4 text-white/50 hover:text-white transition-colors"
                            >
                                <ChevronRight size={48} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
