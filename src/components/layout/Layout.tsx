import { memo } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
// import ProgressiveBlur from '../ui/ProgressiveBlur';

const Layout = memo(function Layout() {
    return (
        <div className="app-container flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background overflow-x-hidden">

            {/* Progressive Blur Effects */}
            {/* <ProgressiveBlur position="top" height="150px" zIndex={45} />
            <ProgressiveBlur position="bottom" height="120px" zIndex={45} /> */}

            {/* Global background noise or effects can go here */}
            {/* <div className="fixed inset-0 bg-[url('/noise/2.png')] bg-cover bg-no-repeat bg-center opacity-[0.2] pointer-events-none zmix-blend-overlay z-60" /> */}

            {/* Accessibility: Skip to main content bypass link */}
            {/* <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-5 focus:py-2.5 focus:bg-foreground focus:text-background focus:rounded-2xl focus:shadow-2xl focus:font-bold focus:outline-none"
            >
                Skip to content
            </a> */}

            <Navbar />
            <main id="main-content" tabIndex={-1} className="grow zmax-w-480 zmx-auto w-full focus:outline-none">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
});

export default Layout;
