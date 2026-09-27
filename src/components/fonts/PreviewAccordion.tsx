import { useEffect, useRef, useState, memo, useCallback } from 'react';

const AUTO_CYCLE_INTERVAL = 4000;

export const PreviewAccordion = memo(function PreviewAccordion({
    images,
    vertical = false,
}: {
    images: string[];
    vertical?: boolean;
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const touchStartX = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);

    // IntersectionObserver — only animate/cycle when on screen
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                setIsVisible(entries[0].isIntersecting);
            },
            { rootMargin: '200px' }
        );
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // ResizeObserver — throttled
    useEffect(() => {
        if (!containerRef.current) return;
        let rafId: number | null = null;

        const observer = new ResizeObserver((entries) => {
            if (rafId) return; // throttle: skip if a frame is already queued
            rafId = requestAnimationFrame(() => {
                rafId = null;
                const entry = entries[0];
                if (entry) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height,
                    });
                }
            });
        });

        observer.observe(containerRef.current);
        return () => {
            observer.disconnect();
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    // Auto-cycle — only when visible and not paused
    useEffect(() => {
        if (paused || !isVisible || images.length <= 1) return;

        intervalRef.current = window.setInterval(() => {
            setActiveIndex((prev) => {
                const next = (prev + 1) % images.length;
                // Pre-load the next image
                setLoadedImages((s) => new Set([...s, next]));
                return next;
            });
        }, AUTO_CYCLE_INTERVAL);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [paused, isVisible, images.length]);

    const handleMouseEnter = useCallback(() => setPaused(true), []);
    const handleMouseLeave = useCallback(() => setPaused(false), []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setPaused(true);
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            if (touchStartX.current === null) return;
            const deltaX = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(deltaX) > 50) {
                setActiveIndex((prev) => {
                    const next =
                        deltaX > 0
                            ? prev === 0
                                ? images.length - 1
                                : prev - 1
                            : (prev + 1) % images.length;
                    setLoadedImages((s) => new Set([...s, next]));
                    return next;
                });
            }
            touchStartX.current = null;
            setPaused(false);
        },
        [images.length]
    );

    const handleClick = useCallback((index: number) => {
        setLoadedImages((s) => new Set([...s, index]));
        setActiveIndex(index);
    }, []);

    if (!images || images.length === 0) return null;

    // Calculate flex-grow values for strict aspect ratio in vertical mode
    let activeFlex = 12;
    let inactiveFlex = 1;

    const isVerticalOrientation =
        vertical || (typeof window !== 'undefined' && window.innerWidth < 768);

    if (
        images.length > 1 &&
        isVerticalOrientation &&
        dimensions.width > 0 &&
        dimensions.height > 0
    ) {
        const targetHeight = dimensions.width * (2 / 3);
        const remainingHeight = Math.max(0, dimensions.height - targetHeight);
        const inactiveItemHeight = remainingHeight / (images.length - 1);
        activeFlex = targetHeight;
        inactiveFlex = Math.max(inactiveItemHeight, 1);
    } else if (
        images.length > 1 &&
        !isVerticalOrientation &&
        dimensions.width > 0 &&
        dimensions.height > 0
    ) {
        const targetWidth = dimensions.height * (3 / 2);
        const remainingWidth = Math.max(0, dimensions.width - targetWidth);
        const inactiveItemWidth = remainingWidth / (images.length - 1);
        activeFlex = targetWidth;
        inactiveFlex = Math.max(inactiveItemWidth, 1);
    } else if (images.length === 1) {
        activeFlex = 1;
    }

    return (
        <div
            ref={containerRef}
            className={`w-full h-full flex overflow-hidden bg-[rgb(var(--color-card))] group ${vertical ? 'flex-col rounded-4xl' : 'flex-col md:flex-row rounded-4xl border border-[rgb(var(--color-border)/0.5)]'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {images.map((img, index) => {
                const isActive = activeIndex === index;
                const shouldLoad = loadedImages.has(index) || isActive;

                return (
                    <button
                        key={img}
                        onClick={() => handleClick(index)}
                        style={{
                            flexGrow:
                                images.length > 1
                                    ? isActive
                                        ? activeFlex
                                        : inactiveFlex
                                    : 1,
                            flexShrink:
                                images.length > 1 ? (isActive ? 0 : 1) : 1,
                            flexBasis: images.length > 1 ? 0 : 'auto',
                            // Only hint GPU compositing for the active item
                            willChange: isActive ? 'flex-grow' : 'auto',
                            // CSS contain hints to reduce layout thrashing
                            contain: 'layout style',
                        }}
                        className={`relative flex cursor-pointer select-none transition-[flex-grow] duration-700 ease-in-out overflow-hidden border-[rgb(var(--color-border)/0.5)]
                            ${
                                vertical
                                    ? images.length > 1
                                        ? 'w-full border-b last:border-b-0'
                                        : 'w-full h-auto max-h-[80vh]'
                                    : images.length > 1
                                      ? 'w-full md:w-auto md:h-full border-b md:border-b-0 md:border-r last:border-b-0 md:last:border-r-0'
                                      : 'w-full h-auto max-h-[80vh]'
                            }
                        `}
                    >
                        {shouldLoad && (
                            <img
                                src={img}
                                alt={`Typography specimen preview image ${index + 1}`}
                                loading="lazy"
                                decoding="async"
                                className={`absolute inset-0 object-cover ${images.length === 1 ? 'w-full h-full relative' : 'w-full h-full'}`}
                                draggable={false}
                            />
                        )}

                        {/* Overlay */}
                        {images.length > 1 && (
                            <div
                                className={`
                                absolute inset-0 transition-colors ease-in-out duration-700
                                ${isActive ? 'bg-transparent' : 'bg-[rgb(var(--color-background)/0.4)]'}
                                `}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
});
