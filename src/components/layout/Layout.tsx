import { memo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { AnimatePresence, motion } from 'framer-motion';
import ProgressiveBlur from '../ui/ProgressiveBlur';

const Layout = memo(function Layout() {
    const location = useLocation();
    return (
        <div className="app-container flex flex-col min-h-screen px-4 md:px-8 bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] antialiased selection:bg-[rgb(var(--color-foreground))] selection:text-[rgb(var(--color-background))] overflow-x-hidden">

            {/* Progressive Blur Effects */}
            <ProgressiveBlur position="top" height="100px" zIndex={45} />
            <ProgressiveBlur position="bottom" height="120px" zIndex={45} />

            {/* Global background noise or effects can go here */}
            <div className="fixed inset-0 xbg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay z-[60]" />

            <Navbar />
            <main className="grow pt-24 pb-34 max-w-480 mx-auto w-full relative">
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
