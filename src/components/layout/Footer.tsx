import React, { useEffect, useRef, memo } from 'react';

const Footer: React.FC = memo(() => {
    const currentYear = new Date().getFullYear();
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 2.0; // speed
        }
    }, []);

    return (
        <footer className="hidden sm:block bg-[rgb(var(--color-background))] text-[rgb(var(--color-muted-foreground))] pb-20 font-sans selection:bg-[rgb(var(--color-foreground))] selection:text-[rgb(var(--color-background))]">
            <div className="max-w-480 mx-auto px-3">

                <div className=''>
                    <div className='hidden h-20rem w-20rem relative'>
                        <video ref={videoRef} autoPlay loop muted playsInline src="/videos/logo.webm"></video>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-24 mt-4 mb-24">

                    {/* Left Column: Brand & Newsletter */}
                    <div className="w-full lg:max-w-xl flex flex-col">
                        <h2 className="text-[rgb(var(--color-foreground))] text-2xl font-medium tracking-tight mb-4">
                            nobadfonts.in
                        </h2>
                        <p className="text-sm leading-relaxed text-[rgb(var(--color-muted-foreground))] mb-8">
                            A meticulously curated archive of 100% free and open-source typography. Built to elevate the standard of design for everyone.
                        </p>

                        <form className="relative flex items-center w-full" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Join the newsletter"
                                className="w-full bg-transparent border-b border-[rgb(var(--color-border))] py-2 pr-8 text-sm text-[rgb(var(--color-foreground))] placeholder-[rgb(var(--color-muted-foreground)/0.6)] focus:outline-none focus:border-[rgb(var(--color-foreground))] transition-colors rounded-none"
                                required
                            />
                            <button
                                type="submit"
                                className="absolute right-0 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors"
                                aria-label="Subscribe"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </button>
                        </form>
                    </div>

                    {/* Right Columns: The Navigation Directory */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 w-full">

                        {/* Column 1: The Archive */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-[rgb(var(--color-foreground))] text-xs font-semibold tracking-wider uppercase mb-2">The Archive</h3>
                            <a href="/fonts/variable" className="text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Variable</a>
                        </div>

                        {/* Column 2: Platform & Tools */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-[rgb(var(--color-foreground))] text-xs font-semibold tracking-wider uppercase mb-2">Platform</h3>
                            <a href="/submit" className="text-sm hover:text-white transition-colors">Submit a Font</a>
                            <a href="/type-tester" className="text-sm hover:text-white transition-colors">Type Tester</a>
                            <a href="/guide/installation" className="text-sm hover:text-white transition-colors">Installation Guide</a>
                            <a href="/about" className="text-sm hover:text-white transition-colors">About Us</a>
                            <a href="/contact" className="text-sm hover:text-white transition-colors">Contact</a>
                        </div>

                        {/* Column 3: Font Licensing (For the downloaded files) */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-[rgb(var(--color-foreground))] text-xs font-semibold tracking-wider uppercase mb-2">Font Licenses</h3>
                            <a href="/license/overview" className="text-sm hover:text-white transition-colors text-zinc-300">License Overview</a>
                            <a href="/license/sil-ofl" className="text-sm hover:text-white transition-colors">SIL Open Font (OFL)</a>
                            <a href="/license/commercial-use" className="text-sm hover:text-white transition-colors">Commercial Use Guide</a>
                            <a href="/license/personal-use" className="text-sm hover:text-white transition-colors">Personal Use Guide</a>
                            <a href="/license/webfont" className="text-sm hover:text-white transition-colors">Webfont & App Usage</a>
                        </div>

                        {/* Column 4: Site Policies (For using your website) */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-[rgb(var(--color-foreground))] text-xs font-semibold tracking-wider uppercase mb-2">Site Policies</h3>
                            <a href="/legal/terms" className="text-sm hover:text-white transition-colors">Terms of Service</a>
                            <a href="/legal/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
                            <a href="/legal/cookies" className="text-sm hover:text-white transition-colors">Cookie Policy</a>
                            <a href="/legal/dmca" className="text-sm hover:text-white transition-colors text-zinc-300">DMCA / Takedown</a>
                            <a href="/legal/guidelines" className="text-sm hover:text-white transition-colors">Community Guidelines</a>
                        </div>

                    </div>
                </div>

                {/* Absolute Bottom Footer: Socials & Copyright */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-[rgb(var(--color-border))]">

                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>&copy; {currentYear} nobadfonts.in. All rights reserved.</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-[rgb(var(--color-foreground))] transition-colors flex items-center gap-1 group">
                            Twitter
                            <svg className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                        </a>
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[rgb(var(--color-foreground))] transition-colors flex items-center gap-1 group">
                            GitHub
                            <svg className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[rgb(var(--color-foreground))] transition-colors flex items-center gap-1 group">
                            Instagram
                            <svg className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                        </a>
                    </div>

                </div>

            </div>
        </footer>
    );
});

export default Footer;


