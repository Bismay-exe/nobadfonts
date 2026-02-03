import { useState } from 'react';
import { Smartphone, Monitor, Image as ImageIcon, Menu, Battery, Wifi, Signal } from 'lucide-react';

interface ContextPreviewProps {
    fontFamily: string;
}

type Tab = 'hero' | 'app' | 'poster';

export default function ContextPreview({ fontFamily }: ContextPreviewProps) {
    const [activeTab, setActiveTab] = useState<Tab>('hero');

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('hero')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                        ${activeTab === 'hero' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}
                    `}
                >
                    <Monitor size={16} /> Website Hero
                </button>
                <button
                    onClick={() => setActiveTab('app')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                        ${activeTab === 'app' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}
                    `}
                >
                    <Smartphone size={16} /> Mobile App
                </button>
                <button
                    onClick={() => setActiveTab('poster')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                        ${activeTab === 'poster' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}
                    `}
                >
                    <ImageIcon size={16} /> Typographic Poster
                </button>
            </div>

            {/* Preview Container */}
            <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-auto min-h-125">

                {/* HERO VIEW */}
                {activeTab === 'hero' && (
                    <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 animate-in fade-in duration-300">
                        {/* Fake Browser Chrome */}
                        <div className="bg-gray-100 px-4 py-3 flex items-center gap-4 border-b border-gray-200">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="flex-1 bg-white h-6 rounded-md shadow-sm opacity-50"></div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col md:flex-row h-100">
                            <div className="flex-1 p-12 flex flex-col justify-center gap-6">
                                <span style={{ fontFamily }} className="text-sm tracking-widest uppercase text-blue-600">
                                    Introducing
                                </span>
                                <h1 style={{ fontFamily }} className="text-5xl md:text-6xl leading-tight text-gray-900">
                                    Future of Typography.
                                </h1>
                                <p className="text-gray-500 leading-relaxed max-w-md">
                                    Experience the perfect blend of aesthetics and readability.
                                    Designed for modern interfaces and bold statements.
                                </p>
                                <div className="flex gap-4 pt-4">
                                    <button style={{ fontFamily }} className="px-8 py-3 bg-black text-white rounded-lg">
                                        Get Started
                                    </button>
                                    <button style={{ fontFamily }} className="px-8 py-3 bg-gray-100 text-black rounded-lg">
                                        Learn More
                                    </button>
                                </div>
                            </div>
                            <div className="w-1/3 bg-gray-100 m-8 rounded-2xl hidden md:flex items-center justify-center text-gray-300">
                                <ImageIcon size={64} />
                            </div>
                        </div>
                    </div>
                )}

                {/* APP VIEW */}
                {activeTab === 'app' && (
                    <div className="relative w-[320px] h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300 border-8 border-black">
                        {/* Island */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-24 bg-black rounded-b-xl z-20"></div>

                        {/* Screen */}
                        <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden flex flex-col relative text-gray-900">
                            {/* Status Bar */}
                            <div className="h-12 px-6 flex justify-between items-center text-xs font-bold text-black z-10 pt-2">
                                <span>9:41</span>
                                <div className="flex gap-1">
                                    <Signal size={12} />
                                    <Wifi size={12} />
                                    <Battery size={12} />
                                </div>
                            </div>

                            {/* App Content */}
                            <div className="p-6 flex-1 flex flex-col gap-6">
                                <div className="flex justify-between items-center">
                                    <Menu size={24} />
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                </div>

                                <div>
                                    <h2 style={{ fontFamily }} className="text-3xl leading-none mb-2">Discover</h2>
                                    <p className="text-gray-400 text-sm">New collections today</p>
                                </div>

                                {/* Cards */}
                                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                                    <div className="shrink-0 w-48 h-64 bg-black rounded-2xl p-4 flex flex-col justify-end text-white">
                                        <span style={{ fontFamily }} className="text-xl">Minimalist</span>
                                        <span className="text-xs opacity-70">24 Items</span>
                                    </div>
                                    <div className="shrink-0 w-48 h-64 bg-gray-100 rounded-2xl p-4 flex flex-col justify-end">
                                        <span style={{ fontFamily }} className="text-xl">Abstract</span>
                                        <span className="text-xs opacity-70 text-gray-500">18 Items</span>
                                    </div>
                                </div>

                                <div className="flex-1 bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                    <div>
                                        <h3 style={{ fontFamily }} >Grid System</h3>
                                        <p className="text-xs text-gray-400">By Studio A</p>
                                    </div>
                                </div>
                            </div>

                            {/* Nav Bar */}
                            <div className="h-20 bg-white/90 backdrop-blur border-t px-8 flex justify-between items-center pb-4">
                                <div className="w-6 h-6 rounded-md bg-black"></div>
                                <div className="w-6 h-6 rounded-md bg-gray-200"></div>
                                <div className="w-6 h-6 rounded-md bg-gray-200"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* POSTER VIEW */}
                {activeTab === 'poster' && (
                    <div className="relative w-full max-w-md aspect-3/4 bg-[#F4F1EA] shadow-xl p-8 flex flex-col justify-between animate-in fade-in duration-300">
                        {/* Texture Overlay */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')]"></div>

                        <div className="border border-black flex-1 p-2 flex flex-col">
                            <div className="flex justify-between border-b border-black pb-2 mb-8">
                                <span style={{ fontFamily }} className="text-xs uppercase tracking-widest">Vol. 01</span>
                                <span style={{ fontFamily }} className="text-xs uppercase tracking-widest">Edition 2024</span>
                            </div>

                            <div className="flex-1 flex flex-col justify-center items-center text-center">
                                <h1 style={{ fontFamily }} className="text-8xl leading-[0.8] wrap-break-word w-full  mb-4">
                                    TYPO<br />GRAPHY
                                </h1>
                                <div style={{ fontFamily }} className="w-24 h-24 rounded-full bg-black text-[#F4F1EA] flex items-center justify-center text-xl animate-spin-slow">
                                    ART
                                </div>
                            </div>

                            <div className="border-t border-black pt-4 grid grid-cols-3 gap-4 text-[10px] leading-tight mt-8">
                                <p>
                                    LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT.
                                    SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE.
                                </p>
                                <p className="text-center font-bold">
                                    FIG. 1
                                    <br />
                                    DISPLAY TYPEFACE
                                </p>
                                <p className="text-right">
                                    DESIGNED FOR IMPACT.<br />
                                    CRAFTED FOR READABILITY.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Add this to tailwind layer later if needed, but for now standard classes work.
// Note: 'animate-spin-slow' is a custom class, usually 'animate-spin' works or we add custom CSS.
