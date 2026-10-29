import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useAdminControls() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const [enabled, setEnabled] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem('nbf_admin_controls');
            return stored !== null ? stored === 'true' : true;
        } catch {
            return true;
        }
    });

    useEffect(() => {
        const handler = () => {
            try {
                const stored = localStorage.getItem('nbf_admin_controls');
                setEnabled(stored !== null ? stored === 'true' : true);
            } catch {
                setEnabled(true);
            }
        };
        window.addEventListener('adminControlsChanged', handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('adminControlsChanged', handler);
            window.removeEventListener('storage', handler);
        };
    }, []);

    const toggleAdminControls = useCallback(() => {
        setEnabled(prev => {
            const next = !prev;
            try {
                localStorage.setItem('nbf_admin_controls', String(next));
                window.dispatchEvent(new Event('adminControlsChanged'));
            } catch {}
            return next;
        });
    }, []);

    return {
        isAdmin,
        showAdminControls: isAdmin && enabled,
        adminControlsEnabled: enabled,
        toggleAdminControls,
    };
}

