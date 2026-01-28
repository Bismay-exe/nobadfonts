import { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Type, MoveVertical, MoveHorizontal } from 'lucide-react';
import type { Font } from '../../types/font';

interface FontTesterProps {
    font: Font;
}

export default function FontTester({ font }: FontTesterProps) {
    const [text, setText] = useState('The quick brown fox jumps over the lazy dog.');
    const [fontSize, setFontSize] = useState(48);
    const [lineHeight, setLineHeight] = useState(1.5);
    const [letterSpacing, setLetterSpacing] = useState(0);
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

    const fontName = `custom-font-${font.slug}`;

    // Dynamically load the font using a style tag
    useEffect(() => {
        if (!font) return;

        // Determine best URL to load
        // Order: ttf -> otf -> woff -> woff2
        const fontUrl = font.ttf_url || font.otf_url || font.woff_url || font.woff2_url;

        if (!fontUrl) return;

        const style = document.createElement('style');
        style.innerHTML = `
            @font-face {
                font-family: '${fontName}';
                src: url('${fontUrl}');
                font-display: swap;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, [font, fontName]);

    return (
        <div className="bg-white rounded-3xl border-2 border-black overflow-hidden">
            {/* Toolbar */}
            <div className="border-b border-gray-100 p-4 bg-gray-50 flex flex-wrap gap-6 items-center">

                {/* Font Size */}
                <div className="flex items-center space-x-2">
                    <Type size={18} className="text-gray-400" />
                    <input
                        type="range"
                        min="12"
                        max="128"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-32 accent-blue-600"
                    />
                    <span className="text-sm text-gray-600 w-8">{fontSize}px</span>
                </div>

                {/* Line Height */}
                <div className="flex items-center space-x-2">
                    <MoveVertical size={18} className="text-gray-400" />
                    <input
                        type="range"
                        min="0.8"
                        max="3"
                        step="0.1"
                        value={lineHeight}
                        onChange={(e) => setLineHeight(Number(e.target.value))}
                        className="w-24 accent-blue-600"
                    />
                </div>

                {/* Letter Spacing */}
                <div className="flex items-center space-x-2">
                    <MoveHorizontal size={18} className="text-gray-400" />
                    <input
                        type="range"
                        min="-5"
                        max="20"
                        value={letterSpacing}
                        onChange={(e) => setLetterSpacing(Number(e.target.value))}
                        className="w-24 accent-blue-600"
                    />
                </div>

                {/* Alignment */}
                <div className="flex items-center space-x-1 border-l border-gray-300 pl-6">
                    <button
                        onClick={() => setTextAlign('left')}
                        className={`p-2 rounded hover:bg-gray-200 ${textAlign === 'left' ? 'bg-gray-200 text-blue-600' : 'text-gray-500'}`}
                    >
                        <AlignLeft size={18} />
                    </button>
                    <button
                        onClick={() => setTextAlign('center')}
                        className={`p-2 rounded hover:bg-gray-200 ${textAlign === 'center' ? 'bg-gray-200 text-blue-600' : 'text-gray-500'}`}
                    >
                        <AlignCenter size={18} />
                    </button>
                    <button
                        onClick={() => setTextAlign('right')}
                        className={`p-2 rounded hover:bg-gray-200 ${textAlign === 'right' ? 'bg-gray-200 text-blue-600' : 'text-gray-500'}`}
                    >
                        <AlignRight size={18} />
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="p-8 min-h-75 flex items-center justify-center overflow-auto bg-white">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-full bg-transparent resize-none outline-none border-none text-gray-900 placeholder-gray-300 selection:bg-blue-100 selection:text-blue-900"
                    style={{
                        fontFamily: `"${fontName}", sans-serif`,
                        fontSize: `${fontSize}px`,
                        lineHeight: lineHeight,
                        letterSpacing: `${letterSpacing}px`,
                        textAlign: textAlign,
                    }}
                    spellCheck={false}
                />
            </div>
        </div>
    );
}
