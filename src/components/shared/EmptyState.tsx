import { memo } from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
}

const EmptyState = memo(({ title = "No fonts found", description = "We couldn't find any fonts matching your search criteria. Try adjusting your filters or search term." }: EmptyStateProps) => {
    return (
        <div className="absolute h-[80vh] w-full inset-0 flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-card-background p-4 rounded-full shadow-sm mb-4">
                <SearchX size={48} className="text-muted/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
            <p className="text-muted max-w-sm mx-auto">
                {description}
            </p>
        </div>
    );
});

export default EmptyState;
