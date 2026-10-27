import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OAuthConsent from './OAuthConsent';

const CLIENT_ID = '11111111-2222-4333-8444-555555555555';
const AUTHORIZATION_ID = 'auth-req-1';
const REDIRECT_URL = 'https://example.chromiumapp.org/?code=abc&state=xyz';

const { auth, oauth } = vi.hoisted(() => ({
    auth: {
        user: null as { id: string; email: string } | null,
        loading: false,
        signOut: vi.fn(),
    },
    oauth: {
        getAuthorizationDetails: vi.fn(),
        approveAuthorization: vi.fn(),
        denyAuthorization: vi.fn(),
    },
}));

vi.mock('../lib/supabase', () => ({
    supabase: { auth: { oauth } },
}));

vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => auth,
}));

vi.mock('../components/shared/SEO', () => ({
    default: () => null,
}));

const details = (overrides: Record<string, unknown> = {}) => ({
    authorization_id: AUTHORIZATION_ID,
    client: {
        id: CLIENT_ID,
        name: 'NoBadFonts Extension (local dev)',
        uri: 'https://www.nobadfonts.in',
    },
    user: { id: 'user-1', email: 'reader@example.com' },
    scope: 'openid profile email',
    ...overrides,
});

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderConsent(search = `?authorization_id=${AUTHORIZATION_ID}`) {
    return render(
        <MemoryRouter initialEntries={[`/oauth/consent${search}`]}>
            <LocationProbe />
            <Routes>
                <Route path="/oauth/consent" element={<OAuthConsent />} />
                <Route path="/auth" element={<div>auth screen</div>} />
            </Routes>
        </MemoryRouter>
    );
}

const replace = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
    vi.stubEnv('VITE_NOBADFONTS_OAUTH_CLIENT_ID', CLIENT_ID);
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: { replace },
    });
    auth.user = { id: 'user-1', email: 'reader@example.com' };
    auth.loading = false;
    auth.signOut.mockReset();
    oauth.getAuthorizationDetails.mockReset();
    oauth.approveAuthorization.mockReset();
    oauth.denyAuthorization.mockReset();
    replace.mockReset();
});

afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
    });
});

describe('OAuthConsent', () => {
    it('asks a signed-out visitor to sign in before showing the request', async () => {
        auth.user = null;
        renderConsent();

        await userEvent.click(await screen.findByRole('button', { name: 'Sign in to continue' }));

        expect(screen.getByText('auth screen')).toBeInTheDocument();
        expect(screen.getByTestId('location')).toHaveTextContent(
            `/auth?returnTo=${encodeURIComponent(`/oauth/consent?authorization_id=${AUTHORIZATION_ID}`)}`
        );
        expect(oauth.getAuthorizationDetails).not.toHaveBeenCalled();
    });

    it('refuses a request without an authorization id', async () => {
        renderConsent('');

        expect(await screen.findByText('Authorization stopped')).toBeInTheDocument();
        expect(screen.getByText(/missing its request id/i)).toBeInTheDocument();
        expect(oauth.getAuthorizationDetails).not.toHaveBeenCalled();
    });

    it('reports an expired request when the details cannot be loaded', async () => {
        oauth.getAuthorizationDetails.mockResolvedValue({ data: null, error: { message: 'nope' } });
        renderConsent();

        expect(await screen.findByText(/expired or is no longer valid/i)).toBeInTheDocument();
    });

    it('refuses an authorization request from another OAuth client', async () => {
        oauth.getAuthorizationDetails.mockResolvedValue({
            data: details({ client: { id: 'some-other-client', name: 'Someone else' } }),
            error: null,
        });
        renderConsent();

        expect(
            await screen.findByText(/not allowed to connect to NoBadFonts accounts/i)
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Authorize extension' })).not.toBeInTheDocument();
    });

    it('refuses a request belonging to a different account', async () => {
        oauth.getAuthorizationDetails.mockResolvedValue({
            data: details({ user: { id: 'user-2', email: 'other@example.com' } }),
            error: null,
        });
        renderConsent();

        expect(await screen.findByText(/belongs to a different account/i)).toBeInTheDocument();
    });

    it('lists what the extension is asking for', async () => {
        oauth.getAuthorizationDetails.mockResolvedValue({ data: details(), error: null });
        renderConsent();

        expect(await screen.findByText('Connect NoBadFonts Extension (local dev)?')).toBeInTheDocument();
        expect(screen.getByText('Your profile')).toBeInTheDocument();
        expect(screen.getByText('Your email address')).toBeInTheDocument();
        expect(screen.getByText(/Signed in as reader@example.com/)).toBeInTheDocument();
    });

    it('approves the request and hands the code back to the extension', async () => {
        oauth.getAuthorizationDetails.mockResolvedValue({ data: details(), error: null });
        oauth.approveAuthorization.mockResolvedValue({
            data: { redirect_url: REDIRECT_URL },
            error: null,
        });
        renderConsent();

        await userEvent.click(await screen.findByRole('button', { name: 'Authorize extension' }));

        await waitFor(() => expect(replace).toHaveBeenCalledWith(REDIRECT_URL));
        expect(oauth.approveAuthorization).toHaveBeenCalledWith(AUTHORIZATION_ID, {
            skipBrowserRedirect: true,
        });
        expect(oauth.denyAuthorization).not.toHaveBeenCalled();
    });

    it('denies the request and returns the access_denied redirect', async () => {
        oauth.getAuthorizationDetails.mockResolvedValue({ data: details(), error: null });
        oauth.denyAuthorization.mockResolvedValue({
            data: { redirect_url: `${REDIRECT_URL}&error=access_denied` },
            error: null,
        });
        renderConsent();

        await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        await waitFor(() =>
            expect(replace).toHaveBeenCalledWith(`${REDIRECT_URL}&error=access_denied`)
        );
        expect(oauth.denyAuthorization).toHaveBeenCalledWith(AUTHORIZATION_ID, {
            skipBrowserRedirect: true,
        });
        expect(oauth.approveAuthorization).not.toHaveBeenCalled();
    });

    it('redirects straight back when the extension is already connected', async () => {
        oauth.getAuthorizationDetails.mockResolvedValue({
            data: details({ redirect_url: REDIRECT_URL }),
            error: null,
        });
        renderConsent();

        await waitFor(() => expect(replace).toHaveBeenCalledWith(REDIRECT_URL));
        expect(oauth.approveAuthorization).not.toHaveBeenCalled();
    });

    it('signs out and resumes the request from the auth page when switching accounts', async () => {
        oauth.getAuthorizationDetails.mockResolvedValue({ data: details(), error: null });
        renderConsent();

        await userEvent.click(await screen.findByRole('button', { name: 'Use a different account' }));

        await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
        expect(screen.getByTestId('location')).toHaveTextContent(
            `/auth?returnTo=${encodeURIComponent(`/oauth/consent?authorization_id=${AUTHORIZATION_ID}`)}`
        );
    });

    it('surfaces a failed decision instead of leaving the page waiting', async () => {
        oauth.getAuthorizationDetails.mockResolvedValue({ data: details(), error: null });
        oauth.approveAuthorization.mockResolvedValue({ data: null, error: { message: 'nope' } });
        renderConsent();

        await userEvent.click(await screen.findByRole('button', { name: 'Authorize extension' }));

        expect(await screen.findByText(/could not be completed/i)).toBeInTheDocument();
        expect(replace).not.toHaveBeenCalled();
    });
});
