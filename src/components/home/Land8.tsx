import React, { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

const AnimatedWord = ({
    children,
    addToRefs,
}: {
    children: React.ReactNode;
    addToRefs: (el: HTMLSpanElement | null) => void;
}) => (
    <span className="inline-block will-change-[opacity]">
        <span ref={addToRefs} className="opacity-0">
            {children}
        </span>
    </span>
);

const Landing = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Refs for elements to animate
    const text1Ref = useRef<HTMLHeadingElement>(null);
    const text2Ref = useRef<HTMLHeadingElement>(null);

    // Section 3 refs
    const section3Ref = useRef<HTMLElement>(null);
    const textContainer3Ref = useRef<HTMLDivElement>(null);
    const text3Ref = useRef<HTMLHeadingElement>(null);
    const headerWordsRef = useRef<(HTMLSpanElement | null)[]>([]);

    // 1. Setup Lenis Smooth Scroll
    useEffect(() => {
        const lenis = new Lenis();
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
        return () => {
            lenis.destroy();
            gsap.ticker.remove(lenis.raf);
        };
    }, []);

    // 2. Setup Animations
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {

            // --- Helper: Dynamic Scale Calculation ---
            const getScale = (sectionClass: string, textRef: React.RefObject<HTMLElement | null>) => {
                const section = document.querySelector(sectionClass) as HTMLElement;
                if (!section || !textRef.current) return 1;
                return section.offsetHeight / textRef.current.offsetHeight;
            };

            const scale1 = getScale(".sticky-text-1", text1Ref);
            const scale2 = getScale(".sticky-text-2", text2Ref);
            const scale3 = getScale(".sticky-text-3", text3Ref);

            // --- Section 1: Overdrive ---
            ScrollTrigger.create({
                trigger: ".sticky-text-1",
                start: "top bottom",
                end: "top top",
                scrub: 1,
                onUpdate: (self) => {
                    if (text1Ref.current) gsap.set(text1Ref.current, { scaleY: scale1 * self.progress });
                },
            });

            ScrollTrigger.create({
                trigger: ".sticky-text-1",
                start: "top top",
                end: `+=${window.innerHeight}px`,
                pin: true,
                pinSpacing: false,
                scrub: 1,
                onUpdate: (self) => {
                    if (text1Ref.current) gsap.set(text1Ref.current, { scaleY: scale1 * (1 - self.progress) });
                },
            });

            // --- Section 2: Static ---
            ScrollTrigger.create({
                trigger: ".sticky-text-2",
                start: "top bottom",
                end: "top top",
                scrub: 1,
                onUpdate: (self) => {
                    if (text2Ref.current) gsap.set(text2Ref.current, { scaleY: scale2 * self.progress });
                },
            });

            ScrollTrigger.create({
                trigger: ".sticky-text-2",
                start: "top top",
                end: `+=${window.innerHeight}px`,
                pin: true,
                pinSpacing: false,
                scrub: 1,
                onUpdate: (self) => {
                    if (text2Ref.current) gsap.set(text2Ref.current, { scaleY: scale2 * (1 - self.progress) });
                },
            });

            // --- Section 3: Friction (Timeline) ---
            // Enter phase
            ScrollTrigger.create({
                trigger: ".sticky-text-3",
                start: "top bottom",
                end: "top top",
                scrub: 1,
                onUpdate: (self) => {
                    if (text3Ref.current) gsap.set(text3Ref.current, { scaleY: scale3 * self.progress });
                },
            });

            // Pin phase (Complex animation)
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".sticky-text-3",
                    start: "top top",
                    end: `+=${window.innerHeight * 4}px`,
                    pin: true,
                    pinSpacing: true,
                    scrub: 1,
                }
            });

            // 1. Expand black container
            tl.to(textContainer3Ref.current, {
                scale: 10,
                duration: 0.75,
                ease: "none"
            }, 0);

            // 2. Fade Background Color (rgba(17, 39, 11, 1) -> transparent)
            tl.to(textContainer3Ref.current, {
                backgroundColor: "rgba(17, 39, 11, 0)",
                duration: 0.25,
                ease: "none"
            }, 0.25);

            // 3. Fade Opacity
            tl.to(textContainer3Ref.current, {
                opacity: 0,
                duration: 0.25,
                ease: "none"
            }, 0.5);

            // 4. Reveal Text (Spans)
            tl.fromTo(headerWordsRef.current,
                { opacity: 0 },
                {
                    opacity: 1,
                    stagger: 0.1,
                    duration: 0.2,
                    ease: "none"
                },
                0.75
            );

            // Buffer
            tl.to({}, { duration: 0.05 }, 0.95);

        }, containerRef);

        return () => ctx.revert();
    }, []);

    const addToRefs = (el: HTMLSpanElement | null) => {
        if (el && !headerWordsRef.current.includes(el)) {
            headerWordsRef.current.push(el);
        }
    };

    // Common styles
    const sectionClass = "relative w-full h-[100svh]";
    const flexCenter = "flex justify-center items-center";
    const h1Base = "uppercase font-black tracking-[-0.02em] leading-[0.75] text-center m-0";
    const h1Responsive = "text-[5rem] max-[1000px]:text-[3rem]";
    const containerClass = "text-container absolute top-0 left-0 w-full h-full z-10 will-change-transform";

    // Colors
    const darkBg = "bg-[#1C1D1E]";
    const lightBg = "bg-[#EEEFEB]";
    const darkText = "text-[#1C1D1E]";
    const lightText = "text-[#EEEFEB]";

    return (
        <div ref={containerRef} className="font-['Roboto_Condensed'] bg-[#11270b]">
            {/* Import Font */}
            <style>{`@import url("https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap");`}</style>

            {/* --- HERO --- */}
            <section className={`hero ${sectionClass} ${flexCenter} ${darkBg} ${lightText}`}>
                <h1 className={`${h1Base} ${h1Responsive} w-1/2 max-[1000px]:w-[calc(100%-4rem)]`}>
                    Fonts chosen with intent
                </h1>
            </section>

            {/* --- STICKY TEXT 1 --- */}
            <section className={`sticky-text-1 ${sectionClass} ${lightBg} ${darkText}`}>
                <div className={containerClass}>
                    <div
                        ref={text1Ref}
                        className={`${h1Base} text-[20vw] font-light relative -left-[0.035em] tracking-[-0.05em] origin-top scale-y-0 will-change-transform`}
                    >
                        Handpicked
                    </div>
                </div>
            </section>

            {/* --- STICKY TEXT 2 --- */}
            <section className={`sticky-text-2 ${sectionClass} ${lightBg} ${darkText}`}>
                <div className={containerClass}>
                    <div
                        ref={text2Ref}
                        className={`${h1Base} text-[38vw] relative -left-[0.035em] tracking-[-0.05em] origin-top scale-y-0 will-change-transform`}
                    >
                        Clean
                    </div>
                </div>
            </section>

            {/* --- STICKY TEXT 3 --- */}
            <section ref={section3Ref} className={`sticky-text-3 ${sectionClass}`}>
                {/* Background Image */}
                <div className="bg-img absolute inset-0 w-full h-full rounded-4xl overflow-hidden border-y border-[#1C1D1E] z-0">
                    <img
                        src="/images/bg.avif"
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="fg-img absolute bottom-0 w-full h-1/2 md:h-2/3 lg:h-full z-10">
                    <img
                        src="/images/fg.png"
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="fg-img absolute top-0 left-0 m-10 md:m-15 w-10 h-10 z-10 text-2xl md:text-3xl uppercase font-black leading-none">
                    <img
                        src="/logo/logo-black.png"
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                    />
                    <p>NoBad</p>
                    <p>Fonts©</p>
                </div>

                {/* Expanding Container */}
                <div
                    ref={textContainer3Ref}
                    className={`${containerClass} ${darkBg} ${lightText} flex justify-center items-start`}
                >
                    <div
                        ref={text3Ref}
                        className={`${h1Base} text-[18vw] relative -left-[0.035em] tracking-[-0.05em] origin-top scale-y-0`}
                    >
                        Typography
                    </div>
                </div>

                {/* Overlay Header with Split Text */}
                <div className="header absolute h-full w-full flex justify-center items-center z-0 pointer-events-none">
                    <div className="w-full text-[#ff0000] uppercase text-[18vw] md:text-[14vw] lg:text-[10vw] font-categories-elegant tracking-tight leading-[1.3] text-center">

                        <div className="hidden lg:block">
                            <AnimatedWord addToRefs={addToRefs}>Seriously</AnimatedWord>
                        </div>

                        <div className="lg:hidden">
                            <AnimatedWord addToRefs={addToRefs}>Just</AnimatedWord>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-[16vw]">
                            <AnimatedWord addToRefs={addToRefs}>Stop</AnimatedWord>
                            <AnimatedWord addToRefs={addToRefs}>Using</AnimatedWord>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-[16vw]">
                            <AnimatedWord addToRefs={addToRefs}>Bad</AnimatedWord>
                            <AnimatedWord addToRefs={addToRefs}>Fonts!</AnimatedWord>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- OUTRO --- */}
            <section className={`outro ${sectionClass} ${flexCenter} ${darkBg} ${lightText}`}>
                <h2 className={`${h1Base} ${h1Responsive} w-1/2 max-[1000px]:w-[calc(100%-4rem)]`}>
                    Use Good Fonts from NoBadFonts.in
                </h2>
            </section>
        </div>
    );
};

export default Landing;