import { useLayoutEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let lenis: Lenis | null = null;
const refs = new Set();

const update = (time: number) => {
    lenis?.raf(time * 1000);
};

export const useLenis = () => {
    useLayoutEffect(() => {
        const symbol = Symbol();
        refs.add(symbol);

        if (!lenis) {
            lenis = new Lenis();
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(update);
            gsap.ticker.lagSmoothing(0);
        }

        return () => {
            refs.delete(symbol);
            // Only destroy if no one is using it anymore
            if (refs.size === 0 && lenis) {
                lenis.destroy();
                lenis = null;
                gsap.ticker.remove(update);
            }
        };
    }, []);

    return lenis;
};
