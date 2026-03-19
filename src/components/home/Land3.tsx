import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "../../hooks/useLenis";

// NOTE: SplitText is a premium Club GSAP plugin.
import { SplitText } from "gsap/SplitText";

/* -------------------------------------------------------------------------- */
/* STYLES (Complex Transforms & Variables)                                    */
/* -------------------------------------------------------------------------- */
const styles = `
@import url("https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap");

:root {
  --dark: rgb(var(--color-background));
  --light: rgb(var(--color-card));
}

/* Initial state for text scaling animation (Must remain in CSS for precision) */
.text-container h1 {
  position: relative;
  left: -0.035em;
  letter-spacing: -0.05em;
  transform-origin: 50% 0%;
  transform: scaleY(0); 
  will-change: transform;
}

/* Helper for SplitText */
.spotlight-word {
  display: inline-block;
}
`;

const Landing: React.FC = () => {
    useLenis();
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        // 1. Register Plugins
        try {
            if (typeof SplitText !== "undefined") {
                gsap.registerPlugin(ScrollTrigger, SplitText);
            } else {
                gsap.registerPlugin(ScrollTrigger);
            }
        } catch (e) {
            console.warn("SplitText plugin not found or failed to register.");
            gsap.registerPlugin(ScrollTrigger);
        }



        // 3. GSAP Context
        const ctx = gsap.context((self) => {
            const header = self.selector?.(".header h1")[0];
            const textElement1 = self.selector?.(".sticky-text-1 .text-container h1")[0];
            const textElement2 = self.selector?.(".sticky-text-2 .text-container h1")[0];
            const textElement3 = self.selector?.(".sticky-text-3 .text-container h1")[0];
            const textContainer3 = self.selector?.(".sticky-text-3 .text-container")[0];

            // Get CSS variable
            const outroTextBgColor = getComputedStyle(containerRef.current!)
                .getPropertyValue("--dark")
                .trim() || "rgb(var(--color-background))";

            // --- SplitText Logic ---
            let headerSplit: any = null;
            if (header && typeof SplitText !== "undefined") {
                try {
                    headerSplit = new SplitText(header, {
                        type: "words",
                        wordsClass: "spotlight-word",
                    });
                    gsap.set(headerSplit.words, { opacity: 0 });
                } catch (e) {
                    console.warn("SplitText failed to initialize");
                }
            }

            // --- Dynamic Scale Calculation ---
            const targetScales: number[] = [];
            const calculateDynamicScale = () => {
                for (let i = 1; i <= 3; i++) {
                    const section = self.selector?.(`.sticky-text-${i}`)[0];
                    const text = self.selector?.(`.sticky-text-${i} .text-container h1`)[0];

                    if (!section || !text) continue;

                    const sectionHeight = section.offsetHeight;
                    const textHeight = text.offsetHeight;
                    targetScales[i - 1] = textHeight > 0 ? sectionHeight / textHeight : 1;
                }
            };

            calculateDynamicScale();
            window.addEventListener("resize", calculateDynamicScale);

            const setScaleY = (element: HTMLElement, scale: number) => {
                if (element) element.style.transform = `scaleY(${scale})`;
            };

            // --- ScrollTriggers ---

            // SECTION 1
            ScrollTrigger.create({
                trigger: ".sticky-text-1",
                start: "top bottom",
                end: "top top",
                scrub: 1,
                onUpdate: (selfInstance) => {
                    const currentScale = targetScales[0] * selfInstance.progress;
                    setScaleY(textElement1, currentScale);
                },
            });

            ScrollTrigger.create({
                trigger: ".sticky-text-1",
                start: "top top",
                end: () => `+=${window.innerHeight * 1}px`,
                pin: true,
                pinSpacing: false,
                scrub: 1,
                onUpdate: (selfInstance) => {
                    const currentScale = targetScales[0] * (1 - selfInstance.progress);
                    setScaleY(textElement1, currentScale);
                },
            });

            // SECTION 2
            ScrollTrigger.create({
                trigger: ".sticky-text-2",
                start: "top bottom",
                end: "top top",
                scrub: 1,
                onUpdate: (selfInstance) => {
                    const currentScale = targetScales[1] * selfInstance.progress;
                    setScaleY(textElement2, currentScale);
                },
            });

            ScrollTrigger.create({
                trigger: ".sticky-text-2",
                start: "top top",
                end: () => `+=${window.innerHeight * 1}px`,
                pin: true,
                pinSpacing: false,
                scrub: 1,
                onUpdate: (selfInstance) => {
                    const currentScale = targetScales[1] * (1 - selfInstance.progress);
                    setScaleY(textElement2, currentScale);
                },
            });

            // SECTION 3
            ScrollTrigger.create({
                trigger: ".sticky-text-3",
                start: "top bottom",
                end: "top top",
                scrub: 1,
                onUpdate: (selfInstance) => {
                    const currentScale = targetScales[2] * selfInstance.progress;
                    setScaleY(textElement3, currentScale);
                },
            });

            ScrollTrigger.create({
                trigger: ".sticky-text-3",
                start: "top top",
                end: () => `+=${window.innerHeight * 4}px`,
                pin: true,
                pinSpacing: true,
                scrub: 1,
                onUpdate: (selfInstance) => {
                    const progress = selfInstance.progress;

                    if (!textContainer3) return;

                    // Reset Start
                    if (progress === 0) {
                        textContainer3.style.backgroundColor = outroTextBgColor;
                        textContainer3.style.opacity = "1";
                    }

                    // Scaling Effect
                    if (progress <= 0.75) {
                        const scaleProgress = progress / 0.75;
                        const currentScale = 1 + 9 * scaleProgress;
                        textContainer3.style.transform = `scale3d(${currentScale}, ${currentScale}, 1)`;
                    } else {
                        textContainer3.style.transform = `scale3d(10, 10, 1)`;
                    }

                    // Background Color Fading
                    if (progress < 0.25) {
                        textContainer3.style.backgroundColor = outroTextBgColor;
                        textContainer3.style.opacity = "1";
                    } else if (progress >= 0.25 && progress <= 0.5) {
                        const fadeProgress = (progress - 0.25) / 0.25;
                        const bgOpacity = Math.max(0, Math.min(1, 1 - fadeProgress));
                        textContainer3.style.opacity = bgOpacity.toString();
                    } else if (progress > 0.5) {
                        textContainer3.style.opacity = "0";
                    }

                    // Opacity Fading
                    if (progress >= 0.5 && progress <= 0.75) {
                        const textProgress = (progress - 0.5) / 0.25;
                        const textOpacity = 1 - textProgress;
                        textContainer3.style.opacity = textOpacity.toString();
                    } else if (progress > 0.75) {
                        textContainer3.style.opacity = "0";
                    }

                    // Reveal Header (SplitText)
                    if (headerSplit && headerSplit.words.length > 0) {
                        if (progress >= 0.75 && progress <= 0.95) {
                            const textProgress = (progress - 0.75) / 0.2;
                            const totalWords = headerSplit.words.length;

                            headerSplit.words.forEach((word: HTMLElement, index: number) => {
                                const wordRevealProgress = index / totalWords;
                                const opacity = textProgress >= wordRevealProgress ? 1 : 0;
                                gsap.set(word, { opacity });
                            });
                        } else if (progress < 0.75) {
                            gsap.set(headerSplit.words, { opacity: 0 });
                        } else if (progress > 0.95) {
                            gsap.set(headerSplit.words, { opacity: 1 });
                        }
                    }
                },
            });

        }, containerRef);

        return () => {
            ctx.revert();
            window.removeEventListener("resize", () => { });
        };
    }, []);

    // Common Tailwind classes for standard H1s
    const bigTextClasses = "uppercase font-black tracking-tighter leading-[0.85] text-center w-full";
    // Common classes for full screen sections
    const sectionClasses = "phive-section relative w-full h-[100svh] overflow-hidden border-b-2 border-black";
    // Common flex center classes
    const centerFlexClasses = "flex justify-center items-center";
    // Absolute cover classes
    const absoluteCoverClasses = "absolute inset-0 w-full h-full z-10";

    return (
        <div
            ref={containerRef}
            className="phive-scroll-wrapper w-full overflow-x-hidden font-['Roboto_Condensed']"
        >
            <style>{styles}</style>

            {/* Hero */}
            <section className={`hero phive-section relative w-full h-full py-15 bg-(--light) text-black rounded-4xl overflow-hidden border-y border-(--dark) ${centerFlexClasses}`}>
                <h1 className="w-[calc(100%-4rem)] lg:w-1/2 uppercase text-5xl lg:text-[5rem] font-black tracking-[-0.02em] leading-[0.85] text-center">
                    Fonts chosen with intent
                </h1>
            </section>

            {/* Section 1 */}
            <section className={`sticky-text-1 ${sectionClasses} bg-(--light) text-(--dark) rounded-4xl z-10`}>
                <div className={`text-container ${absoluteCoverClasses}`}>
                    <h1 className={`${bigTextClasses} text-[20vw] font-light`}>
                        Handpicked
                    </h1>
                </div>
            </section>

            {/* Section 2 */}
            <section className={`sticky-text-2 ${sectionClasses} bg-(--light) text-(--dark) rounded-4xl z-20`}>
                <div className={`text-container ${absoluteCoverClasses}`}>
                    <h1 className={`${bigTextClasses} text-[38vw]`}>
                        Clean
                    </h1>
                </div>
            </section>

            {/* Section 3 */}
            <section className={`sticky-text-3 ${sectionClasses} text-(--light) rounded-4xl z-30`}>
                <div className="bg-img absolute inset-0 w-full h-full z-0">
                    <img
                        src="/images/bg.avif"
                        alt="Abstract Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="fg-img absolute bottom-0 w-full h-1/2 md:h-2/3 lg:h-full z-10">
                    <img
                        src="/images/fg.png"
                        alt="Abstract Background"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className={`text-container ${absoluteCoverClasses} bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]`}>
                    <h1 className={`${bigTextClasses} text-[18vw]`}>
                        Typography
                    </h1>
                </div>

                <div className="header absolute h-full w-full flex justify-center items-center z-0">
                    <h1 className="w-screen text-[rgb(var(--color-primary))] uppercase text-[18vw] md:text-[14vw] lg:text-[10vw] font-categories-elegant tracking-tight leading-[1.3] text-center">
                        <div className="hidden lg:block">Seriously</div>
                        <div className="lg:hidden">Just</div>
                        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-[16vw] gap-0">
                            <span>Stop</span>
                            <span> Using</span>
                        </div>
                        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-[16vw] gap-0">
                            <span>Bad</span>
                            <span> Fonts!</span>
                        </div>
                    </h1>
                </div>
            </section>

            {/* Outro */}
            <section className={`hidden outro h-full ${centerFlexClasses} bg-[#EEEFEB] text-(--light) rounded-4xl border-y border-[#1C1D1E] p-10`}>
                <h1 className="lg:w-full text-[5rem] lg:text-[6rem] font- tracking-[-0.02em] leading-[0.85] text-center">
                    Use Good Fonts from NoBadFonts.in
                </h1>
            </section>
        </div>
    );
};

export default Landing;