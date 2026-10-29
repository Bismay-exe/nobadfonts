import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2, TriangleAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ConnectedAppCard, { type ConnectedApp } from '../components/connected-apps/ConnectedAppCard';
import SEO from '../components/shared/SEO';
import { getSafeReturnPath } from '../lib/oauthReturn';

const returnTo = '/settings/connected-apps';

export default function ConnectedApps() {
    const { user, loading } = useAuth();
    const [apps, setApps] = useState<Array<ConnectedApp> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);

        const { data, error: listError } = await supabase.auth.oauth.listGrants();

        if (listError) {
            setError('Connected apps could not be loaded. Try again in a moment.');
            setApps([]);
            return;
        }

        setApps((data ?? []) as Array<ConnectedApp>);
    }, []);

    useEffect(() => {
        if (user) {
            load();
        }
    }, [load, user]);

    const revoke = useCallback(async (clientId: string) => {
        const { error: revokeError } = await supabase.auth.oauth.revokeGrant({ clientId });

        if (revokeError) {
            setError('That connection could not be disconnected. Try again.');
            return;
        }

        setApps(previous => (previous ?? []).filter(app => app.client.id !== clientId));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-muted" size={26} />
            </div>
        );
    }

    if (!user) {
        const safeReturn = getSafeReturnPath(returnTo) ?? returnTo;
        return <Navigate to={`/auth?returnTo=${encodeURIComponent(safeReturn)}`} replace />;
    }

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
            <SEO title="Connected Apps | NoBadFonts" noindex url={returnTo} />

            <Link
                to="/profile"
                className="mb-8 inline-flex items-center gap-2 font-space-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground"
            >
                <ArrowLeft size={14} />
                Back to profile
            </Link>

            <h1 className="font-inter text-4xl font-semibold tracking-tight">Connected apps</h1>
            <p className="mt-2 max-w-xl font-space-mono text-sm leading-relaxed text-muted">
                Apps you have authorized with your NoBadFonts account. Disconnecting one revokes its
                access immediately.
            </p>

            {error && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                    <TriangleAlert className="mt-0.5 shrink-0" size={18} />
                    <span>{error}</span>
                </div>
            )}

            {apps === null ? (
                <div className="mt-10 flex justify-center">
                    <Loader2 className="animate-spin text-muted" size={22} />
                </div>
            ) : apps.length === 0 ? (
                <div className="mt-10 rounded-4xl border border-dashed border-border p-10 text-center">
                    <p className="text-lg font-medium">No connected applications</p>
                    <p className="mt-2 font-space-mono text-sm text-muted">
                        When you sign in to the NoBadFonts extension, it will appear here.
                    </p>
                </div>
            ) : (
                <ul className="mt-10 flex flex-col gap-4">
                    {apps.map(app => (
                        <ConnectedAppCard key={app.client.id} app={app} onRevoke={revoke} />
                    ))}
                </ul>
            )}
        </div>
    );
}
