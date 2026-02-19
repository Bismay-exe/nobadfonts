"use client";

import HeroNew from '../components/home/HeroNew';
import FeaturedFonts from '../components/home/FeaturedFonts';
import { useLenis } from '../hooks/useLenis';
import SEO from '../components/shared/SEO';

export default function Home() {
    useLenis();
    return (
        <div className="flex flex-col min-h-screen">
            <SEO />
            <HeroNew />
            <FeaturedFonts />

            {/* Additional Sections can be added here later */}
            <section className="py-24 px-4 text-center">
                <h3 className="text-2xl font-bold text-zinc-700 mb-4">More Coming Soon</h3>
                <p className="text-zinc-500">We are busy curating the best fonts for you.</p>
            </section>
        </div>
    );
}
