import { AtSign, BadgeCheck, UserRound } from 'lucide-react';

type ScopeDescription = {
    icon: typeof UserRound;
    label: string;
    description: string;
};

const SCOPES: Record<string, ScopeDescription> = {
    openid: {
        icon: BadgeCheck,
        label: 'Confirm your identity',
        description: 'Verify that you are signed in to NoBadFonts.',
    },
    profile: {
        icon: UserRound,
        label: 'Your profile',
        description: 'See your name, avatar, and public profile details.',
    },
    email: {
        icon: AtSign,
        label: 'Your email address',
        description: 'See the email address on your NoBadFonts account.',
    },
};

export default function ConsentScopeList({ scopes }: { scopes: Array<string> }) {
    if (!scopes.length) {
        return (
            <p className="text-muted font-space-mono text-sm">
                This application did not ask for any account details.
            </p>
        );
    }

    return (
        <ul className="flex flex-col gap-3">
            {scopes.map(scope => {
                const known = SCOPES[scope];

                return (
                    <li key={scope} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground">
                            {known ? <known.icon size={16} strokeWidth={1.8} /> : <BadgeCheck size={16} strokeWidth={1.8} />}
                        </span>
                        <span className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                                {known?.label ?? scope}
                            </span>
                            <span className="text-sm text-muted">
                                {known?.description ?? `Access the ${scope} scope.`}
                            </span>
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}
