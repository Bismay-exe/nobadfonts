import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MoveRight, Sparkles, PenTool, Type, Layers, Instagram, Dribbble, Twitter, MessageCircle, Check, Image as ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';


gsap.registerPlugin(ScrollTrigger);

// Define theme colors based on the reference image


const Land2: React.FC = () => {
    // State for the mock variable font slider
    const [weight, setWeight] = useState(500);
    const marqueeRef = useRef<HTMLDivElement>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const galleryRef = useRef<HTMLDivElement>(null);



    // GSAP: Infinite Marquee for "Trusted By" section
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(marqueeRef.current, {
                xPercent: -50,
                ease: "none",
                duration: 20,
                repeat: -1,
            });

            // Optional: Simple parallax for gallery
            if (galleryRef.current) {
                gsap.fromTo(galleryRef.current.children,
                    { y: 50, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        stagger: 0.1,
                        scrollTrigger: {
                            trigger: galleryRef.current,
                            start: "top 80%",
                        }
                    }
                );
            }
        }, mainContainerRef);
        return () => ctx.revert();
    }, []);

    // Framer Motion hover variants for interactive elements
    const popHover = {
        scale: 1.05,
        transition: { type: "spring", stiffness: 400, damping: 10 }
    } as const;

    return (
        <div ref={mainContainerRef} className="min-h-screen w-full bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] font-rockinsoda overflow-x-hidden">


            {/* === HERO SECTION === */}
            <section className="relative bg-[rgb(var(--color-card))] text-[rgb(var(--color-foreground))] rounded-3xl border-t-2 border-[rgb(var(--color-foreground))]">
                <div className="p-4 sm:p-8 md:p-16 py-14 items-center text-center relative">
                    <h1 className="text-[13vw] md:text-[7vw] leading-[0.9] font-black mb-8">
                        Type is not decoration.<br />
                        It’s the <span className="font-western font-thin italic text-[rgb(var(--color-primary))]">voice</span> of your design.
                    </h1>

                    <p className="text-lg md:text-2xl font-mono max-w-2xl mx-auto leading-tight text-[rgb(var(--color-muted-foreground))] mb-8">
                        A curated directory of open-source typefaces that actually look good. No clutter, just type.
                    </p>

                    <Link to="/fonts" className="inline-flex items-center gap-2 bg-[rgb(var(--color-primary))] border-2 border-[rgb(var(--color-foreground))] px-6 py-3 group rounded-full font-serif italic hover:bg-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-background))] transition-colors ">
                        Explore Fonts <ArrowUpRight className='group-hover:rotate-45 transition-all duration-300' />
                    </Link>
                </div>

            </section>


            {/* === MARQUEE === */}
            <section className="overflow-hidden bg-[rgb(var(--color-card)/0)] rounded-3xl border-t-2 border-[rgb(var(--color-foreground))]">
                <div className="flex overflow-hidden">
                    <div ref={marqueeRef} className="flex pl-4 items-center whitespace-nowrap tracking-wider font-trunks text-[rgb(var(--color-foreground))]">
                        {[...Array(4)].map((_, i) => (
                            <React.Fragment key={i}>
                                <div className="bg-[rgb(var(--color-primary))] px-6 py-2 rounded-full border border-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]">Pangram Pangram</div>
                                <div className="bg-[rgb(var(--color-primary))] px-6 py-2 rounded-full border border-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]">Klim Type</div>
                                <div className="bg-[rgb(var(--color-primary))] px-6 py-2 rounded-full border border-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]">Grilli Type</div>
                                <div className="bg-[rgb(var(--color-primary))] px-6 py-2 rounded-full border border-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]">Dinamo</div>
                                <div className="bg-[rgb(var(--color-primary))] px-6 py-2 rounded-full border border-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]">Sharp Type</div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* === ABOUT / INTRO SECTION === */}
            <section className="p-8 md:p-16 grid md:grid-cols-2 gap-12 items-center relative bg-[rgb(var(--color-card))] rounded-3xl border-t-2 border-[rgb(var(--color-foreground))]">
                <div className="text-2xl md:text-4xl leading-tight">
                    <span className="text-6xl block mb-4">///</span>
                    At NoBadFonts, we believe typography is the voice of your brand. We reject the bland and champion the brave, supplying kinetic type for digital maximalists.
                </div>
                <div className="flex justify-center relative">
                    <svg viewBox="0 0 300 150" className="w-full max-w-md rotate-[-5deg]">
                        <ellipse cx="150" cy="75" rx="145" ry="70" fill="none" stroke="rgb(var(--color-primary))" strokeWidth="3" />
                        <text x="150" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill="rgb(var(--color-foreground))">ESTABLISHED</text>
                        <text x="150" y="95" textAnchor="middle" dominantBaseline="middle" fontSize="60" fontWeight="black" fill="rgb(var(--color-foreground))">2026</text>
                    </svg>
                </div>
            </section>




            {/* === NEW SECTION 1: HOT DROPS (Horizontal Scroll) === */}
            <section className="bg-[rgb(var(--color-primary))] relative rounded-3xl border-t-2 border-[rgb(var(--color-foreground))]">
                <div className="flex justify-center text-center items-center py-10">
                    <h2 className="text-7xl font-black text-[rgb(var(--color-background))]">Fresh<span className="font-serif font-thin italic hover:not-italic text-[rgb(var(--color-highlight))]">drops</span></h2>
                </div>
            </section>

            {/* Horizontal Scroll Container */}
            <section className="bg-[rgb(var(--color-background))] relative rounded-3xl border-t-2 border-[rgb(var(--color-foreground))]">
                <div className="flex gap-8 overflow-x-auto px-8 snap-x hide-scrollbar">

                </div>
            </section>

            {/* === NEW SECTION 2: TYPE TESTER === */}
            <motion.section
                className="col-span-1 md:col-span-2 md:row-span-2 bg-[rgb(var(--color-highlight))] rounded-3xl p-8 md:p-16 flex flex-col justify-between text-[rgb(var(--color-background))] border-t-2 border-[rgb(var(--color-foreground))]"
            >
                <div className="flex items-center gap-2 text-[rgb(var(--color-accent))] mb-4">
                    <SlidersHorizontal size={18} />
                    <span className="text-sm font-bold uppercase tracking-wider">Variable Tester</span>
                </div>

                <div className="grow flex items-center justify-center">
                    <span style={{ fontWeight: weight }} className="hidden md:hidden lg:block text-6xl text-[rgb(var(--color-accent))] transition-all duration-100 ease-in-out select-none">
                        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Asperiores repellendus magni rerum iusto quia consequuntur. Cum, adipisci. Ex eius eum magni, aliquid voluptatibus optio vel maiores, eaque dignissimos tenetur maxime?
                    </span>
                    <span style={{ fontWeight: weight }} className="hidden md:block lg:hidden text-6xl text-[rgb(var(--color-accent))] transition-all duration-100 ease-in-out select-none">
                        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Asperiores repellendus magni rerum iusto quia consequuntur. Cum, adipisci.
                    </span>
                    <span style={{ fontWeight: weight }} className="md:hidden text-6xl text-[rgb(var(--color-accent))] transition-all duration-100 ease-in-out select-none">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    </span>
                </div>

                <div className="mt-4">
                    <input
                        type="range"
                        min="100"
                        max="900"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full h-2 bg-[rgb(var(--color-foreground)/0.2)] rounded-lg appearance-none cursor-pointer accent-[rgb(var(--color-accent))]"
                    />
                    <div className="flex justify-between text-xs font-mono mt-2 text-[rgb(var(--color-muted-foreground))]">
                        <span>Thin (100)</span>
                        <span>Black (900)</span>
                    </div>
                </div>
            </motion.section>


            <motion.section
                className="rounded-3xl p-8 md:p-16 flex flex-col justify-between bg-[rgb(var(--color-purple))] text-[rgb(var(--color-highlight))] overflow-hidden relative border-t-2 border-[rgb(var(--color-foreground))]"
                >
                <div className="p-6 absolute top-0 left-0 z-10 w-full bg-linear-to-b from-[rgb(var(--color-purple))] to-transparent">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} />
                        <span className="text-sm font-bold uppercase tracking-wider">Trending Styles</span>
                    </div>
                </div>

                {/* GSAP Scroller */}
                <div className="h-full overflow-hidden flex items-center justify-center relative mask-image-vertical">
                    <div className="flex flex-col gap-8 py-8 text-center font-black text-4xl md:text-5xl uppercase select-none">
                        {/* Duplicated list for seamless loop */}
                        <span>Neue Mono</span>
                        <span>Editorial Serif</span>
                        <span>Brutal Sans</span>
                        <span>Liquid Display</span>
                        <span className="text-[rgb(var(--color-background))]">Geometric</span>
                        <span>Neue Mono</span>
                        <span>Editorial Serif</span>
                        <span>Brutal Sans</span>
                        <span>Liquid Display</span>
                        <span className="text-[rgb(var(--color-background))]">Geometric</span>
                    </div>
                </div>
                <div className="p-6 absolute bottom-0 left-0 z-10 w-full bg-linear-to-t from-[rgb(var(--color-purple))] to-transparent h-24 pointer-events-none" />
            </motion.section>


            {/* === CATEGORIES (Services) SECTION === */}
            <section className="p-8 md:p-16 bg-[rgb(var(--color-card))] rounded-3xl border-t-2 border-[rgb(var(--color-foreground))]">
                <h2 className="text-4xl font-black mb-12 uppercase text-[rgb(var(--color-foreground))]">The Collection We Deliver</h2>
                <div className="flex flex-col gap-4">
                    <motion.div whileHover={popHover} className="bg-[rgb(var(--color-accent))] p-6 rounded-[40px] border-2 border-[rgb(var(--color-foreground))] flex justify-between items-center cursor-pointer">
                        <span className="text-3xl md:text-5xl font-black uppercase text-[rgb(var(--color-background))]">Display Sans</span>
                        <Type size={48} className="text-[rgb(var(--color-background))]" />
                    </motion.div>
                    <motion.div whileHover={popHover} className="bg-[rgb(var(--color-brown))] text-[rgb(var(--color-background))] p-6 rounded-[40px] border-2 border-[rgb(var(--color-foreground))] flex justify-between items-center cursor-pointer ml-4 md:ml-12">
                        <span className="text-3xl md:text-5xl font-black uppercase font-serif">Editorial Serif</span>
                        <PenTool size={48} className="text-[rgb(var(--color-background))]" />
                    </motion.div>
                    <motion.div whileHover={popHover} className="bg-[rgb(var(--color-warning))] p-6 rounded-[40px] border-2 border-[rgb(var(--color-foreground))] flex justify-between items-center cursor-pointer">
                        <span className="text-3xl md:text-5xl font-black uppercase text-[rgb(var(--color-background))]">Neo-Grotesque</span>
                        <Layers size={48} className="text-[rgb(var(--color-background))]" />
                    </motion.div>
                    <motion.div whileHover={popHover} className="bg-[rgb(var(--color-orange))] p-6 rounded-[40px] border-2 border-[rgb(var(--color-foreground))] flex justify-between items-center cursor-pointer ml-8 md:ml-24">
                        <span className="text-3xl md:text-5xl font-black uppercase text-[rgb(var(--color-background))]">Experimental</span>
                        <Sparkles size={48} className="text-[rgb(var(--color-background))]" />
                    </motion.div>
                </div>
            </section>


            {/* === NEW SECTION 6: HOW IT WORKS (Process) === */}
            <section className="bg-[rgb(var(--color-background))] border-t-2 border-[rgb(var(--color-foreground))]">
                <div className="grid md:grid-cols-3 gap-0 text-center">
                    {[
                        { num: "01", title: "Browse", desc: "Search our curated collection of 500+ premium typefaces." },
                        { num: "02", title: "Test", desc: "Use our live tester to see if the glyphs fit your grid." },
                        { num: "03", title: "Download", desc: "One-click download. Completely free" }
                    ].map((step, i) => (
                        <div key={i} className="flex flex-col items-center bg-[rgb(var(--color-card))] p-6 rounded-3xl border-x border-[rgb(var(--color-foreground))]">
                            <div className="w-24 h-24 rounded-full border-2 border-[rgb(var(--color-foreground))] bg-[rgb(var(--color-background))] flex items-center justify-center text-3xl font-black mb-6 shadow-[8px_8px_0px_0px_rgb(var(--color-foreground))] text-[rgb(var(--color-foreground))]">
                                {step.num}
                            </div>
                            <h3 className="text-2xl font-black uppercase mb-2 text-[rgb(var(--color-foreground))]">{step.title}</h3>
                            <p className="font-bold text-[rgb(var(--color-muted-foreground))] max-w-xs">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>


            {/* === NEW SECTION 4: LICENSING PLANS === */}
            <section id="licensing" className="p-8 md:p-24 bg-[rgb(var(--color-accent))] rounded-3xl border-t-2 border-[rgb(var(--color-foreground))]">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-black uppercase text-[rgb(var(--color-background))]">Simple Licensing</h2>
                    <p className="font-bold mt-4 text-[rgb(var(--color-background))]">No lawyers needed. Pick a plan and go.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Plan 1 */}
                    <div className="bg-[rgb(var(--color-card))] p-8 border-2 border-[rgb(var(--color-foreground))] shadow-[8px_8px_0px_0px_rgb(var(--color-foreground))] flex flex-col">
                        <h3 className="text-2xl font-black uppercase mb-2 text-[rgb(var(--color-foreground))]">Free</h3>
                        <div className="text-4xl font-black mb-6 text-[rgb(var(--color-foreground))]">$0<span className="text-sm font-normal text-[rgb(var(--color-muted-foreground))]">/project</span></div>
                        <ul className="space-y-4 mb-8 grow text-[rgb(var(--color-foreground))]">
                            <li className="flex gap-2 text-sm font-bold"><Check size={18} /> Personal Use Only</li>
                            <li className="flex gap-2 text-sm font-bold"><Check size={18} /> 1 User Seat</li>
                            <li className="flex gap-2 text-sm font-bold text-[rgb(var(--color-muted-foreground)/0.5)] line-through"><Check size={18} /> Commercial Work</li>
                        </ul>
                        <button className="w-full py-3 border-2 border-[rgb(var(--color-foreground))] font-bold uppercase hover:bg-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-background))] transition-colors">Download</button>
                    </div>

                    {/* Plan 2 (Highlighted) */}
                    <div className="bg-[rgb(var(--color-warning))] p-8 border-2 border-[rgb(var(--color-foreground))] shadow-[12px_12px_0px_0px_rgb(var(--color-foreground))] flex flex-col relative transform md:-translate-y-4">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] px-4 py-1 rounded-full text-xs font-bold uppercase">Most Popular</div>
                        <h3 className="text-2xl font-black uppercase mb-2 text-[rgb(var(--color-background))]">Pro</h3>
                        <div className="text-4xl font-black mb-6 text-[rgb(var(--color-background))]">$45<span className="text-sm font-normal text-[rgb(var(--color-background)/0.6)]">/font</span></div>
                        <ul className="space-y-4 mb-8 grow text-[rgb(var(--color-background))]">
                            <li className="flex gap-2 text-sm font-bold"><Check size={18} /> Commercial Use</li>
                            <li className="flex gap-2 text-sm font-bold"><Check size={18} /> Up to 3 Users</li>
                            <li className="flex gap-2 text-sm font-bold"><Check size={18} /> Web & Print</li>
                        </ul>
                        <button className="w-full py-3 bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] border-2 border-[rgb(var(--color-foreground))] font-bold uppercase hover:bg-[rgb(var(--color-card))] hover:text-[rgb(var(--color-foreground))] transition-colors">Select Plan</button>
                    </div>
                </div>
            </section>


            {/* === TESTIMONIALS (Sticky Notes) === */}
            <section className="p-8 md:p-16 relative min-h-212.5 md:min-h-150 overflow-hidden bg-[rgb(var(--color-card))] rounded-3xl border-t-2 border-[rgb(var(--color-foreground))]">
                <h2 className="text-4xl font-black mb-12 uppercase text-[rgb(var(--color-foreground))]">Word on the street</h2>

                <div className="relative flex justify-center items-center h-full mt-20">
                    <div className="absolute bg-[rgb(var(--color-warning))] p-8 w-80 h-80 rotate-[-10deg] border-2 border-[rgb(var(--color-foreground))] shadow-[8px_8px_0px_0px_rgb(var(--color-foreground))] top-0 left-10 md:left-1/4 z-10">
                        <p className="font-bold text-xl leading-tight text-[rgb(var(--color-background))]">"NoBadFonts's selection is absolutely unhinged in the best way possible. My portfolio has never looked this good."</p>
                        <div className="mt-8 font-black uppercase text-[rgb(var(--color-background))]">- Sarah, Art Director</div>
                    </div>
                    <div className="absolute bg-[rgb(var(--color-accent))] p-8 w-80 h-80 rotate-[5deg] border-2 border-[rgb(var(--color-foreground))] shadow-[8px_8px_0px_0px_rgb(var(--color-foreground))] top-70 md:top-20 right-10 md:right-1/4 z-20">
                        <p className="font-bold text-xl leading-tight text-[rgb(var(--color-background))]">"Finally, a foundry site that doesn't put me to sleep. The variable fonts here are next level."</p>
                        <div className="mt-8 font-black uppercase text-[rgb(var(--color-background))]">- Marcus, UI Designer</div>
                    </div>
                </div>
            </section>


            {/* === CTA SECTION === */}
            <section className="p-8 md:p-16 flex justify-center items-center py-32 border-t-2 border-[rgb(var(--color-foreground))] bg-[rgb(var(--color-card))] rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <svg viewBox="0 0 200 200" className="w-[150vw] h-[150vw] animate-spin-slow">
                        <path fill="rgb(var(--color-accent))" d="M100,0 L120,80 L200,100 L120,120 L100,200 L80,120 L0,100 L80,80 Z" />
                    </svg>
                </div>

                <motion.div
                    whileHover={{ scale: 1.02, rotate: 2 }}
                    className="bg-[rgb(var(--color-orange))] w-full max-w-3xl aspect-square md:aspect-4/3 rounded-[50%] md:rounded-[200px] flex flex-col items-center justify-center text-center p-12 relative z-10 shadow-[12px_12px_0px_0px_rgb(var(--color-foreground))] cursor-pointer"
                >
                    <h2 className="text-5xl md:text-7xl font-black uppercase leading-none mb-8 text-[rgb(var(--color-background))]">Let's Craft <br /> Your Success.</h2>
                    <p className="font-bold text-xl mb-8 text-[rgb(var(--color-background))]">Find the typeface that defines you.</p>
                    <button className="bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] px-8 py-4 rounded-full font-bold uppercase flex items-center gap-2 hover:bg-[rgb(var(--color-card))] hover:text-[rgb(var(--color-foreground))] border-2 border-[rgb(var(--color-foreground))] transition-colors">
                        Start Browsing <MoveRight />
                    </button>
                </motion.div>
            </section>


            {/* === FOOTER === */}
            <footer className="p-8 md:p-16 bg-[rgb(var(--color-card))] rounded-3xl relative overflow-hidden border-y-2 border-[rgb(var(--color-foreground))]">
                <div className="flex flex-wrap justify-center gap-4 mb-24 relative z-10">
                    <motion.a href="#" whileHover={popHover} className="w-40 h-40 bg-[rgb(var(--color-brown))] rounded-full border-2 border-[rgb(var(--color-foreground))] flex items-center justify-center text-[rgb(var(--color-background))]">
                        <Twitter size={48} />
                    </motion.a>
                    <motion.a href="#" whileHover={popHover} className="w-40 h-40 bg-[rgb(var(--color-accent))] rounded-full border-2 border-[rgb(var(--color-foreground))] flex items-center justify-center text-[rgb(var(--color-background))]">
                        <MessageCircle size={48} />
                    </motion.a>
                    <motion.a href="#" whileHover={popHover} className="w-40 h-40 bg-[rgb(var(--color-accent))] rounded-full border-2 border-[rgb(var(--color-foreground))] flex items-center justify-center text-[rgb(var(--color-background))]">
                        <Dribbble size={48} />
                    </motion.a>
                    <motion.a href="#" whileHover={popHover} className="w-40 h-40 bg-[rgb(var(--color-warning))] rounded-full border-2 border-[rgb(var(--color-foreground))] flex items-center justify-center text-[rgb(var(--color-background))]">
                        <Instagram size={48} />
                    </motion.a>
                </div>

                <div className="relative z-10 text-[rgb(var(--color-foreground))]">
                    <h2 className="text-[10vw] font-black leading-none">Email</h2>
                    <p className="text-xl md:text-3xl font-bold mb-12 text-[rgb(var(--color-muted-foreground))]">hello@NoBadFonts.com</p>

                    <h2 className="text-[10vw] font-black leading-none">Whatsapp</h2>
                    <p className="text-xl md:text-3xl font-bold text-[rgb(var(--color-muted-foreground))]">+1 (555) 000-TYPE</p>
                </div>

                <div className="absolute bottom-[-5vw] right-[-5vw] rotate-12 opacity-20 pointer-events-none">
                    <div className="text-[20vw] font-black text-[rgb(var(--color-foreground))]">
                        NoBadFonts
                    </div>
                </div>

                <div className="mt-24 pt-8 border-t-2 border-[rgb(var(--color-foreground))] flex flex-wrap gap-8 font-bold uppercase text-sm relative z-10 text-[rgb(var(--color-foreground))]">
                    <a href="#" className="hover:text-[rgb(var(--color-primary))]">Licensing</a>
                    <a href="#" className="hover:text-[rgb(var(--color-primary))]">Privacy Policy</a>
                    <a href="#" className="hover:text-[rgb(var(--color-primary))]">Terms & Conditions</a>
                    <span className="ml-auto">© 2024 NoBadFonts. All rights reserved.</span>
                </div>
            </footer>

            <style>{`
                .animate-spin-slow {
                    animation: spin 20s linear infinite;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

        </div>
    );
};

export default Land2;