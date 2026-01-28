import { SearchX } from 'lucide-react';

export default function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <SearchX size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No fonts found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
                We couldn't find any fonts matching your search criteria. Try adjusting your filters or search term.
            </p>
        </div>
    );
}
