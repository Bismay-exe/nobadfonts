import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Small delay for smooth entry after initial page load
            const timer = setTimeout(() => setIsVisible(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('cookie_consent', 'all');
        setIsVisible(false);
    };

    const handleAcceptEssential = () => {
        localStorage.setItem('cookie_consent', 'essential');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 pointer-events-auto"
                >
                    <div className="bg-background/85 dark:bg-card-background/60 backdrop-blur-2xl border border-border rounded-3xl p-5 md:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] text-foreground flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground">
                                    <Cookie size={18} />
                                </div>
                                <h3 className="font-bold text-sm tracking-tight text-foreground">
                                    Cookie & Privacy Choices
                                </h3>
                            </div>
                            <button
                                onClick={handleAcceptEssential}
                                className="text-muted hover:text-foreground transition-colors duration-300 ease-in-out p-1"
                                aria-label="Dismiss cookie notice"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p className="text-xs text-muted leading-relaxed">
                            We use cookies and local storage to keep you authenticated, remember your theme preferences, and maintain anonymous download metrics. Read our{' '}
                            <Link to="/legal/cookies" className="underline hover:text-foreground transition-colors duration-300 ease-in-out">
                                Cookie Policy
                            </Link>{' '}
                            and{' '}
                            <Link to="/legal/privacy" className="underline hover:text-foreground transition-colors duration-300 ease-in-out">
                                Privacy Policy
                            </Link>.
                        </p>

                        <div className="flex items-center gap-2.5 pt-1">
                            <button
                                onClick={handleAcceptAll}
                                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:opacity-90 transition-opacity active:scale-[0.98]"
                            >
                                Accept All
                            </button>
                            <button
                                onClick={handleAcceptEssential}
                                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-foreground/5 border border-border text-foreground hover:bg-foreground/10 transition-colors duration-300 ease-in-out active:scale-[0.98]"
                            >
                                Essential Only
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
