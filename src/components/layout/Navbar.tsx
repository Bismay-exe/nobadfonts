"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { cn } from "../../lib/utils";
import { Type, Combine, Terminal, Users, Shield, Plus, Sun, Moon, UserRound, BookOpen, Search, X, Menu, Star, ShieldAlert, LayoutDashboard, Bot } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useUpdate } from "../../contexts/UpdateContext";
import { Download } from "lucide-react";
import { Squircle } from "react-ios-corners";
import { useBag } from "../../contexts/BagContext";
import { DocsSearchModal } from "../docs/DocsSearchModal";
import Switch from "../ui/ThemeToggle";

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
    const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Checks if path starts with '/docs/' and ensures it isn't just '/docs' or '/docs/'
    const inDocs = location.pathname.startsWith("/docs");
    // const isMobile = window.innerWidth < 768;

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
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
                        <path fill="currentColor" d="M12.494.253C11.08.253 10.172 0 8.715 0C4.007 0 1.812 2.681 1.812 5.404c0 1.604.76 2.132 2.259 2.132c-.106-.232-.296-.486-.296-1.626c0-3.188 1.203-4.117 2.744-4.18c0 0-1.264 12.396-4.934 13.883v.385h4.947l1.688-8h3.091l.689-2H8.642l.812-3.847c.929.19 1.837.38 2.618.38c.971 0 1.858-.296 2.343-2.533c-.591.19-1.224.253-1.921.253z" />
                    </svg>
                ),
            },
            {
                name: "Pairing",
                path: "/pairing",
                icon: Combine,
                svg: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 15 15">
                        <path fill="currentColor" d="M3.5 5A1.5 1.5 0 0 0 2 6.5V8h3V6.5A1.5 1.5 0 0 0 3.5 5" />
                        <path fill="currentColor" fill-rule="evenodd" d="M0 2.5A1.5 1.5 0 0 1 1.5 1h4A1.5 1.5 0 0 1 7 2.5v10A1.5 1.5 0 0 1 5.5 14h-4A1.5 1.5 0 0 1 0 12.5zM2 11V9h3v2h1V6.5a2.5 2.5 0 0 0-5 0V11z" clip-rule="evenodd" />
                        <path fill="currentColor" d="M12 7h-2V5h2a1 1 0 1 1 0 2m0 3h-2V8h2a1 1 0 1 1 0 2" />
                        <path fill="currentColor" fill-rule="evenodd" d="M8 2.5A1.5 1.5 0 0 1 9.5 1h4A1.5 1.5 0 0 1 15 2.5v10a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 8 12.5zM12 4H9v7h3a2 2 0 0 0 1.323-3.5A2 2 0 0 0 12 4" clip-rule="evenodd" />
                    </svg>
                ),
            },
            {
                name: "CLI",
                path: "/cli",
                icon: Terminal,
                svg: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 12">
                        <path fill="currentColor" d="M11 1H1c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1M9.5 9h-4c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h4c.28 0 .5.22.5.5s-.22.5-.5.5m-7 .12a.62.62 0 0 1-.44-.18a.63.63 0 0 1 0-.88L4.12 6L2.06 3.94a.63.63 0 0 1 0-.88c.24-.24.64-.24.88 0L5.09 5.2c.44.44.44 1.15 0 1.59L2.94 8.94a.62.62 0 0 1-.44.18" />
                    </svg>
                ),
                badge: "NEW",
            },
            {
                name: "Docs",
                path: "/docs",
                icon: BookOpen,
                svg: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20.25" height="18" viewBox="0 0 576 512">
                        <path fill="currentColor" d="M528.3 46.5H388.5c-48.1 0-89.9 33.3-100.4 80.3c-10.6-47-52.3-80.3-100.4-80.3H48c-26.5 0-48 21.5-48 48v245.8c0 26.5 21.5 48 48 48h89.7c102.2 0 132.7 24.4 147.3 75c.7 2.8 5.2 2.8 6 0c14.7-50.6 45.2-75 147.3-75H528c26.5 0 48-21.5 48-48V94.6c0-26.4-21.3-47.9-47.7-48.1M242 311.9c0 1.9-1.5 3.5-3.5 3.5H78.2c-1.9 0-3.5-1.5-3.5-3.5V289c0-1.9 1.5-3.5 3.5-3.5h160.4c1.9 0 3.5 1.5 3.5 3.5v22.9zm0-60.9c0 1.9-1.5 3.5-3.5 3.5H78.2c-1.9 0-3.5-1.5-3.5-3.5v-22.9c0-1.9 1.5-3.5 3.5-3.5h160.4c1.9 0 3.5 1.5 3.5 3.5V251zm0-60.9c0 1.9-1.5 3.5-3.5 3.5H78.2c-1.9 0-3.5-1.5-3.5-3.5v-22.9c0-1.9 1.5-3.5 3.5-3.5h160.4c1.9 0 3.5 1.5 3.5 3.5v22.9zm259.3 121.7c0 1.9-1.5 3.5-3.5 3.5H337.5c-1.9 0-3.5-1.5-3.5-3.5v-22.9c0-1.9 1.5-3.5 3.5-3.5h160.4c1.9 0 3.5 1.5 3.5 3.5v22.9zm0-60.9c0 1.9-1.5 3.5-3.5 3.5H337.5c-1.9 0-3.5-1.5-3.5-3.5V228c0-1.9 1.5-3.5 3.5-3.5h160.4c1.9 0 3.5 1.5 3.5 3.5v22.9zm0-60.9c0 1.9-1.5 3.5-3.5 3.5H337.5c-1.9 0-3.5-1.5-3.5-3.5v-22.8c0-1.9 1.5-3.5 3.5-3.5h160.4c1.9 0 3.5 1.5 3.5 3.5V190z" />
                    </svg>
                ),
            },
            {
                name: "Moods",
                path: "/moods",
                icon: BookOpen,
                svg: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 64 64">
                        <path fill="currentColor" d="M31.096 62h-4.891s5.02-18.473 5.213-30.574c.014-.838 1.164-.838 1.164 0C32.582 48.862 31.096 62 31.096 62m26.889-40.164c-9.24-6.425-22.98 7.2-24.522 9.138c.873 1.571 6.095 21.527 16.962 20.817c10.104-.658 8.646-12.536 4.267-14.841c5.278.041 11.593-9.343 3.293-15.114" />
                        <path fill="currentColor" d="M46.571 7.935c-3.203-9.883-13.61-5.449-14.572-.513c-1.323-5.26-11.473-9.185-14.57.521c-3.449 10.808 13.355 20.356 14.56 21.946c1.2-1.264 18.032-11.321 14.582-21.954" />
                        <path fill="currentColor" d="M6.013 21.836c-8.298 5.771-1.98 15.155 3.295 15.114c-4.38 2.306-5.836 14.183 4.267 14.841c10.868.709 16.065-19.245 16.937-20.816c-1.596-1.938-15.317-15.52-24.499-9.139" />
                    </svg>
                ),
                badge: "NEW",
            },
            // {
            //     name: "Favourites",
            //     path: "/favourites",
            //     icon: Star,
            //     svg: (
            //         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
            //             <path fill="currentColor" fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15C-7.534 4.736 3.562-3.248 8 1.314" />
            //         </svg>

            //     ),
            // },
            // {
            //     name: "Boards",
            //     path: "/boards",
            //     icon: LayoutDashboard,
            //     svg: (
            //         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
            //             <path fill="currentColor" fill-rule="evenodd" d="M14.748 0a1.75 1.75 0 0 0-1.75 1.75v4.5c0 .966.784 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-4.5A1.75 1.75 0 0 0 22.248 0zm0 10a1.75 1.75 0 0 0-1.75 1.75v10.5c0 .967.784 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-10.5a1.75 1.75 0 0 0-1.75-1.75zM.002 1.75C.002.784.785 0 1.752 0h7.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 9.252 14h-7.5a1.75 1.75 0 0 1-1.75-1.75zM1.752 16a1.75 1.75 0 0 0-1.75 1.75v4.5c0 .966.783 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-4.5A1.75 1.75 0 0 0 9.252 16z" clip-rule="evenodd" />
            //         </svg>
            //     ),
            // },
            // {
            //     name: "Bag",
            //     path: "/bag",
            //     icon: Users,
            //     svg: (
            //         <svg
            //             xmlns="http://www.w3.org/2000/svg"
            //             width="18"
            //             height="18"
            //             viewBox="0 0 24 24"
            //         >
            //             <g
            //                 fill="none"
            //                 stroke="currentColor"
            //                 stroke-linecap="round"
            //                 stroke-linejoin="round"
            //                 stroke-width="2"
            //             >
            //                 <path
            //                     d="M3.977 9.84A2 2 0 0 1 5.971 8h12.058a2 2 0 0 1 1.994 1.84l.803 10A2 2 0 0 1 18.833 22H5.167a2 2 0 0 1-1.993-2.16z"
            //                     fill="currentColor"
            //                 />
            //                 <path d="M16 11V6a4 4 0 0 0-4-4v0a4 4 0 0 0-4 4v5" />
            //             </g>
            //         </svg>
            //     ),
            // },
            ...(profile?.role === "member" || profile?.role === "admin"
                ? [
                    {
                        name: "Members",
                        path: "/members",
                        icon: Users,
                        svg: (
                            <svg xmlns="http://www.w3.org/2000/svg" width="22.5" height="18" viewBox="0 0 640 512">
                                <path fill="currentColor" d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64s-64 28.7-64 64s28.7 64 64 64m448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64s-64 28.7-64 64s28.7 64 64 64m32 32h-64c-17.6 0-33.5 7.1-45.1 18.6c40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64m-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32S208 82.1 208 144s50.1 112 112 112m76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2m-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4" />
                            </svg>
                        ),
                    },
                    {
                        name: "Admin",
                        path: "/admin",
                        icon: ShieldAlert,
                        svg: (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
                                <path fill="currentColor" fill-rule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56c-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.8 11.8 0 0 0 2.517 2.453c.386.273.744.482 1.048.625c.28.132.581.24.829.24s.548-.108.829-.24a7 7 0 0 0 1.048-.625a11.8 11.8 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.54 1.54 0 0 0-1.044-1.263a63 63 0 0 0-2.887-.87C9.843.266 8.69 0 8 0m2.146 5.146a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793z" />
                            </svg>


                        ),
                    },
                    {
                        name: "Upload",
                        path: "/upload",
                        icon: Plus,
                        svg: (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512">
                                <path fill="currentColor" d="M288 109.3V352c0 17.7-14.3 32-32 32s-32-14.3-32-32V109.3l-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM64 352h128c0 35.3 28.7 64 64 64s64-28.7 64-64h128c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64v-32c0-35.3 28.7-64 64-64m368 104a24 24 0 1 0 0-48a24 24 0 1 0 0 48" />
                            </svg>

                        ),
                    },
                ]
                : []),
        ],
        [profile?.role],
    );

    const otherLinks = [
        {
            name: "Favourites",
            path: "/favourites",
            icon: Star,
            svg: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
                    <path fill="currentColor" fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15C-7.534 4.736 3.562-3.248 8 1.314" />
                </svg>

            ),
        },
        {
            name: "Boards",
            path: "/boards",
            icon: LayoutDashboard,
            svg: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" fill-rule="evenodd" d="M14.748 0a1.75 1.75 0 0 0-1.75 1.75v4.5c0 .966.784 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-4.5A1.75 1.75 0 0 0 22.248 0zm0 10a1.75 1.75 0 0 0-1.75 1.75v10.5c0 .967.784 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-10.5a1.75 1.75 0 0 0-1.75-1.75zM.002 1.75C.002.784.785 0 1.752 0h7.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 9.252 14h-7.5a1.75 1.75 0 0 1-1.75-1.75zM1.752 16a1.75 1.75 0 0 0-1.75 1.75v4.5c0 .966.783 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-4.5A1.75 1.75 0 0 0 9.252 16z" clip-rule="evenodd" />
                </svg>
            ),
        },
        {
            name: "Bag",
            path: "/bag",
            icon: Users,
            svg: (
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
            ),
        },
        {
            name: "MCP",
            path: "/mcp",
            icon: Bot,
            svg: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
                    <path fill="currentColor" d="M9.052 1.684a1 1 0 0 1 1.896.633l-4 12a1 1 0 0 1-1.896-.633zM3.293 4.293a1 1 0 1 1 1.414 1.414L2.414 8l2.293 2.293a1 1 0 1 1-1.414 1.414l-3-3a1 1 0 0 1 0-1.414zm8 0a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L13.586 8l-2.293-2.293a1 1 0 0 1 0-1.414" />
                </svg>
            ),
            badge: "Soon",
        },
    ]

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 w-full left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
                    isScrolled
                        ? "max-w-full md:rounded-none bg-linear-to-b from-background via-background/60 to-background/0 py-2 md:py-4 px-6 md:px-10"
                        : "max-w-full md:rounded-none zbg-linear-to-b from-background via-background/60 to-background/0 py-2 md:py-4 px-6 md:px-10",
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
                                        className="md:hidden relative h-10 w-10 flex items-center justify-center gap-1 rounded-xl bg-foreground/5 backdrop-blur-3xl text-foreground hover:bg-foreground/10 transition-all  duration-300 ease-in-out cursor-pointer group"
                                        style={{ color: "var(--color-muted)" }}
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
                                        className={`${inDocs ? "hidden sm:block" : ""} w-10 h-10 flex justify-center items-center text-foreground rounded-xl`}
                                    >
                                        <svg
                                            className='overflow-visible'
                                            width="28"
                                            height="28"
                                            viewBox="0 0 680 678"
                                            fill="currentColor"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M27.7539 678C27.7539 678 4.99807 663 0.500015 598C-3.99804 533 22 418 72.5 353.5C123 289 226.5 226 226.5 226C226.5 226 319.5 0 452.5 0C585.5 0 680 213.239 680 415.5C680 617.761 639.5 678 639.5 678H403C403 678 366.5 625 345 537C323.5 449 384.5 291 384.5 218.5C384.5 146 226.5 226 226.5 226C226.5 226 191 320.5 191 452C191 583.5 250 678 250 678H27.7539Z" />

                                            <path
                                                className="origin-[113.5px_113px] group-hover:animate-[spin_2s_linear_infinite]"
                                                d="M30.508 20.5896C21.5794 14.4189 11.648 7.55723 0.503116 0.0105563C8.0698 11.1837 14.9155 21.091 21.0703 29.9942C49.3078 70.8509 63.4278 91.2869 63.4272 113.006C63.4278 134.69 49.3555 155.092 21.2122 195.813L21.0862 195.999C14.915 204.928 8.05273 214.86 0.506647 226.005C11.6816 218.44 21.5883 211.595 30.4915 205.439C71.3464 177.201 91.7824 163.081 113.501 163.081C135.187 163.079 155.588 177.152 196.309 205.297L196.497 205.42C205.425 211.592 215.356 218.456 226.5 226.002C218.935 214.827 212.09 204.92 205.935 196.016C177.698 155.16 163.576 134.726 163.576 113.006C163.576 91.3234 177.648 70.9203 205.792 30.199L205.918 30.0119C212.09 21.0839 218.952 11.1508 226.497 0.00820215C215.323 7.57253 205.417 14.4171 196.512 20.5731C155.657 48.8118 135.222 62.9323 113.502 62.9317C91.8183 62.9317 71.417 48.8582 30.6945 20.7161L30.508 20.5896Z"
                                            />
                                        </svg>
                                    </div>
                                    {/* <span
                                        className={cn(
                                            `${inDocs ? "" : "hidden zsm:block"}`,
                                            "font-inter-tight text-3xl transition-all duration-300 ease-in-out",
                                            "text-foreground",
                                        )}
                                    >
                                        NoBadFonts
                                    </span> */}
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <div className={cn(
                                "hidden zxl:flex items-center gap-1 ",
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
                                                    ? "text-foreground"
                                                    : "text-muted hover:text-foreground",
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
                                    className="relative h-10 w-10 flex items-center justify-center rounded-full bg-foreground/5 border border-border/20 text-foreground hover:bg-foreground/10 transition-all cursor-pointer group"
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
                                                stroke="color-mix(in srgb, var(--color-foreground) 10%, transparent)"
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
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-foreground/5 backdrop-blur-3xl text-foreground hover:bg-foreground/10 transition-all cursor-pointer group"
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
                                </div>
                            </motion.button>

                            {/* Docs Search */}
                            {inDocs && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        await Haptics.impact({ style: ImpactStyle.Light });
                                        setSearchOpen(true)
                                    }}
                                    className="relative h-10 px-4 flex items-center justify-center gap-1 rounded-xl bg-foreground/5 backdrop-blur-3xl text-muted hover:text-foreground hover:bg-foreground/10 transition-all duration-300 ease-in-out cursor-pointer group"
                                >
                                    <Search size={18} strokeWidth={3} />
                                    <span className="text-sm font-inter-tight tracking-wider">
                                        Search
                                    </span>
                                    <kbd
                                        className="hidden sm:flex bg-foreground/10 text-[10px] font-mono px-1 py-0.5 rounded-md"
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
                                </motion.button>
                            )}

                            {/* {!inDocs && (
                                <> */}
                            {/* Bag Button */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => {
                                    await Haptics.impact({ style: ImpactStyle.Light });
                                    navigate("/bag");
                                }}
                                className="relative h-10 w-10 flex items-center justify-center rounded-full bg-foreground/5 backdrop-blur-3xl text-foreground hover:bg-foreground/10 transition-all cursor-pointer group"
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
                                    <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-foreground text-background text-[12px] font-inter-tight font-semibold rounded-full flex items-center justify-center">
                                        {bagCount > 99 ? "99+" : bagCount}
                                    </span>
                                )}
                            </motion.button>

                            {user ? (
                                <>
                                    {profile?.role === "admin" && (
                                        <>
                                            <Squircle
                                                radius={20}
                                                className="hidden zsm:block bg-accent/20 backdrop-blur-3xl hover:bg-accent/30 transition-all duration-300 ease-in-out"
                                            >
                                                <Link
                                                    to="/admin"
                                                    onClick={async () => {
                                                        await Haptics.impact({
                                                            style: ImpactStyle.Light,
                                                        });
                                                    }}
                                                    className="flex items-center justify-center h-10 w-10 text-accent"
                                                >
                                                    <Shield
                                                        size={18}
                                                        className="fill-accent"
                                                    />
                                                </Link>
                                            </Squircle>
                                            <Squircle
                                                radius={20}
                                                className="hidden zsm:block bg-foreground hover:bg-muted transition-colors duration-300 ease-in-out"
                                            >
                                                <Link
                                                    to="/upload"
                                                    onClick={async () => {
                                                        await Haptics.impact({ style: ImpactStyle.Light });
                                                    }}
                                                    className="flex items-center gap-2 text-background px-4 h-10 text-sm font-medium"
                                                >
                                                    <Plus size={16} />
                                                    <span>Upload</span>
                                                </Link>
                                            </Squircle>
                                        </>
                                    )}
                                    <Link
                                        to="/profile"
                                        onClick={async () => {
                                            await Haptics.impact({ style: ImpactStyle.Light });
                                        }}
                                        className="h-10 w-10 rounded-full bg-foreground/10 backdrop-blur-3xl border border-border/20 flex items-center justify-center text-foreground overflow-hidden hover:bg-foreground/20 hover:scale-105 transition-transform duration-300 ease-in-out"
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
                                    className="bg-foreground hover:bg-muted transition-colors duration-300 ease-in-out"
                                >
                                    <Link
                                        to="/auth"
                                        className="flex items-center justify-center text-background px-5 py-2 rounded-full font-bold text-sm"
                                    >
                                        Login
                                    </Link>
                                </Squircle>
                            )}

                            <button
                                type="button"
                                onClick={async () => {
                                    await Haptics.impact({
                                        style: ImpactStyle.Light,
                                    });
                                    setDesktopMenuOpen((prev) => !prev);
                                }}
                                className={`hidden md:flex h-10 w-10 rounded-full bg-foreground/10 backdrop-blur-3xl border border-border/20 items-center justify-center text-foreground overflow-hidden hover:bg-foreground/20 hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer ${desktopMenuOpen ? "-rotate-45" : ""}`}
                                aria-label="Open account menu"
                                aria-expanded={desktopMenuOpen}
                            >
                                {desktopMenuOpen ? (
                                    <X className="w-5 h-5 rotate-45" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    await Haptics.impact({ style: ImpactStyle.Light });
                                    setMobileMenuOpen((prev) => !prev);
                                }}
                                className={`md:hidden relative h-10 w-10 flex items-center justify-center rounded-xl bg-foreground/5 backdrop-blur-3xl text-foreground hover:bg-foreground/10 transition-all duration-300 cursor-pointer ${mobileMenuOpen ? "-rotate-45" : ""}`}
                                aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                                aria-expanded={mobileMenuOpen}
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-5 h-5 rotate-45" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </button>
                            {/* </>
                            )} */}
                        </div>
                    </div>
                </div>
            </nav >

            <AnimatePresence>
                {desktopMenuOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40 hidden md:block"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDesktopMenuOpen(false)}
                        />

                        <motion.div
                            className="fixed right-4 top-18 z-50 hidden md:block w-75 overflow-hidden rounded-3xl border border-border/50 bg-card-background shadow-2xl"
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="p-2">

                                {/* Navigation */}
                                <div className="space-y-0.5">
                                    {navLinks.map((link) => {
                                        const isActive = location.pathname === link.path;

                                        return (
                                            <Link
                                                key={link.path}
                                                to={link.path}
                                                onClick={async () => {
                                                    await Haptics.impact({
                                                        style: ImpactStyle.Light,
                                                    });
                                                    setDesktopMenuOpen(false);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-100 ease-in-out",
                                                    isActive
                                                        ? "bg-border text-foreground"
                                                        : "text-foreground hover:bg-foreground/10"
                                                )}
                                            >
                                                <span className={cn(
                                                    "font-inter-tight ztext-[2.4rem] zsm:text-[2.7rem] zmd:text-[2rem] zleading-none transition-colors duration-200 flex items-center",
                                                    isActive ? "text-foreground" : "text-muted group-hover:text-foreground"
                                                )}>
                                                    {link.name}
                                                </span>
                                                <span className={cn(isActive ? "text-foreground" : "text-muted group-hover:text-foreground")}>
                                                    {link.svg}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                <div className="w-full h-px bg-card-background my-4" />

                                {/* other links */}
                                <div className="space-y-0.5">
                                    {otherLinks.map((link) => {
                                        const isActive = location.pathname === link.path;

                                        return (
                                            <Link
                                                key={link.path}
                                                to={link.path}
                                                onClick={async () => {
                                                    await Haptics.impact({
                                                        style: ImpactStyle.Light,
                                                    });
                                                    setDesktopMenuOpen(false);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-100 ease-in-out",
                                                    isActive
                                                        ? "bg-border text-foreground"
                                                        : "text-foreground hover:bg-foreground/10"
                                                )}
                                            >
                                                <span className={cn(
                                                    "font-inter-tight ztext-[2.4rem] zsm:text-[2.7rem] zmd:text-[2rem] zleading-none transition-colors duration-200 flex items-center",
                                                    isActive ? "text-foreground" : "text-muted group-hover:text-foreground"
                                                )}>
                                                    {link.name}
                                                    {link.name === "Bag" && bagCount > 0 && (
                                                        <span className="ml-2 text-xs bg-border text-muted px-1.5 py-0.5 rounded-full">
                                                            {bagCount > 99 ? "99+" : bagCount} <span className='ml-0.5 tracking-normal'>fonts</span>
                                                        </span>
                                                    )}
                                                </span>
                                                <span className={cn(isActive ? "text-foreground" : "text-muted group-hover:text-foreground")}>
                                                    {link.svg}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Theme + Docs Search */}
                                <div className="mt-2 border-t border-border/50 pt-2">

                                    <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-foreground">
                                        <span className="flex items-center gap-3 text-sm font-medium">
                                            Theme
                                        </span>

                                        <Switch />

                                        {/* <button
                                            type="button"
                                            onClick={async () => {
                                                await Haptics.impact({
                                                    style: ImpactStyle.Light,
                                                });
                                                toggleTheme();
                                            }}
                                            className="flex items-center justify-center rounded-full transition-colors cursor-pointer"
                                            aria-label="Toggle theme"
                                        >
                                            {theme === "light" ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M11.643 5.28q-.143-.145-.143-.357V2.539q0-.213.144-.357t.357-.144t.356.144t.143.356v2.385q0 .213-.144.356t-.357.144t-.356-.144m5 2.079q-.141-.14-.131-.342q.01-.2.15-.366l1.65-1.694q.15-.166.359-.166t.378.17q.155.156.155.35t-.16.354L17.35 7.358q-.16.16-.354.16t-.354-.16m2.435 5.142q-.213 0-.356-.144t-.144-.357t.144-.356t.356-.143h2.385q.212 0 .356.144t.143.357t-.143.356t-.357.143zm-7.434 9.318q-.143-.144-.143-.356v-2.366q0-.212.144-.356t.357-.144t.356.144t.143.356v2.366q0 .212-.144.356t-.357.144t-.356-.144M6.67 7.358l-1.713-1.67q-.165-.149-.165-.36t.165-.372q.16-.14.367-.14t.34.14l1.714 1.713q.14.134.14.341t-.136.348q-.15.14-.348.14t-.364-.14m11.662 11.686l-1.67-1.694q-.14-.165-.15-.366t.128-.342t.34-.14t.371.16l1.694 1.669q.146.14.143.344t-.149.37q-.16.164-.366.164t-.341-.165M2.539 12.5q-.213 0-.357-.144t-.143-.357t.143-.356t.357-.143h2.384q.213 0 .356.144t.144.357t-.144.356t-.356.143zm2.436 6.544q-.14-.16-.15-.363t.13-.344l1.676-1.675q.16-.16.35-.16t.358.155q.165.17.165.371t-.165.366l-1.65 1.65q-.166.166-.373.166t-.341-.166m3.487-3.501Q7 14.086 7 12.005T8.457 8.46T11.995 7t3.544 1.457T17 11.995t-1.457 3.544T12.005 17T8.46 15.543" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M20.71 13.51c-.78.23-1.58.35-2.38.35c-4.52 0-8.2-3.68-8.2-8.2c0-.8.12-1.6.35-2.38a1.002 1.002 0 0 0-1.25-1.25A10.17 10.17 0 0 0 2 11.8C2 17.42 6.58 22 12.2 22c4.53 0 8.45-2.91 9.76-7.24a1.002 1.002 0 0 0-1.25-1.25" />
                                                    <path fill="currentColor" d="m16 8l.94-2.06L19 5l-2.06-.94L16 2l-.94 2.06L13 5l2.06.94zm4.25-.5l-.55 1.2l-1.2.55l1.2.55l.55 1.2l.55-1.2l1.2-.55l-1.2-.55z" />
                                                </svg>
                                            )}
                                        </button> */}
                                    </div>


                                    {inDocs && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDesktopMenuOpen(false);
                                                setSearchOpen(true);
                                            }}
                                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                                        >
                                            <span className="flex items-center gap-3">
                                                <Search size={18} />
                                                Docs Search
                                            </span>

                                            <kbd className="rounded-md bg-foreground/5 px-2 py-1 text-[10px] text-muted">
                                                ⌘K
                                            </kbd>
                                        </button>
                                    )}
                                </div>

                                {/* Account */}
                                <div className="border-t border-border/50 pt-2">
                                    {user ? (
                                        <Link
                                            to="/profile"
                                            onClick={async () => {
                                                await Haptics.impact({
                                                    style: ImpactStyle.Light,
                                                });
                                                setDesktopMenuOpen(false);
                                            }}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-foreground/5 transition-colors"
                                        >
                                            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-foreground/10 flex items-center justify-center">
                                                {profile?.avatar_url ? (
                                                    <img
                                                        src={profile.avatar_url}
                                                        alt={profile?.full_name ? `${profile.full_name}'s avatar` : "Profile"}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <UserRound size={17} />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {profile?.full_name || "Profile"}
                                                </p>
                                                <p className="truncate text-sm font-normal text-muted">
                                                    {profile?.email || "email"}
                                                </p>
                                            </div>
                                        </Link>
                                    ) : (
                                        <Link
                                            to="/auth"
                                            onClick={() => setDesktopMenuOpen(false)}
                                            className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-foreground hover:bg-foreground/5 transition-colors"
                                        >
                                            <span className="flex items-center gap-3">
                                                <UserRound size={18} />
                                                Login
                                            </span>

                                            <span className="text-muted">
                                                →
                                            </span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.aside
                            className="md:hidden fixed z-60 inset-0 md:inset-auto md:right-4 md:top-4 md:bottom-4 md:w-90 bg-background text-foreground md:rounded-[28px] border border-foreground/10 overflow-hidden shadow-2xl"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="relative h-full flex flex-col justify-start overflow-y-auto">

                                {/* Header */}
                                <div className="sticky top-0 flex items-center justify-between px-6 md:px-7 pt-[calc(1.5rem+env(safe-area-inset-top))] md:pt-6">

                                    <Link
                                        to="/"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-2"
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center text-foreground">
                                            <svg
                                                className="overflow-visible"
                                                width="30"
                                                height="30"
                                                viewBox="0 0 680 678"
                                                fill="currentColor"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path d="M27.7539 678C27.7539 678 4.99807 663 0.500015 598C-3.99804 533 22 418 72.5 353.5C123 289 226.5 226 226.5 226C226.5 226 319.5 0 452.5 0C585.5 0 680 213.239 680 415.5C680 617.761 639.5 678 639.5 678H403C403 678 366.5 625 345 537C323.5 449 384.5 291 384.5 218.5C384.5 146 226.5 226 226.5 226C226.5 226 191 320.5 191 452C191 583.5 250 678 250 678H27.7539Z" />
                                                <path d="M30.508 20.5896C21.5794 14.4189 11.648 7.55723 0.503116 0.0105563C8.0698 11.1837 14.9155 21.091 21.0703 29.9942C49.3078 70.8509 63.4278 91.2869 63.4272 113.006C63.4278 134.69 49.3555 155.092 21.2122 195.813L21.0862 195.999C14.915 204.928 8.05273 214.86 0.506647 226.005C11.6816 218.44 21.5883 211.595 30.4915 205.439C71.3464 177.201 91.7824 163.081 113.501 163.081C135.187 163.079 155.588 177.152 196.309 205.297L196.497 205.42C205.425 211.592 215.356 218.456 226.5 226.002C218.935 214.827 212.09 204.92 205.935 196.016C177.698 155.16 163.576 134.726 163.576 113.006C163.576 91.3234 177.648 70.9203 205.792 30.199L205.918 30.0119C212.09 21.0839 218.952 11.1508 226.497 0.00820215C215.323 7.57253 205.417 14.4171 196.512 20.5731C155.657 48.8118 135.222 62.9323 113.502 62.9317C91.8183 62.9317 71.417 48.8582 30.6945 20.7161L30.508 20.5896Z" />
                                            </svg>
                                        </div>

                                        {/* <span className="font-advine text-2xl text-foreground">
                                            NoBadFonts
                                        </span> */}
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="h-10 w-10 rounded-full flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                                        aria-label="Close menu"
                                    >
                                        <X size={25} strokeWidth={1.5} />
                                    </button>

                                </div>

                                {/* Navigation */}
                                <div className="px-6 md:px-7 pt-10 md:pt-12">

                                    <nav className="flex flex-col sm:flex-row sm:gap-4 justify-between sm:items-start">
                                        <div className="flex-1">
                                            {navLinks.map((link, index) => {
                                                const isActive = location.pathname === link.path;

                                                return (
                                                    <Link
                                                        key={link.path}
                                                        to={link.path}
                                                        onClick={async () => {
                                                            await Haptics.impact({
                                                                style: ImpactStyle.Light,
                                                            });

                                                            setMobileMenuOpen(false);
                                                        }}
                                                        className="group"
                                                    >
                                                        <motion.div
                                                            initial={{ opacity: 0, x: 15 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.035, duration: 0.3 }}
                                                            className="flex sm:flex-row-reverse items-center justify-between sm:justify-end sm:gap-4 py-2 md:py-2.5"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "font-inter-tight text-[2rem] sm:text-[2rem] leading-none transition-colors duration-200 flex items-center",
                                                                    isActive ? "text-foreground" : "text-muted/60 group-hover:text-foreground"
                                                                )}
                                                            >
                                                                {link.name}
                                                            </span>

                                                            <span className={cn("sm:hiddenz", isActive ? "text-foreground" : "text-muted/60 group-hover:text-foreground")}>
                                                                {link.svg}
                                                            </span>
                                                        </motion.div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                        <div className="w-full sm:w-px h-px sm:h-full bg-border my-8 sm:my-0 sm:mx-4" />
                                        <div className="flex-1 bg-card-background px-6 py-4 rounded-3xl">
                                            {otherLinks.map((link, index) => {
                                                const isActive = location.pathname === link.path;

                                                return (
                                                    <Link
                                                        key={link.path}
                                                        to={link.path}
                                                        onClick={async () => {
                                                            await Haptics.impact({
                                                                style: ImpactStyle.Light,
                                                            });

                                                            setMobileMenuOpen(false);
                                                        }}
                                                        className="group"
                                                    >
                                                        <motion.div
                                                            initial={{ opacity: 0, x: 15 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.035, duration: 0.3 }}
                                                            className="flex items-center justify-between py-2 md:py-2.5"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "font-inter-tight text-[2rem] sm:text-[2rem] leading-none transition-colors duration-200 flex items-center",
                                                                    isActive ? "text-foreground" : "text-muted/60 group-hover:text-foreground"
                                                                )}
                                                            >
                                                                {link.name}
                                                                {link.name === "Bag" && bagCount > 0 && (
                                                                    <span className="ml-2 text-lg bg-foreground/90 text-background tracking-normal px-2 py-0 rounded-full">
                                                                        {bagCount > 99 ? "99+" : bagCount} <span className='ml-1'>fonts</span>
                                                                    </span>
                                                                )}
                                                                <span className="ml-2 text-lg bg-muted/30 text-muted/95 tracking-normal lowercase px-2 py-0 rounded-full">
                                                                    {link.badge}
                                                                </span>
                                                            </span>

                                                            <span className={cn(isActive ? "text-foreground" : "text-muted/60 group-hover:text-foreground")}>
                                                                {link.svg}
                                                            </span>
                                                        </motion.div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </nav>

                                    {/* Utilities */}
                                    <div className="mt-8 pt-6 border-t border-foreground/10">
                                        <div className="grid grid-cols-1 gap-2">

                                            {/* Search */}
                                            {/* <button
                                                type="button"
                                                onClick={() => {
                                                    setMobileMenuOpen(false);
                                                    setSearchOpen(true);
                                                }}
                                                className="h-12 rounded-2xl bg-foreground/5 flex items-center justify-between px-4 text-sm hover:bg-foreground/10 transition-colors cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Search size={17} />
                                                    Search
                                                </span>

                                                <span className="text-[10px] text-muted">
                                                    ⌘K
                                                </span>
                                            </button> */}

                                            {/* Theme */}
                                            <div className="flex items-center justify-between sm:justify-start gap-4 rounded-xl py-2.5 transition-colors text-foreground">
                                                <span className="font-inter-tight text-[2rem] sm:text-[2rem] md:text-[2rem] leading-none transition-colors duration-200 flex items-center">
                                                    Theme
                                                </span>

                                                <div className="sm:bg-card-background sm:aspect-square sm:h-full sm:p-3 flex justify-center items-center rounded-full">
                                                    <Switch />
                                                </div>

                                                {/* <button
                                                    type="button"
                                                    onClick={async () => {
                                                        await Haptics.impact({
                                                            style: ImpactStyle.Light,
                                                        });
                                                        toggleTheme();
                                                    }}
                                                    className="flex items-center justify-center rounded-full transition-colors cursor-pointer"
                                                    aria-label="Toggle theme"
                                                >
                                                    {theme === "light" ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                                            <path fill="currentColor" d="M11.643 5.28q-.143-.145-.143-.357V2.539q0-.213.144-.357t.357-.144t.356.144t.143.356v2.385q0 .213-.144.356t-.357.144t-.356-.144m5 2.079q-.141-.14-.131-.342q.01-.2.15-.366l1.65-1.694q.15-.166.359-.166t.378.17q.155.156.155.35t-.16.354L17.35 7.358q-.16.16-.354.16t-.354-.16m2.435 5.142q-.213 0-.356-.144t-.144-.357t.144-.356t.356-.143h2.385q.212 0 .356.144t.143.357t-.143.356t-.357.143zm-7.434 9.318q-.143-.144-.143-.356v-2.366q0-.212.144-.356t.357-.144t.356.144t.143.356v2.366q0 .212-.144.356t-.357.144t-.356-.144M6.67 7.358l-1.713-1.67q-.165-.149-.165-.36t.165-.372q.16-.14.367-.14t.34.14l1.714 1.713q.14.134.14.341t-.136.348q-.15.14-.348.14t-.364-.14m11.662 11.686l-1.67-1.694q-.14-.165-.15-.366t.128-.342t.34-.14t.371.16l1.694 1.669q.146.14.143.344t-.149.37q-.16.164-.366.164t-.341-.165M2.539 12.5q-.213 0-.357-.144t-.143-.357t.143-.356t.357-.143h2.384q.213 0 .356.144t.144.357t-.144.356t-.356.143zm2.436 6.544q-.14-.16-.15-.363t.13-.344l1.676-1.675q.16-.16.35-.16t.358.155q.165.17.165.371t-.165.366l-1.65 1.65q-.166.166-.373.166t-.341-.166m3.487-3.501Q7 14.086 7 12.005T8.457 8.46T11.995 7t3.544 1.457T17 11.995t-1.457 3.544T12.005 17T8.46 15.543" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                                            <path fill="currentColor" d="M20.71 13.51c-.78.23-1.58.35-2.38.35c-4.52 0-8.2-3.68-8.2-8.2c0-.8.12-1.6.35-2.38a1.002 1.002 0 0 0-1.25-1.25A10.17 10.17 0 0 0 2 11.8C2 17.42 6.58 22 12.2 22c4.53 0 8.45-2.91 9.76-7.24a1.002 1.002 0 0 0-1.25-1.25" />
                                                            <path fill="currentColor" d="m16 8l.94-2.06L19 5l-2.06-.94L16 2l-.94 2.06L13 5l2.06.94zm4.25-.5l-.55 1.2l-1.2.55l1.2.55l.55 1.2l.55-1.2l1.2-.55l-1.2-.55z" />
                                                        </svg>
                                                    )}
                                                </button> */}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account / Social Panel */}
                                    <div className="mb-4 md:mb-5 rounded-3xl bg-card-background hover:bg-foreground/8 transition-colors duration-300 ease-in-out overflow-hidden">
                                        {user ? (
                                            <>
                                                {/* Profile */}
                                                <Link
                                                    to="/profile"
                                                    onClick={async () => {
                                                        await Haptics.impact({
                                                            style: ImpactStyle.Light,
                                                        });

                                                        setMobileMenuOpen(false);
                                                    }}
                                                    className="flex items-center gap-3 px-5 py-4 transition-colors"
                                                >
                                                    <div className="h-14 w-14 rounded-full overflow-hidden bg-foreground/10 flex items-center justify-center shrink-0">
                                                        {profile?.avatar_url ? (
                                                            <img
                                                                src={profile.avatar_url}
                                                                alt={profile?.full_name ? `${profile.full_name}'s avatar` : "User profile avatar"}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <UserRound size={19} />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">
                                                            {profile?.full_name || "Your profile"}
                                                        </p>

                                                        <p className="text-sm text-muted truncate">
                                                            {profile?.email || "Your email"}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                {/* Login */}
                                                <Link
                                                    to="/auth"
                                                    onClick={async () => {
                                                        await Haptics.impact({
                                                            style: ImpactStyle.Light,
                                                        });

                                                        setMobileMenuOpen(false);
                                                    }}
                                                    className="flex items-center justify-between px-5 py-5 font-medium hover:bg-foreground/5 transition-colors"
                                                >
                                                    <span>Sign in</span>
                                                    <span>→</span>
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Cmd+K Search Modal */}
            < DocsSearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
            />
        </>
    );
}
