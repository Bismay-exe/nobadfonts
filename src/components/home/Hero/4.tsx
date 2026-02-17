'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Define the shape of our data
interface ContentRow {
    id: number;
    text1: string;
    img?: string; // Optional: not all lines have images
    text2?: string; // Optional: not all lines have trailing text
}

// Data Array
const rows: ContentRow[] = [
    {
        id: 1,
        text1: 'We craft',
        img: 'https://i.pinimg.com/1200x/93/27/65/932765c7cd00055218ba7398119d7d4d.jpg',
        text2: 'digital',
    },
    {
        id: 2,
        text1: 'experiences',
        img: 'https://i.pinimg.com/736x/a9/f1/19/a9f11909a9644d7bfd5102fabcd8310c.jpg',
        text2: 'that',
    },
    {
        id: 3,
        text1: 'inspire',
        img: 'https://i.pinimg.com/1200x/48/09/77/480977567d6b4503c8f642728f266b72.jpg',
        // No text2 here
    },
    {
        id: 4,
        text1: 'and move',
        // No image or text2 here
    },
    {
        id: 5,
        text1: 'people',
        img: 'https://i.pinimg.com/1200x/9e/f2/b7/9ef2b73b1e2ff489f99bc0a90196fbea.jpg',
        text2: 'forward.',
    },
];

const TextImageReveal: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis();
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        const ctx = gsap.context(() => {
            const lines = document.querySelectorAll('.line');

            lines.forEach((line) => {
                const imgSpan = line.querySelector('.img-span');

                // Only create animation if an image span exists in this line
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

        return () => {
            ctx.revert();
            lenis.destroy();
            gsap.ticker.remove(lenis.raf);
        };
    }, []);

    // Shared classes
    const sectionClass =
        'h-screen w-full bg-[#EEEFEB] rounded-4xl border-y border-[#1C1D1E]';
    const textClass =
        'text-[7.5rem] font-bold tracking-[-4px] inline-block overflow-hidden whitespace-nowrap leading-none';
    const imgSpanClass =
        'img-span h-[110px] w-0 rounded-[5px] overflow-hidden relative inline-block align-middle';
    const imgClass =
        'h-full w-[300px] absolute left-1/2 -translate-x-1/2 rounded-[5px] object-cover object-center max-w-none';

    return (
        <div
            ref={containerRef}
            className="min-h-screen w-full overflow-x-hidden text-[#1a1a1a] font-bricolage-grotesque"
        >

            {/* Intro */}
            <div className={`intro ${sectionClass} flex justify-center items-center`}>
                <p className="font-inter text-[1rem] font-light tracking-[2px] uppercase text-[#999]">
                    Scroll to explore
                </p>
            </div>

            {/* Main Content */}
            <div className={`main ${sectionClass} flex flex-col justify-center items-center w-full h-screen`}>
                {rows.map((row) => (
                    <div
                        key={row.id}
                        className="line flex justify-center items-center gap-5"
                    >
                        {/* First Text Block */}
                        <span className={textClass}>{row.text1}</span>

                        {/* Image Block (Conditional) */}
                        {row.img && (
                            <span className={imgSpanClass}>
                                <img className={imgClass} src={row.img} alt="Visual" />
                            </span>
                        )}

                        {/* Second Text Block (Conditional) */}
                        {row.text2 && <span className={textClass}>{row.text2}</span>}
                    </div>
                ))}
            </div>

            <div className={`outro ${sectionClass} flex justify-center items-center`}></div>
        </div>
    );
};

export default TextImageReveal;