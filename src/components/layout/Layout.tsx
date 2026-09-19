import { memo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { AnimatePresence, motion } from 'framer-motion';
// import ProgressiveBlur from '../ui/ProgressiveBlur';

const Layout = memo(function Layout() {
    const location = useLocation();
    return (
        <div className="app-container flex flex-col min-h-screen px-2 md:px-0 bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] antialiased selection:bg-[rgb(var(--color-foreground))] selection:text-[rgb(var(--color-background))] overflow-x-hidden">

            {/* Progressive Blur Effects */}
            {/* <ProgressiveBlur position="top" height="150px" zIndex={45} />
            <ProgressiveBlur position="bottom" height="120px" zIndex={45} /> */}

            {/* Global background noise or effects can go here */}
            {/* <div className="fixed inset-0 bg-[url('/noise/2.png')] bg-cover bg-no-repeat bg-center opacity-[0.2] pointer-events-none zmix-blend-overlay z-60" /> */}

            {/* Accessibility: Skip to main content bypass link */}
            {/* <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-5 focus:py-2.5 focus:bg-[rgb(var(--color-foreground))] focus:text-[rgb(var(--color-background))] focus:rounded-2xl focus:shadow-2xl focus:font-bold focus:outline-none"
            >
                Skip to content
            </a> */}

            <Navbar />
            <main id="main-content" tabIndex={-1} className="grow pt-24 pb-34 max-w-480 mx-auto w-full focus:outline-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
            <Footer />
        </div>
    );
});

export default Layout;
