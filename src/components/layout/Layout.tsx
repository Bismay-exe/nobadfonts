import { useEffect } from 'react';
import { Outlet, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Robust check using window.location to catch everything
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const error = params.get('error') || hashParams.get('error');
        const errorDescription = params.get('error_description') || hashParams.get('error_description');

        if (error || errorDescription) {
            const message = errorDescription || error || 'An authentication error occurred';

            // formatting the message for better readability
            const formattedMessage = message.replace(/\+/g, ' ').replace(/%20/g, ' ');

            // Clean URL immediately
            window.history.replaceState({}, document.title, window.location.pathname);

            // Show alert after clearing URL (setTimeout to let UI update)
            setTimeout(() => {
                alert(`Authentication Error: ${formattedMessage}`);
            }, 100);
        }
    }, [location]);

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
