import LegalLayout from './LegalLayout';
import { ShieldCheck, AlertCircle, Check } from 'lucide-react';

export default function TermsOfService() {
    return (
        <LegalLayout
            title="Terms of Service"
            description="The rules and legal requirements governing your use of NoBadFonts, user accounts, font submissions, and typography downloads."
            lastUpdated="September 2026"
        >
            <div className="space-y-10">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">1. Acceptance of Terms</h2>
                    <p>
                        By accessing, browsing, or utilizing <strong>NoBadFonts</strong> (located at nobadfonts.in, including our mobile applications, APIs, and command-line interfaces), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you must not use or access our services.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">2. User Accounts & Membership</h2>
                    <p>
                        To upload fonts, favorite typefaces, or access member features, you must register an account. You agree to provide accurate, current, and complete information during registration and keep your authentication credentials confidential. You are responsible for all activities that occur under your account.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">3. Font Uploads & Creator Representations</h2>
                    <div className="p-6 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-4">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="text-[rgb(var(--color-highlight))] shrink-0 mt-1" size={22} />
                            <div>
                                <h4 className="font-bold text-[rgb(var(--color-foreground))]">Mandatory Creator Warranties</h4>
                                <p className="text-sm text-[rgb(var(--color-muted-foreground))] mt-1 leading-relaxed">
                                    When uploading font software (in TrueType, OpenType, WOFF, or WOFF2 formats) or accompanying showcase graphics to NoBadFonts, you explicitly represent and warrant that:
                                </p>
                            </div>
                        </div>

                        <ul className="space-y-2 text-sm pl-9">
                            <li className="flex items-start gap-2">
                                <Check size={16} className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" />
                                <span>You are the original creator/foundry of the font software, OR you possess explicit legal authorization or a valid open-source license (such as the SIL Open Font License, Apache 2.0, or CC0) allowing public hosting and distribution.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check size={16} className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" />
                                <span>The font file does not infringe upon any third-party copyright, trademark, trade secret, or proprietary intellectual property right.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check size={16} className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" />
                                <span>You will truthfully specify the precise <strong>License Type</strong> (e.g., SIL OFL, Personal Use Only, 100% Free) governing the file during the upload submission.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check size={16} className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" />
                                <span>The file contains no viruses, trojan horses, worms, backdoors, spyware, or malicious code.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">4. Downloading & Font Usage Licenses</h2>
                    <p>
                        NoBadFonts serves as a discovery platform and curated directory. Each font available on our platform remains subject to the individual license under which its author or foundry provided it.
                    </p>
                    <p>
                        It is your sole responsibility as an end-user or commercial designer to inspect the <strong>License Type</strong> on each font details page prior to utilizing any typeface in commercial brand assets, client projects, SaaS web applications, or mobile software.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">5. Prohibited Conduct</h2>
                    <p>You agree not to engage in any of the following activities on our service:</p>
                    <ul className="list-disc pl-6 space-y-2 text-[rgb(var(--color-muted-foreground))]">
                        <li>Uploading commercial typography ripped, cracked, or pirated from paid digital foundries (e.g., Monotype, Adobe Type, Linotype, etc.).</li>
                        <li>Automated scraping, bulk downloading, or crawling that impairs server performance without prior written consent.</li>
                        <li>Circumventing security measures, access controls, or storage bucket policies.</li>
                        <li>Harassing designers or submitting fraudulent copyright claims.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">6. Disclaimers & Limitation of Liability</h2>
                    <div className="p-6 rounded-2xl bg-[rgb(var(--color-destructive)/0.05)] border border-[rgb(var(--color-destructive)/0.2)] flex items-start gap-4">
                        <AlertCircle className="text-[rgb(var(--color-destructive))] shrink-0 mt-1" size={24} />
                        <div className="text-sm space-y-2">
                            <p className="font-bold text-[rgb(var(--color-foreground))]">Warranty Disclaimer</p>
                            <p className="text-[rgb(var(--color-muted-foreground))] leading-relaxed">
                                NoBadFonts is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. In no event shall NoBadFonts, its founders, or contributors be liable for any indirect, incidental, special, or consequential damages resulting from the use of font files or third-party intellectual property claims.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">7. Copyright & DMCA Takedowns</h2>
                    <p>
                        We respond promptly to valid copyright notices. If you believe your copyrighted font has been uploaded without authorization, please consult our dedicated <a href="/legal/dmca" className="underline font-bold text-[rgb(var(--color-foreground))]">DMCA Policy</a> for instructions on filing an official takedown notice.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
