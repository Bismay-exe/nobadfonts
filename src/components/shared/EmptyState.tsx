import { SearchX } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
}

export default function EmptyState({ title = "No fonts found", description = "We couldn't find any fonts matching your search criteria. Try adjusting your filters or search term." }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[rgb(var(--color-muted)/0.05)] rounded-xl border border-dashed border-[rgb(var(--color-border))]">
            <div className="bg-[rgb(var(--color-card))] p-4 rounded-full shadow-sm mb-4">
                <SearchX size={48} className="text-[rgb(var(--color-muted-foreground)/0.4)]" />
            </div>
            <h3 className="text-xl font-bold text-[rgb(var(--color-foreground))] mb-2">{title}</h3>
            <p className="text-[rgb(var(--color-muted-foreground))] max-w-sm mx-auto">
                {description}
            </p>
        </div>
    );
}
