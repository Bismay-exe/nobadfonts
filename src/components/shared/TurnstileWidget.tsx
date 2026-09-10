import { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onError?: (err?: any) => void;
    onExpire?: () => void;
    className?: string;
}

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: string | HTMLElement,
                params: {
                    sitekey: string;
                    callback: (token: string) => void;
                    'error-callback'?: () => void;
                    'expired-callback'?: () => void;
                    theme?: 'light' | 'dark' | 'auto';
                }
            ) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onloadTurnstileCallback?: () => void;
    }
}

export default function TurnstileWidget({ onVerify, onError, onExpire, className = '' }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    const [isDevMode, setIsDevMode] = useState(!siteKey);

    useEffect(() => {
        // If no sitekey is configured, activate Dev/Bypass mode
        if (!siteKey) {
            setIsDevMode(true);
            const timer = setTimeout(() => {
                onVerify('bypass_dev_token');
            }, 300);
            return () => clearTimeout(timer);
        }

        let isMounted = true;

        const renderWidget = () => {
            if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

            try {
                const id = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme: 'auto',
                    callback: (token: string) => {
                        if (isMounted) onVerify(token);
                    },
                    'error-callback': () => {
                        if (isMounted && onError) onError();
                    },
                    'expired-callback': () => {
                        if (isMounted && onExpire) onExpire();
                    }
                });
                widgetIdRef.current = id;
            } catch (e) {
                console.error('Turnstile render failed:', e);
            }
        };

        // If turnstile script already loaded
        if (window.turnstile) {
            renderWidget();
        } else {
            // Load Cloudflare Turnstile script
            const scriptId = 'cf-turnstile-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    if (isMounted) renderWidget();
                };
                document.head.appendChild(script);
            } else {
                const interval = setInterval(() => {
                    if (window.turnstile) {
                        clearInterval(interval);
                        if (isMounted) renderWidget();
                    }
                }, 100);
                return () => clearInterval(interval);
            }
        }

        return () => {
            isMounted = false;
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch (_) {}
                widgetIdRef.current = null;
            }
        };
    }, [siteKey, onVerify, onError, onExpire]);

    if (isDevMode) {
        return (
            <div className={`flex items-center gap-2 p-3 rounded-xl bg-[rgb(var(--color-foreground)/0.03)] border border-[rgb(var(--color-foreground)/0.08)] text-xs text-[rgb(var(--color-muted-foreground))] ${className}`}>
                <ShieldCheck size={16} className="text-[rgb(var(--color-highlight))] shrink-0" />
                <span>Protected by Bot Verification <em>(Auto-verified in local development)</em></span>
            </div>
        );
    }

    return (
        <div className={`my-2 flex justify-center ${className}`}>
            <div ref={containerRef} />
        </div>
    );
}
