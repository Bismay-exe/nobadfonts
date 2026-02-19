
export default function Footer() {
    return (
        <footer className="w-full py-12 px-6 border-t border-white/5 bg-black relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-white/2 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-2">NoBadFonts.</h2>
                    <p className="text-zinc-500 text-sm">Curators of fine digital typography.</p>
                </div>

                <div className="flex gap-8 text-sm text-zinc-500">
                    <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    <a href="#" className="hover:text-white transition-colors">GitHub</a>
                    <a href="#" className="hover:text-white transition-colors">Discord</a>
                </div>

                <div className="text-zinc-600 text-xs text-center md:text-right">
                    <p>&copy; {new Date().getFullYear()} No Bad Fonts.</p>
                    <p>All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
