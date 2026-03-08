"use client";

import SEO from '../components/shared/SEO';
import { useLenis } from '../hooks/useLenis';
import Hero from '../components/home/Hero/1';

export default function Home() {
    useLenis();
    return (
        <div className="flex flex-col">
            <SEO />
            <Hero />
        </div>
    );
}
