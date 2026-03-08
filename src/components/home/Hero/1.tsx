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
        <div ref={containerRef} className="@container max-w-480 h-full text-[#EEEFEB] font-mono selection:bg-[#ff0000] selection:text-[#1C1D1E] overflow-hidden flex flex-col">

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center items-center relative p-4 sm:p-8 md:p-26 py-14">

                <div className="relative z-10 text-center mx-auto">
                    {/* Heading */}
                    <h1 ref={titleRef} className="text-[10cqw] uppercase font-abc-gravity leading-[0.8]">
                        <div>
                            <span className="hero-line block"><span className='font-thin'>No</span> <span className='font-black'>bad</span> <span className='italic font-extralight'>fonts</span></span>
                        </div>
                        <div>
                            <span className="hero-line block">
                                <span className='italic font-thin'>Only</span> <span className="font-bold tracking-tight">good</span> <span className='font-extralight'>Type.</span>
                            </span>
                        </div>
                    </h1>

                    {/* Subtext & Actions */}
                    <div className="hero-content mt-8 md:mt-12 max-w-xl mx-auto flex flex-col items-center gap-8">
                        <p className="text-md md:text-xl text-gray-600 leading-none font-medium">
                            A curated directory of open-source typefaces that actually look good.
                            No clutter, just type.
                        </p>

                        {/* Search Bar / CTA */}
                        <div className="w-full max-w-md relative group scale-75 md:scale-100 text-gray-400 font-sans">
                            <input
                                type="text"
                                placeholder="Try 'Inter' or 'Geist'..."
                                className="w-full h-14 pl-6 pr-14 bg-[#1C1D1E] rounded-2xl border border-[#1C1D1E] focus:border-none focus:bg-[#1C1D1E] outline-none transition-all placeholder:text-[#EEEFEB]/80 font-medium"
                            />
                            <button className="absolute right-2 top-2 h-10 w-10 bg-[#EEEFEB] text-[#1C1D1E] rounded-xl flex items-center justify-center group-focus-within:bg-[#ff0000] transition-colors">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex gap-4 text-sm text-gray-300 font-inter font-bold">
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