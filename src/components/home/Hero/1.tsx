'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import NeatGradient from '../components/NeatGradient';

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
        <div ref={containerRef} className="@container max-w-480 h-full text-[rgb(var(--color-foreground))] font-mono selection:bg-[rgb(var(--color-primary)/0)] selection:text-[rgb(var(--color-foreground))] overflow-hidden flex flex-col -translate-y-20 min-h-[97vh] -mb-34">

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center items-center relative overflow-hidden p-4 sm:p-8 md:p-26 py-14 rounded-4xl
            z[background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,var(--color-blue-600),var(--color-white)_100%)]"
                // style={{
                //     background:
                //         "radial-gradient(45.33% 46.43% at 41.69% 50%, #0140FF 0%, rgba(1, 64, 255, 0) 100%), radial-gradient(28.41% 117.96% at 7.72% 28.75%, #A6FDFF 0%, rgba(255, 255, 255, 0) 100%), radial-gradient(37.39% 69.19% at 107.79% 0%, #0075FF 0%, rgba(0, 66, 255, 0) 100%), radial-gradient(54.38% 89.75% at 83.46% 89.75%, #26F9FF 0%, rgba(0, 69, 255, 0.6) 100%), #0140FF",
                // }}
            >

                {/* <img src="/gradients/72pt.png" alt=""
                    className='fixed h-full w-full object-cover rounded-4xl' 
                /> */}

                <NeatGradient />

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
                        <p className="text-md md:text-xl text-[rgb(var(--color-muted-foreground))] leading-none font-medium">
                            A curated directory of open-source typefaces that actually look good.
                            No clutter, just type.
                        </p>

                        {/* Search Bar / CTA */}
                        <div className="w-full max-w-md relative group scale-75 md:scale-100 text-[rgb(var(--color-muted-foreground))] font-sans">
                            <input
                                type="text"
                                placeholder="Try 'Inter' or 'Geist'..."
                                className="w-full h-14 pl-6 pr-14 bg-[rgb(var(--color-background))] rounded-2xl border border-[rgb(var(--color-foreground))] focus:border-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] outline-none transition-all placeholder:text-[rgb(var(--color-foreground)/0.8)] font-medium"
                            />
                            <button className="absolute right-2 top-2 h-10 w-10 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-xl flex items-center justify-center group-focus-within:bg-[rgb(var(--color-primary))] transition-colors">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex gap-4 text-sm text-[rgb(var(--color-muted-foreground))] font-inter font-bold">
                            <span className='text-[rgb(var(--color-muted-foreground)/0.5)]'>Popular:</span>
                            <span className="cursor-pointer hover:underline decoration-[rgb(var(--color-primary))] underline-offset-4">Helvetica</span>
                            <span className="cursor-pointer hover:underline decoration-[rgb(var(--color-primary))] underline-offset-4">Futura</span>
                            <span className="cursor-pointer hover:underline decoration-[rgb(var(--color-primary))] underline-offset-4">Garamond</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Hero;