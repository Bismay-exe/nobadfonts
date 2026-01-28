import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ArrowUpRight, Type, Sparkles, Layers, SlidersHorizontal } from 'lucide-react';

const Bento: React.FC = () => {
    const marqueeRef = useRef<HTMLDivElement>(null);
    // State for the mock variable font slider
    const [weight, setWeight] = useState(500);

    // GSAP: Vertical Infinite Marquee for the Purple Box
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ repeat: -1 });
            tl.to(marqueeRef.current, {
                yPercent: -50,
                ease: "none",
                duration: 10,
            });
        }, marqueeRef);
        return () => ctx.revert();
    }, []);

    // Framer Motion Variants for Staggered Entrance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };  

    return (
        <div className="min-h-screen w-screen bg-[#000000] p-4 md:p-8 flex items-center justify-center font-sans overflow-hidden">

            {/* --- BENTO GRID CONTAINER --- */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full h-full md:h-[85vh] grid grid-cols-1 md:grid-cols-7 md:grid-rows-3 gap-1"
            >

                {/* === BOX 1: MAIN TITLE (White, Large Square) === */}
                <motion.div
                    className="col-span-1 md:col-span-3 md:row-span-3 bg-[#FFFFFF] text-black rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 bg-neutral-100 p-2 rounded-full">
                            <Layers size={18} />
                            <span className="text-sm font-bold uppercase tracking-wider">The Foundry</span>
                        </div>
                        <span className="text-sm font-mono opacity-60">Est. 2024</span>
                    </div>

                    <div className="relative z-10 mt-12">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-4">
                            Fontique.
                        </h1>
                        <p className="text-xl md:text-2xl font-medium leading-tight max-w-md text-neutral-600">
                            Curating the digital alphabet. <br /> Premium type for modern interfaces.
                        </p>
                    </div>

                    {/* Decorative giant letter */}
                    <div className="absolute -bottom-10 -right-10 text-[15rem] font-serif font-black text-neutral-100 select-none pointer-events-none group-hover:text-neutral-200 transition-colors">
                        Aa
                    </div>
                </motion.div>


                {/* === BOX 2: VERTICAL MARQUEE (Purple, Tall) === */}
                <motion.div
                    className="col-span-1 md:col-span-2 md:row-span-3 bg-[#7E3BED] text-[#C6FF34] rounded-2xl overflow-hidden relative flex flex-col"
                >
                    <div className="p-6 absolute top-0 left-0 z-10 w-full bg-linear-to-b from-[#7E3BED] to-transparent">
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} />
                            <span className="text-sm font-bold uppercase tracking-wider">Trending Styles</span>
                        </div>
                    </div>

                    {/* GSAP Scroller */}
                    <div className="h-full overflow-hidden flex items-center justify-center relative mask-image-vertical">
                        <div ref={marqueeRef} className="flex flex-col gap-8 py-8 text-center font-black text-4xl md:text-5xl uppercase tracking-tight select-none">
                            {/* Duplicated list for seamless loop */}
                            <span>Neue Mono</span>
                            <span>Editorial Serif</span>
                            <span>Brutal Sans</span>
                            <span>Liquid Display</span>
                            <span className="text-white">Geometric</span>
                            <span>Neue Mono</span>
                            <span>Editorial Serif</span>
                            <span>Brutal Sans</span>
                            <span>Liquid Display</span>
                            <span className="text-white">Geometric</span>
                        </div>
                    </div>
                    <div className="p-6 absolute bottom-0 left-0 z-10 w-full bg-linear-to-t from-[#7E3BED] to-transparent h-24 pointer-events-none" />
                </motion.div>


                {/* === BOX 3: VARIABLE SLIDER INTERACTION (Purple, Small) === */}
                <motion.div
                    className="col-span-1 md:col-span-2 md:row-span-2 bg-[#C6FF34] rounded-2xl p-6 flex flex-col justify-between text-white"
                >
                    <div className="flex items-center gap-2 text-[#7E3BED] mb-4">
                        <SlidersHorizontal size={18} />
                        <span className="text-sm font-bold uppercase tracking-wider">Variable Tester</span>
                    </div>

                    <div className="grow flex items-center justify-center">
                        <span style={{ fontWeight: weight }} className="text-6xl text-[#7E3BED] transition-all duration-100 ease-in-out select-none">
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
                            className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer accent-[#7E3BED]"
                        />
                        <div className="flex justify-between text-xs font-mono mt-2 text-black/60">
                            <span>Thin (100)</span>
                            <span>Black (900)</span>
                        </div>
                    </div>
                </motion.div>


                {/* === BOX 4: MAIN CTA (Lime, Wide) === */}
                <motion.div
                    whileHover={{ scale: 1.02, backgroundColor: "#b5ed2a" }} // Slightly darker lime on hover
                    className="col-span-1 md:col-span-2 bg-[#7E3BED] text-black rounded-2xl p-6 md:p-8 flex items-center justify-between relative overflow-hidden cursor-pointer group"
                >
                    <div className="flex flex-col gap-2 relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
                            Start <br /> Exploring
                        </h2>
                        <span className="font-medium text-lg">Browse the 2024 catalogue.</span>
                    </div>

                    <div className="bg-black p-4 md:p-6 rounded-full transition-transform duration-300 group-hover:rotate-45 relative z-10">
                        <ArrowUpRight className="text-[#C6FF34] w-8 h-8 md:w-12 md:h-12" />
                    </div>

                    {/* Decorative Icon Pattern BG */}
                    <Type className="absolute -bottom-4 -left-4 text-black/5 w-40 h-40 rotate-12 pointer-events-none" />
                </motion.div>

            </motion.div>

            {/* CSS for the gradient masks on the scrolling text */}
            <style>{`
        .mask-image-vertical {
            mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
        }
      `}</style>
        </div>
    );
};

export default Bento;