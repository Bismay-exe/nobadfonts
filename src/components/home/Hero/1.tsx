'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const Hero = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

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



        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full bg-[#EEEFEB] border-t-2 border-[#1C1D1E] rounded-4xl text-[#1C1D1E] font-rockinsoda selection:bg-[#ff0000] selection:text-[#EEEFEB] overflow-hidden flex flex-col">

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center items-center relative p-4 sm:p-8 md:p-26 py-14">

                {/* Decorative background blur ([#ff0000] glow) */}
                <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-[#1C1D1E]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[20vw] h-[20vw] bg-[#1C1D1E]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center mx-auto">
                    {/* Heading */}
                    <h1 ref={titleRef} className="text-[11vw] md:text-[10vw] font-lct-mogi uppercase leading-[0.8]">
                        <div>
                            <span className="hero-line block">No Bad Fonts.</span>
                        </div>
                        <div>
                            <span className="hero-line block">
                                Only <span className="text-[#ff0000] italic font-western font-normal normal-case tracking-tight">good</span> Type.
                            </span>
                        </div>
                    </h1>

                    {/* Subtext & Actions */}
                    <div className="hero-content mt-8 md:mt-12 max-w-xl mx-auto flex flex-col items-center gap-8">
                        <p className="text-lg md:text-xl text-[#1C1D1E]/60 leading-relaxed font-medium">
                            A curated directory of open-source typefaces that actually look good.
                            No clutter, just type.
                        </p>

                        {/* Search Bar / CTA */}
                        <div className="w-full max-w-md relative group scale-75 md:scale-100">
                            <input
                                type="text"
                                placeholder="Try 'Inter' or 'Geist'..."
                                className="w-full h-14 pl-6 pr-14 bg-[#1C1D1E] text-[#EEEFEB]/80 rounded-2xl border border-[#1C1D1E] focus:border-[#ff0000] focus:bg-[#1C1D1E] outline-none transition-all placeholder:text-[#EEEFEB]/80 font-medium"
                            />
                            <button className="absolute right-2 top-2 h-10 w-10 bg-[#EEEFEB] text-[#1C1D1E] rounded-xl flex items-center justify-center group-focus-within:bg-[#ff0000] transition-colors">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex gap-4 text-sm text-[#1C1D1E]/80">
                            <span className='text-gray-500'>Popular:</span>
                            <span className="cursor-pointer hover:underline decoration-[#ff0000] underline-offset-4">Helvetica</span>
                            <span className="cursor-pointer hover:underline decoration-[#ff0000] underline-offset-4">Futura</span>
                            <span className="cursor-pointer hover:underline decoration-[#ff0000] underline-offset-4">Garamond</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Hero;