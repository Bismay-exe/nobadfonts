import { SearchX } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
}

export default function EmptyState({ title = "No fonts found", description = "We couldn't find any fonts matching your search criteria. Try adjusting your filters or search term." }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <SearchX size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
                {description}
            </p>
        </div>
    );
}
