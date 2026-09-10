import LegalLayout from './LegalLayout';
import { CheckCircle2, SlidersHorizontal, Shield } from 'lucide-react';

export default function SiteCookies() {
    return (
        <LegalLayout
            title="Cookie Policy"
            description="How NoBadFonts uses browser cookies and local storage to provide a fast, secure, and personalized typography browsing experience."
            lastUpdated="September 2026"
        >
            <div className="space-y-10">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">1. What Are Cookies and Local Storage?</h2>
                    <p>
                        Cookies and browser local storage are small data files placed on your computer, tablet, or smartphone when you visit web platforms. They allow the website to recognize your browser, remember your user preferences, and keep you authenticated as you navigate through different pages.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">2. Types of Storage Technologies We Use</h2>

                    <div className="space-y-4">
                        <div className="p-6 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-base text-[rgb(var(--color-foreground))]">
                                <CheckCircle2 size={18} className="text-[rgb(var(--color-highlight))]" />
                                Strictly Necessary & Authentication (Essential)
                            </div>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                These cookies and storage tokens are essential for you to log in, navigate the site securely, and manage font uploads. Without them, authenticated sessions and secure member areas cannot function.
                            </p>
                            <div className="text-xs font-mono text-[rgb(var(--color-muted-foreground)/0.8)] pt-2 border-t border-[rgb(var(--color-border))]">
                                Example: <code>sb-*-auth-token</code> (Supabase secure session state)
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-base text-[rgb(var(--color-foreground))]">
                                <SlidersHorizontal size={18} className="text-[rgb(var(--color-highlight))]" />
                                Functionality & User Preferences
                            </div>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                We utilize HTML5 LocalStorage to remember your UI display settings between visits so you don't have to reconfigure your workspace every time you open the site.
                            </p>
                            <div className="text-xs font-mono text-[rgb(var(--color-muted-foreground)/0.8)] pt-2 border-t border-[rgb(var(--color-border))]">
                                Examples: <code>theme</code> (Dark/Light/Vibrant/Sepia), <code>cookie_consent</code>, catalog view layout
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-base text-[rgb(var(--color-foreground))]">
                                <Shield size={18} className="text-[rgb(var(--color-highlight))]" />
                                Analytics & Performance
                            </div>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                Used solely in aggregate to understand which typefaces are popular and monitor system performance. We do not use third-party behavioral advertising or cross-site tracking cookies.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">3. Managing Your Cookie Preferences</h2>
                    <p>
                        You can adjust your cookie settings at any time through our on-site cookie consent banner or directly inside your web browser preferences. Most modern browsers allow you to block or delete cookies:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--color-muted-foreground))]">
                        <li><strong>Chrome:</strong> Settings → Privacy and Security → Third-Party Cookies</li>
                        <li><strong>Safari:</strong> Settings → Preferences → Privacy → Block all cookies</li>
                        <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                        <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                    </ul>
                    <p className="text-sm text-[rgb(var(--color-muted-foreground))] mt-2">
                        <em>Please note: Disabling strictly necessary cookies may prevent authentication and account-related features from functioning properly.</em>
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
