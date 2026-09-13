import LegalLayout from './LegalLayout';

export default function DmcaPolicy() {
    return (
        <LegalLayout
            title="DMCA & Copyright"
            description="Our procedures for handling copyright infringement notifications, takedowns, and counter-notices under the Digital Millennium Copyright Act."
            lastUpdated="13 September 2026"
        >
            <div className="space-y-20">
                <section className="space-y-8">
                    <h2>The short version</h2>
                    <p>
                        <strong>NoBadFonts</strong> was built by developers and designers to celebrate typography and support legitimate type foundries. We do not host pirated commercial fonts, and we do not tolerate copyright infringement. If someone has uploaded your copyrighted font software without your authorization, send us a formal notification following the steps below and our team will take it down promptly—usually within 24 to 48 hours.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Safe harbor & our role as an archive</h2>
                    <p>
                        <strong>Platform architecture.</strong>{' '}
                        NoBadFonts operates as a community repository and interactive testing sandbox that allows registered members and independent type creators to upload, preview, and share open-source and freely licensed font software. Because typography files are uploaded at the direction of third-party users, NoBadFonts qualifies for the safe harbor protections established under Section 512(c) of the Digital Millennium Copyright Act (17 U.S.C. § 512).
                    </p>
                    <p>
                        <strong>Expeditious action.</strong>{' '}
                        While we benefit from safe harbor provisions, our commitment to typography creators goes further: we actively review reported files, inspect uploaded font metadata, and act expeditiously to remove or disable access to any font binary found to infringe upon third-party intellectual property rights.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Submitting a DMCA takedown notice</h2>
                    <p>
                        If you are a copyright owner, or an agent authorized to act on behalf of one, and you believe in good faith that a typeface hosted on NoBadFonts infringes your exclusive rights, please deliver a written notification to our Designated Copyright Agent containing all of the following information:
                    </p>
                    <p>
                        <strong>1. Identification of the copyrighted work.</strong>{' '}
                        The specific name of the original typeface or font software, the copyright registration number (if registered with the US Copyright Office or international equivalents), or direct links to your official website, digital foundry catalogue, or authorized distributor where the authentic work is showcased.
                    </p>
                    <p>
                        <strong>2. Exact location of the infringing material.</strong>{' '}
                        The specific URL(s) on NoBadFonts where the disputed typeface is accessible (for example: <code>https://nobadfonts.in/fonts/[font-slug]</code>). Please provide specific page links rather than general search queries so our team can immediately identify and disable the correct records.
                    </p>
                    <p>
                        <strong>3. Your contact information.</strong>{' '}
                        Your full legal name, title, company or type foundry name, physical mailing address, telephone number, and official corporate email address.
                    </p>
                    <p>
                        <strong>4. Good-faith belief statement.</strong>{' '}
                        A statement that: <em>"I have a good-faith belief that the use of the copyrighted font software in the manner complained of is not authorized by the copyright owner, its agent, or the law."</em>
                    </p>
                    <p>
                        <strong>5. Statement of accuracy under penalty of perjury.</strong>{' '}
                        A statement that: <em>"The information in this notification is accurate, and under penalty of perjury, I am the copyright owner or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed."</em>
                    </p>
                    <p>
                        <strong>6. Physical or electronic signature.</strong>{' '}
                        A physical or electronic signature of the copyright owner or an authorized representative (typing your full legal name at the bottom of the email satisfies this requirement).
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>What happens upon receipt of a notice</h2>
                    <p>
                        <strong>Immediate disabling.</strong>{' '}
                        Upon receiving a complete and valid notification that satisfies 17 U.S.C. § 512(c)(3), we immediately disable public access to the disputed font page, delete the font binary from our Supabase storage buckets, and issue a global cache-invalidation request across our Cloudflare and Vercel edge networks.
                    </p>
                    <p>
                        <strong>Uploader notification.</strong>{' '}
                        We promptly notify the registered member who uploaded the font file, providing them with a complete copy of your takedown notice so they are fully informed of the claimed infringement and have an opportunity to respond if the removal was the result of mistake or misidentification.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Counter-notification procedure</h2>
                    <p>
                        If you are an uploader and believe that your font was removed or disabled as a result of mistake, misidentification, or false claiming (for example, if you are the legitimate creator or hold a valid, verifiable SIL Open Font License or public domain release for the file), you may file a formal written Counter-Notification pursuant to 17 U.S.C. § 512(g).
                    </p>
                    <p>
                        Your counter-notification must include: your physical or electronic signature; identification of the font that was removed and the URL where it appeared before removal; a statement under penalty of perjury that you have a good-faith belief that the material was removed or disabled as a result of mistake or misidentification; your full legal name, physical address, telephone number, and email address; and a statement consenting to the jurisdiction of the federal or appropriate legal district.
                    </p>
                    <p>
                        Upon receipt of a valid counter-notification, we forward a copy to the original complainant. If the copyright claimant does not notify us within 10 to 14 business days that they have filed a legal action seeking a court order against the uploader, we may restore access to the disputed material.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Repeat infringer policy</h2>
                    <p>
                        In accordance with Section 512(i) of the DMCA, NoBadFonts maintains and strictly enforces a policy providing for the immediate suspension or permanent termination of user accounts who are deemed to be repeat infringers or who repeatedly upload unauthorized commercial font software. Users with terminated accounts are barred from publishing future typefaces or maintaining active member profiles.
                    </p>
                </section>

                <section className="space-y-8 pt-2">
                    <h2>Designated copyright agent</h2>
                    <p>
                        Please deliver all official DMCA notifications and counter-notifications to our designated agent via email:
                    </p>
                    <p>
                        <strong>Email:</strong>{' '}
                        <a href="mailto:nobadfonts@gmail.com">
                            nobadfonts@gmail.com
                        </a>
                    </p>
                    <p>
                        <strong>Subject Line:</strong>{' '}
                        <code>
                            DMCA Takedown Notice - [Font Name]
                        </code>
                    </p>
                    <p className="text-xs text-[rgb(var(--color-muted-foreground))]">
                        Attn: NoBadFonts Legal Compliance & Copyright Agent. We review all notices promptly and confirm receipt within 24–48 hours.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
