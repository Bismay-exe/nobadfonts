import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PreviewAccordion } from '../components/fonts/PreviewAccordion';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

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
    const { user, loading: authLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && user) {
            navigate('/profile', { replace: true });
        }
    }, [user, authLoading, navigate]);

    const handleAuth = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
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
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;

                // If session is null (email confirmation required)
                if (data.user && !data.session) {
                    setIsVerifying(true);
                } else {
                    navigate('/profile');
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [isLogin, email, password, fullName, navigate]);

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
            navigate('/profile');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [email, otp, navigate]);

    const handleSocialLogin = useCallback(async (provider: 'google' | 'github') => {
        try {
            const isNative = Capacitor.isNativePlatform();
            const redirectTo = isNative ? 'nobadfonts://auth' : `${window.location.origin}/profile`;

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo,
                    skipBrowserRedirect: isNative,
                },
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
        <div className="fixed h-screen w-screen top-0 left-0 p-2 flex bg-[rgb(var(--color-background))] z-100">
            {/* Form Side */}
            <div className="w-full md:h-full p-8 md:p-16 flex flex-col justify-center gap-5 relative">

                {/* Toggle Switch */}
                {!isVerifying && (
                    <div className="flex bg-[rgb(var(--color-card)/0.5)] p-1 rounded-full border border-[rgb(var(--color-foreground)/0.1)] w-fit mx-auto relative z-10">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`px-8 py-3 rounded-full font-bold uppercase text-sm transition-all duration-300 ${isLogin ? 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))]' : 'text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`px-8 py-3 rounded-full font-bold uppercase text-sm transition-all duration-300 ${!isLogin ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))]' : 'text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                <div className="w-full text-[rgb(var(--color-foreground))] p-2 md:p-16 rounded-4xl">
                    <h2 className="text-3xl font-bold mb-2">
                        {isVerifying ? 'Verify Email' : (isLogin ? 'Welcome Back' : 'Create Account')}
                    </h2>
                    <p className="text-[rgb(var(--color-muted-foreground))] mb-2">
                        {isVerifying
                            ? `Enter the code sent to ${email}`
                            : (isLogin ? 'Enter your details to access your account' : 'Start your journey with us today')
                        }
                    </p>

                    {error && (
                        <div className="bg-[rgb(var(--color-destructive)/0.1)] text-[rgb(var(--color-destructive))] p-3 rounded-lg text-sm border border-[rgb(var(--color-destructive)/0.2)]">
                            {error}
                        </div>
                    )}

                    {isVerifying ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-muted-foreground))] mb-1">Verification Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="123456"
                                    className="w-full bg-[rgb(var(--color-card))] border border-[rgb(var(--color-foreground)/0.1)] rounded-xl p-2 text-[rgb(var(--color-foreground))] font-bold placeholder-[rgb(var(--color-muted-foreground))] focus:outline-none focus:bg-[rgb(var(--color-foreground)/0.03)] focus:border-[rgb(var(--color-accent))] transition-all text-center tracking-widest text-2xl"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-8 w-full py-3 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))] hover:opacity-90">
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>

                            <div className="flex flex-col gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                    className="text-sm font-medium text-[rgb(var(--color-highlight))] hover:underline"
                                >
                                    Resend Code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsVerifying(false)}
                                    className="text-sm font-medium text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                                >
                                    Back to Sign Up
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleAuth} className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-medium text-[rgb(var(--color-muted-foreground))] mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[rgb(var(--color-card))] border border-[rgb(var(--color-foreground)/0.1)] rounded-xl p-2 text-[rgb(var(--color-foreground))] font-bold placeholder-[rgb(var(--color-muted-foreground))] focus:outline-none focus:bg-[rgb(var(--color-foreground)/0.03)] focus:border-[rgb(var(--color-accent))] transition-all"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-muted-foreground))] mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className={`w-full bg-[rgb(var(--color-card))] border border-[rgb(var(--color-foreground)/0.1)] rounded-xl p-2 text-[rgb(var(--color-foreground))] font-bold placeholder-[rgb(var(--color-muted-foreground))] focus:outline-none focus:bg-[rgb(var(--color-foreground)/0.03)]  transition-all ${isLogin ? 'focus:border-[rgb(var(--color-highlight))]' : 'focus:border-[rgb(var(--color-accent))]'}`}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-muted-foreground))] mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className={`w-full bg-[rgb(var(--color-card))] border border-[rgb(var(--color-foreground)/0.1)] rounded-xl p-2 text-[rgb(var(--color-foreground))] font-bold placeholder-[rgb(var(--color-muted-foreground))] focus:outline-none focus:bg-[rgb(var(--color-foreground)/0.03)]  transition-all ${isLogin ? 'focus:border-[rgb(var(--color-highlight))]' : 'focus:border-[rgb(var(--color-accent))]'}`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`mt-8 w-full py-3 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${isLogin ? 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] hover:opacity-90' : 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))] hover:opacity-90'}`}>
                                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>
                    )}

                    <div className="hidden mt-6 text-center text-sm">
                        <span className="text-[rgb(var(--color-muted-foreground))]">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[rgb(var(--color-highlight))] hover:underline font-medium"
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </div>



                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[rgb(var(--color-foreground)/0.1)]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[rgb(var(--color-card))] text-[rgb(var(--color-muted-foreground))] rounded-full">Or continue with</span>
                        </div>
                    </div>


                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] py-3 rounded-xl font-bold uppercase text-sm hover:bg-[rgb(var(--color-foreground)/0.03)] transition-colors flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12.213 12.173 12.213c3.493 0 6.16-1.187 8.253-3.36 2.16-2.16 2.853-5.32 2.853-7.88 0-.787-.067-1.453-.16-2.04H12.48z"></path></svg>
                            Google
                        </button>
                        <button
                            onClick={() => handleSocialLogin('github')}
                            className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] py-3 rounded-xl font-bold uppercase text-sm hover:bg-[rgb(var(--color-foreground)/0.03)] transition-colors flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                            GitHub
                        </button>
                    </div>
                </div>
            </div>

            {/* Branding Side */}
            <div className="hidden md:flex w-full h-full bg-[rgb(var(--color-background))] border-10 border-[rgb(var(--color-foreground))] rounded-[3rem] overflow-hidden shadow-[8px_8px_0px_0px_rgba(var(--color-foreground),1)]">
                <PreviewAccordion
                    vertical={true}
                    images={AUTH_IMAGES}
                />
            </div>
        </div>
    );
}
