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
    // const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

    const touchStartX = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);

    // Pre-calculate natural aspect ratios for all images
    useEffect(() => {
        if (!images || images.length === 0) return;

        images.forEach((src) => {
            if (!src) return;
            const img = new Image();
            img.src = src;

            const updateRatio = () => {
                if (img.naturalWidth && img.naturalHeight) {
                    const ratio = img.naturalWidth / img.naturalHeight;
                    setAspectRatios((prev) => {
                        if (prev[src] === ratio) return prev;
                        return { ...prev, [src]: ratio };
                    });
                }
            };

            if (img.complete && img.naturalWidth) {
                updateRatio();
            } else {
                img.onload = updateRatio;
            }
        });
    }, [images]);

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
                // setLoadedImages((s) => new Set([...s, next]));
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
                    // setLoadedImages((s) => new Set([...s, next]));
                    return next;
                });
            }
            touchStartX.current = null;
            setPaused(false);
        },
        [images.length]
    );

    const handleClick = useCallback((index: number) => {
        // setLoadedImages((s) => new Set([...s, index]));
        setActiveIndex(index);
    }, []);

    if (!images || images.length === 0) return null;

    // Calculate flex-grow values based on the active image's natural aspect ratio
    let activeFlex = 12;
    let inactiveFlex = 1;

    const isVerticalOrientation =
        vertical || (dimensions.width > 0 ? dimensions.width < 768 : (typeof window !== 'undefined' && window.innerWidth < 768));

    const activeSrc = images[activeIndex];
    const activeRatio = (activeSrc && aspectRatios[activeSrc]) || (3 / 2);

    if (
        images.length > 1 &&
        isVerticalOrientation &&
        dimensions.width > 0 &&
        dimensions.height > 0
    ) {
        // Vertical mode (column): expanded slide height scales to display the full image width & height
        const idealTargetHeight = dimensions.width / activeRatio;
        const minInactiveTotal = Math.max(24 * (images.length - 1), dimensions.height * 0.08);
        const maxTargetHeight = Math.max(dimensions.height * 0.4, dimensions.height - minInactiveTotal);
        const minTargetHeight = dimensions.height / images.length;

        const targetHeight = Math.max(minTargetHeight, Math.min(idealTargetHeight, maxTargetHeight));
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
        // Horizontal mode (row): expanded slide width scales to display the full image width & height
        const idealTargetWidth = dimensions.height * activeRatio;
        const minInactiveTotal = Math.max(28 * (images.length - 1), dimensions.width * 0.05);
        const maxTargetWidth = Math.max(dimensions.width * 0.4, dimensions.width - minInactiveTotal);
        const minTargetWidth = dimensions.width / images.length;

        const targetWidth = Math.max(minTargetWidth, Math.min(idealTargetWidth, maxTargetWidth));
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
            className={`w-full h-full flex overflow-hidden bg-card-background group ${vertical ? 'flex-col rounded-4xl' : 'flex-col md:flex-row rounded-4xl border border-border/50'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {images.map((img, index) => {
                const isActive = activeIndex === index;
                // const shouldLoad = loadedImages.has(index) || isActive;
                const shouldLoad = true;

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
                        className={`relative flex cursor-pointer select-none transition-[flex-grow] duration-700 ease-in-out overflow-hidden border-border/50 active:scale-100!
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
                                loading={isActive ? 'eager' : 'lazy'}
                                decoding="async"
                                onLoad={(e) => {
                                    const target = e.currentTarget;
                                    if (target.naturalWidth && target.naturalHeight) {
                                        const ratio = target.naturalWidth / target.naturalHeight;
                                        setAspectRatios((prev) => {
                                            if (prev[img] === ratio) return prev;
                                            return { ...prev, [img]: ratio };
                                        });
                                    }
                                }}
                                className={`absolute inset-0 w-full h-full transition-all duration-100 ease-in-out ${
                                    isActive ? 'object-cover object-center' : 'object-cover object-center'
                                } ${images.length === 1 ? 'relative' : ''}`}
                                draggable={false}
                            />
                        )}

                        {/* Overlay */}
                        {images.length > 1 && (
                            <div
                                className={`
                                absolute inset-0 transition-colors ease-in-out duration-700 pointer-events-none
                                ${isActive ? 'bg-transparent' : 'bg-background/70 hover:bg-background/20'}
                                `}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
});
