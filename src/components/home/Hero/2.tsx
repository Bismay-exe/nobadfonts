'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const TextImageReveal: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        // Register GSAP Plugin
        gsap.registerPlugin(ScrollTrigger);

        // Initialize Lenis Smooth Scroll
        const lenis = new Lenis();

        lenis.on('scroll', ScrollTrigger.update);

        // Connect Lenis to GSAP Ticker
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        // Create GSAP Context for easy cleanup in React
        const ctx = gsap.context(() => {
            const lines = document.querySelectorAll('.line');

            lines.forEach((line) => {
                const imgSpan = line.querySelector('.img-span');

                if (imgSpan) {
                    gsap.to(imgSpan, {
                        width: 300,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: line,
                            start: 'top 90%',
                            end: 'top 40%',
                            scrub: 1,
                        },
                    });
                }
            });
        }, containerRef);

        // Cleanup function
        return () => {
            ctx.revert(); // Revert GSAP animations
            lenis.destroy(); // Destroy Lenis instance
            gsap.ticker.remove(lenis.raf);
        };
    }, []);

    return (
        <div ref={containerRef}>
            {/* Styles injected locally to keep it a single file as requested */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Bricolage Grotesque', sans-serif;
        }

        body {
            min-height: 100vh;
            width: 100vw;
            overflow-x: hidden;
            background: #f5f5f0;
            color: #1a1a1a;
        }

        .container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .intro {
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .intro h1 {
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            font-weight: 300;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #999;
        }

        .outro {
            height: 100vh;
            width: 100vw;
        }

        .line {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }

        .line span {
            font-size: 7.5rem;
            font-weight: 700;
            letter-spacing: -4px;
            display: inline-block;
            overflow: hidden;
            /* Ensure text wraps correctly on smaller screens if needed, though raw design assumes desktop */
            white-space: nowrap; 
        }

        .img-span {
            height: 110px;
            width: 0;
            border-radius: 5px;
            overflow: hidden;
            position: relative;
            display: inline-block;
        }

        .img-span img {
            height: 100%;
            width: 300px; /* Fixed width relative to container to maintain aspect ratio during reveal */
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 5px;
            object-fit: cover;
            object-position: center center;
        }
      `}</style>

            <div className="intro">
                <h1>Scroll to explore</h1>
            </div>

            <div className="container">
                <div className="line">
                    <span>We craft</span>
                    <span className="img-span">
                        <img
                            src="https://i.pinimg.com/1200x/93/27/65/932765c7cd00055218ba7398119d7d4d.jpg"
                            alt="Craft"
                        />
                    </span>
                    <span>digital</span>
                </div>
                <div className="line">
                    <span>experiences</span>
                    <span className="img-span">
                        <img
                            src="https://i.pinimg.com/736x/a9/f1/19/a9f11909a9644d7bfd5102fabcd8310c.jpg"
                            alt="Experiences"
                        />
                    </span>
                    <span>that</span>
                </div>
                <div className="line">
                    <span>inspire</span>
                    <span className="img-span">
                        <img
                            src="https://i.pinimg.com/1200x/48/09/77/480977567d6b4503c8f642728f266b72.jpg"
                            alt="Inspire"
                        />
                    </span>
                </div>
                <div className="line">
                    <span>and move</span>
                </div>
                <div className="line">
                    <span>people</span>
                    <span className="img-span">
                        <img
                            src="https://i.pinimg.com/1200x/9e/f2/b7/9ef2b73b1e2ff489f99bc0a90196fbea.jpg"
                            alt="People"
                        />
                    </span>
                    <span>forward.</span>
                </div>
            </div>

            <div className="outro"></div>
        </div>
    );
};

export default TextImageReveal;