import LegalLayout from './LegalLayout';

export default function SiteCookies() {
    return (
        <LegalLayout
            title="Cookie Policy"
            description="NoBadFonts uses minimal browser storage to remember your settings and keep you signed in. No trackers, no ad networks."
            lastUpdated="13 September 2026"
        >
            <div className="space-y-20">
                <section className="space-y-8">
                    <h2>The short version</h2>
                    <p>
                        We do not use cookies or local browser storage to track you across the internet, profile your reading habits, or sell your typography preferences to advertising networks. The small amount of data stored on your device exists for strictly technical and functional reasons: keeping you signed into your account if you choose to log in, and remembering whether you prefer dark mode or light mode.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Storage technologies we use</h2>
                    <p>
                        <strong>Cookies vs. LocalStorage.</strong>{' '}
                        Modern web applications rely on two primary client-side storage mechanisms: HTTP cookies (small strings sent automatically with network requests) and HTML5 LocalStorage (a browser-sandboxed key-value store that remains on your device and is never automatically sent across the wire with every HTTP asset request). NoBadFonts primarily uses HTML5 LocalStorage to keep network requests lightweight, fast, and private.
                    </p>
                    <p>
                        <strong>Authentication tokens (essential).</strong>{' '}
                        When you choose to register an account and log in, our authentication provider (Supabase Auth) creates an encrypted session token stored in browser LocalStorage under keys matching the pattern <code>sb-*-auth-token</code>. This session token contains cryptographic signatures that authenticate your API requests to our database, letting you manage your profile, bookmark favorite typefaces, and publish fonts without re-entering your credentials on every page refresh. If you browse anonymously without signing in, this authentication token is never generated.
                    </p>
                    <p>
                        <strong>UI & theme preferences (functional).</strong>{' '}
                        We store non-identifying client-side preferences in LocalStorage under specific keys:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                        <li>
                            <code>theme</code>: Stores your chosen visual contrast mode (Dark, Light) so your eyes aren't blinded by sudden light flashes when you reopen the site.
                        </li>
                        <li>
                            <code>cookie_consent</code>: Records whether you have reviewed or dismissed the initial privacy choices prompt so we do not repeatedly display banner dialogs on subsequent page visits.
                        </li>
                        <li>
                            <code>catalog_layout</code>: Preserves your preferred display density when exploring typography (such as dense grid cards versus detailed list view).
                        </li>
                    </ul>
                    <p>
                        <strong>Interactive tester specimen memory.</strong>{' '}
                        When you type custom headline copy, test paragraphs, or code snippets into the interactive font preview sandboxes, your custom specimen text is cached locally in your browser so you do not lose your draft test copy when switching between different typefaces. This text remains exclusively on your machine and is never sent to our servers.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Third-party scripts & tracking</h2>
                    <p>
                        <strong>No advertising or analytics trackers.</strong>{' '}
                        We do not embed third-party surveillance scripts. You will find no Google Analytics, no Facebook Pixels, no Hotjar session replay recorders, and no programmatic ad network tags running on our pages. We do not participate in cross-site tracking or device fingerprinting.
                    </p>
                    <p>
                        <strong>Edge CDN logs.</strong>{' '}
                        When your browser fetches font binaries, CSS styles, or JavaScript application bundles from our global edge infrastructure (Cloudflare and Vercel), standard HTTP request headers and IP addresses are processed at the network layer to route requests, deliver cached assets quickly, and defend against denial-of-service floods. These logs are maintained strictly for security and uptime monitoring and are purged automatically per infrastructure retention rules.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Managing and purging stored data</h2>
                    <p>
                        Because our client-side storage is entirely transparent and non-invasive, you have complete control over it through your web browser's built-in developer tools and privacy settings:
                    </p>
                    <p>
                        <strong>Google Chrome / Chromium / Edge.</strong>{' '}
                        Open Settings → Privacy and security → Clear browsing data. Choose "Cookies and other site data" and click Clear data. You can also press <code>F12</code> to open DevTools, go to the <em>Application</em> tab, expand <em>Local Storage</em>, and delete any stored key.
                    </p>
                    <p>
                        <strong>Apple Safari (macOS & iOS).</strong>{' '}
                        On macOS, open Safari Preferences → Privacy → Manage Website Data, search for <code>nobadfonts.in</code>, and click Remove. On iOS, open Settings → Safari → Advanced → Website Data, search for NoBadFonts, and swipe to delete.
                    </p>
                    <p>
                        <strong>Mozilla Firefox.</strong>{' '}
                        Open Settings → Privacy & Security → Cookies and Site Data → Clear Data. Alternatively, open DevTools (<code>F12</code>), go to the <em>Storage</em> tab, select <em>Local Storage</em>, and clear all entries.
                    </p>
                    <p className="text-xs text-muted">
                        Clearing site storage will reset your UI theme to the default, clear any cached specimen text, and sign you out if you were authenticated.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Changes</h2>
                    <p>
                        If we ever introduce new client-side features that require persistent local storage, we will update this policy immediately with an exact breakdown of the keys stored, their functional purpose, and their persistence lifecycle.
                    </p>
                </section>

                <section className="space-y-8 pt-2">
                    <h2>Contact</h2>
                    <p>
                        Questions regarding our cookie and local storage policies can be sent to{' '}
                        <a href="mailto:nobadfonts@gmail.com">
                            nobadfonts@gmail.com
                        </a>
                        .
                    </p>
                </section>
            </div>
        </LegalLayout>
    );
}
