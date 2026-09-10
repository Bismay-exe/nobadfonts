import LegalLayout from './LegalLayout';
import { AlertTriangle, CheckCircle2, Mail, ShieldAlert } from 'lucide-react';

export default function DmcaPolicy() {
    return (
        <LegalLayout
            title="DMCA / Copyright Policy"
            description="Our procedures for handling copyright infringement notifications, takedowns, and counter-notifications under the Digital Millennium Copyright Act (DMCA)."
            lastUpdated="September 2026"
        >
            <div className="space-y-10">
                {/* Intro Notice */}
                <div className="p-6 rounded-2xl bg-[rgb(var(--color-primary)/0.05)] border border-[rgb(var(--color-primary)/0.2)] flex items-start gap-4">
                    <ShieldAlert className="text-[rgb(var(--color-primary))] shrink-0 mt-1" size={24} />
                    <div className="text-sm space-y-1">
                        <p className="font-bold text-[rgb(var(--color-foreground))]">Notice to Rights Holders</p>
                        <p className="text-[rgb(var(--color-muted-foreground))]">
                            NoBadFonts (nobadfonts.in) respects the intellectual property rights of typeface designers and creators. In accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512), we respond expeditiously to notices of alleged infringement and maintain a strict repeat-infringer policy.
                        </p>
                    </div>
                </div>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">1. Safe Harbor Overview</h2>
                    <p>
                        NoBadFonts operates as an interactive digital archive and community repository that enables registered members and typeface designers to upload, test, and distribute font software.
                    </p>
                    <p>
                        Because user-generated font files are stored at the direction of third-party users, NoBadFonts qualifies for the safe harbor protections set forth under 17 U.S.C. § 512(c). Upon receipt of a valid and complete notification of claimed copyright infringement, we will act promptly to remove or disable access to the allegedly infringing font file and variants.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">2. Submitting a DMCA Takedown Notice</h2>
                    <p>
                        If you are a copyright owner, or an agent authorized to act on behalf of one, and you believe in good faith that a font hosted on NoBadFonts infringes your copyrighted work, please submit a written notification containing the following information:
                    </p>
                    <div className="space-y-3 pl-2">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" size={18} />
                            <span><strong>Identification of the copyrighted work:</strong> The name of the original typeface, registration number (if registered), or link to the official repository/foundry page.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" size={18} />
                            <span><strong>Identification of the infringing material:</strong> The specific URL(s) on nobadfonts.in (e.g., <code>https://nobadfonts.in/fonts/[slug]</code>) where the disputed font is located.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" size={18} />
                            <span><strong>Contact Information:</strong> Your legal full name, company/foundry name, address, telephone number, and official email address.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" size={18} />
                            <span><strong>Good Faith Statement:</strong> "I have a good faith belief that use of the copyrighted material described above is not authorized by the copyright owner, its agent, or the law."</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" size={18} />
                            <span><strong>Accuracy & Penalty of Perjury Statement:</strong> "The information in this notification is accurate, and under penalty of perjury, I am the copyright owner or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed."</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-[rgb(var(--color-highlight))] shrink-0 mt-0.5" size={18} />
                            <span><strong>Signature:</strong> A physical or electronic signature of the copyright owner or an authorized representative.</span>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">3. Designated Copyright Agent</h2>
                    <p>
                        Please deliver your complete DMCA notification to our Designated Copyright Agent via email:
                    </p>
                    <div className="p-6 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] space-y-2 font-mono text-sm">
                        <div className="flex items-center gap-2 text-[rgb(var(--color-foreground))] font-bold">
                            <Mail size={16} /> dmca@nobadfonts.in
                        </div>
                        <p className="text-[rgb(var(--color-muted-foreground))]">Attn: NoBadFonts Copyright Agent / Legal Compliance</p>
                        <p className="text-[rgb(var(--color-muted-foreground))]">Online: nobadfonts.in</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">4. Counter-Notification Procedure</h2>
                    <p>
                        If you believe that your uploaded font was removed or disabled as a result of mistake or misidentification (for instance, if you hold a valid open-source SIL OFL license or public domain release for the file), you may file a written Counter-Notification with our copyright agent containing:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-[rgb(var(--color-muted-foreground))]">
                        <li>Your physical or electronic signature.</li>
                        <li>Identification of the material that was removed and the URL where it previously appeared.</li>
                        <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.</li>
                        <li>Your name, address, telephone number, and consent to jurisdiction in the federal or appropriate legal district.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">5. Repeat Infringer Policy</h2>
                    <div className="p-6 rounded-2xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] flex items-start gap-4">
                        <AlertTriangle className="text-[rgb(var(--color-warning))] shrink-0 mt-1" size={24} />
                        <div className="text-sm space-y-1">
                            <p className="font-bold text-[rgb(var(--color-foreground))]">Account Suspension & Termination</p>
                            <p className="text-[rgb(var(--color-muted-foreground))]">
                                In accordance with § 512(i) of the DMCA, NoBadFonts maintains a policy that provides for the immediate suspension or permanent termination of user accounts who are deemed to be repeat infringers or who repeatedly upload font files without verifiable distribution licenses.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </LegalLayout>
    );
}
