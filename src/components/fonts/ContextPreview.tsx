import { useState } from 'react';
import { Smartphone, Monitor, Image as ImageIcon, TrendingUp, Bell, Play, CheckCircle, Shield, Signal, Wifi, Battery, Heart, ShoppingBag, ChevronDown, MoreHorizontal, Music, SkipBack, SkipForward, Repeat, Shuffle, Lock } from 'lucide-react';

interface ContextPreviewProps {
    fontFamily: string;
}

type Tab = 'poster' | 'app' | 'hero';

export default function ContextPreview({ fontFamily }: ContextPreviewProps) {
    const [activeTab, setActiveTab] = useState<Tab>('poster');

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-white/5 overflow-x-auto bg-black/20">
                <button
                    onClick={() => setActiveTab('poster')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
                        ${activeTab === 'poster' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}
                    `}
                >
                    <ImageIcon size={14} /> Typographic Poster
                </button>
                <button
                    onClick={() => setActiveTab('app')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
                        ${activeTab === 'app' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}
                    `}
                >
                    <Smartphone size={14} /> Mobile App
                </button>
                <button
                    onClick={() => setActiveTab('hero')}
                    className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
                        ${activeTab === 'hero' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}
                    `}
                >
                    <Monitor size={14} /> Website Hero
                </button>
            </div>

            {/* Preview Container */}
            <div className="flex-1 py-8 md:py-12 flex items-center justify-center overflow-auto min-h-150 bg-zinc-950/50 relative">

                {/* Background Grid/Noise */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

                {/* HERO VIEW */}
                {activeTab === 'hero' && (
                    <div className="w-full min-h-150 relative bg-zinc-950 rounded-3xl overflow-hidden border border-white/5 flex flex-col md:flex-row font-sans animate-in fade-in zoom-in duration-300">
                        {/* --- Browser Chrome / Toolbar --- */}
                        <div className="bg-zinc-950 border-b border-white/5 h-10 flex items-center px-4 gap-4 shrink-0 z-50 relative">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                            </div>
                            <div className="flex-1 bg-white/5 rounded-md h-6 flex items-center px-3 gap-2 text-[10px] text-zinc-500 max-w-md mx-auto border border-white/5">
                                <Lock size={10} className="text-zinc-400" />
                                <span>acme-inc.com/future</span>
                            </div>
                        </div>

                        {/* --- Website Content --- */}
                        <div className="bg-black relative flex-1">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-blue-500/10 blur-[100px] rounded-full mix-blend-screen animate-pulse" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-purple-500/10 blur-[80px] rounded-full mix-blend-screen pointer-events-none"></div>

                            {/* Hero Section */}
                            <section className="px-12 pt-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 max-w-6xl mx-auto">
                                {/* Left Content */}
                                <div className="flex flex-col items-start gap-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                        v2.0 Released
                                    </div>

                                    <h1 style={{ fontFamily }} className="text-6xl md:text-7xl text-white leading-none font-bold tracking-tight">
                                        Shape the <br />
                                        <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-rose-400">Future.</span>
                                    </h1>

                                    <p className="text-lg text-zinc-400 leading-relaxed max-w-lg">
                                        Experience the next generation of digital interfaces.
                                        Designed for clarity, built for speed.
                                    </p>

                                    <div className="flex gap-4 pt-4">
                                        <button className="flex items-center justify-center gap-2 text-sm font-bold text-black bg-white hover:bg-zinc-200 px-8 py-4 rounded-full transition-all">
                                            <Play size={16} fill="currentColor" />
                                            Start Demo
                                        </button>
                                        <button className="px-8 py-4 rounded-full text-sm font-bold text-white border border-white/10 hover:bg-white/5 transition-all">
                                            Documentation
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-6 pt-4 text-xs text-zinc-500 font-medium uppercase tracking-wider">
                                        <span className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> No credit card</span>
                                        <span className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> 14-day free trial</span>
                                    </div>
                                </div>

                                {/* Right Visual */}
                                <div className="relative w-full aspect-square flex items-center justify-center">
                                    <span className="bg-clip-text text-transparent bg-linear-to-r from-white/10 to-transparent">Aa</span>
                                    <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/10 to-transparent rounded-full blur-2xl"></div>

                                    {/* Abstract Card */}
                                    <div className="relative w-75 h-100 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                                        <div className="flex justify-between items-center">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                <TrendingUp size={20} className="text-emerald-400" />
                                            </div>
                                            <span className="text-xs text-zinc-500 font-mono">LIVE</span>
                                        </div>

                                        <div>
                                            <p className="text-sm text-zinc-400 font-medium mb-1">Total Revenue</p>
                                            <h3 style={{ fontFamily }} className="text-4xl text-white font-bold">$124.5k</h3>
                                        </div>

                                        <div className="h-32 flex items-end gap-2">
                                            {[40, 70, 45, 90, 60].map((h, i) => (
                                                <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-indigo-500/20 rounded-t-sm hover:bg-indigo-500/40 transition-colors"></div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="absolute -bottom-8 -left-8 w-50 bg-zinc-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-4 animate-bounce [animation-duration:4s]">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-400">Security</p>
                                            <p className="text-sm font-bold text-white">Encrypted</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}


                {/* APP VIEW */}
                {activeTab === 'app' && (
                    <div className='flex flex-wrap justify-center items-center gap-8'>
                        {/* Music App */}
                        <div className="relative min-w-80 max-w-80 h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300 border border-zinc-800">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-24 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-zinc-950 rounded-[2.2rem] overflow-hidden flex flex-col relative text-white">
                                {/* Ambient Background */}
                                <div className="absolute inset-0 bg-linear-to-b from-indigo-900/20 to-black pointer-events-none"></div>

                                {/* Status Bar */}
                                <div className="h-10 px-6 flex justify-between items-center text-[10px] font-medium text-white z-10 pt-2">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <Signal size={10} />
                                        <Wifi size={10} />
                                        <Battery size={10} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col relative z-10">
                                    <div className="flex justify-between items-center mb-8">
                                        <ChevronDown size={24} className="text-zinc-400" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400">Playing from Playlist</span>
                                        <MoreHorizontal size={24} className="text-zinc-400" />
                                    </div>

                                    {/* Album Art */}
                                    <div className="aspect-square bg-zinc-900 rounded-2xl mb-8 border border-white/5 shadow-2xl overflow-hidden relative group">
                                        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/80 to-black p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-white/5">
                                            <Music size={80} />
                                        </div>
                                    </div>

                                    {/* Track Info */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h2 style={{ fontFamily }} className="text-2xl font-bold mb-1 text-white">Midnight City</h2>
                                                <p className="text-zinc-400 text-sm">M83 • Hurry Up, We're Dreaming</p>
                                            </div>
                                            <Heart size={24} className="text-indigo-500 fill-indigo-500 mb-1" />
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-8 group">
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="w-50 h-32 md:h-40 object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium text-zinc-500 mt-2">
                                            <span>2:14</span>
                                            <span>4:18</span>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex justify-between items-center">
                                        <Shuffle size={20} className="text-zinc-600" />
                                        <SkipBack size={28} className="text-white hover:text-indigo-400 transition-colors" />
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10">
                                            <Play size={24} className="ml-1 fill-black" />
                                        </div>
                                        <SkipForward size={28} className="text-white hover:text-indigo-400 transition-colors" />
                                        <Repeat size={20} className="text-zinc-600" />
                                    </div>
                                </div>
                                <div className="h-1 w-1/3 bg-white/20 rounded-full mx-auto mb-2"></div>
                            </div>
                        </div>

                        {/* Finance App */}
                        <div className="relative min-w-80 max-w-80 h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300 border border-zinc-800">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-24 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-[#050505] rounded-[2.2rem] overflow-hidden flex flex-col relative text-white">
                                {/* Status Bar */}
                                <div className="h-10 px-6 flex justify-between items-center text-[10px] font-medium text-white z-10 pt-2">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <Signal size={10} />
                                        <Wifi size={10} />
                                        <Battery size={10} />
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar relative z-10">
                                    {/* Header */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-zinc-900 rounded-full border border-white/10 flex items-center justify-center text-xs font-bold">JD</div>
                                            <div>
                                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Total Balance</p>
                                                <p style={{ fontFamily }} className="text-lg font-bold">$24,484.00</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-zinc-900">
                                            <Bell size={18} className="text-zinc-400" />
                                        </div>
                                    </div>

                                    {/* Card */}
                                    <div className="bg-linear-to-br from-indigo-600 to-indigo-900 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-indigo-900/20">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-tr from-white/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="text-xs font-mono text-indigo-200">DEBIT</div>
                                            <div className="flex gap-1">
                                                <div className="w-6 h-4 bg-white/20 rounded-sm"></div>
                                                <div className="w-6 h-4 bg-white/20 rounded-sm"></div>
                                            </div>
                                        </div>
                                        <p className="font-mono text-lg tracking-widest mb-4">•••• •••• •••• 4582</p>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] text-indigo-200 uppercase">Card Holder</p>
                                                <p className="text-sm font-bold">John Doe</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-red-500/80"></div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-4">
                                        <button className="flex-1 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors">Send</button>
                                        <button className="flex-1 py-3 bg-zinc-900 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors">Request</button>
                                    </div>

                                    {/* List */}
                                    <div>
                                        <p className="text-sm font-bold mb-4">Transactions</p>
                                        <div className="flex flex-col gap-4">
                                            {[1, 2, 3].map((_, i) => (
                                                <div key={i} className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-colors">
                                                            <ShoppingBag size={16} className="text-zinc-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold">Apple Store</p>
                                                            <p className="text-[10px] text-zinc-500">Today, 10:24 AM</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-white">-$1,299.00</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-1 w-1/3 bg-white/20 rounded-full mx-auto mb-2"></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'poster' && (
                    <div className="w-full max-w-sm aspect-3/4 bg-white text-black p-8 flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        <div className="w-full aspect-3/4 object-cover border-20 border-black shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 ease-out"></div>

                        <div className="z-10 relative">
                            <div className="flex justify-between items-start mb-12">
                                <div className="w-8 h-8 bg-black rounded-full"></div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-right">
                                    Typographic<br />Exhibition<br />2024
                                </div>
                            </div>

                            <h1 style={{ fontFamily }} className="text-8xl leading-[0.8] tracking-tighter mix-blend-difference wrap-break-word">
                                Flow<br />Stat.e
                            </h1>
                        </div>

                        <div className="z-10 relative">
                            <p style={{ fontFamily }} className="text-xl leading-tight max-w-[80%] mb-8">
                                Exploring the boundaries between legibility and abstraction in modern digital interfaces.
                            </p>

                            <div className="flex justify-between items-end border-t-2 border-black pt-4">
                                <span className="text-xs font-mono">FIG. 001</span>
                                <span className="text-xs font-mono">NYC</span>
                            </div>
                        </div>

                        {/* Interactive texture/grain overlay */}
                        <div className="absolute inset-0 bg-[#f0f0f0] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-multiply pointer-events-none z-0"></div>
                    </div>
                )}

            </div>
        </div>
    );
}

