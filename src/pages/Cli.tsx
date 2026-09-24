
import { Terminal, Check, Download, Zap, FileJson, Info, List, MousePointerClick } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomClipboard } from '../components/ui/CustomIcons';
import SEO from '../components/shared/SEO';

const commands = [
    {
        title: 'Default',
        subtitle: 'Install all variants',
        command: 'npx nobadfonts add offbit',
        description: 'Installs all available variants and generates CSS for the entire font family.',
        icon: <Download size={18} />,
    },
    {
        title: 'Selective',
        subtitle: 'Install specific variants',
        command: 'npx nobadfonts add offbit --variant pixelbold --variant extradot-pixel',
        description: 'Downloads only the requested variants. Short alias: -v',
        icon: <MousePointerClick size={18} />,
    },
    {
        title: 'Interactive',
        subtitle: 'Choose variants from a prompt',
        command: 'npx nobadfonts add offbit --select',
        description: 'Opens a multi-select terminal prompt with checkboxes to pick variants.',
        icon: <List size={18} />,
    },
    {
        title: 'Inspect',
        subtitle: 'List available variants',
        command: 'npx nobadfonts info offbit',
        description: 'Shows all variants, file formats, and install commands — before installing.',
        icon: <Info size={18} />,
    },
];

export default function Cli() {
    const [copied, setCopied] = useState<string | null>(null);
    const mainCommand = 'npx nobadfonts add "FontName"';

    const copyCommand = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="pt-24 mx-auto md:py-20">
            <SEO
                title="NoBadFonts CLI — Developer Command Line Typography Tool"
                description="Install webfonts directly into your React, Next.js, and Vite projects with a single command. Supports variant selection, interactive prompts, and ZIP downloads."
                url="/cli"
                keywords={['nobadfonts-cli', 'font cli', 'webfont installer', 'developer typography', 'npx nobadfonts']}
                schema={{
                    '@type': 'SoftwareApplication',
                    name: 'nobadfonts-cli',
                    applicationCategory: 'DeveloperApplication',
                    operatingSystem: 'Windows, macOS, Linux',
                    url: 'https://nobadfonts.in/cli',
                    description: 'Command line interface to add fonts directly into web projects with variant selection support.',
                    offers: {
                        '@type': 'Offer',
                        price: '0',
                        priceCurrency: 'USD'
                    }
                }}
            />

            {/* Hero */}
            <div className="flex flex-col justify-center items-center px-0 mb-20 text-center">
                <div className="inline-flex scale-75 md:scale-90 lg:scale-100 items-center gap-2 px-4 py-2 bg-[rgb(var(--color-background))] text-[rgb(var(--color-primary))] rounded-full font-mono font-bold text-sm mb-6 border border-[rgb(var(--color-primary))]">
                    <Terminal size={16} />
                    v1.2.0 — Now with variant selection
                </div>
                <h1 className="text-[10vw] md:text-[7vw] text-[rgb(var(--color-foreground))] font-aspect-range leading-normal uppercase my-6">
                    The NoBadFonts CLI
                </h1>
                <p className="text-xl md:text-2xl text-[rgb(var(--color-muted-foreground))] max-w-3xl mx-auto mb-10">
                    Stop manually downloading zip files. Add fonts directly to your project with a single command — pick the exact variants you need.
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
                            <span className="text-[rgb(var(--color-primary))]">$</span> {mainCommand}
                        </code>
                        <button
                            onClick={() => copyCommand(mainCommand)}
                            className="p-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] rounded-lg hover:bg-[rgb(var(--color-highlight))] transition-colors duration-300 ease-in-out font-bold flex items-center gap-2 shrink-0"
                        >
                            {copied === mainCommand ? <Check className='h-5 w-5' strokeWidth={3} /> : <CustomClipboard className='h-5 w-5' />}
                            <span className="md:hidden font-mono uppercase tracking-widest text-xs">Copy</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Command Modes Grid */}
            <div className="max-w-5xl mx-auto px-4 mb-20">
                <h2 className="text-2xl md:text-4xl font-black uppercase mb-3 text-center text-[rgb(var(--color-foreground))]">
                    4 Ways to Install
                </h2>
                <p className="text-[rgb(var(--color-muted-foreground))] text-center mb-10">
                    From one-liner to fine-grained variant control.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                    {commands.map((cmd, i) => (
                        <div
                            key={i}
                            className="bg-[rgb(var(--color-card)/0.5)] border border-[rgb(var(--color-border))] rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-[rgb(var(--color-muted-foreground))] uppercase tracking-widest font-mono">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span className="text-[rgb(var(--color-primary))] text-[10px] uppercase tracking-widest font-bold">
                                            · {cmd.title}
                                        </span>
                                    </div>
                                    <p className="font-black text-lg text-[rgb(var(--color-foreground))]">{cmd.subtitle}</p>
                                </div>
                                <div className="w-10 h-10 bg-[rgb(var(--color-foreground)/0.08)] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[rgb(var(--color-foreground)/0.15)] transition-colors">
                                    {cmd.icon}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border)/0.5)] rounded-xl px-3 py-2.5">
                                <code className="font-mono text-[11px] md:text-xs text-[rgb(var(--color-foreground)/0.85)] break-all leading-relaxed">
                                    <span className="text-[rgb(var(--color-primary))]">$</span> {cmd.command}
                                </code>
                                <button
                                    onClick={() => copyCommand(cmd.command)}
                                    className="shrink-0 p-1.5 rounded-lg text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-all"
                                    aria-label="Copy command"
                                >
                                    {copied === cmd.command
                                        ? <Check size={13} strokeWidth={3} className="text-green-500" />
                                        : <CustomClipboard className="w-3.5 h-3.5" />
                                    }
                                </button>
                            </div>

                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">{cmd.description}</p>
                        </div>
                    ))}
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
                            <p className="text-[rgb(var(--color-muted-foreground))] mb-4">Open your terminal in your project root and run the add command with the font name.</p>
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
                            <p className="text-[rgb(var(--color-muted-foreground))] mb-4">The CLI downloads the optimized font files into <code className="bg-[rgb(var(--color-muted)/0.2)] px-1 rounded">./public/fonts/</code> and generates a CSS file.</p>
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
