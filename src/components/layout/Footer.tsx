import React, { useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';

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
                            <h3 className="text-[rgb(var(--color-foreground))] text-sm font-bold tracking-wider zuppercase mb-4">The Archive</h3>
                            <Link to="/fonts" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">All Fonts</Link>
                            <Link to="/fonts?categories=sans" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Sans-Serif</Link>
                            <Link to="/fonts?categories=serif" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Serif</Link>
                            <Link to="/fonts?categories=display" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Display</Link>
                            <Link to="/fonts?categories=monospace" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Monospace</Link>
                            <Link to="/fonts?query=variable" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Variable Fonts</Link>
                        </div>

                        {/* Column 2: Platform & Tools */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-[rgb(var(--color-foreground))] text-sm font-bold tracking-wider zuppercase mb-4">Platform</h3>
                            <Link to="/upload" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Submit a Font</Link>
                            <Link to="/fonts" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Type Tester</Link>
                            <Link to="/pairing" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Font Pairing</Link>
                            <Link to="/cli" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">CLI Tool</Link>
                            <Link to="/members" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Community</Link>
                        </div>

                        {/* Column 3: Font Licensing (For the downloaded files) */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-[rgb(var(--color-foreground))] text-sm font-bold tracking-wider zuppercase mb-4">Font Licenses</h3>
                            <Link to="/legal/terms" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">License Overview</Link>
                            <Link to="/legal/terms" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">SIL Open Font (OFL)</Link>
                            <Link to="/legal/terms" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Commercial Use Guide</Link>
                            <Link to="/legal/terms" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Personal Use Guide</Link>
                        </div>

                        {/* Column 4: Site Policies (For using your website) */}
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-[rgb(var(--color-foreground))] text-sm font-bold tracking-wider zuppercase mb-4">Site Policies</h3>
                            <Link to="/legal/terms" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Terms of Service</Link>
                            <Link to="/legal/privacy" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Privacy Policy</Link>
                            <Link to="/legal/cookies" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">Cookie Policy</Link>
                            <Link to="/legal/dmca" className="w-fit text-sm hover:text-[rgb(var(--color-foreground))] transition-colors">DMCA / Takedown</Link>
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


