export default function Footer() {
    return (
        <footer className="w-full flex justify-between items-center p-4 border-t border-[#1C1D1E] bg-[#EEEFEB] rounded-t-4xl">
            <div className="w-full flex justify-center md:justify-between gap-1 text-center text-[#1C1D1E]">
                <span>&copy; {new Date().getFullYear()} NoBadFonts.</span> 
                <span>All rights reserved.</span>
            </div>
        </footer>
    );
}
