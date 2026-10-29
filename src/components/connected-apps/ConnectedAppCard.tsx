import { useState } from 'react';
import { Loader2, Puzzle, ShieldOff } from 'lucide-react';

export type ConnectedApp = {
    client: {
        id: string;
        name: string;
        uri?: string;
        logo_uri?: string;
    };
    scopes: Array<string>;
    granted_at: string;
};

type Props = {
    app: ConnectedApp;
    onRevoke: (clientId: string) => Promise<void>;
};

const formatDate = (iso: string) => {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown date';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(date);
};

export default function ConnectedAppCard({ app, onRevoke }: Props) {
    const [confirming, setConfirming] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const name = app.client.name || 'NoBadFonts extension';

    const revoke = async () => {
        setRevoking(true);

        try {
            await onRevoke(app.client.id);
        } finally {
            setRevoking(false);
            setConfirming(false);
        }
    };

    return (
        <li className="flex flex-col gap-4 rounded-4xl border border-border bg-card-background p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-foreground/5">
                        {app.client.logo_uri ? (
                            <img src={app.client.logo_uri} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                            <Puzzle size={20} strokeWidth={1.6} />
                        )}
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
                        <p className="font-space-mono text-xs text-muted">
                            Connected {formatDate(app.granted_at)}
                        </p>
                    </div>
                </div>
                <span className="rounded-full border border-border px-3 py-1 font-space-mono text-[11px] uppercase tracking-wider text-muted">
                    Active
                </span>
            </div>

            <div>
                <p className="font-space-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                    Access
                </p>
                <p className="mt-1 text-sm text-foreground">
                    {app.scopes.length ? app.scopes.join(', ') : 'No scopes requested'}
                </p>
            </div>

            {confirming ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-4">
                    <p className="text-sm text-warning">
                        Disconnecting signs the extension out and ends its session. You can connect it
                        again from the extension.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={revoke}
                            disabled={revoking}
                            className="inline-flex items-center gap-2 rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
                        >
                            {revoking && <Loader2 className="animate-spin" size={14} />}
                            {revoking ? 'Disconnecting…' : 'Yes, disconnect'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            disabled={revoking}
                            className="rounded-xl border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
                        >
                            Keep connected
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
                >
                    <ShieldOff size={15} strokeWidth={1.8} />
                    Disconnect
                </button>
            )}
        </li>
    );
}
