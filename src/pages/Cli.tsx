
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
        <div className="mx-auto md:py-20 border-b-2 border-black">

            {/* Hero */}
            <div className="h-[83vh] md:h-auto flex flex-col justify-center items-center px-0 mb-20 text-center">
                <div className="inline-flex scale-75 md:scale-90 lg:scale-100 items-center gap-2 px-4 py-2 bg-black text-[#ff0000] rounded-full font-mono font-bold text-sm mb-6 border border-[#ff0000]">
                    <Terminal size={16} />
                    RELEASE v1.0.0
                </div>
                <h1 className="text-[10vw] md:text-[7vw] text-[#ff0000] font-aspect-range leading-normal uppercase my-6">
                    The <span className="text-transparent bg-clip-text bg-linear-to-r from-[#ff0000] to-[#ff0000]">NoBadFonts</span> CLI
                </h1>
                <p className="text-xl md:text-2xl text-[#636363] max-w-3xl mx-auto mb-10">
                    Stop manually downloading zip files. Add fonts directly to your project with a single command.
                </p>

                {/* Command Box */}
                <div className="max-w-2xl w-full mx-auto bg-white/10 rounded-xl p-2 md:p-8 relative group overflow-hidden border-2 border-[#636363]">
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>

                    <div className="mt-10 md:mt-6 flex flex-col md:flex-row items-end justify-between gap-4">
                        <code className="bg-transparent text-white/90 font-mono text-[4.3vw] whitespace-nowrap md:text-xl outline-none w-full text-left">
                            <span className="text-[#ff0000]">$</span> {command}
                        </code>
                        <button
                            onClick={() => copyCommand(command)}
                            className="p-2 bg-[#ff0000] text-black rounded-lg hover:scale-105 transition-transform font-bold flex items-center gap-2 shrink-0"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            <span className="md:hidden">Copy</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-8 mb-20 max-w-7xl mx-auto">
                {/* Feature 1 */}
                <div className="bg-white/5 border border-white/5 rounded-4xl p-8 hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                    <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <Download size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-3">Instant Download</h3>
                    <p className="font-light text-white/60">
                        Fetches .ttf, .otf, .woff, and .woff2 files directly from our CDN and places them in your <code className="bg-white text-black font-bold px-1 py-0.5 rounded">public/fonts</code> folder automatically.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white/5 border border-white/5 rounded-4xl p-8 hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                    <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mb-6 -rotate-3">
                        <FileJson size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-3">CSS Generation</h3>
                    <p className="font-light text-white/60">
                        Writes the full <code className="bg-white text-black font-bold px-1 py-0.5 rounded">@font-face</code> definition for you. No more guessing weights, styles, or file paths. It just works.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white/5 border border-white/5 rounded-4xl p-8 hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                    <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <Zap size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-3">Zero Config</h3>
                    <p className="font-light text-white/60">
                        Works with Vite, Next.js, Create React App, and vanilla HTML. It detects your project structure intelligently.
                    </p>
                </div>
            </div>

            {/* How it works */}
            <div className="max-w-4xl mx-auto bg-black text-[#ff0000] rounded-4xl p-8 md:p-12 border-2 border-[#ff0000] md:border-none">
                <h2 className="text-3xl md:text-5xl font-black uppercase mb-12 text-center">How it works</h2>

                <div className="space-y-12">
                    <div className="flex gap-6">
                        <div className="flex-col items-center hidden md:flex">
                            <div className="w-12 h-12 rounded-full bg-[#ffffff] text-black font-black text-xl flex items-center justify-center">1</div>
                            <div className="w-1 h-24 bg-gray-800 my-2"></div>
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold mb-2 text-[#ffffff]">Run the command</h4>
                            <p className="text-gray-400 mb-4">Open your terminal in your project root and run the add command with the font name you want.</p>
                            <div className="bg-gray-900 p-4 rounded-xl font-mono text-sm border border-gray-700">
                                <span className="text-green-400">➜</span>  <span className="text-blue-400">~</span> npx nobadfonts add "Inter"
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-col items-center hidden md:flex">
                            <div className="w-12 h-12 rounded-full bg-[#ffffff] text-black font-black text-xl flex items-center justify-center">2</div>
                            <div className="w-1 h-24 bg-gray-800 my-2"></div>
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold mb-2 text-[#ffffff]">We handle the files</h4>
                            <p className="text-gray-400 mb-4">The CLI downloads the optimized font files into <code className="bg-gray-800 px-1 rounded">./public/fonts/</code> and generates a css file.</p>
                            <div className="bg-gray-900 p-4 rounded-xl font-mono text-sm border border-gray-700 text-gray-400">
                                LOG: Found font: Inter<br />
                                LOG: Files downloaded successfully.<br />
                                LOG: Updated src/fonts.css
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-col items-center hidden md:flex">
                            <div className="w-12 h-12 rounded-full bg-[#EEEFEB] text-black font-black text-xl flex items-center justify-center">3</div>
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold mb-2 text-white">Import and Use</h4>
                            <p className="text-gray-400 mb-4">Just import the generated CSS file in your main entry point (App.tsx or main.ts).</p>
                            <div className="bg-gray-900 p-4 rounded-xl font-mono text-sm border border-gray-700 text-purple-400">
                                import <span className="text-[#ff0000]">'./fonts.css'</span>;
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link to="/fonts" className="inline-block px-8 py-4 bg-[#ff0000] text-xs md:text-sm text-black font-black rounded-full hover:bg-[#000000] border border-black hover:border-[#ff0000] hover:text-[#ff0000] transition-all uppercase tracking-tight">
                        Browse Fonts to Install
                    </Link>
                </div>
            </div>

        </div>
    );
}
