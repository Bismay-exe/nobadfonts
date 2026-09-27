"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { cn } from "../../lib/utils";
import {
    Type,
    Combine,
    Terminal,
    Users,
    Shield,
    Plus,
    Sun,
    Moon,
    Building,
    UserRound,
    BookOpen,
    Search,
    X,
    Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useUpdate } from "../../contexts/UpdateContext";
import { Download } from "lucide-react";
import Logo from "/logo/logo.png"; // Assuming white version exists or we filter it
import {
    CustomSerifA,
    CustomTerminal,
    CustomUpload,
    CustomUsers,
} from "../ui/CustomIcons";
import { Squircle } from "react-ios-corners";
import { useBag } from "../../contexts/BagContext";
import { DocsSearchModal } from "../docs/DocsSearchModal";

export default function Navbar() {
    const { user, profile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const {
        hasUpdate,
        isDownloading,
        progress,
        openModal,
        closeModal,
        isModalOpen,
    } = useUpdate();
    const { count: bagCount } = useBag();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Checks if path starts with '/docs/' and ensures it isn't just '/docs' or '/docs/'
    const inDocs = location.pathname.startsWith("/docs");
    // const isMobile = window.innerWidth < 768;

    // Local state for instantaneous UI updates so animations don't lag
    const [activeTab, setActiveTab] = useState(location.pathname);

    useEffect(() => {
        setActiveTab(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Global Cmd+K / Ctrl+K keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const navLinks = useMemo(
        () => [
            {
                name: "Fonts",
                path: "/fonts",
                icon: Type,
                svg: (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 15 15"
                    >
                        <path
                            fill="currentColor"
                            d="M12.499 2a.5.5 0 0 1 .001 1H8.692l-.287.854c-.216.643-.51 1.518-.824 2.444L7.344 7H8.5a.5.5 0 0 1 0 1H7.004c-.437 1.285-.84 2.462-1.046 3.04c-.322.899-.751 1.446-1.291 1.738c-.504.273-1.025.272-1.383.272H3.25a.55.55 0 1 1 0-1.1c.392 0 .653-.01.894-.14c.22-.119.511-.396.778-1.142c.185-.517.531-1.527.92-2.668H4.5a.5.5 0 0 1 0-1h1.682l.357-1.055c.313-.925.607-1.799.823-2.441L7.532 3H5c-.849 0-1.5.651-1.5 1.5a.5.5 0 0 1-1 0C2.5 3.099 3.599 2 5 2z"
                        />
                    </svg>
                ),
            },
            {
                name: "Pairing",
                path: "/pairing",
                icon: Combine,
                svg: (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="m19.467 8.694l.246-.566a4.36 4.36 0 0 1 2.22-2.25l.759-.339a.53.53 0 0 0 0-.963l-.717-.319a4.37 4.37 0 0 1-2.251-2.326l-.253-.611a.506.506 0 0 0-.942 0l-.253.61a4.37 4.37 0 0 1-2.25 2.327l-.718.32a.53.53 0 0 0 0 .962l.76.338a4.36 4.36 0 0 1 2.219 2.251l.246.566c.18.414.753.414.934 0M4.754 15h6.492l2 5H15.4L9 4H7L.6 20h2.154zM8 6.885L10.446 13H5.554zM21 12v.535a4 4 0 1 0 0 6.93V20h2v-8zm0 4a2 2 0 1 1-4 0a2 2 0 0 1 4 0"
                        />
                    </svg>
                ),
            },
            {
                name: "CLI",
                path: "/cli",
                icon: Terminal,
                svg: (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                    >
                        <g
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                        >
                            <path d="m4 5 7 7 -7 7" />
                            <path d="M14 19h7" />
                        </g>
                    </svg>
                ),
                badge: "NEW",
            },
            {
                name: "Docs",
                path: "/docs",
                icon: BookOpen,
                svg: (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 256 256"
                    >
                        <path
                            fill="currentColor"
                            d="m231.65 194.55l-33.19-157.8a16 16 0 0 0-19-12.39l-46.81 10.06a16.08 16.08 0 0 0-12.3 19l33.19 157.8A16 16 0 0 0 169.16 224a16.3 16.3 0 0 0 3.38-.36l46.81-10.06a16.09 16.09 0 0 0 12.3-19.03M136 50.15v-.09l46.8-10l3.33 15.87L139.33 66Zm6.62 31.47l46.82-10.05l3.34 15.9L146 97.53Zm6.64 31.57l46.82-10.06l13.3 63.24l-46.82 10.06ZM216 197.94l-46.8 10l-3.33-15.87l46.8-10.07l3.33 15.85zM104 32H56a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h48a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M56 48h48v16H56Zm0 32h48v96H56Zm48 128H56v-16h48z"
                        />
                    </svg>
                ),
            },
            {
                name: "Moods",
                path: "/moods",
                icon: BookOpen,
                svg: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                            <path d="M9 9h.01M15 9h.01"/>
                        </g>
                    </svg>
                ),
                badge: "NEW",
            },
            ...(profile?.role === "member" || profile?.role === "admin"
                ? [
                    {
                        name: "Members",
                        path: "/members",
                        icon: Users,
                        svg: (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                            >
                                <g
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                >
                                    <path d="M13 11a4 4 0 1 0-8 0a4 4 0 0 0 8 0" />
                                    <path d="M11.039 7.558a4 4 0 1 1 1.923 2.885M15 21a6 6 0 0 0-12 0" />
                                    <path d="M21 17a6 6 0 0 0-6-6" />
                                </g>
                            </svg>
                        ),
                    },
                ]
                : []),
        ],
        [profile?.role],
    );

    const mobileNavLinks = useMemo(
        () => [
            { name: "Fonts", path: "/fonts", icon: CustomSerifA },
            { name: "Pairing", path: "/pairing", icon: Combine },
            { name: "CLI", path: "/cli", icon: CustomTerminal, badge: "NEW" },
            { name: "Members", path: "/members", icon: CustomUsers },
            { name: "Upload", path: "/upload", icon: CustomUpload },
        ],
        [profile?.role],
    );

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 w-full left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
                    isScrolled
                        ? "max-w-full md:rounded-none bg-linear-to-b from-[rgb(var(--color-background))] via-[rgb(var(--color-background)/0.6)] to-[rgb(var(--color-background)/0)] py-2 md:py-4 px-6 md:px-10"
                        : "max-w-full md:rounded-none zbg-linear-to-b from-[rgb(var(--color-background))] via-[rgb(var(--color-background)/0.6)] to-[rgb(var(--color-background)/0)] py-2 md:py-4 px-6 md:px-10",
                    // : "md:top-4 max-w-7xl md:rounded-3xl bg-transparent border-none py-4 px-4"
                )}
            >
                <div className="flex items-center pt-[env(safe-area-inset-top)] md:pt-0">
                    <div className="max-w-480 w-full mx-auto flex items-center justify-between">
                        <div className="flex gap-10">
                            <div className="flex gap-4">
                                {inDocs && (
                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                        className="md:hidden relative h-10 w-10 flex items-center justify-center gap-1 rounded-xl bg-[rgb(var(--color-foreground)/0.05)] backdrop-blur-3xl text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-all  duration-300 ease-in-out cursor-pointer group"
                                        style={{ color: "rgb(var(--color-muted-foreground))" }}
                                        aria-label="Toggle docs navigation"
                                    >
                                        {mobileMenuOpen ? (
                                            <X className="w-4 h-4" />
                                        ) : (
                                            <Menu className="w-4 h-4" />
                                        )}
                                        {/* <span>{mobileMenuOpen ? 'Close Menu' : 'Documentation'}</span> */}
                                    </button>
                                )}
                                <Link
                                    to="/"
                                    onClick={async () => {
                                        await Haptics.impact({ style: ImpactStyle.Light });
                                    }}
                                    className={`items-center gap-2 group ${inDocs ? "hidde flex" : "flex"}`}
                                >
                                    <div
                                        className={`${inDocs ? "hidden sm:block" : ""} w-10 h-10 bg-[rgb(var(--color-foreground)/0.1)] rounded-xl group-hover:bg-[rgb(var(--color-foreground)/0.2)] transition-colors duration-300 ease-in-out backdrop-blur-sm border border-[rgb(var(--color-foreground)/0.05)]`}
                                    >
                                        <img
                                            src={Logo}
                                            alt="NoBadFonts Logo"
                                            className="rounded-xl object-cover"
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            `${inDocs ? "" : "hidden sm:block"}`,
                                            "font-advine text-3xl transition-all duration-300 ease-in-out",
                                            "text-[rgb(var(--color-foreground))]",
                                        )}
                                    >
                                        NoBadFonts
                                    </span>
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <div
                                className={cn(
                                    "hidden md:flex items-center gap-1 ",
                                    isScrolled ? "" : "",
                                )}
                            >
                                {navLinks.map((link) => {
                                    // const Icon = link.icon;
                                    const isActive = location.pathname === link.path;
                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            className={cn(
                                                "relative px-4 py-2 rounded-full text-sm font-inter-tight font-medium tracking-wider transition-all duration-200 flex items-center gap-2",
                                                isActive
                                                    ? "text-[rgb(var(--color-foreground))]"
                                                    : "text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]",
                                            )}
                                        >
                                            {/* <Icon size={16} className={isActive ? 'fill-current transition-all duration-1000z ease-in-out' : 'fill-current/0'} /> */}
                                            {link.svg}
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            {/* Update Download Icon */}
                            {hasUpdate && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        await Haptics.impact({ style: ImpactStyle.Light });
                                        isModalOpen ? closeModal() : openModal();
                                    }}
                                    className="relative h-10 w-10 flex items-center justify-center rounded-full bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border)/0.2)] text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-all cursor-pointer group"
                                    title="Software Update Available"
                                >
                                    {isDownloading && (
                                        <svg
                                            className="absolute inset-0 w-full h-full -rotate-90"
                                            viewBox="0 0 40 40"
                                        >
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="18"
                                                fill="none"
                                                stroke="rgb(var(--color-foreground) / 0.1)"
                                                strokeWidth="2"
                                            />
                                            <motion.circle
                                                cx="20"
                                                cy="20"
                                                r="18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeDasharray="113.1"
                                                initial={{ strokeDashoffset: 113.1 }}
                                                animate={{
                                                    strokeDashoffset: 113.1 - (113.1 * progress) / 100,
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    bounce: 0,
                                                    duration: 0.5,
                                                }}
                                            />
                                        </svg>
                                    )}
                                    <Download
                                        size={18}
                                        className={cn(
                                            "transition-transform duration-300 group-hover:-translate-y-0.5",
                                            isDownloading && "animate-pulse",
                                        )}
                                    />
                                    {!isDownloading && (
                                        <span className="absolute top-0 right-0 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                        </span>
                                    )}
                                </motion.button>
                            )}

                            {/* Theme Switcher */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => {
                                    await Haptics.impact({ style: ImpactStyle.Light });
                                    toggleTheme();
                                }}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-[rgb(var(--color-foreground)/0.05)] backdrop-blur-3xl text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-all cursor-pointer group"
                                title={`Switch Theme (Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)})`}
                            >
                                <div className="">
                                    {theme === "light" && (
                                        <Sun
                                            size={18}
                                            fill="black"
                                            className="transition-transform duration-700 group-hover:rotate-360 group-active:scale-90"
                                        />
                                    )}
                                    {theme === "dark" && (
                                        <Moon
                                            size={18}
                                            fill="white"
                                            className="transition-transform duration-700 group-hover:rotate-360 group-active:scale-90"
                                        />
                                    )}
                                    {theme === "concrete" && (
                                        <Building size={18} className="group-active:scale-90" />
                                    )}
                                </div>
                            </motion.button>

                            {/* Docs Search */}
                            {inDocs && (
                                <button
                                    type="button"
                                    onClick={() => setSearchOpen(true)}
                                    className="relative h-10 px-4 flex items-center justify-center gap-1 rounded-xl bg-[rgb(var(--color-foreground)/0.05)] backdrop-blur-3xl text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-all duration-300 ease-in-out cursor-pointer group"
                                >
                                    <Search size={18} strokeWidth={3} />
                                    <span className="text-sm font-inter-tight tracking-wider">
                                        Search
                                    </span>
                                    <kbd
                                        className="hidden sm:flex text-[10px] font-mono px-1 py-0.5 rounded-md"
                                        style={{
                                            backgroundColor: "rgb(var(--color-muted))",
                                            color: "rgb(var(--color-muted-foreground))",
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <g id="Interface / Command">
                                                <path
                                                    id="Vector"
                                                    d="M9 15V18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15H9ZM9 15H15M9 15V9M15 15V18C15 19.6569 16.3431 21 18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15H15ZM15 15V9M15 9H9M15 9V6C15 4.34315 16.3431 3 18 3C19.6569 3 21 4.34315 21 6C21 7.65685 19.6569 9 18 9H15ZM9 9V6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9H9Z"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                />
                                            </g>
                                        </svg>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2.5"
                                                d="M7 4v16m0-8h2l8-8m-8 8 8 8"
                                            />
                                        </svg>
                                    </kbd>
                                </button>
                            )}

                            {!inDocs && (
                                <>
                                    {/* Bag Button */}
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={async () => {
                                            await Haptics.impact({ style: ImpactStyle.Light });
                                            navigate("/bag");
                                        }}
                                        className="relative h-10 w-10 flex items-center justify-center rounded-full bg-[rgb(var(--color-foreground)/0.05)] backdrop-blur-3xl text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-all cursor-pointer group"
                                        title="Font Bag"
                                        aria-label={`Font Bag — ${bagCount} font${bagCount !== 1 ? "s" : ""}`}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                        >
                                            <g
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                            >
                                                <path
                                                    d="M3.977 9.84A2 2 0 0 1 5.971 8h12.058a2 2 0 0 1 1.994 1.84l.803 10A2 2 0 0 1 18.833 22H5.167a2 2 0 0 1-1.993-2.16z"
                                                    fill="currentColor"
                                                />
                                                <path d="M16 11V6a4 4 0 0 0-4-4v0a4 4 0 0 0-4 4v5" />
                                            </g>
                                        </svg>
                                        {bagCount > 0 && (
                                            <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {bagCount > 99 ? "99+" : bagCount}
                                            </span>
                                        )}
                                    </motion.button>

                                    {user ? (
                                        <>
                                            {profile?.role === "admin" && (
                                                <Squircle
                                                    radius={20}
                                                    className="hidden sm:block bg-[rgb(var(--color-accent)/0.2)] backdrop-blur-3xl hover:bg-[rgb(var(--color-accent)/0.3)] transition-all duration-300 ease-in-out"
                                                >
                                                    <Link
                                                        to="/admin"
                                                        onClick={async () => {
                                                            await Haptics.impact({
                                                                style: ImpactStyle.Light,
                                                            });
                                                        }}
                                                        className="flex items-center justify-center h-10 w-10 text-[rgb(var(--color-accent))]"
                                                    >
                                                        <Shield
                                                            size={18}
                                                            className="fill-[rgb(var(--color-accent))]"
                                                        />
                                                    </Link>
                                                </Squircle>
                                            )}
                                            <Squircle
                                                radius={20}
                                                className="hidden sm:block bg-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted-foreground))] transition-colors duration-300 ease-in-out"
                                            >
                                                <Link
                                                    to="/upload"
                                                    onClick={async () => {
                                                        await Haptics.impact({ style: ImpactStyle.Light });
                                                    }}
                                                    className="flex items-center gap-2 text-[rgb(var(--color-background))] px-4 h-10 text-sm font-medium"
                                                >
                                                    <Plus size={16} />
                                                    <span>Upload</span>
                                                </Link>
                                            </Squircle>
                                            <Link
                                                to="/profile"
                                                onClick={async () => {
                                                    await Haptics.impact({ style: ImpactStyle.Light });
                                                }}
                                                className="h-10 w-10 rounded-full bg-[rgb(var(--color-foreground)/0.1)] backdrop-blur-3xl border border-[rgb(var(--color-border)/0.2)] flex items-center justify-center text-[rgb(var(--color-foreground))] overflow-hidden hover:bg-[rgb(var(--color-foreground)/0.2)] hover:scale-105 transition-transform duration-300 ease-in-out"
                                            >
                                                {profile?.avatar_url ? (
                                                    <img
                                                        src={profile.avatar_url}
                                                        alt={
                                                            profile?.full_name
                                                                ? `${profile.full_name}'s avatar`
                                                                : "User profile avatar"
                                                        }
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <UserRound size={18} className="fill-current" />
                                                )}
                                            </Link>
                                        </>
                                    ) : (
                                        <Squircle
                                            radius={20}
                                            className="bg-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted-foreground))] transition-colors duration-300 ease-in-out"
                                        >
                                            <Link
                                                to="/auth"
                                                className="flex items-center justify-center text-[rgb(var(--color-background))] px-5 py-2 rounded-full font-bold text-sm"
                                            >
                                                Login
                                            </Link>
                                        </Squircle>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Dock */}
            <div className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-100">
                <nav className="flex items-center justify-evenly gap-1 w-screen px-2 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] bg-[rgb(var(--color-background)/0.6)] backdrop-blur-3xl border-t border-[rgb(var(--color-border)/0.3)]">
                    {mobileNavLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = activeTab === link.path;

                        return (
                            <motion.button
                                key={link.path}
                                aria-label={link.name}
                                layout // Smoothly adjusts the surrounding buttons when width changes
                                onClick={async (e) => {
                                    e.preventDefault();
                                    if (activeTab === link.path) return;

                                    setActiveTab(link.path); // Instant UI feedback
                                    await Haptics.selectionChanged();

                                    // Let the button layout animation finish (300ms) before hitting the React Router tree
                                    setTimeout(() => {
                                        navigate(link.path);
                                    }, 300);
                                }}
                                className={cn(
                                    "relative flex items-center justify-center min-h-10 max-h-12 rounded-full transition-all duration-300 ease-in-out",
                                    isActive
                                        ? "bg-[rgb(var(--color-foreground)/0.8)] text-[rgb(var(--color-background))] px-4 shadow-sm"
                                        : "bg-[rgb(var(--color-foreground)/0.05)] text-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] px-3",
                                )}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                                {/* Icon */}
                                <Icon
                                    className={cn(
                                        "shrink-0 w-4.5 h-4.5",
                                        isActive
                                            ? "fill-[rgb(var(--color-background))]"
                                            : "text-[rgb(var(--color-foreground))]",
                                    )}
                                />

                                {/* Animating Text */}
                                <AnimatePresence initial={false}>
                                    {isActive && (
                                        <motion.span
                                            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                                            animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                                            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                                            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                                            className="font-semibold font-inter-tight text-[18px] overflow-hidden whitespace-nowrap"
                                        >
                                            {link.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {link.badge && (
                                    <span className="absolute top-0 right-0 flex h-2.5 w-2.5 transform translate-x-1/2 -translate-y-1/2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--color-success)/0.75)]"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[rgb(var(--color-success))]"></span>
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </nav>
            </div>

            {/* Cmd+K Search Modal */}
            <DocsSearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
            />
        </>
    );
}
