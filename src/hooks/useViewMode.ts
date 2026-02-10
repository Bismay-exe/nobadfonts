import { useState, useEffect } from 'react';

type ViewMode = 'font' | 'image';

export function useViewMode() {
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const saved = localStorage.getItem('viewMode');
        return (saved === 'font' || saved === 'image') ? saved : 'font';
    });

    useEffect(() => {
        localStorage.setItem('viewMode', viewMode);
    }, [viewMode]);

    return [viewMode, setViewMode] as const;
}
