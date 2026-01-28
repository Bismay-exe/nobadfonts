import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    };

    return (
        <div className="absolute top-0 left-0 h-screen w-full bg-[#000000] text-white font-sans flex items-center justify-center">

            {/* === MAIN CONTAINER === */}
            <div className="h-full w-full bg-[#131413] rounded-3xl border border-[#333] flex flex-col md:flex-row overflow-hidden relative shadow-[0px_0px_50px_rgba(166,9,240,0.15)]">

                {/* --- LEFT SIDE: VISUAL ART (Hidden on mobile) --- */}
                <div className="hidden bg-white rounded-3xl border-2 border-black md:flex w-1/2 relative flex-col justify-between p-12 transition-colors duration-500">
                </div>


                {/* --- RIGHT SIDE: FORM --- */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative">

                    {/* Toggle Switch */}
                    <div className="flex bg-black p-1 rounded-full border border-[#333] w-fit mx-auto mb-12 relative z-10">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`px-8 py-3 rounded-full font-bold uppercase text-sm transition-all duration-300 ${isLogin ? 'bg-[#BDF522] text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`px-8 py-3 rounded-full font-bold uppercase text-sm transition-all duration-300 ${!isLogin ? 'bg-[#A609F0] text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form Container */}
                    <div className="w-full max-w-md mx-auto">
                        <AnimatePresence custom={isLogin ? 1 : -1} mode='wait'>
                            <motion.form
                                key={isLogin ? "login" : "signup"}
                                custom={isLogin ? 1 : -1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="flex flex-col gap-6"
                            >
                                {!isLogin && (
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-xs font-bold uppercase text-[#BDF522] tracking-wider ml-1">First Name</label>
                                            <input type="text" placeholder="JOHNNY" className="w-full bg-black border border-[#333] rounded-xl p-4 text-white font-bold placeholder-gray-700 focus:outline-none focus:border-[#A609F0] focus:bg-[#1a1a1a] transition-all" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-xs font-bold uppercase text-[#BDF522] tracking-wider ml-1">Last Name</label>
                                            <input type="text" placeholder="DESIGNER" className="w-full bg-black border border-[#333] rounded-xl p-4 text-white font-bold placeholder-gray-700 focus:outline-none focus:border-[#A609F0] focus:bg-[#1a1a1a] transition-all" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-[#BDF522] tracking-wider ml-1">Email Address</label>
                                    <div className="relative">
                                        <input type="email" placeholder="HELLO@FONTIQUE.COM" className="w-full bg-black border border-[#333] rounded-xl p-4 text-white font-bold placeholder-gray-700 focus:outline-none focus:border-[#BDF522] focus:bg-[#1a1a1a] transition-all" />
                                        {!isLogin && <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2ECC71]" />}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-bold uppercase text-[#BDF522] tracking-wider">Password</label>
                                        {isLogin && <a href="#" className="text-xs font-bold text-gray-500 hover:text-white uppercase">Forgot?</a>}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            className="w-full bg-black border border-[#333] rounded-xl p-4 text-white font-bold placeholder-gray-700 focus:outline-none focus:border-[#BDF522] focus:bg-[#1a1a1a] transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <button className={`mt-8 w-full py-5 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${isLogin ? 'bg-[#BDF522] text-black hover:bg-white' : 'bg-[#A609F0] text-white hover:bg-white hover:text-black'}`}>
                                    {isLogin ? "Enter The Void" : "Create Account"} <ArrowRight size={24} />
                                </button>

                                <div className="relative flex items-center justify-center my-4">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#333]"></div></div>
                                    <span className="relative bg-[#131413] px-4 text-xs font-bold text-gray-500 uppercase">Or Continue With</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" className="bg-black border border-[#333] py-3 rounded-xl font-bold uppercase text-sm hover:bg-[#333] transition-colors flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12.213 12.173 12.213c3.493 0 6.16-1.187 8.253-3.36 2.16-2.16 2.853-5.32 2.853-7.88 0-.787-.067-1.453-.16-2.04H12.48z"></path></svg>
                                        Google
                                    </button>
                                    <button type="button" className="bg-black border border-[#333] py-3 rounded-xl font-bold uppercase text-sm hover:bg-[#333] transition-colors flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                                        GitHub
                                    </button>
                                </div>
                            </motion.form>
                        </AnimatePresence>
                    </div>

                    {/* Footer Links */}
                    <div className="absolute bottom-6 left-0 w-full text-center">
                        <p className="text-xs font-bold text-gray-600 uppercase">
                            By continuing, you agree to our <a href="#" className="text-white hover:underline">Terms</a> & <a href="#" className="text-white hover:underline">Policy</a>
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Auth;