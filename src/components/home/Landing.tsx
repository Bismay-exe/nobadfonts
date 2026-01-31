import { motion, useInView } from 'framer-motion';
import { ArrowRight, Star, TrendingUp, Download, LayoutTemplate, Heart, Upload, Users, MousePointer2, Layout, Sparkles, PenTool, Type, Layers } from 'lucide-react';
import { useFonts } from '../../hooks/useFonts';
import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import React from 'react';

// --- Reusable Section Wrapper (Land2 Layout Style) ---
const Section = ({
    children,
    className = "",
    bg = "bg-white",
    text = "text-black"
}: {
    children: React.ReactNode;
    className?: string;
    bg?: string;
    text?: string;
    noBorder?: boolean;
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10%" });

    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`w-full ${bg} ${text} rounded-3xl border-2 border-black overflow-hidden relative ${className}`}
        >
            {children}
        </motion.section>
    );
};

export default function Landing() {
    const { fonts: trendingFonts } = useFonts({ sortBy: 'popular' });
    const { fonts: newFonts } = useFonts({ sortBy: 'newest' });

    // --- Chapter 4 State: Tester ---
    const [testerText, setTesterText] = useState("The quick brown fox jumps over the lazy dog.");
    const [weight, setWeight] = useState(500); // For variable font demo

    // --- Chapter 5 State: Pairing ---
    const [pairingSwap, setPairingSwap] = useState(false);

    return (
        <div className="min-h-screen w-full bg-black text-black font-sans flex flex-col">

            {/* --- CHAPTER 1: THE HOOK (HERO) --- */}
            <Section bg="bg-[#BDF522]" className="h-full py-20 flex flex-col justify-center items-center text-center px-8 md:px-16 relative">
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden select-none">
                    <div className="absolute -top-20 -left-20 rotate-12 text-[40vw] font-black">A</div>
                    <div className="absolute top-40 -right-20 -rotate-12 text-[40vw] font-black">g</div>
                </div>

                <div className="z-10 relative max-w-5xl mx-auto bg-[url('/banner/banner.png')]" />

                <div className="z-10 relative max-w-5xl mx-auto">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
                        className="mb-8"
                    >
                        <h1 className="text-[12vw] md:text-[8vw] leading-[0.8] font-black tracking-tighter mb-8">
                            STOP<br />USING<br />BAD FONTS.
                        </h1>
                    </motion.div>

                    <p className="text-xl md:text-3xl font-medium mb-12 max-w-2xl mx-auto leading-tight">
                        Life is too short for bad keming. <br />
                        We curated the top 1% of open-source type.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/fonts" className="group px-8 py-4 bg-black text-white text-xl font-bold rounded-full border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all  hover:shadow-none hover:translate-x-1 hover:translate-y-1 flex items-center gap-2">
                            Browse Collection <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/pairing" className="px-8 py-4 bg-white text-black text-xl font-bold rounded-full border-2 border-black hover:bg-[#FF90E8] transition-all flex items-center gap-2">
                            <LayoutTemplate size={24} /> Pairing Lab
                        </Link>
                    </div>
                </div>
            </Section>


            {/* --- CHAPTER 2: THE HEAT (TRENDING MARQUEE) --- */}
            <Section bg="bg-[#FF90E8]" className="py-20">
                <div className="px-8 md:px-16 mb-12 flex flex-col md:flex-row justify-between items-end">
                    <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                        The <br /> Heat <span className="text-white text-4xl align-top">🔥</span>
                    </h2>
                    <p className="text-xl font-bold max-w-md text-right mt-6 md:mt-0">
                        What the world is typing right now. <br />
                        Top downloads this week.
                    </p>
                </div>

                {/* Marquee */}
                <div className="relative w-full overflow-hidden">
                    <div className="flex gap-8 animate-scroll whitespace-nowrap px-8 pb-12">
                        {[...trendingFonts.slice(0, 5), ...trendingFonts.slice(0, 5)].map((font, i) => (
                            <Link to={`/fonts/${font.slug || font.id}`} key={`${font.id}-${i}`} className="inline-block transition-transform hover:-translate-y-2 duration-300">
                                <div className="w-80 md:w-96 h-112 bg-white rounded-4xl border-2 border-black p-6 flex flex-col justify-between ">
                                    <div className="flex justify-between items-start">
                                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase">{font.category}</span>
                                        <div className="bg-[#BDF522] border-2 border-black rounded-full p-2">
                                            <TrendingUp size={20} />
                                        </div>
                                    </div>
                                    <div className="grow flex items-center justify-center overflow-hidden">
                                        <span className="text-[10rem] leading-none" style={{ fontFamily: font.name }}>Aa</span>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black truncate">{font.name}</h3>
                                        <p className="text-gray-500 font-mono text-sm">Open Source</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </Section>


            {/* --- CHAPTER 3: THE DISCOVERY (CATALOG) --- */}
            <Section bg="bg-white" className="p-8 md:p-16">
                <div className="font-bold text-2xl md:text-4xl leading-tight mb-16 max-w-4xl">
                    <span className="text-6xl block mb-4">///</span>
                    Finding the perfect font shouldn't be a treasure hunt. We filter the noise so you find the signal.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link to="/fonts?category=Serif" className="bg-[#FF90E8] p-8 rounded-4xl border-2 border-black flex flex-col justify-between h-64 hover:scale-[1.02] transition-transform ">
                        <span className="text-3xl font-black uppercase">Serif</span>
                        <Type size={48} className="self-end opacity-20" />
                    </Link>
                    <Link to="/fonts?category=Sans Serif" className="bg-[#A05A2C] text-white p-8 rounded-4xl border-2 border-black flex flex-col justify-between h-64 hover:scale-[1.02] transition-transform ">
                        <span className="text-3xl font-black uppercase font-serif italic">Sans Serif</span>
                        <PenTool size={48} className="self-end opacity-20" />
                    </Link>
                    <Link to="/fonts?category=Display" className="bg-[#FFC900] p-8 rounded-4xl border-2 border-black flex flex-col justify-between h-64 hover:scale-[1.02] transition-transform ">
                        <span className="text-3xl font-black uppercase">Display</span>
                        <Layers size={48} className="self-end opacity-20" />
                    </Link>
                    <Link to="/fonts?category=Monospace" className="bg-[#FF6B00] p-8 rounded-4xl border-2 border-black flex flex-col justify-between h-64 hover:scale-[1.02] transition-transform ">
                        <span className="text-3xl font-black uppercase">Mono</span>
                        <Sparkles size={48} className="self-end opacity-20" />
                    </Link>
                </div>

                <div className="mt-12 text-center">
                    <Link to="/fonts" className="text-xl font-bold underline decoration-4 decoration-[#BDF522] underline-offset-4 hover:bg-[#BDF522] p-1 rounded transition-colors">
                        Explore full catalog &rarr;
                    </Link>
                </div>
            </Section>


            {/* --- CHAPTER 4: THE DETAILS (TESTER) --- */}
            <Section bg="bg-[#C6FF34]" text="text-black" className="p-8 md:p-16 md:col-span-2">
                <div className="flex items-center gap-2 mb-8 opacity-60">
                    <MousePointer2 size={18} />
                    <span className="text-sm font-bold uppercase tracking-wider">Variable Tester</span>
                </div>

                <div className="grow flex flex-col items-center justify-center min-h-[40vh] text-center">
                    <span
                        style={{ fontWeight: weight }}
                        className="text-4xl md:text-7xl transition-all duration-100 ease-linear select-none wrap-break-word max-w-5xl"
                    >
                        {testerText}
                    </span>
                </div>

                <div className="mt-12 max-w-md mx-auto">
                    <input
                        type="text"
                        value={testerText}
                        onChange={(e) => setTesterText(e.target.value)}
                        className="w-full bg-white/50 border-2 border-black rounded-lg px-4 py-2 mb-4 text-center font-bold focus:bg-white transition-colors outline-none"
                    />
                    <input
                        type="range"
                        min="100"
                        max="900"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                    <div className="flex justify-between text-xs font-mono mt-2 opacity-60">
                        <span>Thin (100)</span>
                        <span>Black (900)</span>
                    </div>
                </div>
            </Section>


            {/* --- CHAPTER 5: THE LAB (PAIRING) --- */}
            <Section bg="bg-black" text="text-[#BDF522]" className="p-8 md:p-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-6">
                            The <span className="text-[#BDF522]">Lab</span> 🧪
                        </h2>
                        <p className="text-xl font-bold text-gray-400 mb-8 max-w-md">
                            Typography is a team sport. See how headers and body copy play together.
                        </p>
                        <button
                            onClick={() => setPairingSwap(!pairingSwap)}
                            className="w-full md:w-auto px-8 py-4 bg-[#BDF522] text-black font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Layout size={20} /> Swap Pairing
                        </button>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm p-8 rounded-4xl border border-white/20 min-h-100 flex flex-col justify-center">
                        <h1 className="text-5xl md:text-6xl font-black mb-6 transition-all text-white" style={{
                            fontFamily: pairingSwap ? 'serif' : 'sans-serif'
                        }}>
                            {pairingSwap ? 'The Elegant Header' : 'The Bold Headline'}
                        </h1>
                        <p className="text-lg md:text-xl leading-relaxed text-gray-300 transition-all" style={{
                            fontFamily: pairingSwap ? 'sans-serif' : 'serif'
                        }}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.
                        </p>
                    </div>
                </div>
            </Section>


            {/* --- CHAPTER 6: THE TOOLKIT (PROFILE) --- */}
            <Section bg="bg-white" className="p-8 md:p-16 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                    <div className="w-full md:w-1/2">
                        <div className="w-full aspect-square bg-[#f0f0f0] rounded-4xl border-2 border-black flex items-center justify-center relative shadow-[8px_8px_0px_0px_#000]">
                            <Star size={120} className="text-[#FF90E8]" fill="#FF90E8" />
                            <div className="absolute top-10 right-10 bg-white p-4 rounded-xl border-2 border-black rotate-12 shadow-lg">
                                <Heart className="text-red-500" fill="currentColor" size={32} />
                            </div>
                            <div className="absolute bottom-10 left-10 bg-black text-white p-4 rounded-xl border-2 border-white -rotate-6 shadow-lg">
                                <span className="font-bold text-xl">Saved!</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2">
                        <h2 className="text-6xl md:text-7xl font-black mb-8 leading-none">
                            Your <br /> Toolkit.
                        </h2>
                        <ul className="space-y-6 text-xl font-bold">
                            <li className="flex items-center gap-4">
                                <div className="bg-[#FF90E8] p-3 rounded-xl border-2 border-black"><Heart size={24} /></div>
                                <span>Save your favorites for later</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="bg-[#BDF522] p-3 rounded-xl border-2 border-black"><Download size={24} /></div>
                                <span>One-click bulk downloads</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="bg-black text-white p-3 rounded-xl border-2 border-white"><Upload size={24} /></div>
                                <span>Share your own typefaces</span>
                            </li>
                        </ul>
                        <div className="mt-12">
                            <Link to="/auth" className="inline-block px-8 py-4 bg-black text-white text-xl font-bold rounded-full border-2 border-black hover:bg-white hover:text-black transition-all">
                                Create Free Account
                            </Link>
                        </div>
                    </div>
                </div>
            </Section>


            {/* --- CHAPTER 7: FRESH MEAT (NEW DROPS) --- */}
            <Section bg="bg-[#7B46F8]" text="text-[#BDF522]" className="rounded-4xl">
                <div className="flex justify-center text-center items-center py-16">
                    <h2 className="text-6xl md:text-8xl font-black text-white">Fresh<span className="font-serif italic text-[#BDF522]">drops</span></h2>
                </div>

                <div className="bg-white p-8 md:p-16 border-t-2 border-black">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {newFonts.slice(0, 4).map((font, i) => (
                            <Link to={`/fonts/${font.slug || font.id}`} key={i} className="group block">
                                <div className="aspect-3/4 bg-[#f8f8f8] rounded-xl border-2 border-transparent group-hover:border-black transition-colors p-6 flex flex-col justify-between relative overflow-hidden ">
                                    <div className="absolute top-4 right-4 text-xs font-mono text-black border border-black px-2 rounded-full bg-[#C6FF34]">NEW</div>
                                    <div className="grow flex items-center justify-center">
                                        <span className="text-8xl text-black font-black group-hover:scale-110 transition-transform duration-300" style={{ fontFamily: font.name }}>Aa</span>
                                    </div>
                                    <div className="z-10">
                                        <p className="font-bold text-black truncate text-lg">{font.name}</p>
                                        <p className="text-xs text-gray-500 uppercase">Free License</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </Section>


            {/* --- CHAPTER 8: COMMUNITY --- */}
            <Section bg="bg-[#FF90E8]" className="p-8 md:p-16 text-center">
                <h2 className="text-5xl md:text-7xl font-black mb-8 uppercase leading-tight">Built by Designers,<br />For Designers.</h2>

                <div className="flex justify-center flex-wrap gap-4 mb-12 max-w-4xl mx-auto">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-20 h-20 bg-white rounded-full border-2 border-black flex items-center justify-center font-bold text-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                            <Users size={32} className="opacity-10" />
                        </div>
                    ))}
                </div>

                <Link to="/members" className="inline-block bg-black text-white px-8 py-4 rounded-full font-bold text-xl border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all  hover:shadow-none hover:translate-x-1 hover:translate-y-1">
                    Meet the Community
                </Link>
            </Section>


            {/* --- CHAPTER 9: PROMISE --- */}
            <Section bg="bg-white" className="p-8 md:p-16 text-center border-black">
                <div className="max-w-4xl mx-auto py-16">
                    <Download size={64} className="mx-auto mb-8 text-black" />
                    <h2 className="text-5xl md:text-7xl font-black uppercase mb-8 leading-none">
                        Free. Open Source. <br /> <span className="text-[#FF6B00]">Forever.</span>
                    </h2>
                    <p className="text-xl md:text-2xl font-bold text-gray-600 max-w-2xl mx-auto mb-12">
                        No paywalls. No hidden fees. Just high-quality typefaces for your next project.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 text-left mt-16">
                        <div className="bg-[#F3F3F3] p-8 rounded-3xl border-2 border-black hover:bg-[#C6FF34] transition-colors ">
                            <h3 className="text-2xl font-black uppercase mb-2">01. Browse</h3>
                            <p className="font-medium text-gray-600">Search our curated collection of 500+ premium typefaces.</p>
                        </div>
                        <div className="bg-[#F3F3F3] p-8 rounded-3xl border-2 border-black hover:bg-[#FF90E8] transition-colors ">
                            <h3 className="text-2xl font-black uppercase mb-2">02. Test</h3>
                            <p className="font-medium text-gray-600">Use our live tester to see if the glyphs fit your grid.</p>
                        </div>
                        <div className="bg-[#F3F3F3] p-8 rounded-3xl border-2 border-black hover:bg-[#7B46F8] hover:text-white transition-colors ">
                            <h3 className="text-2xl font-black uppercase mb-2">03. Download</h3>
                            <p className="font-medium text-gray-600 group-hover:text-white">One-click download. Completely free for personal use.</p>
                        </div>
                    </div>
                </div>
            </Section>


            {/* --- CHAPTER 10: FOOTER --- */}
            <Section bg="bg-white" className="p-8 md:p-16 relative overflow-hidden">
                <div className="grid md:grid-cols-2 gap-12 relative z-10 mb-24">
                    <div>
                        <h2 className="text-[10vw] md:text-[5vw] font-black leading-none tracking-tighter mb-4">Email</h2>
                        <a href="mailto:hello@nobadfonts.com" className="text-xl md:text-3xl font-bold hover:text-[#7B46F8] transition-colors">hello@NoBadFonts.com</a>
                    </div>
                    <div>
                        <h2 className="text-[10vw] md:text-[5vw] font-black leading-none tracking-tighter mb-4">Social</h2>
                        <div className="flex gap-4">
                            <a href="#" className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#FF90E8] hover:text-black transition-colors border-2 border-black"><Users /></a>
                            <a href="#" className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#C6FF34] hover:text-black transition-colors border-2 border-black"><Heart /></a>
                        </div>
                    </div>
                </div>

                <div className="absolute -bottom-10 -right-10 rotate-12 opacity-10 pointer-events-none select-none">
                    <div className="text-[20vw] font-black text-black tracking-tighter leading-none">
                        NBF.
                    </div>
                </div>

                <div className="pt-8 border-t-2 border-black flex flex-wrap gap-8 font-bold uppercase text-sm relative z-10">
                    <Link to="/fonts">Catalog</Link>
                    <Link to="/pairing">Pairing</Link>
                    <Link to="/upload">Submit Font</Link>
                    <span className="ml-auto text-gray-500">© 2024 NoBadFonts</span>
                </div>
            </Section>

        </div>
    );
}
