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

    if (vertical && dimensions.width > 0 && dimensions.height > 0) {
        // Target settings: Width = 3, Height = 2 (Aspect Ratio 3:2)
        // In vertical mode, Width is fixed (container width).
        // Target Height = Width * (2 / 3)
        const targetHeight = dimensions.width * (1 / 3);
        const remainingHeight = Math.max(0, dimensions.height - targetHeight);

        // Distribute remaining height among inactive items
        const inactiveItemHeight = remainingHeight / (images.length - 1);

        // Use pixel values as flex-grow ratios (this works because they sum to total height)
        // We ensure a minimum inactive height to prevent total collapse if container is too small
        activeFlex = targetHeight;
        inactiveFlex = Math.max(inactiveItemHeight, 1); // Avoid 0
    }

    return (
        <div
            ref={containerRef}
            className={`w-full h-full flex overflow-hidden bg-zinc-900 group ${vertical ? 'flex-col rounded-4xl' : 'flex-col md:flex-row rounded-4xl border-2 border-white/10'}`}
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
                        flexGrow: activeIndex === index ? activeFlex : inactiveFlex
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
            border-white/10
            ${vertical
                            ? 'w-full border-b last:border-b-0'
                            : 'w-full md:w-auto md:h-full border-b md:border-b-0 md:border-r last:border-b-0 md:last:border-r-0'
                        }
            `}
                >
                    <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                    />

                    {/* Overlay */}
                    <div
                        className={`
                absolute inset-0 transition-colors duration-700
                ${activeIndex === index ? 'bg-black/0' : 'bg-black/40'}
                `}
                    />
                </button>
            ))}
        </div>
    );
}
