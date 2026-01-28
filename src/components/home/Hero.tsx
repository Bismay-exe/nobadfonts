import React, { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MoveRight, Sparkles, PenTool, Type, Layers, Instagram, Dribbble, Twitter, MessageCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Define theme colors based on the reference image


const LandingPage: React.FC = () => {
    const marqueeRef = useRef<HTMLDivElement>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);

    // GSAP: Infinite Marquee for "Trusted By" section
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(marqueeRef.current, {
                xPercent: -50,
                ease: "none",
                duration: 20,
                repeat: -1,
            });
        }, mainContainerRef);
        return () => ctx.revert();
    }, []);

    // Framer Motion hover variants for interactive elements
    const popHover = {
        scale: 1.05,
        transition: { type: "spring", stiffness: 400, damping: 10 }
    } as const;

    return (
        <div ref={mainContainerRef} className="min-h-screen w-full border-x-4 bg-black text-black font-sans overflow-x-hidden">

            {/* === NAV (Simple as per reference) === */}
            <nav className="w-full flex justify-between items-center p-4 border-y-2 bg-white rounded-3xl">
                <div className="font-black text-2xl uppercase tracking-tighter">Fontique</div>
                <div className="hidden md:flex gap-6 font-bold text-sm uppercase">
                    <a href="#">Fonts</a>
                    <a href="#">Foundries</a>
                    <a href="#">About</a>
                </div>
                <button className="border-2 border-black px-4 py-1 font-bold rounded-full hover:bg-black hover:text-white transition-colors">
                    Log In
                </button>
            </nav>


            {/* === HERO SECTION === */}
            <section className="relative bg-white rounded-3xl">

                {/* Massive Headline */}
                <div className="p-4 sm:p-8 md:p-16 pt-24 text-center relative">
                    <h1 className="text-[12vw] md:text-[10vw] leading-[0.85] font-black tracking-tighter mb-8">
                        Typography so <span className="font-serif italic">bold</span>, <br />
                        Your designs will <span className="text-[#FF6B00]">demand</span> attention.
                    </h1>
                    <p className="text-xl md:text-2xl font-bold max-w-2xl mx-auto leading-tight">
                        Curating the world's most distinct typefaces for designers who hate boring websites.
                    </p>
                </div>
            </section>


            {/* === MARQUEE (Client/Foundry Ticker) === */}
            <section className="border-y-2 border-black py-4 overflow-hidden bg-white rounded-3xl">
                <div className="font-bold mb-2 px-4">TRUSTED FOUNDRIES:</div>
                <div className="flex overflow-hidden">
                    <div ref={marqueeRef} className="flex gap-4 pl-4 items-center whitespace-nowrap">
                        {/* Repeated pills for infinite scroll loop */}
                        {[...Array(2)].map((_, i) => (
                            <React.Fragment key={i}>
                                <div className="bg-[#FF90E8] px-6 py-2 rounded-full border-2 border-black font-bold">Pangram Pangram</div>
                                <div className="bg-[#00C2FF] px-6 py-2 rounded-full border-2 border-black font-bold">Klim Type</div>
                                <div className="bg-[#FFC900] px-6 py-2 rounded-full border-2 border-black font-bold">Grilli Type</div>
                                <div className="bg-[#2ECC71] px-6 py-2 rounded-full border-2 border-black font-bold">Dinamo</div>
                                <div className="bg-[#FF6B00] px-6 py-2 rounded-full border-2 border-black font-bold">Sharp Type</div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>


            {/* === ABOUT / INTRO SECTION === */}
            <section className="p-8 md:p-16 grid md:grid-cols-2 gap-12 items-center relative bg-white rounded-3xl">
                <div className="font-bold text-2xl md:text-4xl leading-tight">
                    <span className="text-6xl block mb-4">///</span>
                    At Fontique, we believe typography is the voice of your brand. We reject the bland and champion the brave, supplying kinetic type for digital maximalists.
                </div>
                <div className="flex justify-center relative">
                    {/* Oval "Since" Graphic */}
                    <svg viewBox="0 0 300 150" className="w-full max-w-md rotate-[-5deg]">
                        <ellipse cx="150" cy="75" rx="145" ry="70" fill="none" stroke="black" strokeWidth="3" />
                        <text x="150" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold">ESTABLISHED</text>
                        <text x="150" y="95" textAnchor="middle" dominantBaseline="middle" fontSize="60" fontWeight="black">2024</text>
                    </svg>
                </div>
            </section>


            {/* === CATEGORIES (Services) SECTION === */}
            <section className="p-8 md:p-16 bg-white rounded-3xl border-y-2 border-black">
                <h2 className="text-4xl font-black mb-12 uppercase">The Collection We Deliver</h2>
                <div className="flex flex-col gap-4">
                    {/* Large colorful category pills */}
                    <motion.div whileHover={popHover} className="bg-[#FF90E8] p-6 rounded-[40px] border-2 border-black flex justify-between items-center cursor-pointer">
                        <span className="text-3xl md:text-5xl font-black uppercase">Display Sans</span>
                        <Type size={48} className="text-black" />
                    </motion.div>
                    <motion.div whileHover={popHover} className="bg-[#A05A2C] text-white p-6 rounded-[40px] border-2 border-black flex justify-between items-center cursor-pointer ml-4 md:ml-12">
                        <span className="text-3xl md:text-5xl font-black uppercase font-serif">Editorial Serif</span>
                        <PenTool size={48} className="text-white" />
                    </motion.div>
                    <motion.div whileHover={popHover} className="bg-[#FFC900] p-6 rounded-[40px] border-2 border-black flex justify-between items-center cursor-pointer">
                        <span className="text-3xl md:text-5xl font-black uppercase">Neo-Grotesque</span>
                        <Layers size={48} className="text-black" />
                    </motion.div>
                    <motion.div whileHover={popHover} className="bg-[#FF6B00] p-6 rounded-[40px] border-2 border-black flex justify-between items-center cursor-pointer ml-8 md:ml-24">
                        <span className="text-3xl md:text-5xl font-black uppercase">Experimental</span>
                        <Sparkles size={48} className="text-black" />
                    </motion.div>
                </div>
            </section>


            {/* === TESTIMONIALS (Sticky Notes) === */}
            <section className="p-8 md:p-16 relative min-h-150 overflow-hidden bg-white rounded-3xl">
                <h2 className="text-4xl font-black mb-12 uppercase">Word on the street</h2>

                <div className="relative flex justify-center items-center h-full mt-20">
                    {/* Tilted sticky notes overlapping */}
                    <div className="absolute bg-[#FFC900] p-8 w-80 h-80 rotate-[-10deg] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] top-0 left-10 md:left-1/4 z-10">
                        <p className="font-bold text-xl leading-tight">"Fontique's selection is absolutely unhinged in the best way possible. My portfolio has never looked this good."</p>
                        <div className="mt-8 font-black uppercase">- Sarah, Art Director</div>
                    </div>
                    <div className="absolute bg-[#FF90E8] p-8 w-80 h-80 rotate-[5deg] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] top-20 right-10 md:right-1/4 z-20">
                        <p className="font-bold text-xl leading-tight">"Finally, a foundry site that doesn't put me to sleep. The variable fonts here are next level."</p>
                        <div className="mt-8 font-black uppercase">- Marcus, UI Designer</div>
                    </div>
                </div>
            </section>


            {/* === CTA SECTION === */}
            <section className="p-8 md:p-16 flex justify-center items-center py-32 border-t-2 border-black bg-white rounded-3xl relative overflow-hidden">
                {/* Giant rotating starburst graphic background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <svg viewBox="0 0 200 200" className="w-[150vw] h-[150vw] animate-spin-slow">
                        <path fill="#00C2FF" d="M100,0 L120,80 L200,100 L120,120 L100,200 L80,120 L0,100 L80,80 Z" />
                    </svg>
                </div>

                <motion.div
                    whileHover={{ scale: 1.02, rotate: 2 }}
                    className="bg-[#FF6B00] w-full max-w-3xl aspect-square md:aspect-4/3 rounded-[50%] md:rounded-[200px] border-2 border-black flex flex-col items-center justify-center text-center p-12 relative z-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                    <h2 className="text-5xl md:text-7xl font-black uppercase leading-none mb-8">Let's Craft <br /> Your Success.</h2>
                    <p className="font-bold text-xl mb-8">Find the typeface that defines you.</p>
                    <button className="bg-black text-white px-8 py-4 rounded-full font-bold uppercase flex items-center gap-2 hover:bg-white hover:text-black border-2 border-black transition-colors">
                        Start Browsing <MoveRight />
                    </button>
                </motion.div>
            </section>


            {/* === FOOTER === */}
            <footer className="p-8 md:p-16 bg-white rounded-3xl border-y-2 border-black relative overflow-hidden">

                {/* Big Social Circles */}
                <div className="flex flex-wrap justify-center gap-4 mb-24 relative z-10">
                    <motion.a href="#" whileHover={popHover} className="w-40 h-40 bg-[#A05A2C] rounded-full border-2 border-black flex items-center justify-center text-white">
                        <Twitter size={48} />
                    </motion.a>
                    <motion.a href="#" whileHover={popHover} className="w-40 h-40 bg-[#00C2FF] rounded-full border-2 border-black flex items-center justify-center text-black">
                        <MessageCircle size={48} />
                    </motion.a>
                    <motion.a href="#" whileHover={popHover} className="w-40 h-40 bg-[#FF90E8] rounded-full border-2 border-black flex items-center justify-center text-black">
                        <Dribbble size={48} />
                    </motion.a>
                    <motion.a href="#" whileHover={popHover} className="w-40 h-40 bg-[#FFC900] rounded-full border-2 border-black flex items-center justify-center text-black">
                        <Instagram size={48} />
                    </motion.a>
                </div>

                {/* Massive Contact Text */}
                <div className="relative z-10">
                    <h2 className="text-[10vw] font-black leading-none tracking-tighter">Email</h2>
                    <p className="text-xl md:text-3xl font-bold mb-12">hello@fontique.com</p>

                    <h2 className="text-[10vw] font-black leading-none tracking-tighter">Whatsapp</h2>
                    <p className="text-xl md:text-3xl font-bold">+1 (555) 000-TYPE</p>
                </div>

                {/* Giant Footer Logo Sticker */}
                <div className="absolute bottom-[-5vw] right-[-5vw] rotate-12 opacity-20 pointer-events-none">
                    <div className="text-[20vw] font-black text-black tracking-tighter">
                        FONTIQUE
                    </div>
                </div>

                {/* Bottom links */}
                <div className="mt-24 pt-8 border-t-2 border-black flex flex-wrap gap-8 font-bold uppercase text-sm relative z-10">
                    <a href="#">Licensing</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms & Conditions</a>
                    <span className="ml-auto">© 2024 Fontique. All rights reserved.</span>
                </div>
            </footer>

            {/* Add custom spin animation for CTA background */}
            <style>{`
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
      `}</style>

        </div>
    );
};

export default LandingPage;