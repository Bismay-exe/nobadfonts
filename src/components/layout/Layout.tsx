import { useEffect } from 'react';
import { Outlet, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Check for error in query params (standard OAuth errors)
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const errorHash = new URLSearchParams(location.hash.substring(1)).get('error_description');

        if (error || errorDescription || errorHash) {
            const message = errorDescription || errorHash || 'An authentication error occurred';
            alert(`Authentication Error: ${message.replace(/\+/g, ' ')}`);

            // Clear errors from URL without refreshing
            navigate(location.pathname, { replace: true });
        }
    }, [searchParams, location.hash, navigate, location.pathname]);

    return (
        <div className="flex flex-col min-h-screen w-full border-x-4 bg-black overflow-x-hidden">
            <Navbar />
            <main className="grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
