import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import Logo from '/logo/logo.png';

export default function Navbar() {
    const { user, profile } = useAuth();
    const [open, setOpen] = useState(false);

    return (
        <nav className="w-full bg-[#EEEFEB] border-y border-[#1C1D1E] rounded-4xl p-3">
            <div className="flex justify-between items-center">
                <Link
                    to="/"
                    className="h-15 w-15 flex items-center gap-2 bg-[#1C1D1E] p-1.5 rounded-2xl"
                >

                    <img src={Logo} alt="Logo" className='mr-2' />
                    <span className='h-full font-moldin font-medium uppercase text-[#1C1D1E] text-3xl lg:text-5xl mt-3'>NoBadFonts</span>
                </Link>

                {/* Mobile menu button */}
                <button
                    onClick={() => setOpen(!open)}
                    className="lg:hidden border-2 border-[#1C1D1E] bg-[#1C1D1E] text-[#EEEFEB] rounded-full px-6 py-4 font-bold"
                    aria-label="Toggle menu"
                >
                    ☰
                </button>

                {/* Desktop menu */}
                <div className="hidden lg:flex lg:space-x-4 items-center">
                    <NavLinks user={user} profile={profile} />
                </div>
            </div>

            {/* Mobile menu with animation */}
            <div
                className={`
                lg:hidden
                overflow-hidden
                transition-all
                duration-400
                ease-linear
                ${open ? 'max-h-100 opacity-100 translate-x-0 mt-4' : 'max-h-0 opacity-90 scale-0 -translate-x-60'}
                `}
            >
                <NavLinks user={user} profile={profile} onClick={() => setOpen(false)} />
            </div>
        </nav>
    );
}

function NavLinks({
    user,
    profile,
    onClick,
}: {
    user: any;
    profile: any;
    onClick?: () => void;
}) {
    const base =
        'relative border border-[#1C1D1E] px-6 lg:px-8 py-3 lg:py-4 font-mono uppercase font-bold rounded-full bg-[#1C1D1E] hover:bg-[#1C1D1E] text-[#EEEFEB] hover:text-[#EEEFEB] transition-colors';

    return (
        <div className="flex flex-col lg:flex-row justify-between items-end gap-2">
            <Link to="/fonts" onClick={onClick} className={base}>
                Fonts
            </Link>
            <Link to="/pairing" onClick={onClick} className={base}>
                Pairing
            </Link>
            <Link to="/cli" onClick={onClick} className={`${base} relative group overflow-visible`}>
                <div className="absolute -top-2 -left-2 lg:left-auto right-auto lg:-right-2 bg-[#BDF522] text-[#1C1D1E] text-[14px] px-2.5 py-0.5 rounded-full border border-[#1C1D1E] font-[#1C1D1E] animate-bounce">
                    NEW
                </div>
                CLI
            </Link>
            <Link to="/members" onClick={onClick} className={base}>
                Members
            </Link>

            {profile?.role === 'admin' && (
                <Link to="/admin" onClick={onClick} className="border border-[#1C1D1E]/40 px-6 lg:px-8 py-3 lg:py-4 uppercase font-mono font-bold rounded-full bg-[#FF90E8] text-[#1C1D1E] hover:bg-[#1C1D1E] hover:text-[#FF90E8] transition-colors">
                    Admin Panel
                </Link>
            )}

            {user ? (
                <>
                    <Link to="/upload" onClick={onClick} className={base}>
                        Upload Font
                    </Link>
                    <Link to="/profile" onClick={onClick} className={base}>
                        Profile
                    </Link>
                </>
            ) : (
                <Link to="/auth" onClick={onClick} className={base}>
                    Login
                </Link>
            )}
        </div>
    );
}
