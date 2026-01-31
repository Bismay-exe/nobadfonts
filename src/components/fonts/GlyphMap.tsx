import { useState, useMemo, useEffect, useRef } from 'react';
import opentype from 'opentype.js';

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
    const [selectedChar, setSelectedChar] = useState<string>('Y');

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
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) { setAvailableGlyphs(rangeChars); setIsScanning(false); return; }

            const supported: string[] = [];
            const baselineFont = 'monospace';
            const testFont = `"${fontFamily}", ${baselineFont}`;
            context.font = `72px ${baselineFont}`;
            const baselineWidths = rangeChars.map(char => context.measureText(char).width);
            context.font = `72px ${testFont}`;

            rangeChars.forEach((char, i) => {
                if (context.measureText(char).width !== baselineWidths[i] || char === ' ') supported.push(char);
            });
            setAvailableGlyphs(supported);
            setIsScanning(false);
        };
        checkSupport();
    }, [setMode, rangeChars, fontFamily]);

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

            // Get precise typographic metrics
            // OS/2 table is usually the most accurate for these values
            const capHeight = os2?.sCapHeight || (fontObject.charToGlyph('H').getBoundingBox().y2);
            const xHeight = os2?.sxHeight || (fontObject.charToGlyph('x').getBoundingBox().y2);
            const descender = hhea?.descender || fontObject.descender;

            // Calculate Metrics
            // Normalize to display size
            // Let's set a target font size based on container
            const displayFontSize = Math.min(width, height) * 0.6;
            const scale = displayFontSize / unitsPerEm;

            // Coordinates
            const baselineY = height * 0.70;
            const centerX = width / 2;

            const scaledCapHeight = capHeight * scale;
            const scaledXHeight = xHeight * scale;
            const scaledDescender = descender * scale; // usually negative


            // Draw Guidelines function
            const drawLine = (y: number, label: string, value: number, isDashed = false) => {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                if (isDashed) ctx.setLineDash([4, 4]);
                else ctx.setLineDash([]);
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '12px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(label, 10, y - 6);

                ctx.textAlign = 'right';
                ctx.fillText(Math.round(value).toString(), width - 10, y - 6);
            };

            // Draw Lines
            drawLine(baselineY, 'Baseline', 0);
            drawLine(baselineY - scaledCapHeight, 'Cap Height', capHeight);
            drawLine(baselineY - scaledXHeight, 'X-Height', xHeight, true);
            drawLine(baselineY - scaledDescender, 'Descender', descender);

            // Get Glyph Path
            const glyph = fontObject.charToGlyph(selectedChar);
            const path = glyph.getPath(0, 0, displayFontSize); // we'll translate it later

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
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
                path.fill = null;
                path.stroke = 'rgba(255,255,255,0.5)';
                path.strokeWidth = 1;
                path.draw(ctx);

                // Draw Bézier Points and Handles
                // Iterate through commands
                let startX = 0;
                let startY = 0;

                glyph.path.commands.forEach(cmd => {
                    ctx.beginPath();
                    if (cmd.type === 'M') {
                        startX = cmd.x * scale;
                        startY = -cmd.y * scale; // Flip Y for canvas
                        // Draw Point (On-Curve)
                        ctx.fillStyle = 'white';
                        ctx.arc(startX, startY, 3, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (cmd.type === 'L') {
                        const x = cmd.x * scale;
                        const y = -cmd.y * scale;
                        // Draw Point (On-Curve)
                        ctx.fillStyle = 'white';
                        ctx.arc(x, y, 3, 0, Math.PI * 2); // Square or Circle? Image showed square-ish dots for on-curve
                        ctx.fillRect(x - 2, y - 2, 4, 4); // Let's use squares for on-curve points like standard vector tools
                        startX = x;
                        startY = y;
                    } else if (cmd.type === 'Q') {
                        const x1 = cmd.x1 * scale;
                        const y1 = -cmd.y1 * scale;
                        const x = cmd.x * scale;
                        const y = -cmd.y * scale;

                        // Draw Handle Lines
                        ctx.strokeStyle = '#666';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(x1, y1);
                        ctx.lineTo(x, y);
                        ctx.stroke();

                        // Draw Control Point (Off-Curve)
                        ctx.fillStyle = '#666'; // Grey for control points
                        ctx.beginPath();
                        ctx.arc(x1, y1, 2, 0, Math.PI * 2);
                        ctx.fill();

                        // Draw End Point (On-Curve)
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x - 2, y - 2, 4, 4);

                        startX = x;
                        startY = y;
                    } else if (cmd.type === 'C') {
                        const x1 = cmd.x1 * scale;
                        const y1 = -cmd.y1 * scale;
                        const x2 = cmd.x2 * scale;
                        const y2 = -cmd.y2 * scale;
                        const x = cmd.x * scale;
                        const y = -cmd.y * scale;

                        // Draw Handle Lines: Start -> C1, C2 -> End
                        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([]);

                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(x1, y1);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();

                        // Draw Control Points (Off-Curve) - Small Circles
                        ctx.fillStyle = 'white';
                        ctx.beginPath(); ctx.arc(x1, y1, 2, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x2, y2, 2, 0, Math.PI * 2); ctx.fill();

                        // Draw End Point (On-Curve) - Square
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x - 2.5, y - 2.5, 5, 5);

                        startX = x;
                        startY = y;
                    } else if (cmd.type === 'Z') {
                        // Close path
                    }
                });
            }

            // Reset Transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);

        };

        // Render immediately since we have font object
        render();

        const resizeObserver = new ResizeObserver(render);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();

        return () => resizeObserver.disconnect();

    }, [fontFamily, fontUrl, activeVariant, selectedChar, viewMode, fontObject]);


    return (
        <div className="w-full bg-[#0D0D0D] text-white mt-8 border border-white/10">

            <div className="lg:flex items-start relative">
                {/* Left: sticky ONLY inside this section */}
                <div
                    ref={containerRef}
                    className="
                        max-h-[50vh] md:min-h-screen
                        lg:w-1/2
                        lg:sticky
                        lg:top-0
                        self-start
                        bg-[#0D0D0D]
                        border-r border-white/10
                    "
                >
                    {/* Toolbar */}
                    <div className="relative z-20 flex flex-wrap justify-between border-b border-white/10 px-8 py-6 bg-[#0D0D0D]">
                        <div className="flex items-center gap-6">
                            <h2 className="text-xl font-bold tracking-tight">{setMode === 'basic' ? 'Basic Set' : `${availableGlyphs.length} Glyphs`}</h2>
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                                <span>{selectedChar ? selectedChar.startsWith('U+') ? selectedChar : `U+${selectedChar.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}` : ''}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 mt-4 md:mt-0">
                            {/* Variant Selector (if variants exist) */}
                            {variants.length > 0 && (
                                <div className="border-r border-white/10 pr-8">
                                    <select
                                        value={activeVariant?.name || (variants.some(v => v.url === fontUrl) ? variants.find(v => v.url === fontUrl)?.name : 'Regular')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'Regular') setActiveVariant(null);
                                            else {
                                                const v = variants.find(v => v.name === val);
                                                if (v) setActiveVariant(v);
                                            }
                                        }}
                                        className="bg-[#1A1A1A] border border-white/20 text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:border-white cursor-pointer"
                                    >
                                        {!variants.some(v => v.url === fontUrl) && <option value="Regular">Regular</option>}
                                        {variants.map(v => (
                                            <option key={v.name} value={v.name}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* View Toggle */}
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
                                <button
                                    onClick={() => setViewMode('solid')}
                                    className={`transition-colors hover:text-white ${viewMode === 'solid' ? 'text-white' : ''}`}
                                >
                                    Solid
                                </button>
                                <button
                                    onClick={() => setViewMode('outline')}
                                    className={`transition-colors hover:text-white ${viewMode === 'outline' ? 'text-white' : ''}`}
                                >
                                    Outlines
                                </button>
                            </div>

                            {/* Set Toggle */}
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-400 border-l border-white/10 pl-8">
                                <button
                                    onClick={() => setSetMode('basic')}
                                    className={`transition-colors hover:text-white ${setMode === 'basic' ? 'text-white' : ''}`}
                                >
                                    Basic Set
                                </button>
                                <button
                                    onClick={() => setSetMode('full')}
                                    className={`transition-colors hover:text-white ${setMode === 'full' ? 'text-white' : ''}`}
                                >
                                    Full Set
                                </button>
                            </div>
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        className="w-full block -mt-20"
                    />
                </div>

                {/* Right: must be taller than viewport */}
                <div className="lg:w-1/2 p-8 pb-32">

                    {setMode === 'basic' ? (
                        <div className="space-y-12">
                            {/* Uppercase */}
                            <div>
                                <h3 className="text-xs font-mono text-gray-500 uppercase mb-4 text-right">Uppercase</h3>
                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-px bg-white/10 border border-white/10">
                                    {basicUppercase.map(char => (
                                        <button
                                            key={char}
                                            onClick={() => setSelectedChar(char)}
                                            className={`aspect-square flex items-center justify-center bg-[#0D0D0D] hover:bg-white/5 transition-colors ${selectedChar === char ? 'ring-1 ring-white z-10' : ''}`}
                                        >
                                            <span style={{ fontFamily: `"${fontFamily}"` }} className="text-2xl">{char}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Lowercase */}
                            <div>
                                <h3 className="text-xs font-mono text-gray-500 uppercase mb-4 text-right">Lowercase</h3>
                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-px bg-white/10 border border-white/10">
                                    {basicLowercase.map(char => (
                                        <button
                                            key={char}
                                            onClick={() => setSelectedChar(char)}
                                            className={`aspect-square flex items-center justify-center bg-[#0D0D0D] hover:bg-white/5 transition-colors ${selectedChar === char ? 'ring-1 ring-white z-10' : ''}`}
                                        >
                                            <span style={{ fontFamily: `"${fontFamily}"` }} className="text-2xl">{char}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Numerals */}
                            <div>
                                <h3 className="text-xs font-mono text-gray-500 uppercase mb-4 text-right">Numerals</h3>
                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-px bg-white/10 border border-white/10">
                                    {basicNumerals.map(char => (
                                        <button
                                            key={char}
                                            onClick={() => setSelectedChar(char)}
                                            className={`aspect-square flex items-center justify-center bg-[#0D0D0D] hover:bg-white/5 transition-colors ${selectedChar === char ? 'ring-1 ring-white z-10' : ''}`}
                                        >
                                            <span style={{ fontFamily: `"${fontFamily}"` }} className="text-2xl">{char}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Filter Dropdown */}
                            <div className="flex justify-end">
                                <select
                                    value={selectedRange.name}
                                    onChange={(e) => {
                                        const range = RANGES.find(r => r.name === e.target.value);
                                        if (range) setSelectedRange(range);
                                    }}
                                    className="bg-[#1A1A1A] border border-white/20 text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:border-white"
                                >
                                    {RANGES.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>

                            {isScanning ? (
                                <div className="grid grid-cols-6 md:grid-cols-10 gap-2 opacity-50">Loading...</div>
                            ) : (
                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-px bg-white/10 border border-white/10">
                                    {availableGlyphs.length > 0 ? availableGlyphs.map(char => (
                                        <button
                                            key={char}
                                            onClick={() => setSelectedChar(char)}
                                            className={`aspect-square flex items-center justify-center bg-[#0D0D0D] hover:bg-white/5 transition-colors ${selectedChar === char ? 'ring-1 ring-white z-10' : ''}`}
                                        >
                                            <span style={{ fontFamily: `"${fontFamily}"` }} className="text-2xl">{char}</span>
                                        </button>
                                    )) : (
                                        <div className="col-span-full p-8 text-center text-gray-500">No glyphs found in this range.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
