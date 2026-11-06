import LegalLayout from './LegalLayout';

export default function PrivacyPolicy() {
    return (
        <LegalLayout
            title="Privacy Policy"
            description="NoBadFonts does not track you, does not sell your data, and does not want your identity."
            lastUpdated="5 November 2026"
        >
            <div className="space-y-18">
                <section className="space-y-8">
                    <h2>The short version</h2>
                    <p>
                        Browsing, previewing and downloading fonts needs no account, and there are no ads, no tracking and no behavioral analytics. Accounts are optional, for the features that need one. When resources you need come via cloud servers and edge networks that hold the fonts, everything listed below explains why, what happens, and what is kept. The short of it: we want nothing. We never sell anything about you.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>The app & platform</h2>
                    <p>
                        <strong>No accounts required, no tracking.</strong>{' '}
                        You do not need to sign in to explore, preview, or download fonts from NoBadFonts. The platform does not track you across other apps or websites, and nothing it collects during browsing is linked to your identity. If you search through the typography library, filter by classification, or test a typeface in the interactive specimen sandbox, that query is not recorded or associated with you. If you delete your data, it is gone immediately, and you can confirm that directly in your browser or through the mobile app privacy manifest.
                    </p>
                    <p>
                        <strong>What stays on your device.</strong>{' '}
                        Your custom specimen preview text, type scale adjustments, letter spacing, line height configurations, saved favorites, custom font collections, download history, and font name caches are stored entirely on-device and in local browser storage (HTML5 LocalStorage on the web, and sandboxed persistent storage on iOS and Android). None of this is transmitted to our servers unless you explicitly sign into an account to sync your saved collections.
                    </p>
                    <p>
                        <strong>Cloud sync & accounts.</strong>{' '}
                        If you choose to register an account—to curate public collections, bookmark favorites across devices, or publish original typefaces—we store your email address and display handle. Authentication and session tokens are managed via Supabase Auth. Passwords are never visible to our administrators; they are salted and hashed cryptographically by Supabase. Your active authentication token is stored locally on your device. We do not use your email address for unsolicited promotional marketing, nor do we sell or share your account credentials with third-party brokers.
                    </p>
                    <p>
                        <strong>Fetching and downloading fonts.</strong>{' '}
                        When you preview a webfont or download a font archive (WOFF2, TTF, OTF, or ZIP bundle), the app downloads the font file from our global content delivery network: Cloudflare and Vercel Edge Network. The font catalogue and binary assets come from this edge network. We do not link you or your user account to specific font downloads. When a font is downloaded, the servers record your IP address and standard HTTP request headers, but this exists strictly within Cloudflare and edge infrastructure logs for abuse prevention, bandwidth protection, and DDoS mitigation, and is deleted automatically according to their standard retention policies (typically within 30 days). We do not use this data to profile you, and the app transmits no personal information about your identity with font requests.
                    </p>
                    <p>
                        <strong>Keeping abusers out.</strong>{' '}
                        To protect the font service from automated bulk downloading, denial-of-service scrapers, and malicious bot traffic, our edge proxies use standard traffic verification mechanisms (such as Cloudflare Turnstile and edge rate limiting). The CDN uses these network-level checks to tell legitimate human visitors and mobile apps apart from automated scraping scripts. Nothing in this process identifies you personally, and we do not retain or use these verification tokens for anything else.
                    </p>
                    <p>
                        <strong>Browser-side font processing.</strong>{' '}
                        When you upload a font to test in the specimen viewer or submit a typeface to the catalogue, conversion to modern WOFF2 formats and glyph table inspection run client-side right inside your browser using WebAssembly. Your font files are not transmitted to third-party artificial intelligence training models, machine learning datasets, or external processing farms.
                    </p>
                    <p>
                        <strong>The CLI companion.</strong>{' '}
                        When using the companion CLI (<code>nbf</code> or <code>nobadfonts-cli</code>) to install fonts directly from your terminal into your development projects, the tool makes direct HTTPS requests to fetch release archives from our CDN. The CLI contains zero telemetry, collects no hardware fingerprints or environment variables, and sends no background telemetry pings. It operates entirely as a transparent, stateless package fetcher.
                    </p>
                    <p>
                        <strong>Mobile apps (iOS & Android).</strong>{' '}
                        When using NoBadFonts as a native mobile application via Capacitor, the application runs in a sandboxed container. It requests no invasive system permissions: no contacts, no location, no camera, and no microphone. If you save a font file to your device, the app requests storage access solely to write the font file to your device's Downloads or Documents folder.
                    </p>
                    <p>
                        <strong>Checking for updates.</strong>{' '}
                        We check for application and catalogue updates automatically through standard web caching protocols and official mobile app stores (Google Play and Apple App Store). That request carries standard platform version metadata, and the hosting provider sees your IP address as it does for any standard web request. Nothing comes back to us that connects your IP to your personal identity.
                    </p>
                    <p>
                        <strong>Ratings and reviews.</strong>{' '}
                        Doing a review in the mobile application takes a few taps using standard system rating prompts provided by Apple and Google, and never more than a few times a year. The operating system decides when that prompt appears; we do not log or track your rating responses on our servers.
                    </p>
                    <p>
                        <strong>Reporting a crash or bug.</strong>{' '}
                        If you use the "Report a Bug" feature in settings or submit feedback, the app creates a short technical diagnostics summary: it lists the app and browser version, operating system, device model, and recent network status codes. There are no search queries in that diagnostic and no user data; just whether the network is reachable, whether our edge CDN answered properly, and the app's most recent runtime error logs, kept short so they never exceed what is strictly necessary.
                    </p>
                    <p>
                        Submitting a report opens a pre-filled email in your own default mail app addressed to support, with the diagnostic summary in the body. The app sends nothing automatically in the background. You can see, inspect, and edit the entire email before you choose to tap Send. If your device cannot launch an email client, the app copies the diagnostic summary to your clipboard so you can paste it wherever you like. Emails sent to support include your IP address and standard email headers handled by your mail provider. We keep what you send only for as long as it takes to investigate and resolve the issue.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>The browser extension</h2>
                    <p>
                        <strong>No account needed to use it.</strong>{' '}
                        The extension changes fonts and CSS locally. Styles, profiles, settings and history are stored in your browser, and no browsing history, page contents or list of the sites you style is sent to us.
                    </p>
                    <p>
                        <strong>Optional account sign-in.</strong>{' '}
                        You can sign in to a NoBadFonts account to identify yourself to features that need one. You only ever type your password on this website; the extension opens it in the browser's sign-in window and never sees your password. The extension is a public OAuth client with no secret. Sign-in requests the <code>openid</code>, <code>profile</code> and <code>email</code> scopes, so we receive your account id, email address and display name.
                    </p>
                    <p>
                        <strong>Tokens stay in the extension.</strong>{' '}
                        The access token, refresh token, expiry, granted scope and the account claims above are kept in the extension's own background IndexedDB. They are not placed in <code>chrome.storage.local</code>, which content scripts can read, and popup and options pages only ask the background for account state — they never receive a token.
                    </p>
                    <p>
                        <strong>Retention and revocation.</strong>{' '}
                        Tokens stay until you sign out in the extension or revoke the extension's access on the website's <a href="/settings/connected-apps">Connected apps</a> page. Signing out of the extension clears this browser's session and nothing else; revoking on the site ends the grant everywhere. Revocation takes effect at the next token refresh: an access token already issued can remain valid until it expires, which is up to one hour. A revoked or expired refresh token is discarded, and no new one is accepted.
                    </p>
                    <p>
                        <strong>Reports you send.</strong>{' '}
                        The extension's report action opens the public extension repository's issue page. Nothing is sent in the background; you can review and edit anything before you submit it.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>This website</h2>
                    <p>
                        <strong>Minimal logs, no ad trackers.</strong>{' '}
                        The website runs on modern edge hosting infrastructure provided by Vercel and Cloudflare. We do not load Google Tag Manager, Meta tracking pixels, Hotjar session recordings, or behavioral advertising cookies. Cloudflare and Vercel provide standard, aggregated server access logs (such as IP addresses, requested URLs, browser user-agents, and HTTP status codes) for the minimum time needed to deliver the site securely and mitigate denial-of-service threats. That is standard web hosting.
                    </p>
                    <p>
                        <strong>External foundry and creator links.</strong>{' '}
                        Our catalogue includes links to external designer portfolios, GitHub repositories, and foundry websites. When you click an external link, you navigate outside NoBadFonts, and that third party's privacy policy applies. We do not attach affiliate tracking parameters or route your clicks through tracking redirect servers.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Your choices</h2>
                    <p>
                        You can use NoBadFonts completely without giving us anything. You can clear on-device data and cached fonts at any time in your browser settings or Developer Tools by clearing LocalStorage and site data. If you created an account and wish to permanently delete it along with all associated bookmarks, profile data, or uploaded records, you can do so directly within your profile settings or by writing to support. We will delete all records immediately and permanently.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Children</h2>
                    <p>
                        NoBadFonts is a typography toolchain built for designers, developers, and creative professionals. It is not directed to children under 13. We do not knowingly collect personal information from children.
                    </p>
                </section>

                <section className="space-y-8">
                    <h2>Changes</h2>
                    <p>
                        If these policies change, we will post the updates on this page along with the revised date at the top. Because NoBadFonts maintains its source code in a public Git repository, all modifications to our policies are transparently documented in public commit history.
                    </p>
                </section>

                <section className="space-y-8 pt-2">
                    <h2>Contact</h2>
                    <p>
                        Questions about privacy or requests regarding your data go to{' '}
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
