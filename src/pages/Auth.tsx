import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, ArrowRight, Github } from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../components/shared/SEO';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }
            navigate(searchParams.get('redirect') || '/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid items-center justify-center relative bg-black overflow-hidden font-sans">
            <SEO title={isLogin ? "Sign In" : "Sign Up"} description="Access your account to manage fonts and downloads." />

            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md p-8 md:p-12 z-10"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <Link to="/" className="inline-block text-2xl font-bold tracking-tighter text-white mb-6 hover:opacity-80 transition-opacity">
                        Fontique
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {isLogin ? "Welcome back" : "Create account"}
                    </h1>
                    <p className="text-zinc-400">
                        {isLogin ? "Enter your credentials to access your account" : "Start your journey with us today"}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all shadow-inner"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                            {isLogin && <a href="#" className="text-xs text-white/50 hover:text-white transition-colors">Forgot?</a>}
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all shadow-inner"
                                placeholder={isLogin ? "••••••••" : "Min. 8 characters"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold text-lg rounded-xl py-4 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        {loading && <Loader2 size={20} className="animate-spin" />}
                        {isLogin ? "Sign In" : "Sign Up"}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-zinc-500">Or continue with</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white hover:bg-zinc-800 transition-colors font-medium text-sm">
                        <Github size={18} /> GitHub
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white hover:bg-zinc-800 transition-colors font-medium text-sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.147-1.133 7.973-3.04 1.853-1.853 2.533-4.64 2.533-7.04 0-.587-.04-1.173-.093-1.72h-10.453z" /></svg> Google
                    </button>
                </div>

                {/* Footer Toggle */}
                <p className="mt-8 text-center text-zinc-400 text-sm">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white font-bold hover:underline decoration-1 underline-offset-4"
                    >
                        {isLogin ? "Sign up" : "Sign in"}
                    </button>
                </p>

            </motion.div>
        </div>
    );
}

