'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { useLenis } from '../../hooks/useLenis';

gsap.registerPlugin(ScrollTrigger);

const MARQUEE_DATA = [
    {
        id: "marquee-1",
        items: [
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/s/k/skybold-demo-font-2-large.avif' },
            { type: 'text', content: 'Unique' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/y/o/yourbold-font-6-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/k/i/kitora-font-1-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/o/r/oreon-font-15-large.avif' },
        ]
    },
    {
        id: "marquee-2",
        items: [
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/h/a/hatori-demo-font-6-original.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/k/u/kunatic-demo-font-7-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/a/rantaro-font-8-original.avif' },
            { type: 'text', content: 'Release' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/o/rotio-demo-font-11-large.avif' },
        ]
    },
    {
        id: "marquee-3",
        items: [
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/n/e/nevanta-font-3-large.avif' },
            { type: 'text', content: 'Over' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/a/l/alphatron-demo-font-2-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/c/o/copixel-font-7-original.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/o/roena-font-7-large.avif' },
        ]
    },
    {
        id: "marquee-4",
        items: [
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/e/a/eatvetica-font-7-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/e/reshiga-font-6-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/y/o/yourbold-font-5-large.avif' },
            { type: 'text', content: '1000' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/o/roxhead-font-7-large.avif' },
        ]
    },
    {
        id: "marquee-5",
        items: [
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/s/k/skybold-demo-font-2-large.avif' },
            { type: 'text', content: 'Fonts' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/y/o/yourbold-font-6-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/k/i/kitora-font-1-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/o/r/oreon-font-15-large.avif' },
        ]
    },
    {
        id: "marquee-6",
        items: [
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/h/a/hatori-demo-font-6-original.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/k/u/kunatic-demo-font-7-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/a/rantaro-font-8-original.avif' },
            { type: 'text', content: 'Curated' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/o/rotio-demo-font-11-large.avif' },
        ]
    },
    {
        id: "marquee-7",
        items: [
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/n/e/nevanta-font-3-large.avif' },
            { type: 'text', content: 'For' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/a/l/alphatron-demo-font-2-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/c/o/copixel-font-7-original.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/o/roena-font-7-large.avif' },
        ]
    },
    {
        id: "marquee-8",
        items: [
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/e/a/eatvetica-font-7-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/e/reshiga-font-6-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/y/o/yourbold-font-5-large.avif' },
            { type: 'text', content: 'Real' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/r/o/roxhead-font-7-large.avif' },
        ]
    },
    {
        id: "marquee-9",
        items: [
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/s/k/skybold-demo-font-2-large.avif' },
            { type: 'text', content: 'Use' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/y/o/yourbold-font-6-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/k/i/kitora-font-1-large.avif' },
            { type: 'image', src: 'https://st.1001fonts.net/img/illustrations/o/r/oreon-font-15-large.avif' },
        ]
    }
];

const Landing5 = () => {
    useLenis();
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {

        const ctx = gsap.context(() => {
            // 1. Split Text
            // Note: We target the specific Tailwind class structure now
            new SplitType('.item .marquee-text', { types: 'chars' });

            // 2. Marquee Animation
            const marqueeContainers = document.querySelectorAll('.marquee-container');

            marqueeContainers.forEach((container, index) => {
                let start = '0%';
                let end = '-15%';

                if (index % 2 === 0) {
                    start = '0%';
                    end = '10%';
                }

                const marquee = container.querySelector('.marquee');
                const words = marquee?.querySelectorAll('.item .marquee-text');

                gsap.fromTo(
                    marquee,
                    { x: start },
                    {
                        x: end,
                        scrollTrigger: {
                            trigger: container,
                            start: 'top bottom',
                            end: '150% top',
                            scrub: true,
                        },
                    }
                );

                words?.forEach((word) => {
                    const chars = Array.from(word.querySelectorAll('.char'));
                    if (chars.length) {
                        const reverse = index % 2 !== 0;
                        const staggerOptions = {
                            each: 0.35,
                            from: reverse ? 'start' : 'end',
                            ease: 'linear',
                        } as gsap.StaggerVars;

                        gsap.fromTo(
                            chars,
                            { fontWeight: 100 },
                            {
                                fontWeight: 900,
                                duration: 1,
                                ease: 'none',
                                stagger: staggerOptions,
                                scrollTrigger: {
                                    trigger: container,
                                    start: '50% bottom',
                                    end: 'top top',
                                    scrub: true,
                                },
                            }
                        );
                    }
                });
            });
        }, containerRef);

        return () => {
            ctx.revert();
        };
    }, []);

    return (
        <div className="main-wrapper font-['Big_Shoulders_Display'] w-full h-full overflow-x-hidden" ref={containerRef}>
            {/* Remaining Standard CSS:
        - Font Face imports
        - Lenis requirement classes
        - Specific initial positioning for marquees (complex ID selectors)
      */}
            <style>{`

            /* Lenis Required Styles */
            html.lenis, html.lenis body { height: auto; }
            .lenis.lenis-smooth { scroll-behavior: auto !important; }
            .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
            .lenis.lenis-stopped { overflow: hidden; }
            .lenis.lenis-smooth iframe { pointer-events: none; }

            /* Specific initial positions for marquees.
            While possible in Tailwind, these ID-specific overrides 
            are cleaner in CSS when handling "alternating" logic.
            */
            #marquee-1 .marquee,
            #marquee-3 .marquee {
            left: -15%;
            }

            @media (max-width: 900px) {
            #marquee-2 .marquee,
            #marquee-4 .marquee {
                left: -35%;
            }
            }
        `}</style>

            <div>

                {/* Marquees Section */}
                <section className="marquees h-full md:h-full flex flex-col justify-center bg-[rgb(var(--color-card))] rounded-4xl border-y border-[rgb(var(--color-foreground))] overflow-hidden">
                    {MARQUEE_DATA.map((marquee) => (
                        <div
                            key={marquee.id}
                            className="marquee-container relative w-[250%] md:w-[125%] h-37.5 md:h-62.5 flex gap-4 my-4 overflow-hidden"
                            id={marquee.id}
                        >
                            <div className="marquee w-full h-full absolute top-1/2 left-0 -translate-y-1/2 flex gap-4">
                                {marquee.items.map((item, colIndex) => (
                                    <React.Fragment key={colIndex}>
                                        {item.type === 'text' ? (
                                            <div className="item with-text flex-1 md:flex-[1.5] flex justify-center items-center bg-transparent">
                                                <div className="marquee-text uppercase text-[60px] md:text-[190px] font-thin m-0 text-[rgb(var(--color-foreground))]">
                                                    {item.content}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="item aspect-3/2 w-full flex-1 flex justify-center items-center overflow-hidden bg-[rgb(var(--color-muted))] rounded-xl md:rounded-2xl lg:rounded-4xl">
                                                <img
                                                    src={item.src}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>

                {/* Services Section */}
                <section className="services w-full min-h-screen p-8 md:p-16 bg-[rgb(var(--color-card))] text-[rgb(var(--color-foreground))] rounded-4xl border-y border-[rgb(var(--color-foreground))] flex items-center">
                    <p className="text-[24px] md:text-[42px] font-medium uppercase leading-[1.1]">
                        In this meticulously designed dystopian world, you'll find yourself
                        immersed in stories of resilience and intrigue.
                    </p>
                </section>

                {/* Footer Section */}
                <section className="footer w-full h-screen flex justify-center items-center rounded-4xl bg-[rgb(var(--color-card))] border-y border-[rgb(var(--color-foreground))] text-[rgb(var(--color-foreground))]">
                    <h2 className="text-[10vw] uppercase">The End</h2>
                </section>
            </div>
        </div>
    );
};

export default Landing5;