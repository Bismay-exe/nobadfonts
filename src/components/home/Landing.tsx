import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// NOTE: SplitText is a premium Club GSAP plugin.
// If you do not have a Club GSAP license/token, this import will fail.
// You can remove this import and the related logic inside the useEffect if needed.
import { SplitText } from "gsap/SplitText";

/* -------------------------------------------------------------------------- */
/* STYLES                                   */
/* -------------------------------------------------------------------------- */
const styles = `
@import url("https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap");

:root {
  --dark: rgb(var(--color-background));
  --light: rgb(var(--color-highlight));
}

.phive-scroll-wrapper * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.phive-scroll-wrapper {
  font-family: "Roboto Condensed", sans-serif;
  width: 100%;
  overflow-x: hidden;
}

.phive-scroll-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.phive-scroll-wrapper h1 {
  text-transform: uppercase;
  font-size: 5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 0.85;
  text-align: center;
}

.phive-section {
  position: relative;
  width: 100vw;
  height: 100svh;
  overflow: hidden;
}

.hero,
.outro {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--dark);
  color: var(--light);
}

.hero h1,
.outro h1 {
  width: 50%;
}

.sticky-text-1,
.sticky-text-2 {
  background-color: var(--light);
  color: var(--dark);
}

.sticky-text-3 {
  color: var(--light);
}

.text-container,
.bg-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  will-change: opacity, transform;
  z-index: 1;
}

/* Initial state for text scaling */
.text-container h1 {
  position: relative;
  left: -0.035em;
  letter-spacing: -0.05em;
  transform-origin: 50% 0%;
  transform: scaleY(0); 
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
}

/* Visibility classes for SplitText if used */
.spotlight-word {
  display: inline-block;
}

@media (max-width: 1000px) {
  .phive-scroll-wrapper h1 {
    font-size: 3rem;
  }

  .hero h1,
  .outro h1,
  .header {
    width: calc(100% - 4rem);
  }
}
`;

const PhiveScrollAnimation: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        // 1. Register Plugins
        // Note: If SplitText causes errors due to no license, remove it from here.
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

        // 2. Initialize Lenis (Smooth Scrolling)
        const lenis = new Lenis();
        lenis.on("scroll", ScrollTrigger.update);

        // Connect Lenis to GSAP Ticker
        const tickerFn = (time: number) => {
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(tickerFn);
        gsap.ticker.lagSmoothing(0);

        // 3. GSAP Context (Scopes animations to this component)
        const ctx = gsap.context((self) => {
            // Helper: scoped query selector
            // We assume strict structure, but safe check elements
            const header = self.selector?.(".header h1")[0];
            const textElement1 = self.selector?.(".sticky-text-1 .text-container h1")[0];
            const textElement2 = self.selector?.(".sticky-text-2 .text-container h1")[0];
            const textElement3 = self.selector?.(".sticky-text-3 .text-container h1")[0];
            const textContainer3 = self.selector?.(".sticky-text-3 .text-container")[0];

            // Get CSS variable (hacky way to get it from computed style in JS)
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
                    // Avoid division by zero
                    targetScales[i - 1] = textHeight > 0 ? sectionHeight / textHeight : 1;
                }
            };

            // Initial calculation
            calculateDynamicScale();
            window.addEventListener("resize", calculateDynamicScale);


            // Helper
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
                end: `+=${window.innerHeight * 1}px`,
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
                end: `+=${window.innerHeight * 1}px`,
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
                end: `+=${window.innerHeight * 4}px`,
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
                        // Since we are using variables, we can set opacity on the element
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

        }, containerRef); // End GSAP Scope

        return () => {
            // Cleanup
            ctx.revert();
            gsap.ticker.remove(tickerFn);
            lenis.destroy();
            window.removeEventListener("resize", () => { }); // Note: logic inside ctx handles resize, but good practice
        };
    }, []);

    return (
        <div className="phive-scroll-wrapper" ref={containerRef}>
            <style>{styles}</style>

            <section className="hero phive-section">
                <h1>This space intentionally loud</h1>
            </section>

            <section className="sticky-text-1 phive-section">
                <div className="text-container">
                    <h1>Overdrive</h1>
                </div>
            </section>

            <section className="sticky-text-2 phive-section">
                <div className="text-container">
                    <h1>Static</h1>
                </div>
            </section>

            <section className="sticky-text-3 phive-section">
                <div className="bg-img">
                    {/* Replaced local /img.jpg with a placeholder for portability */}
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" alt="Abstract Background" />
                </div>
                <div className="text-container">
                    <h1>Friction</h1>
                </div>
                <div className="header">
                    <h1>Overdrive always breaks the system</h1>
                </div>
            </section>

            <section className="outro phive-section">
                <h1>End of transmission</h1>
            </section>
        </div>
    );
};

export default PhiveScrollAnimation;