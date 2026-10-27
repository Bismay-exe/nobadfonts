import { describe, expect, it } from 'vitest';
import {
    getAuthorizationId,
    getConsentReturnPath,
    getSafeReturnPath,
} from './oauthReturn';

describe('getSafeReturnPath', () => {
    it('keeps the consent page and its authorization id', () => {
        expect(getSafeReturnPath('/oauth/consent?authorization_id=abc123')).toBe(
            '/oauth/consent?authorization_id=abc123'
        );
    });

    it('keeps the connected apps page', () => {
        expect(getSafeReturnPath('/settings/connected-apps')).toBe('/settings/connected-apps');
    });

    it('rejects other site paths', () => {
        expect(getSafeReturnPath('/profile')).toBeNull();
        expect(getSafeReturnPath('/')).toBeNull();
    });

    it('rejects absolute and protocol-relative URLs', () => {
        expect(getSafeReturnPath('https://evil.example/oauth/consent')).toBeNull();
        expect(getSafeReturnPath('//evil.example/oauth/consent')).toBeNull();
        expect(getSafeReturnPath('javascript:alert(1)')).toBeNull();
    });

    it('rejects backslash and encoded origin tricks', () => {
        expect(getSafeReturnPath('/\\evil.example')).toBeNull();
        expect(getSafeReturnPath('/%2f%2fevil.example')).toBeNull();
        expect(getSafeReturnPath('/oauth/consent/../../admin')).toBeNull();
    });

    it('rejects empty values', () => {
        expect(getSafeReturnPath(null)).toBeNull();
        expect(getSafeReturnPath(undefined)).toBeNull();
        expect(getSafeReturnPath('')).toBeNull();
    });
});

describe('getConsentReturnPath', () => {
    it('encodes the authorization id', () => {
        expect(getConsentReturnPath('a b&c')).toBe('/oauth/consent?authorization_id=a%20b%26c');
    });
});

describe('getAuthorizationId', () => {
    it('reads a non-empty id from the query string', () => {
        expect(getAuthorizationId('?authorization_id=abc')).toBe('abc');
        expect(getAuthorizationId('?authorization_id=')).toBeNull();
        expect(getAuthorizationId('?other=1')).toBeNull();
    });
});
