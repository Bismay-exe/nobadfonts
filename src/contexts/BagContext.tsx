import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Font } from '../types/font';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BagItem {
    font: Font;
    /** 'all' = every variant; string[] = specific variant_name values selected */
    selectedVariants: 'all' | string[];
}

interface BagContextValue {
    items: BagItem[];
    count: number;
    isOpen: boolean;
    openBag: () => void;
    closeBag: () => void;
    toggleBag: () => void;
    addToBag: (font: Font) => void;
    removeFromBag: (fontId: string) => void;
    isInBag: (fontId: string) => boolean;
    toggleVariant: (fontId: string, variantName: string) => void;
    setAllVariants: (fontId: string) => void;
    clearBag: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const BagContext = createContext<BagContextValue | null>(null);

const STORAGE_KEY = 'nobadfonts-bag';

function loadBagFromStorage(): BagItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveBagToStorage(items: BagItem[]) {
    try {
        // Store only lightweight font data (exclude heavy gallery images)
        const slim = items.map(item => ({
            font: {
                id: item.font.id,
                name: item.font.name,
                slug: item.font.slug,
                designer: item.font.designer,
                category: item.font.category,
                tags: item.font.tags,
                font_variants: item.font.font_variants?.map(v => ({
                    id: v.id,
                    font_id: v.font_id,
                    variant_name: v.variant_name,
                    woff2_url: v.woff2_url,
                    woff_url: v.woff_url,
                    ttf_url: v.ttf_url,
                    otf_url: v.otf_url,
                    order_index: v.order_index,
                    created_at: v.created_at,
                    file_size_woff2: v.file_size_woff2,
                    file_size_woff: v.file_size_woff,
                    file_size_ttf: v.file_size_ttf,
                    file_size_otf: v.file_size_otf,
                })),
                woff2_url: item.font.woff2_url,
                woff_url: item.font.woff_url,
                ttf_url: item.font.ttf_url,
                otf_url: item.font.otf_url,
                commercial_use: item.font.commercial_use,
                license_type: item.font.license_type,
            },
            selectedVariants: item.selectedVariants,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
        // Storage full or unavailable — no-op
    }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function BagProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<BagItem[]>(() => loadBagFromStorage());
    const [isOpen, setIsOpen] = useState(false);

    // Persist on every change
    useEffect(() => {
        saveBagToStorage(items);
    }, [items]);

    const openBag = useCallback(() => setIsOpen(true), []);
    const closeBag = useCallback(() => setIsOpen(false), []);
    const toggleBag = useCallback(() => setIsOpen(p => !p), []);

    const addToBag = useCallback((font: Font) => {
        setItems(prev => {
            if (prev.some(i => i.font.id === font.id)) return prev;
            return [...prev, { font, selectedVariants: 'all' }];
        });
    }, []);

    const removeFromBag = useCallback((fontId: string) => {
        setItems(prev => prev.filter(i => i.font.id !== fontId));
    }, []);

    const isInBag = useCallback((fontId: string) => {
        return items.some(i => i.font.id === fontId);
    }, [items]);

    const toggleVariant = useCallback((fontId: string, variantName: string) => {
        setItems(prev => prev.map(item => {
            if (item.font.id !== fontId) return item;

            // If currently 'all', expand to all variant names first, then remove the toggled one
            if (item.selectedVariants === 'all') {
                const allVariantNames = (item.font.font_variants || []).map(v => v.variant_name);
                const newSelected = allVariantNames.filter(n => n !== variantName);
                return { ...item, selectedVariants: newSelected };
            }

            const current = item.selectedVariants as string[];
            const exists = current.includes(variantName);
            const newSelected = exists
                ? current.filter(n => n !== variantName)
                : [...current, variantName];

            // If all variants are selected again, revert to 'all'
            const totalVariants = (item.font.font_variants || []).length;
            if (newSelected.length === totalVariants && totalVariants > 0) {
                return { ...item, selectedVariants: 'all' };
            }

            return { ...item, selectedVariants: newSelected };
        }));
    }, []);

    const setAllVariants = useCallback((fontId: string) => {
        setItems(prev => prev.map(item =>
            item.font.id === fontId ? { ...item, selectedVariants: 'all' } : item
        ));
    }, []);

    const clearBag = useCallback(() => {
        setItems([]);
    }, []);

    const count = items.length;

    return (
        <BagContext.Provider value={{
            items,
            count,
            isOpen,
            openBag,
            closeBag,
            toggleBag,
            addToBag,
            removeFromBag,
            isInBag,
            toggleVariant,
            setAllVariants,
            clearBag,
        }}>
            {children}
        </BagContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBag() {
    const ctx = useContext(BagContext);
    if (!ctx) throw new Error('useBag must be used within BagProvider');
    return ctx;
}
