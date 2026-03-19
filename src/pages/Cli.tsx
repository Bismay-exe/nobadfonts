
import { Terminal, Copy, Check, Download, Zap, FileJson } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Cli() {
    const [copied, setCopied] = useState(false);
    const command = 'npx nobadfonts-cli add "FontName"';

    const copyCommand = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mx-auto md:py-20">

            {/* Hero */}
            <div className="h-[83vh] md:h-auto flex flex-col justify-center items-center px-0 mb-20 text-center">
                <div className="inline-flex scale-75 md:scale-90 lg:scale-100 items-center gap-2 px-4 py-2 bg-[rgb(var(--color-background))] text-[rgb(var(--color-primary))] rounded-full font-mono font-bold text-sm mb-6 border border-[rgb(var(--color-primary))]">
                    <Terminal size={16} />
                    RELEASE v1.0.0
                </div>
                <h1 className="text-[10vw] md:text-[7vw] text-[rgb(var(--color-foreground))] font-aspect-range leading-normal uppercase my-6">
                    The NoBadFonts CLI
                </h1>
                <p className="text-xl md:text-2xl text-[rgb(var(--color-muted-foreground))] max-w-3xl mx-auto mb-10">
                    Stop manually downloading zip files. Add fonts directly to your project with a single command.
                </p>

                {/* Command Box */}
                <div className="max-w-2xl w-full mx-auto bg-[rgb(var(--color-card))] rounded-xl p-2 md:p-8 relative group overflow-hidden border-2 border-[rgb(var(--color-border))] shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),0.1)]">
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[rgb(var(--color-destructive))]"></div>
                        <div className="w-3 h-3 rounded-full bg-[rgb(var(--color-warning))]"></div>
                        <div className="w-3 h-3 rounded-full bg-[rgb(var(--color-success,var(--color-highlight)))]"></div>
                    </div>

                    <div className="mt-10 md:mt-6 flex flex-col md:flex-row items-end justify-between gap-4">
                        <code className="bg-transparent text-[rgb(var(--color-foreground))] font-mono text-[4.3vw] whitespace-nowrap md:text-xl outline-none w-full text-left">
                            <span className="text-[rgb(var(--color-primary))]">$</span> {command}
                        </code>
                        <button
                            onClick={() => copyCommand(command)}
                            className="p-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] rounded-lg hover:bg-[rgb(var(--color-highlight))] transition-colors font-bold flex items-center gap-2 shrink-0"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            <span className="md:hidden font-mono uppercase tracking-widest text-xs">Copy</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-8 mb-20 max-w-7xl mx-auto px-4">
                {/* Feature 1 */}
                <div className="bg-[rgb(var(--color-card)/0.5)] border border-[rgb(var(--color-border))] rounded-4xl p-8 hover:-translate-y-2 transition-all duration-300 group">
                    <div className="w-16 h-16 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-2xl flex items-center justify-center mb-6 rotate-3 group-hover:rotate-0 transition-transform">
                        <Download size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-3 text-[rgb(var(--color-foreground))]">Instant Download</h3>
                    <p className="font-light text-[rgb(var(--color-muted-foreground))]">
                        Fetches .ttf, .otf, .woff, and .woff2 files directly from our CDN and places them in your <code className="bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] font-bold px-1 py-0.5 rounded">public/fonts</code> folder automatically.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-[rgb(var(--color-card)/0.5)] border border-[rgb(var(--color-border))] rounded-4xl p-8 hover:-translate-y-2 transition-all duration-300 group">
                    <div className="w-16 h-16 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-2xl flex items-center justify-center mb-6 -rotate-3 group-hover:rotate-0 transition-transform">
                        <FileJson size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-3 text-[rgb(var(--color-foreground))]">CSS Generation</h3>
                    <p className="font-light text-[rgb(var(--color-muted-foreground))]">
                        Writes the full <code className="bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] font-bold px-1 py-0.5 rounded">@font-face</code> definition for you. No more guessing weights, styles, or file paths. It just works.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-[rgb(var(--color-card)/0.5)] border border-[rgb(var(--color-border))] rounded-4xl p-8 hover:-translate-y-2 transition-all duration-300 group">
                    <div className="w-16 h-16 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-2xl flex items-center justify-center mb-6 rotate-3 group-hover:rotate-0 transition-transform">
                        <Zap size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-3 text-[rgb(var(--color-foreground))]">Zero Config</h3>
                    <p className="font-light text-[rgb(var(--color-muted-foreground))]">
                        Works with Vite, Next.js, Create React App, and vanilla HTML. It detects your project structure intelligently.
                    </p>
                </div>
            </div>

            {/* How it works */}
            <div className="max-w-4xl mx-auto bg-[rgb(var(--color-card)/0.3)] text-[rgb(var(--color-foreground))] rounded-4xl p-8 md:p-12 border border-[rgb(var(--color-border))]">
                <h2 className="text-3xl md:text-5xl font-black uppercase mb-12 text-center">How it works</h2>

                <div className="space-y-12">
                    <div className="flex gap-6">
                        <div className="flex-col items-center hidden md:flex">
                            <div className="w-12 h-12 rounded-full bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] font-black text-xl flex items-center justify-center">1</div>
                            <div className="w-1 h-24 bg-[rgb(var(--color-border))] my-2"></div>
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold mb-2 text-[rgb(var(--color-foreground))]">Run the command</h4>
                            <p className="text-[rgb(var(--color-muted-foreground))] mb-4">Open your terminal in your project root and run the add command with the font name you want.</p>
                            <div className="bg-[rgb(var(--color-surface,var(--color-card)))] p-4 rounded-xl font-mono text-sm border border-[rgb(var(--color-border))] shadow-inner">
                                <span className="text-[rgb(var(--color-success,var(--color-highlight)))]">➜</span>  <span className="text-[rgb(var(--color-primary))]">~</span> npx nobadfonts add "Inter"
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-col items-center hidden md:flex">
                            <div className="w-12 h-12 rounded-full bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] font-black text-xl flex items-center justify-center">2</div>
                            <div className="w-1 h-24 bg-[rgb(var(--color-border))] my-2"></div>
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold mb-2 text-[rgb(var(--color-foreground))]">We handle the files</h4>
                            <p className="text-[rgb(var(--color-muted-foreground))] mb-4">The CLI downloads the optimized font files into <code className="bg-[rgb(var(--color-muted)/0.2)] px-1 rounded">./public/fonts/</code> and generates a css file.</p>
                            <div className="bg-[rgb(var(--color-surface,var(--color-card)))] p-4 rounded-xl font-mono text-sm border border-[rgb(var(--color-border))] text-[rgb(var(--color-muted-foreground))] shadow-inner">
                                <span className="text-[rgb(var(--color-primary))]">LOG:</span> Found font: Inter<br />
                                <span className="text-[rgb(var(--color-primary))]">LOG:</span> Files downloaded successfully.<br />
                                <span className="text-[rgb(var(--color-primary))]">LOG:</span> Updated src/fonts.css
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-col items-center hidden md:flex">
                            <div className="w-12 h-12 rounded-full bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] font-black text-xl flex items-center justify-center">3</div>
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold mb-2 text-[rgb(var(--color-foreground))]">Import and Use</h4>
                            <p className="text-[rgb(var(--color-muted-foreground))] mb-4">Just import the generated CSS file in your main entry point (App.tsx or main.ts).</p>
                            <div className="bg-[rgb(var(--color-surface,var(--color-card)))] p-4 rounded-xl font-mono text-sm border border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))] shadow-inner">
                                import <span className="text-[rgb(var(--color-highlight))]">'./fonts.css'</span>;
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link to="/fonts" className="inline-block px-8 py-4 bg-[rgb(var(--color-foreground))] text-xs md:text-sm text-[rgb(var(--color-background))] font-black rounded-full hover:scale-105 transition-transform uppercase tracking-widest shadow-xl">
                        Browse Fonts to Install
                    </Link>
                </div>
            </div>

        </div>
    );
}
