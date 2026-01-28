import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function Navbar() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    return (
        <nav className="w-full bg-[#7B46F8] border-y-2 border-black rounded-3xl p-4">
            <div className="flex justify-between items-center">
                <Link
                    to="/"
                    className="font-black text-2xl uppercase tracking-tighter"
                >
                    Fontique
                </Link>

                {/* Mobile menu button */}
                <button
                    onClick={() => setOpen(!open)}
                    className="md:hidden border-2 border-black bg-[#BDF522] rounded-full px-6 py-2 font-bold"
                    aria-label="Toggle menu"
                >
                    ☰
                </button>

                {/* Desktop menu */}
                <div className="hidden md:flex md:space-x-4 items-center">
                    <NavLinks user={user} />
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
                <NavLinks user={user} onClick={() => setOpen(false)} />
            </div>
        </nav>
    );
}

function NavLinks({
    user,
    onClick,
}: {
    user: any;
    onClick?: () => void;
}) {
    const base =
        'border-2 border-black px-4 py-1 font-bold rounded-full bg-white hover:bg-black hover:text-white transition-colors';

    return (
        <div className="flex flex-col-reverse md:flex-row justify-between items-end gap-2">
            <Link to="/fonts" onClick={onClick} className={base}>
                Fonts
            </Link>

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
