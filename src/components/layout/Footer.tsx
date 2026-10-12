import React, { memo } from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = memo(() => {
    const currentYear = new Date().getFullYear();

    const linkClass =
        'w-fit text-[15px] font-semibold leading-snug text-foreground transition-colors duration-200 hover:text-muted';

    const headingClass =
        'mb-1 text-[15px] font-semibold tracking-tight text-muted/80';

    return (
        <footer className="relative z-0 bg-background px-3 py-3 text-foreground font-inter sm:px-5 sm:py-5 lg:px-8 lg:py-8">
            <div className="mx-auto flex min-h-140 w-full max-w-[1600px] flex-col rounded-[22px] bg-card-background px-6 py-8 sm:px-8 sm:py-10 md:min-h-147.5 md:px-10 md:py-10 lg:min-h-130 lg:rounded-[28px] lg:px-10 lg:py-9 xl:px-12">
                {/* Navigation directory */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-10 lg:grid-cols-5 lg:gap-x-8 lg:gap-y-0">
                    <nav aria-label="Font archive" className="flex flex-col items-start gap-y-3">
                        <h2 className={headingClass}>Archive</h2>
                        <Link to="/fonts" className={linkClass}>All Fonts</Link>
                        <Link to="/fonts?categories=sans" className={linkClass}>Sans-Serif</Link>
                        <Link to="/fonts?categories=serif" className={linkClass}>Serif</Link>
                        <Link to="/fonts?categories=display" className={linkClass}>Display</Link>
                        <Link to="/fonts?categories=monospace" className={linkClass}>Monospace</Link>
                        <Link to="/fonts?categories=brush" className={linkClass}>Brush</Link>
                        <Link to="/fonts?categories=signature" className={linkClass}>Signature</Link>
                    </nav>

                    <nav aria-label="Platform" className="flex flex-col items-start gap-y-3">
                        <h2 className={headingClass}>Platform</h2>
                        <Link to="/docs" className={linkClass}>Documentation</Link>
                        <Link to="/upload" className={linkClass}>Submit a Font</Link>
                        <Link to="/fonts" className={linkClass}>Type Tester</Link>
                        <Link to="/pairing" className={linkClass}>Font Pairing</Link>
                        <Link to="/cli" className={linkClass}>CLI Tool</Link>
                        <Link to="/members" className={linkClass}>Community</Link>
                    </nav>

                    <nav aria-label="Font licenses" className="flex flex-col items-start gap-y-3">
                        <h2 className={headingClass}>Licenses</h2>
                        <Link to="/legal/terms" className={linkClass}>License Overview</Link>
                        <Link to="/legal/terms" className={linkClass}>SIL Open Font (OFL)</Link>
                        <Link to="/legal/terms" className={linkClass}>Commercial Use</Link>
                        <Link to="/legal/terms" className={linkClass}>Personal Use</Link>
                    </nav>

                    <nav aria-label="Policies" className="flex flex-col items-start gap-y-3">
                        <h2 className={headingClass}>Policies</h2>
                        <Link to="/about" className={linkClass}>About</Link>
                        <Link to="/legal/terms" className={linkClass}>Terms of Service</Link>
                        <Link to="/legal/privacy" className={linkClass}>Privacy Policy</Link>
                        <Link to="/legal/cookies" className={linkClass}>Cookie Policy</Link>
                        <Link to="/legal/dmca" className={linkClass}>DMCA / Takedown</Link>
                    </nav>

                    <div className="flex flex-col items-start gap-y-3">
                        <h2 className={headingClass}>Follow Us</h2>
                        <div className="flex items-center gap-5 lg:gap-4 lg:pt-1">
                            <a href="https://x.com/NoBadFonts" target="_blank" rel="noopener noreferrer" aria-label="NoBadFonts on X" className="text-foreground/90 transition-opacity hover:opacity-60">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="currentColor" fill-rule="evenodd" d="M19 2h3l-7.68 9.03l7.68 11h-6l-4.97-7.1L5 22.03H2L9.68 13L2 2h6l4.97 7.1zm1.08 19L7.48 3H3.92l12.6 18z" clip-rule="evenodd" />
                                </svg>
                            </a>
                            <a href="https://www.instagram.com/bismay.exe" target="_blank" rel="noopener noreferrer" aria-label="NoBadFonts on Instagram" className="transition-opacity hover:opacity-60">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12 15.5a3.53 3.53 0 0 1-2.5-1.04a3.54 3.54 0 0 1-1.04-2.5a3.53 3.53 0 0 1 1.04-2.5A3.54 3.54 0 0 1 12 8.42a3.53 3.53 0 0 1 2.5 1.04a3.54 3.54 0 0 1 1.04 2.5a3.53 3.53 0 0 1-1.04 2.5A3.54 3.54 0 0 1 12 15.5" />
                                    <path fill="currentColor" fill-rule="evenodd" d="M7.41 1.07C8.343 1.02 9.87.996 12 .996q3.195 0 4.59.074c.825.03 1.64.17 2.43.417c.803.286 1.53.748 2.14 1.35a5.8 5.8 0 0 1 1.35 2.14c.249.797.398 1.62.442 2.46q.05 1.375.049 4.57q0 3.195-.074 4.59a9.3 9.3 0 0 1-.417 2.43a5.8 5.8 0 0 1-1.35 2.14a5.8 5.8 0 0 1-2.14 1.35a9.3 9.3 0 0 1-2.43.417c-.933.05-2.46.074-4.59.074q-3.195 0-4.59-.074a8 8 0 0 1-2.43-.466a5.3 5.3 0 0 1-2.14-1.3a5.6 5.6 0 0 1-1.35-2.14a9.3 9.3 0 0 1-.417-2.43c-.05-.933-.074-2.46-.074-4.59q0-3.195.074-4.59c.03-.825.17-1.64.417-2.43c.286-.803.748-1.53 1.35-2.14s1.33-1.06 2.14-1.35a9.3 9.3 0 0 1 2.43-.417zm9.72 3.89a1.365 1.365 0 0 1 1.732.178c.257.256.403.604.408.968a1.6 1.6 0 0 1-.432.967a1.24 1.24 0 0 1-.943.408a1.32 1.32 0 0 1-.968-.408a1.37 1.37 0 0 1-.302-1.496a1.37 1.37 0 0 1 .507-.617zM9.25 7.24A5.34 5.34 0 0 1 12 6.499c.967-.006 1.92.25 2.75.741a5.5 5.5 0 0 1 2.01 2.01a5.47 5.47 0 0 1 0 5.5a5.5 5.5 0 0 1-2.01 2.01a5.47 5.47 0 0 1-5.5 0a5.5 5.5 0 0 1-2.01-2.01a5.47 5.47 0 0 1 0-5.5a5.53 5.53 0 0 1 2.01-2.01" clip-rule="evenodd" />
                                </svg>
                            </a>
                            <a href="https://github.com/Bismay-exe" target="_blank" rel="noopener noreferrer" aria-label="NoBadFonts on GitHub" className="transition-opacity hover:opacity-60">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="currentColor" fill-rule="evenodd" d="M12 0C5.36 0 0 5.5 0 12.3c0 5.44 3.44 10 8.21 11.7c.597.122.815-.265.815-.59c0-.285-.02-1.26-.02-2.28c-3.34.734-4.04-1.47-4.04-1.47c-.537-1.43-1.33-1.79-1.33-1.79c-1.09-.754.08-.754.08-.754c1.21.082 1.85 1.26 1.85 1.26c1.07 1.87 2.8 1.34 3.5 1.02c.1-.794.418-1.34.756-1.65c-2.66-.285-5.47-1.34-5.47-6.07c0-1.34.477-2.44 1.23-3.3c-.12-.306-.537-1.57.119-3.26c0 0 1.01-.326 3.3 1.26c.979-.269 1.99-.406 3-.407s2.05.143 3 .407c2.29-1.59 3.3-1.26 3.3-1.26c.656 1.69.238 2.95.119 3.26c.776.855 1.23 1.96 1.23 3.3c0 4.73-2.8 5.76-5.49 6.07c.438.387.815 1.12.815 2.28c0 1.65-.02 2.97-.02 3.38c0 .326.22.713.815.591c4.77-1.63 8.21-6.23 8.21-11.7c.02-6.8-5.37-12.3-12-12.3z" clip-rule="evenodd" />
                                </svg>
                            </a>
                            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="transition-opacity hover:opacity-60">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
                                    <path fill="currentColor" d="M3.468 1.948C5.303 3.325 7.276 6.118 8 7.616c.725-1.498 2.698-4.29 4.532-5.668C13.855.955 16 .186 16 2.632c0 .489-.28 4.105-.444 4.692c-.572 2.04-2.653 2.561-4.504 2.246c3.236.551 4.06 2.375 2.281 4.2c-3.376 3.464-4.852-.87-5.23-1.98c-.07-.204-.103-.3-.103-.218c0-.081-.033.014-.102.218c-.379 1.11-1.855 5.444-5.231 1.98c-1.778-1.825-.955-3.65 2.28-4.2c-1.85.315-3.932-.205-4.503-2.246C.28 6.737 0 3.12 0 2.632C0 .186 2.145.955 3.468 1.948" />
                                </svg>
                            </a>
                            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="transition-opacity hover:opacity-60">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
                                    <path fill="currentColor" d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802c.756-1.081 1.753-1.502 3.132-1.502c.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137c0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994C1 2.034 4.482 0 8.044 0C9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79c0 4.143 2.254 6.343 5.63 6.343c2.777 0 4.847-1.443 4.847-3.556c0-1.438-1.208-2.127-1.27-2.127c-.236 1.234-.868 3.31-3.644 3.31c-1.618 0-3.013-1.118-3.013-2.582c0-2.09 1.984-2.847 3.55-2.847c.586 0 1.294.04 1.663.114c0-.637-.54-1.728-1.9-1.728c-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416c0 .878 1.043 1.168 1.6 1.168c1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom brand and legal row */}
                <div className="mt-auto flex flex-col gap-8 pt-16 sm:pt-20 lg:flex-row lg:items-end lg:justify-between lg:pt-24">
                    <div className="flex items-end">
                        <svg
                            className='overflow-visible'
                            width="80"
                            height="80"
                            viewBox="0 0 680 678"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M27.7539 678C27.7539 678 4.99807 663 0.500015 598C-3.99804 533 22 418 72.5 353.5C123 289 226.5 226 226.5 226C226.5 226 319.5 0 452.5 0C585.5 0 680 213.239 680 415.5C680 617.761 639.5 678 639.5 678H403C403 678 366.5 625 345 537C323.5 449 384.5 291 384.5 218.5C384.5 146 226.5 226 226.5 226C226.5 226 191 320.5 191 452C191 583.5 250 678 250 678H27.7539Z" />

                            <path
                                className="origin-[113.5px_113px] animate-[spin_2s_linear_infinite]"
                                d="M30.508 20.5896C21.5794 14.4189 11.648 7.55723 0.503116 0.0105563C8.0698 11.1837 14.9155 21.091 21.0703 29.9942C49.3078 70.8509 63.4278 91.2869 63.4272 113.006C63.4278 134.69 49.3555 155.092 21.2122 195.813L21.0862 195.999C14.915 204.928 8.05273 214.86 0.506647 226.005C11.6816 218.44 21.5883 211.595 30.4915 205.439C71.3464 177.201 91.7824 163.081 113.501 163.081C135.187 163.079 155.588 177.152 196.309 205.297L196.497 205.42C205.425 211.592 215.356 218.456 226.5 226.002C218.935 214.827 212.09 204.92 205.935 196.016C177.698 155.16 163.576 134.726 163.576 113.006C163.576 91.3234 177.648 70.9203 205.792 30.199L205.918 30.0119C212.09 21.0839 218.952 11.1508 226.497 0.00820215C215.323 7.57253 205.417 14.4171 196.512 20.5731C155.657 48.8118 135.222 62.9323 113.502 62.9317C91.8183 62.9317 71.417 48.8582 30.6945 20.7161L30.508 20.5896Z"
                            />
                        </svg>
                    </div>

                    <div className="flex flex-col items-start gap-3 text-xs text-muted-foreground sm:text-sm lg:items-end">
                        <span>© {currentYear} NoBadFonts</span>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                            <Link to="/legal/terms" className="transition-colors hover:text-foreground">Terms</Link>
                            <span aria-hidden="true">·</span>
                            <Link to="/legal/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
                            <span aria-hidden="true">·</span>
                            <Link to="/legal/cookies" className="transition-colors hover:text-foreground">Cookies</Link>
                            <span aria-hidden="true">·</span>
                            <Link to="/legal/dmca" className="transition-colors hover:text-foreground">DMCA</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
});

export default Footer;
