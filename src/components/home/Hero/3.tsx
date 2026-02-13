'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const TextImageReveal: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis();
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        const ctx = gsap.context(() => {
            // We still target the 'line' and 'img-span' classes used in the JSX
            const lines = document.querySelectorAll('.line');

            lines.forEach((line) => {
                const imgSpan = line.querySelector('.img-span');

                if (imgSpan) {
                    gsap.to(imgSpan, {
                        width: 300,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: line,
                            start: 'top 90%',
                            end: 'top 40%',
                            scrub: 1,
                        },
                    });
                }
            });
        }, containerRef);

        return () => {
            ctx.revert();
            lenis.destroy();
            gsap.ticker.remove(lenis.raf);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="min-h-screen w-full overflow-x-hidden bg-[#f5f5f0] text-[#1a1a1a] font-['Bricolage_Grotesque',_sans-serif]"
        >
            {/* Load Fonts via HTML links instead of CSS @import */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap"
                rel="stylesheet"
            />

            {/* Intro Section */}
            <div className="intro h-screen w-screen flex justify-center items-center">
                <h1 className="font-['Inter',_sans-serif] text-[1rem] font-light tracking-[2px] uppercase text-[#999]">
                    Scroll to explore
                </h1>
            </div>

            {/* Main Content Container */}
            <div className=" flex flex-col justify-center items-center w-screen h-screen">
                {/* Line 1 */}
                <div className="line flex justify-center items-center gap-5">
                    <span className="text-[7.5rem] font-bold tracking-[-4px] inline-block overflow-hidden whitespace-nowrap leading-none">
                        We craft
                    </span>
                    <span className="img-span h-[110px] w-0 rounded-[5px] overflow-hidden relative inline-block align-middle">
                        <img
                            className="h-full w-[300px] absolute left-1/2 -translate-x-1/2 rounded-[5px] object-cover object-center max-w-none"
                            src="https://i.pinimg.com/1200x/93/27/65/932765c7cd00055218ba7398119d7d4d.jpg"
                            alt="Craft"
                        />
                    </span>
                    <span className="text-[7.5rem] font-bold tracking-[-4px] inline-block overflow-hidden whitespace-nowrap leading-none">
                        digital
                    </span>
                </div>

                {/* Line 2 */}
                <div className="line flex justify-center items-center gap-5">
                    <span className="text-[7.5rem] font-bold tracking-[-4px] inline-block overflow-hidden whitespace-nowrap leading-none">
                        experiences
                    </span>
                    <span className="img-span h-[110px] w-0 rounded-[5px] overflow-hidden relative inline-block align-middle">
                        <img
                            className="h-full w-[300px] absolute left-1/2 -translate-x-1/2 rounded-[5px] object-cover object-center max-w-none"
                            src="https://i.pinimg.com/736x/a9/f1/19/a9f11909a9644d7bfd5102fabcd8310c.jpg"
                            alt="Experiences"
                        />
                    </span>
                    <span className="text-[7.5rem] font-bold tracking-[-4px] inline-block overflow-hidden whitespace-nowrap leading-none">
                        that
                    </span>
                </div>

                {/* Line 3 */}
                <div className="line flex justify-center items-center gap-5">
                    <span className="text-[7.5rem] font-bold tracking-[-4px] inline-block overflow-hidden whitespace-nowrap leading-none">
                        inspire
                    </span>
                    <span className="img-span h-[110px] w-0 rounded-[5px] overflow-hidden relative inline-block align-middle">
                        <img
                            className="h-full w-[300px] absolute left-1/2 -translate-x-1/2 rounded-[5px] object-cover object-center max-w-none"
                            src="https://i.pinimg.com/1200x/48/09/77/480977567d6b4503c8f642728f266b72.jpg"
                            alt="Inspire"
                        />
                    </span>
                </div>

                {/* Line 4 */}
                <div className="line flex justify-center items-center gap-5">
                    <span className="text-[7.5rem] font-bold tracking-[-4px] inline-block overflow-hidden whitespace-nowrap leading-none">
                        and move
                    </span>
                </div>

                {/* Line 5 */}
                <div className="line flex justify-center items-center gap-5">
                    <span className="text-[7.5rem] font-bold tracking-[-4px] inline-block overflow-hidden whitespace-nowrap leading-none">
                        people
                    </span>
                    <span className="img-span h-[110px] w-0 rounded-[5px] overflow-hidden relative inline-block align-middle">
                        <img
                            className="h-full w-[300px] absolute left-1/2 -translate-x-1/2 rounded-[5px] object-cover object-center max-w-none"
                            src="https://i.pinimg.com/1200x/9e/f2/b7/9ef2b73b1e2ff489f99bc0a90196fbea.jpg"
                            alt="People"
                        />
                    </span>
                    <span className="text-[7.5rem] font-bold tracking-[-4px] inline-block overflow-hidden whitespace-nowrap leading-none">
                        forward.
                    </span>
                </div>
            </div>

            <div className="outro h-screen w-screen"></div>
        </div>
    );
};

export default TextImageReveal;