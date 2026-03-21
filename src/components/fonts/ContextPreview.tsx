import { useState, useCallback } from 'react';
import { Smartphone, Monitor, Image as ImageIcon, Menu, Battery, Wifi, Signal, ChevronDown, MoreHorizontal, Music, Heart, Shuffle, SkipBack, Play, SkipForward, Repeat, CreditCard, ArrowDown, ArrowUp, TrendingUp, Bell, ArrowUpRight, Star, ShoppingBag, ArrowLeft, ArrowRight, Search, MapPin, Grid, Settings, Tv, Lightbulb, Flame, Wind, Lock, HomeIcon, ChevronRight, CloudRain, Zap, Plus, Sun, Cloud, Droplets, Eye, RotateCw, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ContextPreviewProps {
    fontFamily: string;
}

type Tab = 'poster' | 'app' | 'hero';

export default function ContextPreview({ fontFamily }: ContextPreviewProps) {
    const [activeTab, setActiveTab] = useState<Tab>('poster');

    const getLongShadow = useCallback((color: string, length = 60) => {
        let shadow = '';
        for (let i = 1; i <= length; i++) {
            shadow += `-${i}px ${i}px 0px ${color}${i === length ? '' : ','}`;
        }
        return shadow;
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-[rgb(var(--color-border))] overflow-x-auto">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveTab('poster'); Haptics.impact({ style: ImpactStyle.Light }); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm  transition-all whitespace-nowrap
                        ${activeTab === 'poster' ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] shadow-md' : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-muted)/0.1)]'}
                    `}
                >
                    <ImageIcon size={16} /> Typographic Poster
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveTab('app'); Haptics.impact({ style: ImpactStyle.Light }); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm  transition-all whitespace-nowrap
                        ${activeTab === 'app' ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] shadow-md' : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-muted)/0.1)]'}
                    `}
                >
                    <Smartphone size={16} /> Mobile App
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveTab('hero'); Haptics.impact({ style: ImpactStyle.Light }); }}
                    className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-sm  transition-all whitespace-nowrap
                        ${activeTab === 'hero' ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] shadow-md' : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-muted)/0.1)]'}
                    `}
                >
                    <Monitor size={16} /> Website Hero
                </motion.button>
            </div>

            {/* Preview Container */}
            <div className="flex-1 py-4 md:py-8 flex items-center justify-center overflow-auto min-h-125">

                {/* HERO VIEW */}
                {activeTab === 'hero' && (
                    <div className='hidden lg:flex flex-wrap justify-center items-center gap-5'>
                        <div className="w-full max-w-4xl bg-[rgb(var(--color-background))] rounded-xl shadow-xl overflow-hidden border border-[rgb(var(--color-border))] animate-in fade-in duration-300">
                            {/* Fake Browser Chrome */}
                            <div className="bg-[rgb(var(--color-muted)/0.05)] px-4 py-3 flex items-center gap-4 border-b border-[rgb(var(--color-border))]">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="flex-1 bg-[rgb(var(--color-background))] h-6 rounded-md shadow-sm opacity-50"></div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col md:flex-row h-100">
                                <div className="flex-1 p-12 flex flex-col justify-center gap-6">
                                    <span style={{ fontFamily }} className="text-sm tracking-widest uppercase text-[rgb(var(--color-accent))]">
                                        Introducing
                                    </span>
                                    <h1 style={{ fontFamily }} className="text-5xl md:text-6xl leading-tight text-[rgb(var(--color-foreground))]">
                                        Future of Typography.
                                    </h1>
                                    <p className="text-[rgb(var(--color-muted-foreground))] leading-relaxed max-w-md">
                                        Experience the perfect blend of aesthetics and readability.
                                        Designed for modern interfaces and bold statements.
                                    </p>
                                    <div className="flex gap-4 pt-4">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                                            style={{ fontFamily }}
                                            className="px-8 py-3 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-lg"
                                        >
                                            Get Started
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                                            style={{ fontFamily }}
                                            className="px-8 py-3 bg-[rgb(var(--color-muted)/0.1)] text-[rgb(var(--color-foreground))] rounded-lg"
                                        >
                                            Learn More
                                        </motion.button>
                                    </div>
                                </div>
                                <div className="w-1/3 bg-[rgb(var(--color-muted)/0.05)] m-8 rounded-2xl hidden md:flex items-center justify-center text-[rgb(var(--color-muted-foreground))]">
                                    <ImageIcon size={64} />
                                </div>
                            </div>
                        </div>

                        <div className="w-full max-w-5xl aspect-16/10 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col font-sans animate-in fade-in zoom-in duration-300">

                            {/* --- Browser Chrome / Toolbar --- */}
                            <div className="bg-white border-b border-gray-200 h-10 flex items-center px-4 gap-4 shrink-0 z-50 relative">
                                {/* Window Controls */}
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                </div>

                                {/* Navigation & Address */}
                                <div className="flex-1 flex items-center gap-3 ml-2">
                                    <div className="flex gap-2 text-gray-400">
                                        <ArrowLeft size={14} />
                                        <ArrowRight size={14} />
                                        <RotateCw size={14} />
                                    </div>
                                    <div className="flex-1 bg-[rgb(var(--color-muted)/0.05)] rounded-md h-6 flex items-center px-2 gap-2 text-[10px] text-[rgb(var(--color-muted-foreground))] max-w-md mx-auto">
                                        <Lock size={10} className="text-[rgb(var(--color-highlight))]" />
                                        <span>untitledui.com/product</span>
                                    </div>
                                </div>
                            </div>

                            {/* --- Website Content --- */}
                            <div className="bg-[rgb(var(--color-background))] relative">

                                {/* Background Decoration */}
                                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 w-200 h-200 bg-[rgb(var(--color-accent)/0.05)] rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-150 h-150 bg-[rgb(var(--color-accent)/0.05)] rounded-full blur-3xl pointer-events-none"></div>

                                {/* Hero Section */}
                                <section className="px-8 pt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 max-w-6xl mx-auto">

                                    {/* Left Content */}
                                    <div className="flex flex-col items-start gap-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgb(var(--color-accent)/0.1)] border border-[rgb(var(--color-accent)/0.2)] text-[rgb(var(--color-accent))] text-xs font-medium">
                                            <span className="flex h-2 w-2 rounded-full bg-[rgb(var(--color-accent))]"></span>
                                            New feature released!
                                            <ChevronRight size={12} />
                                        </div>

                                        <h1 style={{ fontFamily }} className="text-5xl md:text-6xl text-[rgb(var(--color-foreground))] leading-[1.1]">
                                            Beautiful analytics to grow smarter
                                        </h1>

                                        <p className="text-lg text-[rgb(var(--color-muted-foreground))] leading-relaxed max-w-lg">
                                            Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                                                className="flex items-center justify-center gap-2 text-base font-bold text-[rgb(var(--color-background))] bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent)/0.9)] px-6 py-3 rounded-xl transition-all shadow-lg"
                                            >
                                                <Play size={18} fill="currentColor" />
                                                Demo
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                                                className="flex items-center justify-center gap-2 text-base font-bold text-[rgb(var(--color-foreground))] bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-muted)/0.05)] px-6 py-3 rounded-xl transition-all"
                                            >
                                                Sign up
                                            </motion.button>
                                        </div>

                                        <div className="flex items-center gap-6 pt-4 text-sm text-[rgb(var(--color-muted-foreground))] font-medium">
                                            <span className="flex items-center gap-1"><CheckCircle size={16} className="text-[rgb(var(--color-highlight))]" /> Free 14-day trial</span>
                                            <span className="flex items-center gap-1"><CheckCircle size={16} className="text-[rgb(var(--color-highlight))]" /> No credit card</span>
                                        </div>
                                    </div>

                                    {/* Right Visual (Abstract UI Composition) */}
                                    <div className="relative w-full flex items-center justify-center perspective-[1000px]">
                                        {/* Background Glow */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[rgb(var(--color-accent)/0.1)] rounded-full blur-3xl"></div>

                                        {/* Main Dashboard Card */}
                                        <div className="absolute w-[90%] bg-[rgb(var(--color-background))] rounded-2xl shadow-2xl border border-[rgb(var(--color-border)/0.5)] p-4 transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform hover:rotate-0 duration-700 ease-out">

                                            {/* Fake Header */}
                                            <div className="flex justify-between items-center mb-6 border-b border-[rgb(var(--color-border)/0.3)] pb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-[rgb(var(--color-foreground))]">Overview</h3>
                                                    <p className="text-xs text-[rgb(var(--color-muted-foreground))]">Welcome back, Olivia</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="w-8 h-8 rounded-md bg-[rgb(var(--color-muted)/0.1)] border border-[rgb(var(--color-border))]"></div>
                                                    <div className="w-8 h-8 rounded-md bg-[rgb(var(--color-accent)/0.1)] border border-[rgb(var(--color-accent)/0.2)] text-[rgb(var(--color-accent))] flex items-center justify-center"><TrendingUp size={16} /></div>
                                                </div>
                                            </div>

                                            {/* Chart Simulation */}
                                            <div className="flex items-end gap-3 h-32 px-2 mb-6">
                                                {[30, 45, 25, 60, 40, 70, 50, 80].map((h, i) => (
                                                    <div key={i} className="flex-1 bg-[rgb(var(--color-accent)/0.1)] rounded-t-sm relative group overflow-hidden">
                                                        <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-[rgb(var(--color-accent))] rounded-t-sm group-hover:bg-[rgb(var(--color-accent)/0.8)] transition-colors"></div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Bottom Stats */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="p-3 bg-[rgb(var(--color-muted)/0.05)] rounded-lg">
                                                    <p className="text-[10px] text-[rgb(var(--color-muted-foreground))] font-bold uppercase">Users</p>
                                                    <p className="text-lg font-bold text-[rgb(var(--color-foreground))]">2.4k</p>
                                                </div>
                                                <div className="p-3 bg-[rgb(var(--color-muted)/0.05)] rounded-lg">
                                                    <p className="text-[10px] text-[rgb(var(--color-muted-foreground))] font-bold uppercase">Sessions</p>
                                                    <p className="text-lg font-bold text-[rgb(var(--color-foreground))]">48k</p>
                                                </div>
                                                <div className="p-3 bg-[rgb(var(--color-accent)/0.1)] rounded-lg border border-[rgb(var(--color-accent)/0.2)]">
                                                    <p className="text-[10px] text-[rgb(var(--color-accent))] font-bold uppercase">Growth</p>
                                                    <p className="text-lg font-bold text-[rgb(var(--color-accent))]">+12%</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Floating Badge 1 (Users) */}
                                        <div className="absolute top-10 -left-4 bg-[rgb(var(--color-background))] p-3 rounded-xl shadow-xl border border-[rgb(var(--color-border)/0.5)] flex items-center gap-3 animate-bounce [animation-duration:3s]">
                                            <div className="flex -space-x-2">
                                                <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--color-background))] bg-red-100"></div>
                                                <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--color-background))] bg-blue-100"></div>
                                                <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--color-background))] bg-green-100"></div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[rgb(var(--color-foreground))]">New Users</p>
                                                <p className="text-[10px] text-[rgb(var(--color-muted-foreground))]">+24 today</p>
                                            </div>
                                        </div>

                                        {/* Floating Badge 2 (Security) */}
                                        <div className="absolute -bottom-6 -right-2 bg-[rgb(var(--color-background))] p-3 rounded-xl shadow-xl border border-[rgb(var(--color-border)/0.5)] flex items-center gap-3 animate-bounce [animation-duration:4s]">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                <Shield size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[rgb(var(--color-foreground))]">Audit Log</p>
                                                <p className="text-[10px] text-green-600">Secure & Encrypted</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                        </div>
                    </div>
                )}

                {/* APP VIEW */}
                {activeTab === 'app' && (
                    <div className='flex flex-wrap justify-center items-center gap-5'>
                        <div className="relative min-w-[320px] max-w-[320px] h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-30 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-[rgb(var(--color-background))] rounded-[2.2rem] overflow-hidden flex flex-col relative text-[rgb(var(--color-foreground))]">
                                {/* Status Bar */}
                                <div className="h-12 px-6 flex justify-between items-center text-xs  text-[rgb(var(--color-foreground))] z-10 pt-2">
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
                                        <div className="w-8 h-8 bg-[rgb(var(--color-muted)/0.15)] rounded-full"></div>
                                    </div>

                                    <div>
                                        <h2 style={{ fontFamily }} className="text-3xl leading-none mb-2">Discover</h2>
                                        <p className="text-[rgb(var(--color-muted-foreground))] text-sm">New collections today</p>
                                    </div>

                                     {/* Cards */}
                                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                                        <div className="shrink-0 w-48 h-64 bg-[rgb(var(--color-foreground))] rounded-2xl p-4 flex flex-col justify-end text-[rgb(var(--color-background))]">
                                            <span style={{ fontFamily }} className="text-xl">Minimalist</span>
                                            <span className="text-xs opacity-70">24 Items</span>
                                        </div>
                                        <div className="shrink-0 w-48 h-64 bg-[rgb(var(--color-muted)/0.1)] rounded-2xl p-4 flex flex-col justify-end">
                                            <span style={{ fontFamily }} className="text-xl">Abstract</span>
                                            <span className="text-xs opacity-70 text-[rgb(var(--color-muted-foreground))]">18 Items</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-[rgb(var(--color-muted)/0.05)] rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[rgb(var(--color-muted)/0.1)] rounded-xl"></div>
                                        <div>
                                            <h3 style={{ fontFamily }} >Grid System</h3>
                                            <p className="text-xs text-[rgb(var(--color-muted-foreground))]">By Studio A</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Nav Bar */}
                                <div className="h-20 bg-[rgb(var(--color-background)/0.9)] backdrop-blur border-t border-[rgb(var(--color-border))] px-8 flex justify-between items-center pb-4">
                                    <div className="w-6 h-6 rounded-md bg-[rgb(var(--color-foreground))]"></div>
                                    <div className="w-6 h-6 rounded-md bg-[rgb(var(--color-muted)/0.2)]"></div>
                                    <div className="w-6 h-6 rounded-md bg-[rgb(var(--color-muted)/0.2)]"></div>
                                </div>
                            </div>
                        </div>

                        {/* APP VIEW - Music Player Variant */}
                        <div className="relative min-w-[320px] max-w-[320px] h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-30 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-[rgb(var(--color-card))] rounded-[2.2rem] overflow-hidden flex flex-col relative text-[rgb(var(--color-foreground))]">

                                {/* Background linear Blob */}
                                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-[rgb(var(--color-accent)/0.4)] rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute bottom-[-10%] right-[-20%] w-full h-[50%] bg-[rgb(var(--color-highlight)/0.2)] rounded-full blur-3xl pointer-events-none"></div>

                                {/* Status Bar */}
                                <div className="h-12 px-6 flex justify-between items-center text-xs  text-white z-10 pt-2">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <Signal size={12} />
                                        <Wifi size={12} />
                                        <Battery size={12} />
                                    </div>
                                </div>

                                {/* App Content */}
                                <div className="p-6 w-full flex flex-col z-10">
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-8">
                                        <ChevronDown size={24} className="text-[rgb(var(--color-foreground)/0.7)]" />
                                        <span className="text-xs font-medium tracking-widest uppercase text-[rgb(var(--color-muted-foreground))]">Now Playing</span>
                                        <MoreHorizontal size={24} className="text-[rgb(var(--color-foreground)/0.7)]" />
                                    </div>

                                    {/* Album Art */}
                                    <div className="w-full aspect-square bg-linear-to-tr from-violet-500 to-fuchsia-500 rounded-2xl shadow-[0_0_40px_10px_rgba(0,0,0,0.3)] mb-8 flex items-center justify-center relative overflow-hidden group">
                                        {/* Simulated Image Texture */}
                                        <div className="absolute inset-0 bg-black/10"></div>
                                        <Music size={64} className="text-white/20" />
                                    </div>

                                    {/* Track Info */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h2 style={{ fontFamily }} className="text-2xl  mb-1">Nightcall</h2>
                                                <p className="text-[rgb(var(--color-muted-foreground))] text-sm">Kavinsky • Drive OST</p>
                                            </div>
                                            <Heart size={24} className="text-[rgb(var(--color-destructive))] fill-[rgb(var(--color-destructive)/0.2)] mb-1" />
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-8">
                                        <div className="h-1.5 w-full bg-[rgb(var(--color-muted)/0.2)] rounded-full overflow-hidden cursor-pointer">
                                            <div className="h-full w-2/3 bg-[rgb(var(--color-foreground))] rounded-full"></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium text-[rgb(var(--color-muted-foreground))] mt-2">
                                            <span>2:14</span>
                                            <span>4:18</span>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex justify-between items-center px-2">
                                        <Shuffle size={20} className="text-[rgb(var(--color-foreground)/0.4)]" />
                                        <SkipBack size={28} className="text-[rgb(var(--color-foreground))] fill-current" />
                                        <div className="w-16 h-16 bg-[rgb(var(--color-foreground))] rounded-full flex items-center justify-center shadow-lg shadow-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-background))] hover:scale-105 transition-transform cursor-pointer">
                                            <Play size={28} className="ml-1 fill-current" />
                                        </div>
                                        <SkipForward size={28} className="text-[rgb(var(--color-foreground))] fill-current" />
                                        <Repeat size={20} className="text-[rgb(var(--color-foreground)/0.4)]" />
                                    </div>
                                </div>

                                {/* Bottom Indicator */}
                                <div className="h-1 w-1/3 bg-[rgb(var(--color-foreground)/0.2)] rounded-full mx-auto mb-2"></div>
                            </div>
                        </div>

                        {/* APP VIEW - Finance/Crypto Wallet */}
                        <div className="relative min-w-[320px] max-w-[320px] h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-30 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-[rgb(var(--color-background))] rounded-[2.2rem] overflow-hidden flex flex-col relative text-[rgb(var(--color-foreground))]">

                                {/* Status Bar */}
                                <div className="h-12 px-6 flex justify-between items-center text-xs  text-white z-10 pt-2">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <Signal size={12} />
                                        <Wifi size={12} />
                                        <Battery size={12} />
                                    </div>
                                </div>

                                {/* App Content */}
                                <div className="p-4 flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">

                                    {/* Header */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-linear-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black  text-sm shadow-lg shadow-orange-500/20">
                                                JD
                                            </div>
                                            <div>
                                                <p className="text-[rgb(var(--color-muted-foreground))] text-[10px] uppercase tracking-wider">Welcome back</p>
                                                <p className=" text-sm">John Doe</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 bg-[rgb(var(--color-muted)/0.1)] rounded-full flex items-center justify-center border border-[rgb(var(--color-border))]">
                                            <Bell size={18} className="text-[rgb(var(--color-muted-foreground))]" />
                                        </div>
                                    </div>

                                    {/* Balance Card */}
                                    <div className="relative overflow-hidden bg-linear-to-br from-[rgb(var(--color-accent))] to-[rgb(var(--color-accent)/0.8)] rounded-3xl p-6 shadow-lg shadow-[rgb(var(--color-accent)/0.2)] group">
                                        {/* Decorative Blur */}
                                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[rgb(var(--color-background)/0.1)] rounded-full blur-3xl group-hover:bg-[rgb(var(--color-background)/0.2)] transition-all duration-500"></div>

                                        <p className="text-[rgb(var(--color-background)/0.8)] text-xs font-medium mb-1">Total Balance</p>
                                        <h2 style={{ fontFamily }} className="text-3xl  mb-4">$24,484.00</h2>

                                        <div className="flex items-center gap-2 text-xs font-medium">
                                            <div className="bg-[rgb(var(--color-highlight)/0.2)] text-[rgb(var(--color-highlight))] px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm border border-[rgb(var(--color-highlight)/0.2)]">
                                                <TrendingUp size={12} /> +2.4%
                                            </div>
                                            <span className="text-[rgb(var(--color-background)/0.6)]">vs last week</span>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}                                     <div className="flex justify-between gap-3">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                                            className="flex-1 bg-[rgb(var(--color-muted)/0.1)] hover:bg-[rgb(var(--color-muted)/0.2)] active:scale-95 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all border border-[rgb(var(--color-border)/0.5)]"
                                        >
                                            <ArrowUp size={20} className="text-[rgb(var(--color-highlight))]" />
                                            <span className="text-xs font-medium text-[rgb(var(--color-muted-foreground))]">Send</span>
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                                            className="flex-1 bg-[rgb(var(--color-muted)/0.1)] hover:bg-[rgb(var(--color-muted)/0.2)] active:scale-95 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all border border-[rgb(var(--color-border)/0.5)]"
                                        >
                                            <ArrowDown size={20} className="text-[rgb(var(--color-accent))]" />
                                            <span className="text-xs font-medium text-[rgb(var(--color-muted-foreground))]">Receive</span>
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                                            className="flex-1 bg-[rgb(var(--color-muted)/0.1)] hover:bg-[rgb(var(--color-muted)/0.2)] active:scale-95 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all border border-[rgb(var(--color-border)/0.5)]"
                                        >
                                            <CreditCard size={20} className="text-[rgb(var(--color-highlight))]" />
                                            <span className="text-xs font-medium text-[rgb(var(--color-muted-foreground))]">Top up</span>
                                        </motion.button>
                                    </div>


                                    {/* Market List */}
                                    <div>
                                        <div className="flex justify-between items-end mb-4">
                                            <h3 className=" text-lg">Market</h3>
                                            <span className="text-xs text-blue-400 font-medium">See All</span>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {/* Bitcoin */}
                                            <div className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-2xl transition-colors border border-gray-700/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                                        <span className=" text-xs">₿</span>
                                                    </div>
                                                    <div>
                                                        <p className=" text-sm">Bitcoin</p>
                                                        <p className="text-gray-500 text-xs">BTC</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className=" text-sm text-gray-200">$42,124</p>
                                                    <p className="text-xs text-emerald-400">+1.2%</p>
                                                </div>
                                            </div>

                                            {/* Ethereum */}
                                            <div className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-2xl transition-colors border border-gray-700/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                                        <span className=" text-xs">Ξ</span>
                                                    </div>
                                                    <div>
                                                        <p className=" text-sm">Ethereum</p>
                                                        <p className="text-gray-500 text-xs">ETH</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className=" text-sm text-gray-200">$2,845</p>
                                                    <p className="text-xs text-rose-400">-0.5%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Indicator */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gray-600 rounded-full mb-1"></div>
                            </div>
                        </div>

                        <div className="relative min-w-[320px] max-w-[320px] h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-30 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-[rgb(var(--color-muted)/0.05)] rounded-[2.2rem] overflow-hidden flex flex-col relative text-[rgb(var(--color-foreground))] font-sans">

                                {/* Status Bar */}
                                <div className="absolute top-0 w-full h-12 px-6 flex justify-between items-center text-xs font-bold text-black z-30 pt-2">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <Signal size={12} />
                                        <Wifi size={12} />
                                        <Battery size={12} />
                                    </div>
                                </div>

                                {/* Product Image Area (Top Half) */}
                                <div className="h-[35%] w-full bg-white relative flex items-center justify-center">
                                    {/* Navigation Icons */}
                                    <div className="absolute top-12 left-4 z-20 p-2 bg-white/50 backdrop-blur-md rounded-full cursor-pointer hover:bg-white">
                                        <ArrowLeft size={20} className="text-black" />
                                    </div>
                                    <div className="absolute top-12 right-4 z-20 p-2 bg-white/50 backdrop-blur-md rounded-full cursor-pointer hover:bg-white">
                                        <Heart size={20} className="text-black hover:fill-red-500 hover:text-red-500 transition-colors" />
                                    </div>

                                    {/* Simulated Product Image */}
                                    <img src="https://media.istockphoto.com/id/1912499984/photo/comfortable-olive-green-armchair-with-wooden-legs-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=gSTPHLk0GRDrHilO0e4gMP8w1NuV-wr7e3L2yIE_Y6Q=" alt="" className="w-48 h-48 z-10" />
                                    <div className="w-48 h-48 bg-orange-200 rounded-full blur-3xl absolute opacity-10"></div>
                                </div>
                                {/* Product Details Sheet (Bottom Half) */}
                                <div className="flex-1 bg-[rgb(var(--color-background))] border-t border-[rgb(var(--color-border))] rounded-t-[2.5rem] -mt-8 relative z-10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                                    {/* Drag Handle */}
                                    <div className="w-12 h-1 bg-[rgb(var(--color-muted)/0.3)] rounded-full mx-auto mt-3"></div>

                                    <div className="p-8 flex-1 flex flex-col">
                                        {/* Header Info */}
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-orange-500 text-xs font-bold uppercase tracking-wider">Herman Miller</span>
                                                <h2 style={{ fontFamily }} className="text-2xl font-bold text-neutral-900 leading-tight">Lounge Chair</h2>
                                            </div>
                                            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                                                <Star size={12} className="fill-green-600 text-green-600" />
                                                <span className="text-xs font-bold text-green-700">4.8</span>
                                            </div>
                                        </div>
                                        {/* Price */}
                                        <div className="mb-6">
                                            <span className="text-3xl font-bold tracking-tight">$640</span>
                                            <span className="text-sm text-[rgb(var(--color-muted-foreground))] line-through ml-2">$850</span>
                                        </div>

                                        {/* Color Selector */}
                                        <div className="mb-6">
                                            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Select Color</p>
                                            <div className="flex gap-3">
                                                <div className="w-5 h-5 rounded-full bg-neutral-900 ring-2 ring-offset-2 ring-gray-300 cursor-pointer"></div>
                                                <div className="w-5 h-5 rounded-full bg-orange-700 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-orange-200"></div>
                                                <div className="w-5 h-5 rounded-full bg-[#D4C3AA] cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-yellow-100"></div>
                                                <div className="w-5 h-5 rounded-full bg-gray-400 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-gray-200"></div>
                                            </div>
                                        </div>

                                        {/* Description (Truncated) */}
                                        <div className="flex-1 overflow-hidden relative">
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                A timeless classic designed for comfort and style. Premium leather upholstery with a molded wood shell...
                                            </p>
                                            <div className="absolute bottom-0 w-full h-8 bg-linear-to-t from-white to-transparent"></div>
                                        </div>

                                        {/* Action Button */}
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                                            className="absolute bottom-3 bg-black text-white py-4 px-15 rounded-2xl font-bold text-sm mt-4 active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                                        >
                                            <ShoppingBag size={18} />
                                            Add to Cart
                                        </motion.button>
                                    </div>
                                </div>
                                {/* Bottom Indicator */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-[rgb(var(--color-muted)/0.3)] rounded-full mb-1"></div>
                            </div>
                        </div>

                        <div className="relative min-w-[320px] max-w-[320px] h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-30 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden flex flex-col relative text-gray-900 font-sans">

                                {/* Background Image (Immersive) */}
                                <div className="absolute inset-0 bg-neutral-900">
                                    {/* Placeholder for a scenic travel photo (mountains/ocean) */}
                                    <div className="w-full h-full opacity-80 bg-[url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center"></div>
                                    <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/60"></div>
                                </div>

                                {/* Status Bar */}
                                <div className="h-12 px-6 flex justify-between items-center text-xs font-bold text-white z-30 pt-2">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <Signal size={12} />
                                        <Wifi size={12} />
                                        <Battery size={12} />
                                    </div>
                                </div>

                                {/* App Header */}
                                <div className="flex justify-between items-center px-6 pt-2 z-30 text-white">
                                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                                        <Menu size={20} />
                                    </div>
                                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                                        <Search size={20} />
                                    </div>
                                </div>

                                {/* Main Content Area */}
                                <div className="flex-1 flex flex-col justify-end p-6 z-30 text-white">

                                    {/* Main Heading */}
                                    <h1 style={{ fontFamily }} className="text-6xl leading-[0.9] mb-4">
                                        The<br />Alps
                                    </h1>

                                    {/* Location Tag */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-white/20">
                                            <MapPin size={12} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Switzerland</span>
                                        </div>
                                    </div>

                                    {/* Stats / Info */}
                                    <div className="flex gap-6 mb-6">
                                        <div>
                                            <p className="text-xs text-gray-300 uppercase tracking-wider font-bold mb-1">Temp</p>
                                            <p className="text-xl font-medium">-4°C</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-300 uppercase tracking-wider font-bold mb-1">Distance</p>
                                            <p className="text-xl font-medium">12 km</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-300 uppercase tracking-wider font-bold mb-1">Rating</p>
                                            <div className="flex items-center gap-1">
                                                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                                <span className="text-xl font-medium">4.9</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description Text */}
                                    <p className="text-sm text-gray-200 leading-relaxed line-clamp-2 mb-6 opacity-80">
                                        Experience the breathtaking views of the Swiss Alps. A paradise for hikers, skiers, and nature lovers alike.
                                    </p>

                                    {/* Action Slider Button */}
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => Haptics.impact({ style: ImpactStyle.Medium })}
                                        className="h-16 bg-white/10 backdrop-blur-xl rounded-4xl p-2 flex items-center border border-white/20 relative overflow-hidden group cursor-pointer"
                                    >
                                        <div className="absolute inset-y-0 left-0 w-1/2 bg-white/10 blur-xl group-hover:translate-x-full transition-transform duration-700"></div>

                                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg z-10">
                                            <ArrowRight size={20} />
                                        </div>
                                        <span className="flex-1 text-center font-bold text-sm tracking-wide">Slide to Book</span>
                                    </motion.div>

                                </div>

                                {/* Bottom Indicator */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/50 rounded-full mb-1 z-30"></div>
                            </div>
                        </div>

                        <div className="relative min-w-[320px] max-w-[320px] h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-30 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-[#1A1A1A] rounded-[2.2rem] overflow-hidden flex flex-col relative text-white font-sans">

                                {/* Ambient Background Glow */}
                                <div className="absolute top-[-10%] right-[-30%] w-[80%] h-[40%] bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[40%] bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

                                {/* Status Bar */}
                                <div className="h-12 px-6 flex justify-between items-center text-xs font-bold text-white z-30 pt-2">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <Signal size={12} />
                                        <Wifi size={12} />
                                        <Battery size={12} />
                                    </div>
                                </div>
                                {/* Header */}
                                <div className="px-4 pt-2 pb-6 flex justify-between items-center z-10">
                                    <div>
                                        <p className="text-xs text-[rgb(var(--color-muted-foreground))] font-medium uppercase tracking-wider mb-1">Welcome Home</p>
                                        <h2 style={{ fontFamily }} className="text-2xl font-bold">Alex's Place</h2>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-muted)/0.2)] overflow-hidden border-2 border-[rgb(var(--color-border))]">
                                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4YreOWfDX3kK-QLAbAL4ufCPc84ol2MA8Xg&s" alt="User" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                {/* Room Selector */}
                                <div className="px-4 mb-6 overflow-x-auto no-scrollbar flex gap-4 z-10">
                                    <span className="text-sm font-bold border-b-2 border-[rgb(var(--color-accent))] pb-1 text-[rgb(var(--color-foreground))] whitespace-nowrap">Living Room</span>
                                    <span className="text-sm font-medium text-[rgb(var(--color-muted-foreground))] pb-1 whitespace-nowrap">Bedroom</span>
                                    <span className="text-sm font-medium text-[rgb(var(--color-muted-foreground))] pb-1 whitespace-nowrap">Kitchen</span>
                                    <span className="text-sm font-medium text-[rgb(var(--color-muted-foreground))] pb-1 whitespace-nowrap">Office</span>
                                </div>

                                {/* Main Controls - Scrollable */}
                                <div className="flex-1 px-4 pb-6 overflow-y-auto no-scrollbar z-10 flex flex-col gap-4">

                                    {/* Thermostat Widget */}
                                    <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center justify-between relative overflow-hidden">
                                        {/* Decorative Ring */}
                                        <div className="absolute -right-12 -bottom-12 w-40 h-40 border-10 border-[rgb(var(--color-accent)/0.2)] rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-medium text-[rgb(var(--color-muted-foreground))] mb-1">Thermostat</p>
                                            <h3 className="text-4xl font-bold mb-1">24°c</h3>
                                            <p className="text-xs text-[rgb(var(--color-highlight))] font-bold uppercase tracking-wide flex items-center gap-1">
                                                <Flame size={10} /> Heating
                                            </p>
                                        </div>

                                        {/* Circular Control UI Simulation */}
                                        <div className="w-20 h-20 rounded-full border-[6px] border-gray-700 relative flex items-center justify-center shadow-inner bg-gray-800">
                                            <div className="absolute inset-0 border-[6px] border-orange-500 rounded-full border-t-transparent border-l-transparent -rotate-45"></div>
                                            <div className="text-xs font-bold text-gray-300">Auto</div>
                                        </div>
                                    </div>

                                    {/* Device Grid */}
                                    <div className="grid grid-cols-2 gap-4">

                                        {/* Smart Light */}
                                        <div className="bg-orange-500 text-white rounded-3xl p-4 flex flex-col justify-between aspect-square shadow-lg shadow-orange-500/20">
                                            <div className="flex justify-between items-start">
                                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                                    <Lightbulb size={16} />
                                                </div>
                                                <div className="w-8 h-4 bg-white rounded-full p-1 flex justify-end">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold">Main Light</p>
                                                <p className="text-xs text-white/70">80% Brightness</p>
                                            </div>
                                        </div>

                                        {/* Smart TV */}
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col justify-between aspect-square hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-300">
                                                    <Tv size={16} />
                                                </div>
                                                <div className="w-8 h-4 bg-gray-700 rounded-full p-1 flex justify-start">
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-300">Smart TV</p>
                                                <p className="text-xs text-gray-500">Off</p>
                                            </div>
                                        </div>

                                        {/* AC Unit */}
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col justify-between aspect-square hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-300">
                                                    <Wind size={16} />
                                                </div>
                                                <div className="w-8 h-4 bg-gray-700 rounded-full p-1 flex justify-start">
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-300">Air Con</p>
                                                <p className="text-xs text-gray-500">Off</p>
                                            </div>
                                        </div>

                                        {/* Security Lock */}
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col justify-between aspect-square hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-300">
                                                    <Lock size={16} />
                                                </div>
                                                <div className="w-8 h-4 bg-green-500/20 rounded-full p-1 flex justify-end border border-green-500/50">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-300">Entry Lock</p>
                                                <p className="text-xs text-green-400">Locked</p>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Bottom Nav Bar (Floating) */}
                                <div className="absolute bottom-4 left-18 right-18 h-14 bg-[#f0c7ac]/20 backdrop-blur-xs rounded-4xl flex justify-around items-center border border-white/20 shadow-2xl z-40">
                                    <HomeIcon size={20} className="text-white" />
                                    <Grid size={20} className="text-gray-500" />
                                    <Settings size={20} className="text-gray-500" />
                                </div>

                                {/* Home Indicator */}
                                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/20 rounded-full mb-1 z-30"></div>
                            </div>
                        </div>

                        <div className="relative min-w-[320px] max-w-[320px] h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-30 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-neutral-900 rounded-[2.2rem] overflow-hidden flex flex-col relative text-white font-sans">

                                {/* Status Bar */}
                                <div className="h-12 px-6 flex justify-between items-center text-xs font-bold text-white z-30 pt-2">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <Signal size={12} />
                                        <Wifi size={12} />
                                        <Battery size={12} />
                                    </div>
                                </div>

                                {/* Header Date & Profile */}
                                <div className="px-6 py-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Monday, 24 Oct</p>
                                        <h2 style={{ fontFamily }} className="text-2xl font-black italic">Keep Moving</h2>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-lime-400 border-2 border-black flex items-center justify-center text-black font-bold">
                                        JD
                                    </div>
                                </div>

                                {/* Main Stats Card (Progress Ring) */}
                                <div className="mx-4 bg-neutral-800 rounded-3xl p-4 relative overflow-hidden mb-6">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg">Daily Goal</h3>
                                        <div className="bg-lime-400/10 text-lime-400 px-2 py-1 rounded-lg text-xs font-bold">
                                            On Track
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Ring Simulation */}
                                        <div className="relative w-24 h-24 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#333" strokeWidth="8" />
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#A3E635" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="60" strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center">
                                                <span className="text-xl font-bold">75%</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Calories</p>
                                                <p className="text-lg font-bold">840 <span className="text-sm text-gray-500 font-medium">/ 1200</span></p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Steps</p>
                                                <p className="text-lg font-bold">6,240 <span className="text-sm text-gray-500 font-medium">/ 8k</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity List */}
                                <div className="flex-1 bg-white rounded-t-[2.5rem] px-4 pt-8 pb-4 text-black flex flex-col gap-4 overflow-y-auto no-scrollbar relative">
                                    <div className="flex justify-between items-end mb-2">
                                        <h3 className="font-bold text-lg">Activity</h3>
                                        <span className="text-xs font-bold text-lime-600">See All</span>
                                    </div>

                                    {/* Activity Item 1 */}
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                            <Flame size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm">Morning Run</h4>
                                            <p className="text-xs text-gray-400">5.2 km • 32 mins</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300" />
                                    </div>

                                    {/* Activity Item 2 */}
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                            <CloudRain size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm">Swimming</h4>
                                            <p className="text-xs text-gray-400">12 laps • 45 mins</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300" />
                                    </div>

                                    {/* Activity Item 3 */}
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                            <Zap size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm">Yoga Flow</h4>
                                            <p className="text-xs text-gray-400">Beginner • 20 mins</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300" />
                                    </div>

                                </div>

                                {/* FAB (Floating Action Button) */}
                                <div className="absolute bottom-2 right-2 w-14 h-14 bg-black text-lime-400 rounded-full flex items-center justify-center shadow-xl shadow-black/30 cursor-pointer hover:scale-105 transition-transform">
                                    <Plus size={24} strokeWidth={3} />
                                </div>

                                {/* Bottom Indicator */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gray-300 rounded-full mb-1 z-30"></div>
                            </div>
                        </div>

                        <div className="relative min-w-[320px] max-w-[320px] h-160 bg-black rounded-[3rem] p-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                            {/* Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-30 bg-black rounded-b-xl z-20"></div>

                            {/* Screen */}
                            <div className="w-full h-full bg-linear-to-b from-blue-500 via-blue-400 to-cyan-300 rounded-[2.2rem] overflow-hidden flex flex-col relative text-white font-sans">

                                {/* Background Decor (Cloud shapes) */}
                                <div className="absolute top-20 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute top-40 right-[-20%] w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                                {/* Status Bar */}
                                <div className="h-12 px-6 flex justify-between items-center text-xs font-bold text-white z-30 pt-2">
                                    <span>9:41</span>
                                    <div className="flex gap-1">
                                        <Signal size={12} />
                                        <Wifi size={12} />
                                        <Battery size={12} />
                                    </div>
                                </div>

                                {/* Header / Location */}
                                <div className="px-6 pt-4 flex justify-between items-start z-10">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} className="fill-white/20" />
                                            <h2 className="text-sm font-bold tracking-wide uppercase">San Francisco</h2>
                                        </div>
                                        <p className="text-xs text-white/70 mt-1">Today, 24 Oct</p>
                                    </div>
                                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 cursor-pointer">
                                        <Grid size={18} />
                                    </div>
                                </div>

                                {/* Main Weather Display */}
                                <div className="flex-1 flex flex-col items-center justify-center z-10 -mt-8">
                                    {/* Weather Icon (Simulated with Lucide + Glow) */}
                                    <div className="relative mb-2">
                                        <div className="absolute inset-0 bg-yellow-300 blur-2xl opacity-40"></div>
                                        <CloudRain size={40} className="text-white relative z-10 drop-shadow-lg" />
                                        <Sun size={24} className="text-yellow-300 absolute -top-2 -right-2 z-0 animate-pulse" fill="#FDE047" />
                                    </div>

                                    <h1 style={{ fontFamily }} className="text-8xl font-black drop-shadow-sm">
                                        18°
                                    </h1>
                                    <p className="text-lg font-medium opacity-90">Rainy Cloudy</p>
                                </div>

                                {/* Glass Stats Grid */}
                                <div className="px-4 mb-8 z-10">
                                    <div className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-3xl p-4 flex justify-between items-center shadow-lg">
                                        <div className="flex flex-col items-center gap-1 w-1/3 border-r border-white/20">
                                            <Wind size={18} className="text-white/80" />
                                            <span className="text-xs font-bold">12 km/h</span>
                                            <span className="text-[10px] text-white/60 uppercase">Wind</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 w-1/3 border-r border-white/20">
                                            <Droplets size={18} className="text-white/80" />
                                            <span className="text-xs font-bold">48%</span>
                                            <span className="text-[10px] text-white/60 uppercase">Humidity</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 w-1/3">
                                            <Eye size={18} className="text-white/80" />
                                            <span className="text-xs font-bold">1.2 km</span>
                                            <span className="text-[10px] text-white/60 uppercase">Visibility</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Forecast Sheet */}
                                <div className="bg-white rounded-t-[2.5rem] p-4 pb-2 text-gray-800 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                                    <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>

                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold">Hourly Forecast</h3>
                                        <span className="text-xs text-blue-500 font-bold cursor-pointer">Next 7 Days</span>
                                    </div>

                                    <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
                                        {/* Hourly Item (Active) */}
                                        <div className="flex flex-col items-center gap-2 bg-blue-500 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/30 min-w-15">
                                            <span className="text-xs font-medium">Now</span>
                                            <CloudRain size={20} />
                                            <span className="font-bold">18°</span>
                                        </div>

                                        {/* Hourly Item */}
                                        <div className="flex flex-col items-center gap-2 p-3 rounded-2xl min-w-15 border border-gray-100">
                                            <span className="text-xs text-gray-400">1 PM</span>
                                            <Cloud size={20} className="text-gray-400" />
                                            <span className="font-bold text-gray-600">19°</span>
                                        </div>

                                        {/* Hourly Item */}
                                        <div className="flex flex-col items-center gap-2 p-3 rounded-2xl min-w-15 border border-gray-100">
                                            <span className="text-xs text-gray-400">2 PM</span>
                                            <Sun size={20} className="text-yellow-500" />
                                            <span className="font-bold text-gray-600">21°</span>
                                        </div>

                                        {/* Hourly Item */}
                                        <div className="flex flex-col items-center gap-2 p-3 rounded-2xl min-w-15 border border-gray-100">
                                            <span className="text-xs text-gray-400">3 PM</span>
                                            <Sun size={20} className="text-yellow-500" />
                                            <span className="font-bold text-gray-600">20°</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Indicator */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gray-300 rounded-full mb-1 z-30"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* POSTER VIEW */}
                {activeTab === 'poster' && (
                    <div className='flex flex-wrap justify-center items-center gap-5'>
                        {/* 1. Poster */}
                        <div className="relative w-[320px] md:w-full max-w-md aspect-3/4 text-black bg-[#F4F1EA] border border-black/10 shadow-xl p-3 md:p-8 flex flex-col justify-between animate-in fade-in duration-300">
                            {/* Texture Overlay */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')]"></div>

                            <div className="border border-black flex-1 p-2 flex flex-col">
                                <div className="flex justify-between border-b border-black pb-2 mb-8">
                                    <span style={{ fontFamily }} className="text-[10px] md:text-xs uppercase tracking-widest">Vol. 01</span>
                                    <span style={{ fontFamily }} className="text-[10px] md:text-xs uppercase tracking-widest">Edition 2024</span>
                                </div>

                                <div className="flex-1 flex flex-col justify-center items-center text-center">
                                    <h1 style={{ fontFamily }} className="text-6xl md:text-8xl text-black leading-[0.8] wrap-break-word w-full mb-4">
                                        TYPO<br />GRAPHY
                                    </h1>
                                    <div style={{ fontFamily }} className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-black text-[#F4F1EA] flex items-center justify-center text-sm md:text-xl animate-spin-slow">
                                        ART
                                    </div>
                                </div>

                                <div className="border-t border-black pt-4 grid grid-cols-3 gap-4 text-[8px] md:text-[10px] leading-tight text-black mt-8">
                                    <p>
                                        LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT.
                                        SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE.
                                    </p>
                                    <p className="text-center ">
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

                        {/* 2. Poster */}
                        <div className="relative w-[320px] md:w-full max-w-md aspect-3/4 bg-[#0A2635] p-4 shadow-2xl flex flex-col items-center justify-center overflow-hidden animate-in fade-in zoom-in duration-300 border-4 border-[#0A2635]">

                            {/* --- Background Stars/Dots --- */}
                            {/* Small dots scattered */}
                            <div className="absolute top-10 left-10 w-2 h-2 bg-[#4ED8E6] rounded-full opacity-60"></div>
                            <div className="absolute top-20 right-8 w-1 h-1 bg-white rounded-full opacity-80"></div>
                            <div className="absolute bottom-32 left-8 w-1.5 h-1.5 bg-[#4ED8E6] rounded-full opacity-50"></div>
                            <div className="absolute bottom-10 right-20 w-2 h-2 bg-white rounded-full opacity-70"></div>
                            <div className="absolute top-1/2 left-4 w-1 h-1 bg-white rounded-full"></div>

                            {/* Sparkles (using Lucide Stars) */}
                            <Star className="absolute top-24 left-4 text-white w-6 h-6 animate-pulse" fill="white" />
                            <Star className="absolute top-32 right-6 text-white w-5 h-5 animate-pulse delay-75" fill="white" />
                            <Star className="absolute bottom-40 left-6 text-white w-6 h-6 animate-pulse delay-150" fill="white" />
                            <Star className="absolute bottom-12 right-12 text-[#4ED8E6] w-4 h-4" fill="#4ED8E6" />

                            {/* --- Main Typography Stack --- */}
                            <div
                                style={{ fontFamily }}
                                className="flex flex-col items-center justify-center w-full leading-[0.85] z-10">

                                {/* LINE 1: I NEED (Cyan, Bubble Font) */}
                                <div className="w-full text-center">
                                    <h1 className="text-[6rem] md:text-[7.5rem] whitespace-nowrap  text-[#4ED8E6]  drop-shadow-md transform scale-y-110"
                                        style={{ textShadow: '4px 4px 0px #000' }}>
                                        <span className='font-game-paused text-white'>I</span> <span className='italic'>NEED</span>
                                    </h1>
                                </div>

                                {/* LINE 2: MORE (White, Serif, Moon O) */}
                                <div className="flex items-center justify-center gap-1 w-full my-2 font-game-paused">
                                    <span className="text-[6rem] md:text-[8rem] text-white" style={{ textShadow: '4px 4px 0px #000' }}>
                                        M
                                    </span>

                                    {/* THE MOON (Replacing 'O') */}
                                    <div className="relative w-20 h-20 md:w-28 md:h-28 bg-white rounded-full overflow-hidden border-2 border-black/20 shrink-0 -mx-2 z-10">
                                        {/* Moon Texture simulation using CSS linears */}
                                        <div className="absolute inset-0 bg-gray-200">
                                            <div className="absolute top-4 left-4 w-6 h-6 bg-gray-400/50 rounded-full blur-[2px]"></div>
                                            <div className="absolute bottom-6 right-8 w-10 h-10 bg-gray-400/40 rounded-full blur-xs"></div>
                                            <div className="absolute top-10 right-4 w-3 h-3 bg-gray-500/30 rounded-full"></div>
                                            {/* Shadow for crescent effect */}
                                            <div className="absolute inset-0 rounded-full shadow-[inset_10px_0px_20px_rgba(0,0,0,0.5)]"></div>
                                            {/* Sketch lines overlay */}
                                            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] mix-blend-multiply"></div>
                                        </div>
                                    </div>

                                    <span className="text-[6rem] md:text-[8rem] text-white" style={{ textShadow: '4px 4px 0px #000' }}>
                                        RE
                                    </span>
                                </div>

                                {/* LINE 3: SPACE (Cyan, Bubble Font) */}
                                <div className="w-full text-center">
                                    <h1 className="text-[6rem] md:text-[7.5rem] text-[#4ED8E6] italic drop-shadow-md transform scale-y-110"
                                        style={{ textShadow: '4px 4px 0px #000' }}>
                                        SPACE
                                    </h1>
                                </div>

                            </div>

                        </div>

                        {/* 3. Poster */}
                        <div className="relative w-[320px] md:w-full max-w-md aspect-3/4 bg-white p-4 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-200">

                            {/* 1. Abstract Yellow Shapes (Background) */}
                            <div className="absolute top-[10%] -left-10 w-[120%] h-22 md:h-40 bg-[#FFEF00] -rotate-6 transform origin-center mix-blend-multiply pointer-events-none"></div>
                            <div className="absolute top-[35%] -right-10 w-[120%] h-22 md:h-40 bg-[#FFEF00] rotate-3 transform origin-center mix-blend-multiply pointer-events-none"></div>
                            <div className="absolute bottom-[15%] left-10 w-full h-22 md:h-40 bg-[#FFEF00] -rotate-12 transform origin-center mix-blend-multiply pointer-events-none"></div>

                            {/* 2. Top Navigation / Header */}
                            <div className="flex justify-between items-start z-10 mb-4 md:mb-8">
                                <div className="flex flex-col">
                                    <span className="bg-black text-white px-2 py-1 text-[8px] md:text-xs uppercase tracking-widest inline-block mb-1 w-fit">
                                        Collection 2026
                                    </span>
                                    <span className="text-[10px] md:text-xs text-black uppercase tracking-widest">
                                        New York City
                                    </span>
                                </div>
                                <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8 text-black stroke-3" />
                            </div>

                            {/* 3. Main Massive Typography */}
                            {/* Using negative margin and massive text to mimic the 'FITNESS' and 'LOREM' posters */}
                            <div className="relative z-20 flex-1 flex flex-col justify-center text-7xl md:text-9xl text-black leading-[0.8] pointer-events-none">
                                <h1 style={{ fontFamily }} className="mix-blend-hard-light">
                                    URBAN
                                </h1>
                                <h1 style={{ fontFamily }} className="ml-10 italic">
                                    MODE
                                </h1>
                                <h1 style={{ fontFamily }}>
                                    STYLE
                                </h1>
                            </div>

                            {/* 4. Text Content / Description Block */}
                            <div className="grid grid-cols-2 gap-8 z-10 mt-auto items-end">
                                <div className="text-xs md:text-sm leading-tight">
                                    <p className="mb-4 text-black">
                                        A VISUAL EXPLORATION OF MODERN STREETWEAR AND BOLD TYPOGRAPHY.
                                    </p>
                                    <button className="bg-black text-white px-3 md:px-6 py-2 md:py-3 text-[8px] md:text-xs uppercase tracking-wider hover:bg-[#FFEF00] hover:text-black transition-colors">
                                        Get Tickets
                                    </button>
                                </div>

                                {/* 5. Date / Number Detail */}
                                <div className="flex flex-col items-end text-black">
                                    <span className="text-5xl md:text-6xl font-black leading-none">
                                        24
                                    </span>
                                    <span className="text-lg md:text-xl uppercase tracking-wide border-t-2 md:border-t-4 border-black pt-0 mt-1 w-full text-right">
                                        October
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Poster */}
                        <div className="relative w-[320px] md:w-full max-w-md aspect-3/4 bg-[#E5E5E5] p-4 md:p-8 border border-black/5 shadow-2xl flex flex-col font-sans animate-in fade-in zoom-in duration-300">

                            {/* 1. Main Speech Bubble Container */}
                            <div className="relative w-full bg-black text-white p-6 md:p-10 flex flex-col mb-12">

                                {/* Small Header inside bubble */}
                                <div className="text-[10px]  uppercase tracking-widest mb-4 opacity-70">
                                    Company
                                </div>

                                {/* Massive Typography */}
                                <div className="flex-1 flex flex-col justify-center leading-[0.85]">
                                    <h1 style={{ fontFamily }} className="text-[6rem] md:text-[8rem] uppercase">
                                        LAY
                                    </h1>
                                    <h1 style={{ fontFamily }} className="text-[6rem] md:text-[8rem] uppercase">
                                        OUT
                                    </h1>
                                </div>

                                {/* The "Tail" of the speech bubble */}
                                <div className="absolute -bottom-8 left-10 w-0 h-0 border-l-40 border-l-transparent border-t-40 border-t-black border-r-0 border-r-transparent">
                                </div>
                            </div>

                            {/* 2. Footer Content (Clean Grid) */}
                            <div className="mt-auto grid grid-cols-2 gap-8 items-end text-black">

                                {/* Left Column */}
                                <div className="flex flex-col gap-4">
                                    <p className="text-[9px] md:text-[10px] leading-relaxed text-gray-600">
                                        Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.
                                    </p>
                                    <div className="flex gap-4 pt-2 border-t border-gray-300">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase  text-gray-400">Date</span>
                                            <span className="text-xs ">24.10.2025</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="flex flex-col gap-4">
                                    <p className="text-[9px] md:text-[10px] leading-relaxed text-gray-600">
                                        Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Voluptates, corporis.
                                    </p>
                                    <div className="flex gap-4 pt-2 border-t border-gray-300">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase  text-gray-400">Issue</span>
                                            <span className="text-xs ">Vol. 01</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* 5. Poster */}
                        <div className="relative w-[320px] md:w-full max-w-md aspect-3/4 bg-[#0F1016] text-white overflow-hidden shadow-2xl flex flex-col p-6 md:p-8 animate-in fade-in zoom-in duration-300 border-4 border-[#0F1016]">

                            {/* Starry Background Texture */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-70 pointer-events-none"></div>

                            {/* Main Content Layer */}
                            <div className="relative h-full w-full flex flex-col justify-center items-center z-10 font-sans">

                                {/* Top Quote Section */}
                                <div className="absolute top-0 left-0 w-full items-start">
                                    <p className="text-[8px] md:text-xs max-w-1/2 leading-relaxed opacity-80 font-medium tracking-wide text-gray-300">
                                        "Yours is the light by which my spirit's born: - you are my sun, my moon, and all my stars."
                                    </p>
                                    {/* Horizontal Line */}
                                    <div className="w-1/2 h-0.5 bg-white absolute right-0"></div>
                                </div>

                                {/* Central Typography Stack */}
                                <div className="relative flex flex-col items-center justify-center leading-[0.8] tracking-widest z-0 ">

                                    {/* 1. Top Solid Text */}
                                    <h1 style={{ fontFamily }} className="text-[5rem] md:text-[6.5rem]  text-[#FFE55C] relative z-20">
                                        MOON
                                    </h1>

                                    {/* 2. Outlined Background Text (Repeated) */}
                                    {/* Using -webkit-text-stroke to create the hollow effect */}
                                    <h1 style={{ fontFamily, WebkitTextStroke: '1px white', color: 'transparent' }}
                                        className="text-[5rem] md:text-[6.5rem]  opacity-30">
                                        MOON
                                    </h1>
                                    <h1 style={{ fontFamily, WebkitTextStroke: '1px white', color: 'transparent' }}
                                        className="text-[5rem] md:text-[6.5rem]  opacity-30">
                                        MOON
                                    </h1>
                                    <h1 style={{ fontFamily, WebkitTextStroke: '1px white', color: 'transparent' }}
                                        className="text-[5rem] md:text-[6.5rem]  opacity-30">
                                        MOON
                                    </h1>
                                </div>

                                {/* The Central Moon Graphic */}
                                {/* Positioned absolutely to sit on top of the text stack */}
                                <div className="scale-75 md:scale-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-56 md:h-56 bg-[#FFE55C] rounded-full shadow-[0_0_60px_rgba(255,229,92,0.2)] z-10 flex items-center justify-center pointer-events-none mt-4">
                                    {/* Craters (CSS Circles) */}
                                    <div className="absolute top-8 left-10 w-8 h-8 bg-[#FACC15] rounded-full opacity-60"></div>
                                    <div className="absolute top-16 left-8 w-3 h-3 bg-[#FACC15] rounded-full opacity-60"></div>
                                    <div className="absolute bottom-12 right-12 w-10 h-10 bg-[#FACC15] rounded-full opacity-60"></div>
                                    <div className="absolute bottom-24 right-8 w-5 h-5 bg-[#FACC15] rounded-full opacity-60"></div>
                                    <div className="absolute top-10 right-16 w-6 h-6 bg-[#FACC15] rounded-full opacity-60"></div>
                                </div>

                                {/* Bottom Quote Section */}
                                <div className="absolute bottom-0 right-0 w-full flex flex-col items-end text-right">
                                    {/* Horizontal Line */}
                                    <div className="w-1/2 h-0.5 bg-white mb-4 absolute left-0"></div>
                                    <p className="text-[8px] md:text-xs max-w-1/2 leading-relaxed opacity-80 font-medium tracking-wide text-gray-300">
                                        "Do not swear by the moon, for she changes constantly. then your love would also change."
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* 6. Poster */}
                        <div className="relative w-[320px] md:w-full max-w-md aspect-3/4 bg-gray-100 overflow-hidden shadow-2xl flex flex-col justify-end animate-in fade-in zoom-in duration-300 font-sans border-8 border-white">

                            {/* --- 1. Paper Texture & Creases Overlay --- */}
                            {/* Main Wrinkled Paper Texture */}
                            <div className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply opacity-40 bg-[url('https://www.transparenttextures.com/patterns/crumbled-paper.png')]"></div>

                            {/* Vertical Fold Highlight (Simulating the poster fold in the image) */}
                            <div className="absolute inset-y-0 left-1/3 w-24 bg-linear-to-r from-transparent via-white/40 to-transparent z-30 pointer-events-none skew-x-6"></div>
                            <div className="absolute inset-y-0 right-1/3 w-12 bg-linear-to-r from-transparent via-black/5 to-transparent z-30 pointer-events-none skew-x-3"></div>


                            {/* --- 2. Main Typography Content --- */}
                            {/* Using a flex container to stack the words tightly */}
                            <div className="relative z-10 flex flex-col leading-[0.85] text-[5rem] md:text-[6rem] text-[#FFE600] p-2 mb-20">

                                {/* WORD 1: GOOD (Yellow on Purple) */}
                                <h1 className="transform origin-bottom-left"
                                    style={{
                                        fontFamily,
                                        textShadow: getLongShadow('#6D28D9', 180) // Purple shadow
                                    }}>
                                    GOOD
                                </h1>

                                {/* WORD 2: VIBES (Yellow on Orange) */}
                                {/* Slight overlap upwards (-mt) to lock the design together */}
                                <h1 className="z-10 transform origin-bottom-left pl-10"
                                    style={{
                                        fontFamily,
                                        textShadow: getLongShadow('#EA580C', 180) // Orange shadow
                                    }}>
                                    VIBES
                                </h1>

                                {/* WORD 3: ONLY (Yellow on Navy Blue) */}
                                <h1 className="z-20 transform origin-bottom-left pl-20"
                                    style={{
                                        fontFamily,
                                        textShadow: getLongShadow('#172554', 220) // Dark Navy shadow
                                    }}>
                                    ONLY
                                </h1>

                            </div>

                            {/* --- 3. Optional "Sticker" or Badge detail (to balance the top empty space) --- */}
                            {/* Since the original image has empty white space at the top, we keep it clean or add a subtle detail */}
                            <div className="absolute top-8 right-8 z-10 opacity-60 mix-blend-multiply">
                                <div className="w-16 h-16 rounded-full border-4 border-black/10 flex items-center justify-center -rotate-12">
                                    <span className="text-[10px]  uppercase tracking-widest text-black/40">Est. 2024</span>
                                </div>
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
