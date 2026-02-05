'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const Hero = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // 1. Navigation Fade In
            tl.from('nav', {
                y: -20,
                opacity: 0,
                duration: 0.8,
            });

            // 2. Main Title Stagger (Lines)
            tl.from('.hero-line', {
                y: 100,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                skewY: 2,
            }, '-=0.4');

            // 3. Subtext & Search Bar
            tl.from('.hero-content', {
                y: 20,
                opacity: 0,
                duration: 0.8,
            }, '-=0.8');

            // 4. Floating Elements (Subtle parallax on load)
            tl.from('.floating-badge', {
                scale: 0,
                opacity: 0,
                duration: 1,
                ease: 'back.out(1.7)',
            }, '-=0.6');

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="w-full bg-black border-t-2 border-black rounded-3xl text-white font-rockinsoda selection:bg-red-500 selection:text-white overflow-hidden flex flex-col">

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center items-center relative p-4 sm:p-8 md:p-16 py-14">

                {/* Decorative background blur (Red-500 glow) */}
                <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[20vw] h-[20vw] bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center max-w-5xl mx-auto">
                    {/* Heading */}
                    <h1 ref={titleRef} className="text-[12vw] md:text-[8vw] font-bold leading-[0.9] tracking-wide">
                        <div className="overflow-hidden">
                            <span className="hero-line block">Premium Quality.</span>
                        </div>
                        <div className="overflow-">
                            <span className="hero-line block text-white/90">
                                Zero <span className="text-red-500 italic font-western font-normal tracking-tight">bad</span> Choices.
                            </span>
                        </div>
                    </h1>

                    {/* Subtext & Actions */}
                    <div className="hero-content mt-8 md:mt-12 max-w-xl mx-auto flex flex-col items-center gap-8">
                        <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-medium">
                            A curated directory of open-source typefaces that actually look good.
                            No clutter, just type.
                        </p>

                        {/* Search Bar / CTA */}
                        <div className="w-full max-w-md relative group scale-75 md:scale-100">
                            <input
                                type="text"
                                placeholder="Try 'Inter' or 'Geist'..."
                                className="w-full h-14 pl-6 pr-14 bg-gray-50 rounded-xl border border-transparent focus:border-red-500 focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium"
                            />
                            <button className="absolute right-2 top-2 h-10 w-10 bg-black text-white rounded-lg flex items-center justify-center group-focus-within:bg-red-500 transition-colors">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex gap-4 text-sm font-semibold text-gray-400">
                            <span>Popular:</span>
                            <span className="text-black cursor-pointer hover:underline decoration-red-500 underline-offset-4">Helvetica</span>
                            <span className="text-black cursor-pointer hover:underline decoration-red-500 underline-offset-4">Futura</span>
                            <span className="text-black cursor-pointer hover:underline decoration-red-500 underline-offset-4">Garamond</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Hero;