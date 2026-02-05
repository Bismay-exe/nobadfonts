'use client'; // Remove this line if not using Next.js App Router

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        // Initialize Lenis for smooth scrolling
        const lenis = new Lenis();

        // Sync Lenis with GSAP's ticker
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        // Context for GSAP (allows easy cleanup in React)
        const ctx = gsap.context(() => {
            // 1. Split Text Logic

            // 2. Marquee Animation Logic
            const marqueeContainers = document.querySelectorAll('.marquee-container');

            marqueeContainers.forEach((container, index) => {
                let start = '0%';
                let end = '-15%';

                if (index % 2 === 0) {
                    start = '0%';
                    end = '10%';
                }

                const marquee = container.querySelector('.marquee');
                const words = marquee?.querySelectorAll('.item h1');

                // Animate the marquee container horizontally
                gsap.fromTo(
                    marquee,
                    { x: start },
                    {
                        x: end,
                        scrollTrigger: {
                            trigger: container,
                            start: 'top bottom',
                            end: '150% top',
                            scrub: true,
                        },
                    }
                );

                // Animate characters inside the marquee
                words?.forEach((word) => {
                    const chars = Array.from(word.querySelectorAll('.char'));
                    if (chars.length) {
                        const reverse = index % 2 !== 0;

                        const staggerOptions = {
                            each: 0.35,
                            from: reverse ? 'start' : 'end',
                            ease: 'linear',
                        } as gsap.StaggerVars; // Type casting for TS

                        gsap.fromTo(
                            chars,
                            { fontWeight: 100 },
                            {
                                fontWeight: 900,
                                duration: 1,
                                ease: 'none',
                                stagger: staggerOptions,
                                scrollTrigger: {
                                    trigger: container,
                                    start: '50% bottom',
                                    end: 'top top',
                                    scrub: true,
                                },
                            }
                        );
                    }
                });
            });
        }, containerRef); // Scope selector to this component

        // Cleanup function
        return () => {
            ctx.revert(); // Reverts GSAP animations/SplitType changes
            lenis.destroy();
            // Use SplitType's revert method if available to clean up DOM, 
            // though ctx.revert() often handles the GSAP part sufficienty.
            // Note: splitText.revert() might be needed if re-renders cause duplication.
        };
    }, []);

    return (
        <div className="main-wrapper" ref={containerRef}>
            {/* Styles embedded for single-file requirement */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@100..900&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          width: 100%;
          height: 100%;
          font-family: "Big Shoulders Display", sans-serif;
          overflow-x: hidden;
        }

        /* Lenis Required Styles */
        html.lenis, html.lenis body { height: auto; }
        .lenis.lenis-smooth { scroll-behavior: auto !important; }
        .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
        .lenis.lenis-stopped { overflow: hidden; }
        .lenis.lenis-smooth iframe { pointer-events: none; }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block; 
        }

        .hero img {
          object-position: center;
        }

        p {
          font-size: 42px;
          font-weight: 500;
          text-transform: uppercase;
          line-height: 1.1;
        }

        section {
          width: 100%;
          min-height: 100vh;
        }

        section.hero {
          height: 100vh;
        }

        section.about,
        section.services {
          padding: 4em;
          background: #87795f;
          display: flex;
          align-items: center;
        }

        section.footer {
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #13120e;
          color: #87795f;
          height: 100vh;
        }

        section.footer h1 {
          font-size: 10vw;
          text-transform: uppercase;
        }

        section.marquees {
          height: 150vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background-color: #fff;
          overflow: hidden;
        }

        .marquee-container {
          position: relative;
          width: 125%;
          height: 250px;
          display: flex;
          gap: 1em;
          margin-bottom: 1em;
          overflow: hidden;
        }

        .marquee {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          display: flex;
          gap: 1em;
        }

        /* Initial offset positions handled by CSS before JS takes over */
        #marquee-1 .marquee,
        #marquee-3 .marquee {
          left: -15%;
        }

        .item {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          background: #f0f0f0; /* Placeholder bg */
        }

        .item.with-text {
          flex: 1.5;
          background: transparent;
        }

        .item h1 {
          text-transform: uppercase;
          font-size: 140px;
          font-weight: 100; /* Start thin */
          margin: 0;
          color: #000;
        }

        @media (max-width: 900px) {
          section.marquees {
            height: 100vh;
          }

          .marquee-container {
            width: 250%;
            height: 150px;
          }

          #marquee-2 .marquee,
          #marquee-4 .marquee {
            left: -35%;
          }

          .item.with-text {
            flex: 1;
          }

          .item h1 {
            font-size: 60px;
          }
          
          section.about, section.services {
             padding: 2em;
          }
          
          p {
            font-size: 24px;
          }
        }
      `}</style>

            <div>
                <section className="hero">
                    <img
                        src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop"
                        alt="Hero Dystopian"
                    />
                </section>

                <section className="about">
                    <p>
                        Step into a surreal and immersive experience with our Dreamy 3D World
                        Dystopian series. This captivating realm invites you to explore a
                        world where reality and fantasy intertwine, creating a unique blend of
                        striking visuals and thought-provoking narratives.
                    </p>
                </section>

                <section className="marquees">
                    {/* Marquee 1 */}
                    <div className="marquee-container" id="marquee-1">
                        <div className="marquee">
                            <div className="item"><img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item with-text"><h1>Unique</h1></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1614730341194-75c60740a2d3?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1614728853975-672f79e74b8b?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1614726365723-49cfae92782f?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                        </div>
                    </div>

                    {/* Marquee 2 */}
                    <div className="marquee-container" id="marquee-2">
                        <div className="marquee">
                            <div className="item"><img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1614332287897-cdc485fa562d?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item with-text"><h1>Release</h1></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                        </div>
                    </div>

                    {/* Marquee 3 */}
                    <div className="marquee-container" id="marquee-3">
                        <div className="marquee">
                            <div className="item"><img src="https://images.unsplash.com/photo-1614726365778-430c576e102f?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item with-text"><h1>2500</h1></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1614728853975-672f79e74b8b?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                        </div>
                    </div>

                    {/* Marquee 4 */}
                    <div className="marquee-container" id="marquee-4">
                        <div className="marquee">
                            <div className="item"><img src="https://images.unsplash.com/photo-1614730341194-75c60740a2d3?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                            <div className="item with-text"><h1>Rarity</h1></div>
                            <div className="item"><img src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=500&q=60" alt="" /></div>
                        </div>
                    </div>
                </section>

                <section className="services">
                    <p>
                        In this meticulously designed dystopian world, you'll find yourself
                        immersed in stories of resilience and intrigue.
                    </p>
                </section>

                <section className="footer">
                    <h1>The End</h1>
                </section>
            </div>
        </div>
    );
};

export default Landing;