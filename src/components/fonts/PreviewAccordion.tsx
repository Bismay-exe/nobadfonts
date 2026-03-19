import { useEffect, useRef, useState } from 'react';

const AUTO_CYCLE_INTERVAL = 4000;

export function PreviewAccordion({ images, vertical = false }: { images: string[]; vertical?: boolean }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const touchStartX = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);


    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);


    useEffect(() => {
        if (paused) return;

        intervalRef.current = window.setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % images.length);
        }, AUTO_CYCLE_INTERVAL);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [paused, images.length]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setPaused(true);
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;

        const deltaX = e.changedTouches[0].clientX - touchStartX.current;

        if (Math.abs(deltaX) > 50) {
            setActiveIndex((prev) => {
                if (deltaX > 0) {
                    return prev === 0 ? images.length - 1 : prev - 1;
                } else {
                    return (prev + 1) % images.length;
                }
            });
        }

        touchStartX.current = null;
        setPaused(false);
    };

    if (!images || images.length === 0) return null;

    // Calculate flex-grow values for strict aspect ratio in vertical mode
    let activeFlex = 12; // Default for horizontal
    let inactiveFlex = 1;

    // In FontDetails, vertical prop is false, but Tailwind md:flex-row means it's vertical on mobile.
    // So we need to compute flex mathematically based on actual orientation.
    const isVerticalOrientation = vertical || (typeof window !== 'undefined' && window.innerWidth < 768);

    if (images.length > 1 && isVerticalOrientation && dimensions.width > 0 && dimensions.height > 0) {
        // Target settings: Width = 3, Height = 2 (Aspect Ratio 3:2)
        // In vertical mode, Width is fixed (container width).
        // Target Height = Width * (2 / 3)
        const targetHeight = dimensions.width * (2 / 3);
        const remainingHeight = Math.max(0, dimensions.height - targetHeight);

        // Distribute remaining height among inactive items
        const inactiveItemHeight = remainingHeight / (images.length - 1);

        // Use pixel values as flex-grow ratios (this works because they sum to total height)
        // We ensure a minimum inactive height to prevent total collapse if container is too small
        activeFlex = targetHeight;
        inactiveFlex = Math.max(inactiveItemHeight, 1); // Avoid 0
    } else if (images.length > 1 && !isVerticalOrientation && dimensions.width > 0 && dimensions.height > 0) {
       // Target settings for horizontal mode (Aspect Ratio of active image should be roughly 3:2 or similar)
       // Let's try to make the active image's aspect ratio close to 3:2 (width:height) based on the current height
       // Height is fixed. Target Width = Height * (3 / 2)
       const targetWidth = dimensions.height * (3 / 2);
       const remainingWidth = Math.max(0, dimensions.width - targetWidth);
       const inactiveItemWidth = remainingWidth / (images.length - 1);
       
       activeFlex = targetWidth;
       inactiveFlex = Math.max(inactiveItemWidth, 1);
    } else if (images.length === 1) {
       // If only 1 image, flex grow doesn't really matter, it will take 100% space. 
       // We disable flex properties later if length === 1.
       activeFlex = 1;
    }

    return (
        <div
            ref={containerRef}
            className={`w-full h-full flex overflow-hidden bg-[rgb(var(--color-card))] group ${vertical ? 'flex-col rounded-4xl' : 'flex-col md:flex-row rounded-4xl border-2 border-[rgb(var(--color-border))]'}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {images.map((img, index) => (
                <button
                    key={img}
                    onClick={() => setActiveIndex(index)}
                    style={{
                        flexGrow: images.length > 1 ? (activeIndex === index ? activeFlex : inactiveFlex) : 1,
                        flexShrink: images.length > 1 ? (activeIndex === index ? 0 : 1) : 1,
                        flexBasis: images.length > 1 ? 0 : 'auto',
                    }}
                    className={`
                        relative
                        flex
                        cursor-pointer
                        select-none
                        transition-[flex-grow]
                        duration-700
                        ease-in-out
                        overflow-hidden
                        border-[rgb(var(--color-border))]
                        ${vertical
                            ? (images.length > 1 ? 'w-full border-b last:border-b-0' : 'w-full h-auto max-h-[80vh]')
                            : (images.length > 1 ? 'w-full md:w-auto md:h-full border-b md:border-b-0 md:border-r last:border-b-0 md:last:border-r-0' : 'w-full h-auto max-h-[80vh]')
                        }
            `}
                >
                    <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className={`absolute inset-0 object-cover ${images.length === 1 ? 'w-full h-full relative' : 'w-full h-full'}`}
                        draggable={false}
                    />

                    {/* Overlay */}
                    {images.length > 1 && (
                        <div
                            className={`
                            absolute inset-0 transition-colors duration-700
                            ${activeIndex === index ? 'bg-transparent' : 'bg-[rgb(var(--color-background)/0.4)]'}
                            `}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
