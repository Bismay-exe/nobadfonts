import React from 'react';

export const CustomAa = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    {/* Uppercase A */}
    <path d="M10.83 5.26a2.25 2.25 0 0 0-4.16 0L2.12 17.5a.75.75 0 0 0 1.38.58l1.6-3.83h7.3l1.6 3.83a.75.75 0 0 0 1.38-.58L10.83 5.26ZM6.52 12.75l2.23-5.35h.02l2.23 5.35H6.52Z" />
    {/* Lowercase a */}
    <path d="M21.5 15.25c0-1.8-1.5-2.75-3.5-2.75-1.42 0-2.6.45-3.23.96a.75.75 0 0 0 .96 1.18c.45-.35 1.28-.64 2.27-.64 1.13 0 2 .46 2 1.25v.17c-.77-.16-1.74-.22-2.75-.02-1.5.3-2.5 1.3-2.5 2.6 0 1.35 1.15 2.5 2.75 2.5 1.23 0 2.1-.56 2.5-1.14v.39a.75.75 0 0 0 1.5 0v-4.47Zm-1.5 1.63c0 .82-.78 1.62-1.75 1.62-.8 0-1.25-.5-1.25-1.1 0-.64.55-1.1 1.5-1.28.63-.12 1.14-.11 1.5-.06v.82Z" />
  </svg>
);

export const CustomSerifA = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M14.53 3.68a2 2 0 0 0-3.56 0L4.14 17.43a1 1 0 0 0 .91 1.44h2.5a1 1 0 0 0 .94-.66L9.63 15h6.24l1.14 3.21a1 1 0 0 0 .94.66h2.5a1 1 0 0 0 .91-1.44L14.53 3.68ZM10.35 13l2.4-6.75h.02L15.15 13h-4.8Z" />
  </svg>
);

export const CustomGlyphBox = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M4 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Zm6.28 5.46a1 1 0 0 1 1.44 0l4 4.5a1 1 0 0 1-1.5 1.34L13 12.96v4.54a1 1 0 1 1-2 0v-4.54l-1.22 1.34a1 1 0 0 1-1.5-1.34l4-4.5Z" />
    <path d="M12.5 7a1 1 0 0 0-1-1h-3a1 1 0 1 0 0 2h3a1 1 0 0 0 1-1ZM16.5 7a1 1 0 0 0-1-1h-1a1 1 0 1 0 0 2h1a1 1 0 0 0 1-1ZM7.5 17a1 1 0 0 0 1 1h7a1 1 0 1 0 0-2h-7a1 1 0 0 0-1 1Z" />
  </svg>
);

export const CustomHome = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.99 8.99a.75.75 0 1 1-1.06 1.06L20 13.432V20a2 2 0 0 1-2 2h-4v-5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5H6a2 2 0 0 1-2-2v-6.568l-.46.46a.75.75 0 0 1-1.06-1.06l8.99-8.99Z" />
    </svg>
);

export const CustomBell = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
);

export const CustomSettings = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        {/* Top Track & Knob */}
        <path d="M3 8C3 7.44772 3.44772 7 4 7H20C20.5523 7 21 7.44772 21 8C21 8.55228 20.5523 9 20 9H4C3.44772 9 3 8.55228 3 8Z" />
        <circle cx="8" cy="8" r="3" />
        {/* Bottom Track & Knob */}
        <path d="M3 16C3 15.4477 3.44772 15 4 15H20C20.5523 15 21 15.4477 21 16C21 16.5523 20.5523 17 20 17H4C3.44772 17 3 16.5523 3 16Z" />
        <circle cx="16" cy="16" r="3" />
    </svg>
);

export const CustomBook = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3c-1.096 0-2.139.18-3.125.512V18.43a1.44 1.44 0 0 1 1.05-.28 9.707 9.707 0 0 1 7.325 3.38v-17zM12.75 4.533v17a9.707 9.707 0 0 1 7.325-3.38c.37-.03.73.06 1.05.28V3.512A9.684 9.684 0 0 0 18 3c-1.966 0-3.8.58-5.25 1.533z" />
    </svg>
);

export const CustomShield = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path d="M11.5 2.25c.3-.15.65-.15.95 0l8.5 4A1 1 0 0 1 21.5 7v5.5c0 5.4-4.5 10.1-9.5 11.5-5-1.4-9.5-6.1-9.5-11.5V7a1 1 0 0 1 .55-.9l8.5-4Z" />
    </svg>
);

// A thick, solid 'T' to represent Fonts/Typography
export const CustomType = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path d="M19.5 4h-15a1.5 1.5 0 0 0 0 3h6v12a1.5 1.5 0 0 0 3 0V7h6a1.5 1.5 0 0 0 0-3Z" />
    </svg>
);

// A circle and a rounded square sitting together to represent Pairing/Combining
export const CustomCombine = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <circle cx="8" cy="12" r="6" />
        <rect x="12" y="6" width="10" height="12" rx="3" />
    </svg>
);

// A solid terminal window with a cutout prompt (>) and cursor (_)
export const CustomTerminal = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path fillRule="evenodd" d="M2.25 6a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V6Zm3.97.97a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Zm4.28 4.28a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
    </svg>
);

// A solid terminal window with a cutout prompt (>) and cursor (_)
export const CustomTerminal2 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path fill-rule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm14.25 6a.75.75 0 0 1-.22.53l-2.25 2.25a.75.75 0 1 1-1.06-1.06L15.44 12l-1.72-1.72a.75.75 0 1 1 1.06-1.06l2.25 2.25c.141.14.22.331.22.53Zm-10.28-.53a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 1 0 1.06-1.06L8.56 12l1.72-1.72a.75.75 0 1 0-1.06-1.06l-2.25 2.25Z" clip-rule="evenodd" />
    </svg>
);

// Two solid silhouettes for Members
export const CustomUsers = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
    </svg>
);

// A solid cloud with an upload arrow
export const CustomUpload = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path d="M11.47 1.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06l-1.72-1.72V7.5h-1.5V4.06L9.53 5.78a.75.75 0 0 1-1.06-1.06l3-3ZM11.25 7.5V15a.75.75 0 0 0 1.5 0V7.5h3.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h3.75Z" />
    </svg>
);

export const CustomLock = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clip-rule="evenodd" />
    </svg>
);

export const CustomClipboard = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path d="M16.5 6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3v-6A4.5 4.5 0 0 1 10.5 6h6Z" />
        <path d="M18 7.5a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-7.5a3 3 0 0 1-3-3v-7.5a3 3 0 0 1 3-3H18Z" />
    </svg>
);

export const CustomClipboardCheck = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path fill-rule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z" clip-rule="evenodd" />
        <path fill-rule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375Zm9.586 4.594a.75.75 0 0 0-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 0 0-1.06 1.06l1.5 1.5a.75.75 0 0 0 1.116-.062l3-3.75Z" clip-rule="evenodd" />
    </svg>
);

export const Custom = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
        <path fill-rule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z" clip-rule="evenodd" />
        <path fill-rule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375Zm9.586 4.594a.75.75 0 0 0-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 0 0-1.06 1.06l1.5 1.5a.75.75 0 0 0 1.116-.062l3-3.75Z" clip-rule="evenodd" />
    </svg>
);