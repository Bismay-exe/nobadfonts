'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Link } from 'react-router-dom';
import VariableProximity from '../components/VariableProximity';
// import SkyGradient from '../components/SkyGradient';

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
        <div ref={containerRef} className="@container zmax-w-480 min-h-screen text-foreground font-mono selection:bg-primary/0 selection:text-foreground overflow-hidden flex flex-col">

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center items-center relative py-14 bg-blackz mt-14 md:mt-18 mx-2 mb-0 md:mb-2"
            >
                <div className='absolute w-full h-full rounded-4xl overflow-hidden zbg-[#0000FF]'>
                    {/* <SkyGradient /> */}
                    {/* <HalftoneBloom /> */}
                    {/* <div className="absolute inset-0 w-full h-full bg-linear-to-b from-transparent zvia-background/50 to-background" /> */}
                </div>

                <div className="relative z-10 text-center mx-auto w-full">
                    {/* Heading */}
                    <h1 ref={titleRef} className="text-[10cqw] uppercase font-abc-gravity leading-[0.8] text-whitez" style={{ fontFamily: "'Abc Gravity Variable', sans-serif" }}>
                        <div>
                            <span className="hero-line block whitespace-nowrap">
                                <VariableProximity
                                    label="No"
                                    className="text-[10cqw]"
                                    fromFontVariationSettings="'wght' 100, 'wdth' 59"
                                    toFontVariationSettings="'wght' 900, 'wdth' 150"
                                    containerRef={containerRef}
                                    radius={120}
                                    falloff="gaussian"
                                />
                                {' '}
                                <VariableProximity
                                    label="bad"
                                    className=""
                                    fromFontVariationSettings="'wght' 900, 'wdth' 150"
                                    toFontVariationSettings="'wght' 100, 'wdth' 50"
                                    containerRef={containerRef}
                                    radius={120}
                                    falloff="gaussian"
                                />
                                {' '}
                                <VariableProximity
                                    label="fonts"
                                    className="italic"
                                    fromFontVariationSettings="'wght' 200, 'wdth' 85"
                                    toFontVariationSettings="'wght' 900, 'wdth' 150"
                                    containerRef={containerRef}
                                    radius={120}
                                    falloff="gaussian"
                                />
                            </span>
                        </div>
                        <div>
                            <span className="hero-line block whitespace-nowrap">
                                <VariableProximity
                                    label="Only"
                                    className="italic"
                                    fromFontVariationSettings="'wght' 100, 'wdth' 59"
                                    toFontVariationSettings="'wght' 900, 'wdth' 120"
                                    containerRef={containerRef}
                                    radius={120}
                                    falloff="gaussian"
                                />
                                {' '}
                                <VariableProximity
                                    label="good"
                                    className="tracking-tightz"
                                    fromFontVariationSettings="'wght' 700, 'wdth' 115"
                                    toFontVariationSettings="'wght' 900, 'wdth' 50"
                                    containerRef={containerRef}
                                    radius={120}
                                    falloff="gaussian"
                                />
                                {' '}
                                <VariableProximity
                                    label="Type."
                                    className=""
                                    fromFontVariationSettings="'wght' 200, 'wdth' 85"
                                    toFontVariationSettings="'wght' 900, 'wdth' 150"
                                    containerRef={containerRef}
                                    radius={120}
                                    falloff="gaussian"
                                />
                            </span>
                        </div>
                    </h1>

                    {/* Subtext & Actions */}
                    <div className='px-6 sm:px-8 md:px-26'>
                        <div className="hero-content mt-8 md:mt-12 max-w-xl mx-auto flex flex-col items-center gap-8">
                            <p className="text-md md:text-xl text-muted leading-none font-medium">
                                A curated directory of open-source typefaces that actually look good.
                                <br className='md:hidden'/>No clutter, just type.
                            </p>

                            {/* Search Bar / CTA */}
                            <div className="w-full max-w-md relative group scale-75 md:scale-100 text-muted font-sans">
                                <input
                                    type="text"
                                    placeholder="Try 'Inter' or 'Geist'..."
                                    className="w-full h-14 pl-6 pr-14 bg-foreground/5 backdrop-blur-sm rounded-2xl focus:border-none! focus:ring-0! outline-none transition-all placeholder:text-foreground/80 text-foreground font-medium font-inter-tight"
                                />
                                <button className="absolute right-2 top-2 h-10 w-10 bg-muted text-background rounded-xl flex items-center justify-center group-focus-within:bg-foreground transition-colors duration-300 ease-in-out">
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex gap-4 text-sm text-muted font-inter font-bold">
                                <span className='text-muted/50'>Popular:</span>
                                <Link to={`/fonts?query=thunder`} className="cursor-pointer hover:text-foreground transition-all duration-300 ease-in-out">Thunder</Link>
                                <Link to={`/fonts?query=offbit`} className="cursor-pointer hover:text-foreground transition-all duration-300 ease-in-out">Offbit</Link>
                                <Link to={`/fonts?query=pilowlava`} className="cursor-pointer hover:text-foreground transition-all duration-300 ease-in-out">Pilowlava</Link>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Hero;