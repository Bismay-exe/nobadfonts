const CANONICAL_ORIGIN = 'https://nobadfonts.in';

const ALLOWED_RETURN_PATHS = ['/oauth/consent', '/settings/connected-apps'];

/**
 * Turns a value from a query string into a path we can send the user to after
 * signing in, or null when it could leave the site or go somewhere the auth
 * flow has no business returning to.
 */
export function getSafeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  if (value.includes('\\')) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value, CANONICAL_ORIGIN);
  } catch {
    return null;
  }

  if (url.origin !== CANONICAL_ORIGIN) {
    return null;
  }

  if (!ALLOWED_RETURN_PATHS.includes(url.pathname)) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * The consent page's own URL for an authorization request, as passed back to
 * the auth page so signing in resumes the request instead of dropping it.
 */
export function getConsentReturnPath(authorizationId: string): string {
  return `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
}

/**
 * Reads the authorization id the OAuth server put on the consent URL.
 */
export function getAuthorizationId(search: string): string | null {
  const authorizationId = new URLSearchParams(search).get('authorization_id');
  return authorizationId && authorizationId.trim() ? authorizationId : null;
}
