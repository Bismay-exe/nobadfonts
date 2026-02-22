import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { AnimatePresence, motion } from 'framer-motion';

export default function Layout() {
    return (
        <div className="flex flex-col min-h-screen px-4 md:px-8 bg-black text-foreground antialiased selection:bg-white selection:text-black overflow-x-hidden">

            {/* Global background noise or effects can go here */}
            <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay z-[60]" />

            <Navbar />
            <main className="grow pt-24 pb-10 max-w-480 mx-auto w-full relative">
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
}
