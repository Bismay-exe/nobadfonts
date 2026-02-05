import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import Red from '/logo/logo-red.png';

export default function Navbar() {
    const { user, profile } = useAuth();
    const [open, setOpen] = useState(false);

    return (
        <nav className="w-full bg-red-500 border-y-2 border-black rounded-3xl p-3">
            <div className="flex justify-between items-center">
                <Link
                    to="/"
                    className="h-10 w-10 flex items-center gap-2 font-black bg-black p-1.5 rounded-xl text-[#000000] text-2xl tracking-tighter"
                >

                    <img src={Red} alt="Logo" className='mr-2' />NoBadFonts
                </Link>

                {/* Mobile menu button */}
                <button
                    onClick={() => setOpen(!open)}
                    className="md:hidden border-2 border-black bg-[#000000] text-white rounded-full px-6 py-2 font-bold"
                    aria-label="Toggle menu"
                >
                    ☰
                </button>

                {/* Desktop menu */}
                <div className="hidden md:flex md:space-x-4 items-center">
                    <NavLinks user={user} profile={profile} />
                </div>
            </div>

            {/* Mobile menu with animation */}
            <div
                className={`
                md:hidden
                overflow-hidden
                transition-all
                duration-400
                ease-linear
                ${open ? 'max-h-96 opacity-100 translate-x-0 mt-4' : 'max-h-0 opacity-90 scale-0 -translate-x-60'}
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
        'border border-black px-4 py-1 font-mono uppercase font-bold rounded-full bg-red-500 hover:bg-black hover:text-white transition-colors';

    return (
        <div className="flex flex-col md:flex-row justify-between items-end gap-2">
            <Link to="/fonts" onClick={onClick} className={base}>
                Fonts
            </Link>
            <Link to="/pairing" onClick={onClick} className={base}>
                Pairing
            </Link>
            <Link to="/members" onClick={onClick} className={base}>
                Members
            </Link>

            {profile?.role === 'admin' && (
                <Link to="/admin" onClick={onClick} className="border-2 border-black px-4 py-1 font-bold rounded-full bg-[#FF90E8] text-black hover:bg-black hover:text-[#FF90E8] transition-colors">
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
