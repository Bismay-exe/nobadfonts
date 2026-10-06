import { Link } from 'react-router-dom';

interface FontTagsProps {
    tags?: string[] | null;
}

export default function FontTags({ tags }: FontTagsProps) {
    if (!tags || tags.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
            {tags.map(tag => (
                <Link
                    key={tag}
                    to={`/fonts?categories=${encodeURIComponent(tag)}`}
                    className="px-4 py-1.5 rounded-full border border-foreground/10 text-sm text-muted hover:text-background hover:bg-foreground/90 transition-colors duration-300 ease-in-out uppercase tracking-wider"
                >
                    {tag}
                </Link>
            ))}
        </div>
    );
}
