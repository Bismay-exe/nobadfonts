'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import NeatGradient from '../components/NeatGradient';
import { Link } from 'react-router-dom';

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
        <div ref={containerRef} className="@container max-w-480 min-h-screen text-[rgb(var(--color-foreground))] font-mono selection:bg-[rgb(var(--color-primary)/0)] selection:text-[rgb(var(--color-foreground))] overflow-hidden flex flex-col">

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center items-center relative overflow-hidden p-4 sm:p-8 md:p-26 py-14"
            >
                {/* <NeatGradient /> */}

                <div className='absolute w-full h-full'>
                    <img src="https://images.unsplash.com/photo-1694868162090-382eae3ee23a?q=80&w=2060&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" className='top-0 left-0 w-full h-full object-cover rounded-4xl p-0.5' />
                    {/* <div className="absolute inset-0 w-full h-full bg-linear-to-b from-transparent via-[rgb(var(--color-background)/0.7)] to-[rgb(var(--color-background))]" /> */}
                </div>

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
                                className="w-full h-14 pl-6 pr-14 bg-[rgb(var(--color-background)/0.5)] rounded-2xl focus:border-none! focus:ring-0! outline-none transition-all placeholder:text-[rgb(var(--color-foreground)/0.8)] text-[rgb(var(--color-foreground))] font-medium font-inter-tight"
                            />
                            <button className="absolute right-2 top-2 h-10 w-10 bg-[rgb(var(--color-muted-foreground))] text-[rgb(var(--color-background))] rounded-xl flex items-center justify-center group-focus-within:bg-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex gap-4 text-sm text-[rgb(var(--color-muted-foreground))] font-inter font-bold">
                            <span className='text-[rgb(var(--color-muted-foreground)/0.5)]'>Popular:</span>
                            <Link to={`/fonts?query=thunder`} className="cursor-pointer hover:text-[rgb(var(--color-foreground))] transition-all duration-300 ease-in-out">Thunder</Link>
                            <Link to={`/fonts?query=offbit`} className="cursor-pointer hover:text-[rgb(var(--color-foreground))] transition-all duration-300 ease-in-out">Offbit</Link>
                            <Link to={`/fonts?query=pilowlava`} className="cursor-pointer hover:text-[rgb(var(--color-foreground))] transition-all duration-300 ease-in-out">Pilowlava</Link>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Hero;