import LegalLayout from './LegalLayout';
import { Lock, Eye, Database, UserCheck, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <LegalLayout
            title="Privacy Policy"
            description="How NoBadFonts collects, uses, protects, and handles your personal data in accordance with modern global privacy regulations (GDPR, CCPA/CPRA)."
            lastUpdated="September 2026"
        >
            <div className="space-y-10">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">1. Introduction</h2>
                    <p>
                        NoBadFonts ("we", "our", or "us") is dedicated to protecting the privacy of our visitors and registered typography creators. This Privacy Policy details how we collect, use, and safeguard personal information when you visit nobadfonts.in, use our platform, or interact with our APIs.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">2. Information We Collect</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[rgb(var(--color-foreground))]">
                                <UserCheck size={18} className="text-[rgb(var(--color-highlight))]" />
                                Account & Profile Information
                            </div>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                When creating an account, we collect your email address, optional full name/display handle, avatar URL, and social links provided in your public profile.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[rgb(var(--color-foreground))]">
                                <Database size={18} className="text-[rgb(var(--color-highlight))]" />
                                Content & Activity Data
                            </div>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                When you interact with fonts, we store your saved favorites, upload records, and aggregate download counters to highlight trending typography.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[rgb(var(--color-foreground))]">
                                <Lock size={18} className="text-[rgb(var(--color-highlight))]" />
                                Technical & Session Data
                            </div>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                Standard browser headers, IP addresses (hashed/anonymized for security logs), browser user-agents, and session authentication tokens issued by Supabase Auth.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[rgb(var(--color-foreground))]">
                                <Eye size={18} className="text-[rgb(var(--color-highlight))]" />
                                Local Browser Storage
                            </div>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                Client-side preferences including UI color themes (Dark/Light/Sepia/etc.), catalog view mode preferences, and cookie consent status are saved locally in your browser.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">3. How We Use Your Data</h2>
                    <p>We process your personal information strictly for legitimate operational purposes:</p>
                    <ul className="list-disc pl-6 space-y-2 text-[rgb(var(--color-muted-foreground))]">
                        <li>To provide, operate, and maintain the NoBadFonts platform and API endpoints.</li>
                        <li>To authenticate registered users and manage member permissions.</li>
                        <li>To generate webfont CSS embeds and serve dynamic font previews.</li>
                        <li>To prevent automated abuse, spam, security threats, and fraudulent copyright claims.</li>
                        <li>To calculate aggregated community stats (top downloads, editor's picks, and trending typography).</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">4. Third-Party Infrastructure</h2>
                    <p>
                        We do not sell, rent, or trade your personal data to third parties. We only share necessary information with reputable cloud service infrastructure providers:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-[rgb(var(--color-muted-foreground))]">
                        <li><strong>Supabase:</strong> Cloud database, user authentication, and encrypted file storage provider.</li>
                        <li><strong>Vercel:</strong> Cloud edge network and hosting infrastructure.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">5. Your Privacy Rights (GDPR & CCPA)</h2>
                    <p>Depending on your location, you have statutory rights concerning your personal data:</p>
                    <div className="p-6 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-3">
                        <div className="flex items-center gap-2 font-bold text-[rgb(var(--color-foreground))]">
                            <Shield size={20} className="text-[rgb(var(--color-highlight))]" />
                            User Rights Checklist
                        </div>
                        <ul className="space-y-1.5 text-sm text-[rgb(var(--color-muted-foreground))] pl-4">
                            <li>• <strong>Right of Access & Portability:</strong> You may request a copy of all personal data held about you.</li>
                            <li>• <strong>Right to Rectification:</strong> You may update or correct your profile details anytime via your account settings.</li>
                            <li>• <strong>Right to Erasure ("Right to be Forgotten"):</strong> You may request permanent deletion of your account and associated personal data.</li>
                            <li>• <strong>Non-Discrimination:</strong> We will never deny services or degrade performance for exercising your privacy rights.</li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">6. Data Deletion Requests</h2>
                    <p>
                        To request the deletion of your account and all associated personal data, please contact our privacy coordinator at <a href="mailto:privacy@nobadfonts.in" className="underline font-bold text-[rgb(var(--color-foreground))]">privacy@nobadfonts.in</a>. All verifiable deletion requests will be completed within 30 days.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
