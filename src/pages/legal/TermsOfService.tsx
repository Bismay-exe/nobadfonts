import LegalLayout from './LegalLayout';

export default function TermsOfService() {
    return (
        <LegalLayout
            title="Terms of Service"
            description="The rules and agreements governing your use of NoBadFonts, typography downloads, and developer tools."
            lastUpdated="13 September 2026"
        >
            <div className="space-y-20">
                <section className="space-y-8">
                    <h2>The short version</h2>
                    <p>
                        <strong>NoBadFonts</strong> is a curated typography platform and developer toolchain built for designers, engineers, and creative professionals who take type seriously. We build tools so you can discover, test in realistic contexts (dashboards, editorial layouts, and code blocks), and install great fonts directly into your projects. In return, we require you to respect font designers' intellectual property, only upload fonts you have verifiable rights to share, refrain from abusive automated scraping that strains our edge infrastructure, and use the platform in good faith.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Using the platform & tools</h2>
                    <p>
                        <strong>Open and unrestricted access.</strong>{' '}
                        You do not need to register an account or pay a fee to browse our curated font catalogue, search for typefaces, test fonts in the interactive specimen sandboxes (UI/Dashboard, Editorial, and Code modes), inspect glyph sets and OpenType features, or download public font packages.
                    </p>
                    <p>
                        <strong>Accounts and credentials.</strong>{' '}
                        If you create an account to curate personal or public font collections, bookmark favorites across devices, or publish your own typefaces, you must provide a valid email address and maintain the confidentiality of your authentication credentials. You are solely responsible for all activities and submissions that occur under your account. If you believe your credentials have been compromised or discover an unauthorized session, you agree to notify us immediately.
                    </p>
                    <p>
                        <strong>Developer tools & CLI usage.</strong>{' '}
                        Our command-line companion tool (<code>nobadfonts-cli</code> or <code>nbf</code>) and public API endpoints are provided to streamline local development and design workflows. You are welcome to integrate our tools into your local terminal environments, project starter templates, and CI/CD pipelines, provided that your automated scripts respect HTTP cache headers and do not generate abusive request floods that degrade service availability for other developers.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Font software & licensing</h2>
                    <p>
                        <strong>Typefaces belong to their creators.</strong>{' '}
                        NoBadFonts does not own, claim copyright over, or sell proprietary rights to the font software indexed on our platform. All copyrights, trademarks, design patents, and intellectual property rights in font software remain the exclusive property of their respective type designers, foundries, or copyright holders.
                    </p>
                    <p>
                        <strong>Independent licenses govern your use.</strong>{' '}
                        Every typeface available on or indexed through NoBadFonts is governed by its individual license agreement—such as the SIL Open Font License (OFL-1.1), Apache License 2.0, MIT License, Creative Commons Zero (CC0), or custom creator terms (such as Free for Personal Use, Donationware, or Commercial Evaluation). NoBadFonts functions as an index and discovery platform; downloading a font through our service does not alter, replace, or supersede the author's legal license terms.
                    </p>
                    <p>
                        <strong>Your responsibility to verify commercial rights.</strong>{' '}
                        We clearly display the declared license type and links to full license documentation on each font's details page. It is your sole responsibility as an end-user, freelance designer, agency, or commercial entity to inspect the license terms before deploying any typeface in commercial client work, SaaS web applications, mobile apps, video games, broadcast media, or corporate brand identity packages. NoBadFonts does not provide legal advice and cannot grant commercial licenses on behalf of third-party foundries.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Publishing & creator warranties</h2>
                    <p>
                        <strong>Verifiable distribution rights.</strong>{' '}
                        When you upload font software (in TrueType, OpenType, WOFF, or WOFF2 formats) or accompanying specimen graphics to NoBadFonts, you explicitly represent and warrant that you are the original designer or foundry of the typeface, or that you hold an explicit, legally valid open-source license (such as the SIL Open Font License) that permits public hosting, web-optimization, redistribution, and sublicensing.
                    </p>
                    <p>
                        <strong>Strict prohibition against pirated commercial fonts.</strong>{' '}
                        We enforce a zero-tolerance policy against uploading cracked, ripped, or unauthorized copies of commercial typefaces from digital foundries (including Monotype, Linotype, Adobe, Din, ITC, or independent retail type foundries). Any account found uploading pirated font binaries will have their account immediately suspended without notice, their uploaded files permanently purged, and their IP address blacklisted.
                    </p>
                    <p>
                        <strong>Accurate metadata and licensing.</strong>{' '}
                        When submitting a typeface, you agree to provide truthful font family names, designer credits, release version numbers, and the precise legal license type governing the software. Misrepresenting a commercial or personal-use typeface as open-source or public domain is a direct violation of these terms.
                    </p>
                    <p>
                        <strong>Binary safety and file integrity.</strong>{' '}
                        You represent and warrant that uploaded files contain no viruses, trojan horses, worms, backdoors, exploit payloads, malformed OpenType tables designed to crash rendering engines, or hidden tracking beacons. All submissions undergo automated client-side WOFF2 decompression via WebAssembly and server-side integrity validation before being made public.
                    </p>
                    <p>
                        <strong>Distribution license granted to NoBadFonts.</strong>{' '}
                        By publishing a font to our public catalogue, you grant NoBadFonts a non-exclusive, worldwide, royalty-free license to host, cache, index, generate preview specimens of, convert to web-optimized WOFF2 format, and distribute the font files to end-users in accordance with the license you specified. You retain full ownership of your intellectual property at all times.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Fair use & system integrity</h2>
                    <p>
                        <strong>No abusive scraping or bulk harvesting.</strong>{' '}
                        You may not run high-concurrency scrapers, automated download bots, or headless crawlers against our edge CDN or API endpoints in a manner that strains bandwidth, incurs excessive infrastructure costs, or impairs platform performance for other users. If you need bulk font data for typography research, academic linguistics, or machine learning experiments, please contact us directly for an approved data export.
                    </p>
                    <p>
                        <strong>Security integrity.</strong>{' '}
                        You agree not to probe, scan, test the vulnerability of, or attempt to breach our Supabase database policies, row-level security definitions, storage bucket access controls, or edge CDN firewalls. Any discovery of a security vulnerability should be reported responsibly to our team.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Disclaimers & limitation of liability</h2>
                    <p>
                        <strong>Provided as-is.</strong>{' '}
                        NoBadFonts, its website, mobile applications, APIs, and command-line companion tools are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, implied, statutory, or otherwise. We make no guarantees that the service will be uninterrupted, error-free, or that font files will render identically across every operating system, mobile device, or browser rendering engine.
                    </p>
                    <p>
                        <strong>Limitation of liability.</strong>{' '}
                        To the maximum extent permitted by applicable law, NoBadFonts, its founders, contributors, and infrastructure providers shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages—including but not limited to loss of profits, data, goodwill, production interruptions, or legal liabilities arising out of your use of font software, client deployments, or third-party intellectual property infringement claims.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Copyright & DMCA takedowns</h2>
                    <p>
                        We respect the intellectual property of typeface creators and respond promptly to legitimate copyright complaints. If you believe your copyrighted font has been uploaded to NoBadFonts without proper authorization, please consult our dedicated <a href="/legal/dmca">DMCA Policy</a> for instructions on filing an official takedown notice.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Changes</h2>
                    <p>
                        We may update these terms as our platform, community features, and developer tools expand. Any modifications will be posted to this page along with the updated date at the top. Because our project is version-controlled in Git, all revisions are transparently documented in public repository history. Continued use of NoBadFonts after changes are posted constitutes your acceptance of the revised terms.
                    </p>
                </section>

                <section className="space-y-8 pt-2">
                    <h2>Contact</h2>
                    <p>
                        Questions about these Terms of Service or commercial licensing inquiries go to{' '}
                        <a href="mailto:nobadfonts@gmail.com">
                            nobadfonts@gmail.com
                        </a>
                        . We typically respond within 24–48 hours.
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
