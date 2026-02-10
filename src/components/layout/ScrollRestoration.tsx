import { useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';

export const scrollPositions = new Map<string, number>();

export function ScrollRestoration() {
    const location = useLocation();

    useLayoutEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // Save current scroll position for the current key before it changes (cleanup function of previous effect would be too late for some cases, but here we want to restore on mount and save on unmount/update)
        // Actually the user provided code uses the cleanup function to save.
        // "return () => { scrollPositions.set(key, window.scrollY); };"
        // This saves the scroll position of the *leaving* page.

        const key = location.key;

        // Restore if we have a saved position
        const y = scrollPositions.get(key);
        if (y !== undefined) {
            window.scrollTo(0, y);
        } else {
            window.scrollTo(0, 0);
        }

        return () => {
            scrollPositions.set(key, window.scrollY);
        };
    }, [location]);

    return null;
}
