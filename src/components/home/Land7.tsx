import React, { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

const App = () => {
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
            // Replicates the logic of calculating scale based on section/text height ratio
            const getScale = (sectionClass: string, textRef: React.RefObject<HTMLElement | null>) => {
                const section = document.querySelector(sectionClass) as HTMLElement;
                if (!section || !textRef.current) return 1;
                return section.offsetHeight / textRef.current.offsetHeight;
            };

            const scale1 = getScale(".sticky-text-1", text1Ref);
            const scale2 = getScale(".sticky-text-2", text2Ref);
            const scale3 = getScale(".sticky-text-3", text3Ref);

            // --- Section 1: Overdrive ---
            // Phase 1: Enter (Grow)
            ScrollTrigger.create({
                trigger: ".sticky-text-1",
                start: "top bottom",
                end: "top top",
                scrub: 1,
                onUpdate: (self) => {
                    if (text1Ref.current) {
                        gsap.set(text1Ref.current, { scaleY: scale1 * self.progress });
                    }
                },
            });

            // Phase 2: Pin (Shrink)
            ScrollTrigger.create({
                trigger: ".sticky-text-1",
                start: "top top",
                end: `+=${window.innerHeight}px`,
                pin: true,
                pinSpacing: false,
                scrub: 1,
                onUpdate: (self) => {
                    if (text1Ref.current) {
                        gsap.set(text1Ref.current, { scaleY: scale1 * (1 - self.progress) });
                    }
                },
            });

            // --- Section 2: Static ---
            // Phase 1: Enter (Grow)
            ScrollTrigger.create({
                trigger: ".sticky-text-2",
                start: "top bottom",
                end: "top top",
                scrub: 1,
                onUpdate: (self) => {
                    if (text2Ref.current) {
                        gsap.set(text2Ref.current, { scaleY: scale2 * self.progress });
                    }
                },
            });

            // Phase 2: Pin (Shrink)
            ScrollTrigger.create({
                trigger: ".sticky-text-2",
                start: "top top",
                end: `+=${window.innerHeight}px`,
                pin: true,
                pinSpacing: false,
                scrub: 1,
                onUpdate: (self) => {
                    if (text2Ref.current) {
                        gsap.set(text2Ref.current, { scaleY: scale2 * (1 - self.progress) });
                    }
                },
            });

            // --- Section 3: Friction (Optimized Timeline) ---
            // Phase 1: Enter (Grow Text)
            ScrollTrigger.create({
                trigger: ".sticky-text-3",
                start: "top bottom",
                end: "top top",
                scrub: 1,
                onUpdate: (self) => {
                    if (text3Ref.current) {
                        gsap.set(text3Ref.current, { scaleY: scale3 * self.progress });
                    }
                },
            });

            // Phase 2: The Complex Sequence
            // We use a single timeline to handle Scale, BG Color, Opacity, and Text Reveal
            // This prevents "glitching" from manual math updates.
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".sticky-text-3",
                    start: "top top",
                    end: `+=${window.innerHeight * 4}px`, // 400vh scroll distance
                    pin: true,
                    pinSpacing: true,
                    scrub: 1,
                }
            });

            // 1. Expand the black container (0% -> 75% of progress)
            tl.to(textContainer3Ref.current, {
                scale: 10,
                duration: 0.75,
                ease: "none"
            }, 0);

            // 2. Fade Background Color (25% -> 50% of progress)
            // Note: CSS Variable --dark is rgba(17, 39, 11, 1). We fade to opacity 0.
            tl.to(textContainer3Ref.current, {
                backgroundColor: "rgba(17, 39, 11, 0)",
                duration: 0.25,
                ease: "none"
            }, 0.25);

            // 3. Fade Opacity (50% -> 75% of progress)
            tl.to(textContainer3Ref.current, {
                opacity: 0,
                duration: 0.25,
                ease: "none"
            }, 0.5);

            // 4. Reveal Text (75% -> 95% of progress)
            // We use the spans we created in the JSX
            tl.fromTo(headerWordsRef.current,
                { opacity: 0 },
                {
                    opacity: 1,
                    stagger: 0.1,
                    duration: 0.2, // Short duration relative to the scroll distance
                    ease: "none"
                },
                0.75
            );

            // Ensure buffer at the end
            tl.to({}, { duration: 0.05 }, 0.95);

        }, containerRef); // Scope GSAP to this component

        return () => ctx.revert(); // Cleanup
    }, []);

    // Utility to add words to refs array
    const addToRefs = (el: HTMLSpanElement | null) => {
        if (el && !headerWordsRef.current.includes(el)) {
            headerWordsRef.current.push(el);
        }
    };

    return (
        <div ref={containerRef}>
            {/* Inject CSS Styles */}
            <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap");

        :root {
            --dark: rgba(17, 39, 11, 1);
            --light: rgba(162, 255, 91, 1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "Roboto Condensed", sans-serif;
            background-color: var(--dark);
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        h1 {
            text-transform: uppercase;
            font-size: 5rem;
            font-weight: 900;
            letter-spacing: -0.02em;
            line-height: 0.85;
            text-align: center;
            margin: 0;
        }

        section {
            position: relative;
            width: 100vw;
            height: 100svh;
            overflow: hidden;
        }

        .hero, .outro {
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--dark);
            color: var(--light);
        }

        .hero h1, .outro h1 {
            width: 50%;
        }

        .sticky-text-1, .sticky-text-2 {
            background-color: var(--light);
            color: var(--dark);
        }

        .sticky-text-3 {
            color: var(--light);
            background-color: var(--dark);
        }

        .text-container, .bg-img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            will-change: opacity, transform;
            z-index: 1;
        }

        .text-container h1 {
            position: relative;
            left: -0.035em;
            letter-spacing: -0.05em;
            transform-origin: 50% 0%;
            transform: scaleY(0); 
            /* Initial scale 0, handled by GSAP */
        }

        .sticky-text-1 .text-container h1 {
            font-size: 23vw;
            font-weight: 300;
            will-change: transform;
        }

        .sticky-text-2 .text-container h1 {
            font-size: 35vw;
            will-change: transform;
        }

        .sticky-text-3 .text-container {
            background-color: var(--dark);
            color: var(--light);
            display: flex; /* Center the text inside */
            justify-content: center;
            align-items: flex-start; /* Align text to top */
        }

        .sticky-text-3 .text-container h1 {
            font-size: 27vw;
            font-weight: 900;
        }

        .header {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50%;
            z-index: 2;
            pointer-events: none; /* Let clicks pass through */
        }
        
        /* Custom Word Split Class */
        .spotlight-word {
            display: inline-block;
            will-change: opacity;
        }

        @media (max-width: 1000px) {
            h1 {
                font-size: 3rem;
            }
            .hero h1, .outro h1, .header {
                width: calc(100% - 4rem);
            }
        }
        `}</style>

            {/* --- HERO --- */}
            <section className="hero">
                <h1>This space intentionally loud</h1>
            </section>

            {/* --- STICKY TEXT 1 --- */}
            <section className="sticky-text-1">
                <div className="text-container">
                    <h1 ref={text1Ref}>Overdrive</h1>
                </div>
            </section>

            {/* --- STICKY TEXT 2 --- */}
            <section className="sticky-text-2">
                <div className="text-container">
                    <h1 ref={text2Ref}>Static</h1>
                </div>
            </section>

            {/* --- STICKY TEXT 3 --- */}
            <section className="sticky-text-3" ref={section3Ref}>
                <div className="bg-img">
                    {/* Using a placeholder abstract image similar to the vibe */}
                    <img
                        src="/images/bg.avif"
                        alt="Abstract Background"
                    />
                </div>

                {/* The Container that scales up and fades out */}
                <div className="text-container" ref={textContainer3Ref}>
                    <h1 ref={text3Ref}>Friction</h1>
                </div>

                {/* The Text that reveals word by word */}
                <div className="header">
                    <h1>
                        {"Overdrive always breaks the system".split(" ").map((word, index) => (
                            <span key={index} className="spotlight-word">
                                <span ref={addToRefs} style={{ opacity: 0 }}>{word}</span>
                                {" "}
                            </span>
                        ))}
                    </h1>
                </div>
            </section>

            {/* --- OUTRO --- */}
            <section className="outro">
                <h1>End of transmission</h1>
            </section>
        </div>
    );
};

export default App;