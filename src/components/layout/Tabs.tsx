import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomBell, CustomBook, CustomHome, CustomSettings, CustomShield } from '../ui/CustomIcons';

// --- Main Tabs Component ---

const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: CustomHome },
    { id: 'notifications', label: 'Notifications', icon: CustomBell },
    { id: 'settings', label: 'Settings', icon: CustomSettings },
    { id: 'changelog', label: 'Changelog', icon: CustomBook },
    { id: 'security', label: 'Security', icon: CustomShield },
];

export default function Tabs() {
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    return (
        <div className="absolute top-0 bottom-0 left-0 w-screen bg-black flex items-center justify-center font-sans z-90">

            {/* Main Widget Container */}
            <div className="w-screen bg-[#0c0c0c] border border-zinc-800/50 rounded-3xl p-4 flex flex-col shadow-2xl relative overflow-hidden">

                {/* Bottom Navigation Bar */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;

                        return (
                            <motion.button
                                key={tab.id}
                                layout // Smoothly adjusts the surrounding buttons when width changes
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center h-10 rounded-full transition-all duration-300 ease-in-out ${isActive
                                    ? 'bg-white/10 text-white px-4' // Active tab gets background and wider padding
                                    : 'bg-transparent text-zinc-500 hover:text-zinc-300 px-3'
                                    }`}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                {/* Fixed Icon */}
                                <tab.icon className="shrink-0" />

                                {/* Animating Text */}
                                <AnimatePresence initial={false}>
                                    {isActive && (
                                        <motion.span
                                            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                                            animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                                            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                                            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                                            className="font-medium text-sm overflow-hidden whitespace-nowrap"
                                        >
                                            {tab.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}