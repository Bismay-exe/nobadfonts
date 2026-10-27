import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ConsentScopeList from '../components/oauth/ConsentScopeList';
import SEO from '../components/shared/SEO';
import {
    getAuthorizationId,
    getConsentReturnPath,
} from '../lib/oauthReturn';

type AuthorizationDetails = {
    authorization_id: string;
    redirect_url?: string;
    client: {
        id: string;
        name: string;
        uri?: string;
        logo_uri?: string;
    };
    user: {
        id: string;
        email: string;
    };
    scope: string;
};

type View =
    | { status: 'loading' }
    | { status: 'sign-in' }
    | { status: 'ready'; details: AuthorizationDetails; scopes: Array<string> }
    | { status: 'error'; message: string };

/**
 * The one OAuth client this site consents to: the NoBadFonts extension. Read
 * per lookup so a build's configuration is what applies, not an import-time
 * snapshot.
 */
function getExtensionClientId(): string | undefined {
    const clientId = import.meta.env.VITE_NOBADFONTS_OAUTH_CLIENT_ID as string | undefined;
    return clientId?.trim() || undefined;
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed top-0 left-0 z-100 flex h-screen w-screen items-center justify-center overflow-y-auto bg-background p-4">
            <SEO title="Authorize the NoBadFonts extension | NoBadFonts" noindex url="/oauth/consent" />
            <div className="w-full max-w-lg rounded-4xl border border-border bg-card-background p-8 text-foreground sm:p-10">
                {children}
            </div>
        </div>
    );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="mb-6">
            <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background">
                    <ShieldCheck size={22} strokeWidth={1.8} />
                </span>
                <span className="font-space-mono text-xs uppercase tracking-[0.25em] text-muted">
                    NoBadFonts
                </span>
            </div>
            <h1 className="font-inter text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 font-space-mono text-sm leading-relaxed text-muted">{subtitle}</p>
        </div>
    );
}

function ErrorView({ message }: { message: string }) {
    return (
        <>
            <Heading title="Authorization stopped" subtitle="Nothing was shared and no session was created." />
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                <TriangleAlert className="mt-0.5 shrink-0" size={18} />
                <span>{message}</span>
            </div>
            <a
                href="/profile"
                className="flex w-full items-center justify-center rounded-xl border border-border py-3 font-medium transition-colors hover:bg-foreground/5"
            >
                Return to NoBadFonts
            </a>
        </>
    );
}

export default function OAuthConsent() {
    const { user, loading: authLoading, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const authorizationId = getAuthorizationId(location.search);
    const consentPath = authorizationId ? getConsentReturnPath(authorizationId) : '/profile';

    const [view, setView] = useState<View>({ status: 'loading' });
    const [submitting, setSubmitting] = useState(false);
    const redirecting = useRef(false);

    const redirectToClient = useCallback((url: string | undefined) => {
        if (!url || redirecting.current) {
            return false;
        }

        redirecting.current = true;
        window.location.replace(url);
        return true;
    }, []);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!authorizationId) {
            setView({
                status: 'error',
                message: 'This authorization link is missing its request id. Start again from the NoBadFonts extension.',
            });
            return;
        }

        if (!user) {
            setView({ status: 'sign-in' });
            return;
        }

        let cancelled = false;

        const load = async () => {
            setView({ status: 'loading' });

            const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

            if (cancelled) {
                return;
            }

            if (error || !data) {
                setView({
                    status: 'error',
                    message:
                        'This authorization request has expired or is no longer valid. Start again from the NoBadFonts extension.',
                });
                return;
            }

            const details = data as AuthorizationDetails;

            if (redirectToClient(details.redirect_url)) {
                return;
            }

            const extensionClientId = getExtensionClientId();

            if (!extensionClientId || details.client.id !== extensionClientId) {
                setView({
                    status: 'error',
                    message: 'This application is not allowed to connect to NoBadFonts accounts.',
                });
                return;
            }

            if (details.user.id !== user.id) {
                setView({
                    status: 'error',
                    message: 'This request belongs to a different account. Sign in again and retry.',
                });
                return;
            }

            setView({
                status: 'ready',
                details,
                scopes: details.scope.split(/\s+/).filter(Boolean),
            });
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [authLoading, authorizationId, redirectToClient, user]);

    const decide = useCallback(
        async (decision: 'approve' | 'deny') => {
            if (!authorizationId) {
                return;
            }

            setSubmitting(true);

            const result =
                decision === 'approve'
                    ? await supabase.auth.oauth.approveAuthorization(authorizationId, {
                        skipBrowserRedirect: true,
                    })
                    : await supabase.auth.oauth.denyAuthorization(authorizationId, {
                        skipBrowserRedirect: true,
                    });

            if (result.error || !result.data?.redirect_url) {
                setSubmitting(false);
                setView({
                    status: 'error',
                    message:
                        'The authorization request could not be completed. It may have expired; start again from the NoBadFonts extension.',
                });
                return;
            }

            redirectToClient(result.data.redirect_url);
            setSubmitting(false);
        },
        [authorizationId, redirectToClient]
    );

    const useAnotherAccount = useCallback(async () => {
        await signOut();
        navigate(`/auth?returnTo=${encodeURIComponent(consentPath)}`, { replace: true });
    }, [consentPath, navigate, signOut]);

    if (view.status === 'loading') {
        return (
            <Shell>
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <Loader2 className="animate-spin text-muted" size={28} />
                    <p className="font-space-mono text-sm text-muted">Checking the request…</p>
                </div>
            </Shell>
        );
    }

    if (view.status === 'sign-in') {
        return (
            <Shell>
                <Heading
                    title="Connect the NoBadFonts extension"
                    subtitle="Sign in to your NoBadFonts account to review what the extension is asking for."
                />
                <button
                    type="button"
                    onClick={() => navigate(`/auth?returnTo=${encodeURIComponent(consentPath)}`)}
                    className="flex w-full items-center justify-center rounded-xl bg-foreground py-3 font-black uppercase text-background transition-opacity hover:opacity-90"
                >
                    Sign in to continue
                </button>
                <p className="mt-4 text-center font-space-mono text-xs text-muted">
                    You can cancel by closing this page. Nothing is shared until you approve.
                </p>
            </Shell>
        );
    }

    if (view.status === 'error') {
        return (
            <Shell>
                <ErrorView message={view.message} />
            </Shell>
        );
    }

    const { details, scopes } = view;
    const clientName = details.client.name || 'the NoBadFonts extension';

    return (
        <Shell>
            <Heading
                title={`Connect ${clientName}?`}
                subtitle="The extension will be able to use these parts of your NoBadFonts account. It never receives your password."
            />

            <div className="mb-6 rounded-2xl border border-border p-4">
                <ConsentScopeList scopes={scopes} />
            </div>

            <p className="mb-6 font-space-mono text-xs leading-relaxed text-muted">
                Signed in as {details.user.email}. You can disconnect the extension at any time from
                Settings → Connected apps.
            </p>

            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    disabled={submitting}
                    onClick={() => decide('approve')}
                    className="flex w-full items-center justify-center rounded-xl bg-foreground py-3 font-black uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {submitting ? 'Authorizing…' : 'Authorize extension'}
                </button>
                <button
                    type="button"
                    disabled={submitting}
                    onClick={() => decide('deny')}
                    className="flex w-full items-center justify-center rounded-xl border border-border py-3 font-medium transition-colors hover:bg-foreground/5 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    disabled={submitting}
                    onClick={useAnotherAccount}
                    className="mt-1 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                >
                    Use a different account
                </button>
            </div>
        </Shell>
    );
}
