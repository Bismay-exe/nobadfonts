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
            // If no history, scroll to top (standard behavior for new pages)
            // The user didn't explicitly ask for this else block but it's good practice for new navigations.
            // However, I will stick strictly to their provided code to ensure I don't break their expected logic,
            // unless it's obviously missing "scroll to top on new navigation". 
            // Standard "ScrollRestoration" from react-router usually scrolls to top on new location.
            // The user's code only restores *if* y is undefined. It doesn't scroll to top otherwise.
            // I'll add window.scrollTo(0, 0) if y is undefined, as that's expected validation of a "ScrollRestoration" component.
            // Wait, the user said "use this", implying I should paste it exactly.
            // But if I paste exactly, new pages might start at the previous scroll position if the browser doesn't reset it.
            // Browsers usually handle scroll on navigation, but key-based restoration overrides it.
            // I will stick to the user's code but verify if I need to import anything else.
            // format: import { useLocation } from 'react-router-dom'; ...
        }

        return () => {
            scrollPositions.set(key, window.scrollY);
        };
    }, [location]);

    return null;
}
