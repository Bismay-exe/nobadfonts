import { useState, useMemo, useEffect, useRef } from 'react';
import opentype from 'opentype.js';
import { cn } from '../../lib/utils';
import { ChevronDown, BoxSelect, Maximize2, Minimize2 } from 'lucide-react';

interface GlyphMapProps {
    fontFamily: string;
    fontUrl: string;
    variants?: { name: string; url: string }[];
}

type UnicodeRange = {
    name: string;
    start?: number;
    end?: number;
    chars?: string[];
};

const RANGES: UnicodeRange[] = [
    { name: 'Basic Latin', start: 0x0020, end: 0x007F },
    { name: 'Latin-1 Supplement', start: 0x0080, end: 0x00FF },
    { name: 'Latin Extended-A', start: 0x0100, end: 0x017F },
    { name: 'Punctuation', start: 0x2000, end: 0x206F },
    { name: 'Symbols', start: 0x20A0, end: 0x20CF },
];

export default function GlyphMap({ fontFamily, fontUrl, variants = [] }: GlyphMapProps) {
    const [viewMode, setViewMode] = useState<'solid' | 'outline'>('solid');
    const [setMode, setSetMode] = useState<'basic' | 'full'>('basic');
    const [selectedChar, setSelectedChar] = useState<string>('g');

    // Variant State
    const [activeVariant, setActiveVariant] = useState<{ name: string; url: string } | null>(null);

    // Sync activeVariant with fontUrl if it matches a variant on mount/update
    useEffect(() => {
        if (!activeVariant && variants.length > 0) {
            const match = variants.find(v => v.url === fontUrl);
            if (match) setActiveVariant(match);
        }
    }, [fontUrl, variants]);

    // Canvas Ref
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Full Set State
    const [selectedRange, setSelectedRange] = useState<UnicodeRange>(RANGES[0]);
    const [availableGlyphs, setAvailableGlyphs] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    // OpenType Font Object
    const [fontObject, setFontObject] = useState<opentype.Font | null>(null);

    // Load OpenType Font
    useEffect(() => {
        const targetUrl = activeVariant ? activeVariant.url : fontUrl;
        if (!targetUrl) return;

        opentype.load(targetUrl, (err, font) => {
            if (err) {
                console.error('Font loading error:', err);
            } else if (font) {
                setFontObject(font);
            }
        });
    }, [fontUrl, activeVariant]);

    // Basic Set
    const basicUppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const basicLowercase = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const basicNumerals = '0123456789'.split('');

    // Full Set Scanning
    const rangeChars = useMemo(() => {
        const chars: string[] = [];
        if (selectedRange.chars) return selectedRange.chars;
        if (selectedRange.start !== undefined && selectedRange.end !== undefined) {
            for (let i = selectedRange.start; i <= selectedRange.end; i++) chars.push(String.fromCharCode(i));
        }
        return chars;
    }, [selectedRange]);

    useEffect(() => {
        if (setMode === 'basic') return;

        const checkSupport = async () => {
            setIsScanning(true);
            await new Promise(resolve => setTimeout(resolve, 10));

            // Simple check using font object if available, otherwise heuristic
            if (fontObject) {
                const supported = rangeChars.filter(char => {
                    try {
                        const glyph = fontObject.charToGlyph(char);
                        return glyph && glyph.name !== '.notdef';
                    } catch { return false; }
                });
                setAvailableGlyphs(supported);
            } else {
                // Fallback heuristic
                setAvailableGlyphs(rangeChars);
            }

            setIsScanning(false);
        };
        checkSupport();
    }, [setMode, rangeChars, fontObject]);

    // CANVAS DRAWING LOGIC (Inspector)
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !fontObject) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            // Metrics and Setup
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            ctx.scale(dpr, dpr);

            const width = rect.width;
            const height = rect.height;

            ctx.clearRect(0, 0, width, height);

            // Use font object metrics
            const { unitsPerEm } = fontObject;
            const os2 = fontObject.tables.os2;
            const hhea = fontObject.tables.hhea;

            const capHeight = os2?.sCapHeight || (fontObject.charToGlyph('H').getBoundingBox().y2);
            const xHeight = os2?.sxHeight || (fontObject.charToGlyph('x').getBoundingBox().y2);
            const descender = hhea?.descender || fontObject.descender;

            // Calculate Metrics
            const displayFontSize = Math.min(width, height) * 0.6;
            const scale = displayFontSize / unitsPerEm;

            // Coordinates
            const baselineY = height * 0.70;
            const centerX = width / 2;

            const scaledCapHeight = capHeight * scale;
            const scaledXHeight = xHeight * scale;
            const scaledDescender = descender * scale;

            // Draw Guidelines function
            const drawLine = (y: number, label: string, value: number, isDashed = false) => {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                if (isDashed) ctx.setLineDash([4, 4]);
                else ctx.setLineDash([]);
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(label, 10, y - 6);
            };

            // Draw Lines
            drawLine(baselineY, 'Baseline', 0);
            drawLine(baselineY - scaledCapHeight, 'Cap Height', capHeight);
            drawLine(baselineY - scaledXHeight, 'X-Height', xHeight, true);
            drawLine(baselineY - scaledDescender, 'Descender', descender);

            // Get Glyph Path
            const glyph = fontObject.charToGlyph(selectedChar);
            const path = glyph.getPath(0, 0, displayFontSize);

            // Center the glyph
            const glyphWidth = (glyph.advanceWidth || 0) * scale;
            const xOffset = centerX - (glyphWidth / 2);

            ctx.translate(xOffset, baselineY);

            // Draw Glyph Body
            if (viewMode === 'solid') {
                ctx.fillStyle = 'white';
                path.fill = 'white';
                path.stroke = null;
                path.draw(ctx);
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                ctx.lineWidth = 1.5;
                path.fill = null;
                path.stroke = 'rgba(255,255,255,0.7)';
                path.strokeWidth = 1.5;
                path.draw(ctx);

                // Draw Nodes
                glyph.path.commands.forEach(cmd => {
                    ctx.beginPath();
                    if (cmd.type === 'M' || cmd.type === 'L') {
                        const x = cmd.x * scale;
                        const y = -cmd.y * scale;
                        ctx.fillStyle = '#BDF522'; // Neon green for on-curve
                        ctx.fillRect(x - 2, y - 2, 4, 4);
                    } else if (cmd.type === 'Q' || cmd.type === 'C') {
                        const x = cmd.x * scale;
                        const y = -cmd.y * scale;
                        // Control points logic simplified for brevity, usually drawn connected
                        ctx.fillStyle = '#BDF522';
                        ctx.fillRect(x - 2, y - 2, 4, 4);

                        if ('x1' in cmd) {
                            const x1 = cmd.x1 * scale;
                            const y1 = -cmd.y1 * scale;
                            ctx.fillStyle = '#666';
                            ctx.beginPath(); ctx.arc(x1, y1, 2, 0, Math.PI * 2); ctx.fill();
                        }
                    }
                });
            }

            // Reset Transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);

        };

        render();
        const resizeObserver = new ResizeObserver(render);
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();

    }, [fontFamily, fontUrl, activeVariant, selectedChar, viewMode, fontObject]);


    return (
        <div className="w-full bg-black/40 backdrop-blur-sm text-white rounded-3xl border border-white/10 overflow-hidden shadow-2xl">

            <div className="lg:flex items-start relative min-h-150">
                {/* Left: Sticky Inspector */}
                <div className="lg:w-1/2 lg:h-auto lg:absolute lg:inset-y-0 border-r border-white/10 bg-linear-to-br from-zinc-900/50 to-black/50">
                    {/* Toolbar Overlay */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-white mb-1">{selectedChar}</h2>
                            <p className="text-xs text-zinc-500 font-mono">
                                {selectedChar.startsWith('U+') ? selectedChar : `U+${selectedChar.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode(m => m === 'solid' ? 'outline' : 'solid')}
                                className="p-2 bg-black/50 hover:bg-white/10 rounded-lg backdrop-blur-md border border-white/5 transition-colors"
                                title="Toggle View"
                            >
                                <BoxSelect size={18} className={viewMode === 'outline' ? 'text-white' : 'text-zinc-500'} />
                            </button>
                        </div>
                    </div>

                    {/* Render Canvas */}
                    <div ref={containerRef} className="w-full h-full cursor-crosshair">
                        <canvas ref={canvasRef} className="block w-full h-full" />
                    </div>
                </div>

                {/* Right: Grid */}
                <div className="lg:w-1/2 p-6 md:p-8 bg-zinc-950/30">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                            <button onClick={() => setSetMode('basic')} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", setMode === 'basic' ? "bg-white text-black" : "text-zinc-500 hover:text-white")}>Basic</button>
                            <button onClick={() => setSetMode('full')} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", setMode === 'full' ? "bg-white text-black" : "text-zinc-500 hover:text-white")}>All Glyphs</button>
                        </div>

                        {variants.length > 0 && (
                            <div className="relative">
                                <select
                                    value={activeVariant?.name || 'Regular'}
                                    onChange={(e) => {
                                        const v = variants.find(v => v.name === e.target.value);
                                        if (v) setActiveVariant(v);
                                    }}
                                    className="appearance-none pl-3 pr-8 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 focus:outline-none focus:border-white/20 hover:text-white"
                                >
                                    {variants.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                                    {!variants.length && <option>Regular</option>}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {setMode === 'basic' ? (
                            <CategoryView
                                fontFamily={fontFamily}
                                basicUppercase={basicUppercase}
                                basicLowercase={basicLowercase}
                                basicNumerals={basicNumerals}
                                selectedChar={selectedChar}
                                setSelectedChar={setSelectedChar}
                            />
                        ) : (
                            <div className="space-y-4">
                                <div className="w-full overflow-hidden">
                                    <select
                                        value={selectedRange.name}
                                        onChange={(e) => {
                                            const range = RANGES.find(r => r.name === e.target.value);
                                            if (range) setSelectedRange(range);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-white/30"
                                    >
                                        {RANGES.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                    </select>
                                </div>

                                {isScanning ? (
                                    <div className="py-12 text-center text-zinc-500 animate-pulse">Scanning font glyphs...</div>
                                ) : (
                                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                                        {availableGlyphs.map(char => (
                                            <GlyphButton
                                                key={char}
                                                char={char}
                                                fontFamily={fontFamily}
                                                isSelected={selectedChar === char}
                                                onClick={() => setSelectedChar(char)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CategoryView({ fontFamily, basicUppercase, basicLowercase, basicNumerals, selectedChar, setSelectedChar }: any) {
    return (
        <div className="space-y-8">
            <Section title="Uppercase" chars={basicUppercase} fontFamily={fontFamily} selectedChar={selectedChar} onSelect={setSelectedChar} />
            <Section title="Lowercase" chars={basicLowercase} fontFamily={fontFamily} selectedChar={selectedChar} onSelect={setSelectedChar} />
            <Section title="Numerals" chars={basicNumerals} fontFamily={fontFamily} selectedChar={selectedChar} onSelect={setSelectedChar} />
        </div>
    );
}

function Section({ title, chars, fontFamily, selectedChar, onSelect }: any) {
    return (
        <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{title}</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                {chars.map((char: string) => (
                    <GlyphButton
                        key={char}
                        char={char}
                        fontFamily={fontFamily}
                        isSelected={selectedChar === char}
                        onClick={() => onSelect(char)}
                    />
                ))}
            </div>
        </div>
    )
}

function GlyphButton({ char, fontFamily, isSelected, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "aspect-square flex items-center justify-center rounded-lg transition-all duration-200",
                isSelected
                    ? "bg-white text-black shadow-lg scale-110 z-10"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            )}
        >
            <span style={{ fontFamily: `"${fontFamily}"` }} className="text-xl md:text-2xl">{char}</span>
        </button>
    )
}
