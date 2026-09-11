'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { NeatGradient, type NeatConfig } from '@firecms/neat';

const config: NeatConfig & Record<string, unknown> = {
    colors: [
        {
            color: '#080808',
            enabled: true,
        },
        {
            color: '#080808',
            enabled: true,
        },
        {
            color: '#0C2255',
            enabled: true,
        },
        {
            color: '#1247BB',
            enabled: true,
        },
        {
            color: '#4380FF',
            enabled: true,
        },
        {
            color: '#A6C7FF',
            enabled: true,
        },
    ],
    speed: 4,
    horizontalPressure: 4,
    verticalPressure: 3,
    waveFrequencyX: 0,
    waveFrequencyY: 0,
    waveAmplitude: 0,
    secondaryWaveEnabled: false,
    secondaryWaveFrequencyX: 3,
    secondaryWaveFrequencyY: 3,
    secondaryWaveAmplitude: 5,
    secondaryWaveSpeed: 0.6,
    secondaryWaveAngle: 1,
    shadows: 2,
    highlights: 7,
    colorBrightness: 1,
    colorSaturation: 8,
    wireframe: false,
    antialias: false,
    colorBlending: 5,
    backgroundColor: '#FF0000',
    backgroundAlpha: 1,
    grainScale: 0,
    grainSparsity: 0,
    grainIntensity: 0,
    grainSpeed: 0,
    resolution: 0.5,
    yOffset: 1059,
    yOffsetWaveMultiplier: 1.5,
    yOffsetColorMultiplier: 1.8,
    yOffsetFlowMultiplier: 2,
    flowDistortionA: 0.5126418056211617,
    flowDistortionB: 3.5115422591605348,
    flowScale: 1.576471923411623,
    flowEase: 0.21462982601001568,
    flowEnabled: false,
    enableProceduralTexture: false,
    transparentTextureVoid: false,
    textureMode: 'bitmap',
    bakeEdgeSoftness: 1,
    textureVoidLikelihood: 0.22158271334009697,
    textureVoidWidthMin: 98.70247771257357,
    textureVoidWidthMax: 378.2024266166359,
    textureBandDensity: 2.182004597904014,
    textureColorBlending: 0.04125337618420408,
    textureSeed: 8011,
    textureEase: 0.75,
    proceduralBackgroundColor: '#F6F6F6',
    textureShapeTriangles: 20,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
    domainWarpEnabled: false,
    domainWarpIntensity: 0,
    domainWarpScale: 3,
    vignetteIntensity: 0,
    vignetteRadius: 0.8,
    fresnelEnabled: false,
    fresnelPower: 2,
    fresnelIntensity: 0.5,
    fresnelColor: '#FFFFFF',
    iridescenceEnabled: false,
    iridescenceIntensity: 0.5,
    iridescenceSpeed: 1,
    prismEdgeEnabled: false,
    prismEdgeIntensity: 0.5,
    prismEdgeThinness: 3,
    prismEdgeSpread: 1,
    prismEdgeSpeed: 0.5,
    prismEdgeRipple: 1,
    bloomIntensity: 0,
    bloomThreshold: 0.7,
    chromaticAberration: 0,
    shapeType: 'plane',
    shapeRotationX: 0,
    shapeRotationY: 0,
    shapeRotationZ: 0,
    shapeAutoRotateSpeedX: 0,
    shapeAutoRotateSpeedY: 0,
    sphereRadius: 15,
    torusRadius: 15,
    torusTube: 5,
    cylinderRadius: 10,
    cylinderHeight: 40,
    planeBend: 0,
    planeTwist: 0,
    silhouetteFade: 0.25,
    cylinderFade: 0.08,
    ribbonFade: 0.05,
    flatShading: true,
    cameraLock: true,
    cameraX: 0,
    cameraY: 0,
    cameraZ: 0,
    cameraRotationX: 0,
    cameraRotationY: 0,
    cameraRotationZ: 0,
    cameraZoom: 1,
};

const Hero = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const gradient = new NeatGradient({
            ref: canvasRef.current,
            ...config,
        });

        const handleScroll = () => {
            gradient.yOffset = window.scrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            gradient.destroy();
        };
    }, []);

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

                <canvas
                    ref={canvasRef}
                    id="gradient"
                    className="absolute inset-0 w-full h-full scale-105"
                    style={{ width: '100%', height: '100%' }}
                />

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