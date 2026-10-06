import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PreviewAccordion } from '../components/fonts/PreviewAccordion';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import TurnstileWidget from '../components/shared/TurnstileWidget';
import SEO from '../components/shared/SEO';
import { ArrowRight } from 'lucide-react';

const AUTH_IMAGES = [
    "https://st.1001fonts.net/img/illustrations/m/o/moldin-demo-font-10-large.avif",
    "https://st.1001fonts.net/img/illustrations/q/u/qurova-demo-font-13-large.avif",
    "https://st.1001fonts.net/img/illustrations/g/r/groovy-alphabet-font-4-large.avif",
    "https://st.1001fonts.net/img/illustrations/t/r/transcity-font-4-large.avif",
    "https://st.1001fonts.net/img/illustrations/b/i/bizantheum-font-3-large.avif",
    "https://st.1001fonts.net/img/illustrations/g/o/golden-girdle-font-9-large.avif",
    "https://st.1001fonts.net/img/illustrations/d/u/duhit-font-5-large.avif",
    "https://st.1001fonts.net/img/illustrations/b/l/blush-asliring-font-6-large.avif",
    "https://st.1001fonts.net/img/illustrations/b/l/blush-asliring-font-4-large.avif",
    "https://st.1001fonts.net/img/illustrations/m/o/moliga-demo-font-2-large.avif",
    "https://st.1001fonts.net/img/illustrations/z/a/zaslia-font-7-large.avif",
    "https://st.1001fonts.net/img/illustrations/t/h/the-jacatra-font-4-large.avif",
    "https://st.1001fonts.net/img/illustrations/m/o/mosseta-font-11-large.avif",
    "https://st.1001fonts.net/img/illustrations/m/o/moot-jungle-free-version-font-3-large.avif",
    "https://st.1001fonts.net/img/illustrations/t/h/the-munday-free-version-font-6-large.avif",
    "https://st.1001fonts.net/img/illustrations/m/o/moldin-demo-font-3-large.avif",
    "https://st.1001fonts.net/img/illustrations/v/a/varelle-demo-font-8-large.avif",
    "https://st.1001fonts.net/img/illustrations/b/l/blush-asliring-font-10-large.avif",
];

export default function Auth() {
    const { user, loading: authLoading, needsOnboarding } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [honeypot, setHoneypot] = useState('');
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && user) {
            if (needsOnboarding) {
                navigate('/onboarding', { replace: true });
            } else {
                navigate('/profile', { replace: true });
            }
        }
    }, [user, authLoading, needsOnboarding, navigate]);

    const handleAuth = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Honeypot check
        if (honeypot) {
            console.warn('Bot submission trapped via honeypot.');
            return;
        }

        // Turnstile check
        if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
            setError('Please complete the bot verification.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/profile');
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                // If session is null (email confirmation required)
                if (data.user && !data.session) {
                    setIsVerifying(true);
                } else {
                    navigate('/onboarding');
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [isLogin, email, password, navigate, honeypot, turnstileToken]);

    const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup'
            });

            if (error) throw error;
            navigate('/onboarding');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [email, otp, navigate]);

    const handleSocialLogin = useCallback(async (provider: 'google' | 'github') => {
        try {
            const isNative = Capacitor.isNativePlatform();
            const redirectTo = isNative ? 'nobadfonts://auth' : `${window.location.origin}/onboarding`;

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo,
                    skipBrowserRedirect: isNative,
                }
            });
            if (error) throw error;
            if (isNative && data?.url) {
                await Browser.open({ url: data.url, windowName: '_self' });
            }
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    const handleResendOtp = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });
            if (error) throw error;
            await Toast.show({
                text: 'Code resent! Check your email (and spam support).',
                duration: 'short'
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [email]);

    return (
        <div className="fixed top-0 left-0 h-screen w-screen flex justify-center bg-background z-100">
            <SEO title="Sign In / Register | NoBadFonts" noindex url="/auth" />
            <div className='max-w-480 w-full flex gap-4 md:gap-8 font-inter zoverflow-y-auto'>
                {/* Form Side */}
                <div className="w-full md: h-full p-4 md:p-16 flex flex-col justify-center gap-5 relative overflow-y-auto">
                    <div className="w-full text-foreground p-2 md:p-16 rounded-4xl">

                        {/* {!isVerifying && (
                            <div className="w-full mx-auto relative z-10 text-lg">
                                {isLogin ? (
                                    <h3 className='text-foreground sm:flex'>
                                        New to NoBadFonts?
                                        <span
                                            onClick={() => setIsLogin(false)}
                                            className='sm:ml-1 italic text-muted hover:text-foreground cursor-pointer flex items-center gap-2 group'
                                        >
                                            Create Account
                                            <ArrowRight size={18} className='group-hover:translate-x-1 transition-all duration-300 ease-in-out' />
                                        </span>
                                    </h3>
                                ) : (<h3 className='text-foreground flex'>
                                    Already have an account? <br className='sm:hidden'/>
                                    <span
                                        onClick={() => setIsLogin(true)}
                                        className='sm:ml-1 italic text-muted hover:text-foreground cursor-pointer flex items-center gap-2 group'
                                    >
                                        Sign in
                                        <ArrowRight size={18} className='group-hover:translate-x-1 transition-all duration-300 ease-in-out' />
                                    </span>
                                </h3>)}
                            </div>
                        )} */}

                        <h2 className="font-inter text-[clamp(3.1rem,9vw,7rem)] font-semibold tracking-tighter leading-none mt-3 sm:mt-4 lg:mt-5">
                            {isVerifying ? 'Verify Email' : (isLogin ? ('Welcome Back') : 'Create Account')}
                        </h2>
                        <p className="text-muted block mt-4 sm:mt-5 lg:mt-6 max-w-md font-space-mono leading-relaxed mb-8">
                            {isVerifying
                                ? `Enter the code sent to ${email}`
                                : (isLogin ? 'Sign in to continue shopping, manage your wishlist, and keep everything synced across your devices.' : 'Create your account to save your wishlist, track orders, and enjoy a personalized shopping experience.')
                            }
                        </p>

                        {error && (
                            <div className="bg-warning/10 text-warning p-3 rounded-lg text-sm border border-warning/20">
                                {error}
                            </div>
                        )}

                        {isVerifying ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1">Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="123456"
                                        className="w-full bg-card-background border border-foreground/10 rounded-xl p-2 text-foreground font-bold placeholder-muted focus:outline-none focus:bg-foreground/3 focus:border-foreground transition-all text-center tracking-widest text-2xl"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-8 w-full py-3 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] bg-foreground text-background hover:opacity-90">
                                    {loading ? 'Verifying...' : 'Verify Email'}
                                </button>

                                <div className="flex flex-col gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                        className="text-sm font-medium text-foreground hover:underline"
                                    >
                                        Resend Code
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsVerifying(false)}
                                        className="text-sm font-medium text-muted hover:text-foreground"
                                    >
                                        Back to Sign Up
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleAuth} className="space-y-4">

                                <div className=''>
                                    <label className="uppercase tracking-[0.25em] text-xs text-muted mb-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                        className='flex-1 w-full mt-3 sm:mt-4 lg:mt-5 bg-transparent outline-none font-inter text-[clamp(2rem,6vw,4rem)] font-medium leading-tight placeholder:text-border caret-foreground pb-4 sm:pb-8 lg:pb-10 border-b border-border focus:border-foreground focus:outline-none transition-colors duration-300 ease-in-out'
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className=''>
                                    <label className="uppercase tracking-[0.25em] text-xs text-muted mb-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className='flex-1 w-full mt-3 sm:mt-4 lg:mt-5 bg-transparent outline-none font-inter text-[clamp(2rem,6vw,4rem)] font-medium leading-tight placeholder:text-border caret-foreground pb-4 sm:pb-8 lg:pb-10 border-b border-border focus:border-foreground focus:outline-none transition-colors duration-300 ease-in-out'
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                {/* <button
                                    type="submit"
                                    disabled={loading}
                                    className={`mt-8 w-full py-3 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${isLogin ? 'bg-foreground text-background hover:opacity-90' : 'bg-foreground text-background hover:opacity-90'}`}>
                                    {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
                                </button> */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group mt-10 sm:mt-12 lg:mt-16 flex items-center gap-3 sm:gap-5 cursor-pointer"
                                >
                                    <span className="font-inter text-[clamp(1.8rem,4vw,3rem)] font-semibold">
                                        {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
                                    </span>

                                    <div className="w-[clamp(3rem,4vw,4rem)] h-[clamp(3rem,4vw,4rem)] rounded-full border border-border flex items-center justify-center gap-12 relative transition-all duration-300 group-hover:bg-foreground group-hover:text-background overflow-hidden">
                                        <ArrowRight className="absolute transition-transform duration-300 translate-x-0 group-hover:translate-x-10" />
                                        <ArrowRight className="absolute transition-transform duration-300 -translate-x-10 group-hover:translate-x-0" />
                                    </div>
                                </button>
                            </form>
                        )}

                        <div className="hidden mt-6 text-center text-sm">
                            <span className="text-muted">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                            </span>
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-foreground hover:underline font-medium"
                            >
                                {isLogin ? 'Sign Up' : 'Login'}
                            </button>
                        </div>

                        {!isVerifying && (
                            <div className="w-full mx-auto relative z-10 text-lg mt-8">
                                {isLogin ? (
                                    <h3 className='text-foreground sm:flex'>
                                        New to NoBadFonts?
                                        <span
                                            onClick={() => setIsLogin(false)}
                                            className='sm:ml-1 italic text-muted hover:text-foreground cursor-pointer flex items-center gap-2 group'
                                        >
                                            Create Account
                                            <ArrowRight size={18} className='group-hover:translate-x-1 transition-all duration-300 ease-in-out' />
                                        </span>
                                    </h3>
                                ) : (<h3 className='text-foreground flex'>
                                    Already have an account? <br className='sm:hidden' />
                                    <span
                                        onClick={() => setIsLogin(true)}
                                        className='sm:ml-1 italic text-muted hover:text-foreground cursor-pointer flex items-center gap-2 group'
                                    >
                                        Sign in
                                        <ArrowRight size={18} className='group-hover:translate-x-1 transition-all duration-300 ease-in-out' />
                                    </span>
                                </h3>)}
                            </div>
                        )}



                        <div className="relative my-6">
                            {/* <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-foreground/10"></div>
                            </div> */}
                            <div className="relative flex zjustify-center">
                                <span className="text-muted text-lg rounded-full">Or continue with</span>
                            </div>
                        </div>


                        {/* <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => handleSocialLogin('google')}
                                className="bg-card-background border border-foreground/10 text-foreground py-3 rounded-xl font-bold uppercase text-sm hover:bg-foreground/3 transition-colors duration-300 ease-in-out flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12.213 12.173 12.213c3.493 0 6.16-1.187 8.253-3.36 2.16-2.16 2.853-5.32 2.853-7.88 0-.787-.067-1.453-.16-2.04H12.48z"></path></svg>
                                Google
                            </button>
                            <button
                                onClick={() => handleSocialLogin('github')}
                                className="bg-card-background border border-foreground/10 text-foreground py-3 rounded-xl font-bold uppercase text-sm hover:bg-foreground/3 transition-colors duration-300 ease-in-out flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                                GitHub
                            </button>
                        </div> */}

                        <div>
                            <button
                                onClick={() => handleSocialLogin('google')}
                                className="w-full border- border-foreground/10 text-muted hover:text-foreground py-3 font-medium text-xl transition-colors duration-300 ease-in-out flex items-center gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 16 16">
                                    <path fill="currentColor" d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301c1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z" />
                                </svg>
                                Continue with Google
                            </button>
                            <button
                                onClick={() => handleSocialLogin('github')}
                                className="w-full border- border-foreground/10 text-muted hover:text-foreground py-3 font-medium text-xl transition-colors duration-300 ease-in-out flex items-center gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 16 16">
                                    <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59c.4.07.55-.17.55-.38c0-.19-.01-.82-.01-1.49c-2.01.37-2.53-.49-2.69-.94c-.09-.23-.48-.94-.82-1.13c-.28-.15-.68-.52-.01-.53c.63-.01 1.08.58 1.23.82c.72 1.21 1.87.87 2.33.66c.07-.52.28-.87.51-1.07c-1.78-.2-3.64-.89-3.64-3.95c0-.87.31-1.59.82-2.15c-.08-.2-.36-1.02.08-2.12c0 0 .67-.21 2.2.82c.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82c.44 1.1.16 1.92.08 2.12c.51.56.82 1.27.82 2.15c0 3.07-1.87 3.75-3.65 3.95c.29.25.54.73.54 1.48c0 1.07-.01 1.93-.01 2.2c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                                </svg>
                                Continue with GitHub
                            </button>
                        </div>

                        {/* Anti-spam Honeypot field (hidden from real users) */}
                        <div className="opacity-0 absolute -left-2499.75 -top-2499.75 pointer-events-none" aria-hidden="true" tabIndex={-1}>
                            <input
                                type="text"
                                name="website_url"
                                autoComplete="off"
                                tabIndex={-1}
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                            />
                        </div>

                        {/* Cloudflare Turnstile Bot Protection */}
                        <div className="hidden pt-2 zflex justify-center">
                            <TurnstileWidget onVerify={setTurnstileToken} />
                        </div>
                    </div>
                </div>

                {/* Branding Side */}
                <div className='hidden md:block w-full h-full p-4 md:p-8'>
                    <div className="flex w-full h-full bg-background border-10 border-foreground rounded-[3rem] overflow-hidden shadow-[8px_8px_0px_0px_rgba(var(--color-foreground),1)]">
                        <PreviewAccordion
                            vertical={true}
                            images={AUTH_IMAGES}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
