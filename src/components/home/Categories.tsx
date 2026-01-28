import { Link } from 'react-router-dom';

const CATEGORIES = [
    {
        id: 'serif',
        name: 'Serif',
        description: 'Traditional & Elegant',
        count: 120,
        color: 'bg-orange-100 text-orange-800'
    },
    {
        id: 'sans-serif',
        name: 'Sans Serif',
        description: 'Modern & Clean',
        count: 240,
        color: 'bg-blue-100 text-blue-800'
    },
    {
        id: 'display',
        name: 'Display',
        description: 'Bold & Expressive',
        count: 85,
        color: 'bg-purple-100 text-purple-800'
    },
    {
        id: 'handwriting',
        name: 'Handwriting',
        description: 'Personal & Creative',
        count: 45,
        color: 'bg-green-100 text-green-800'
    }
];

export default function Categories() {
    return (
        <section className="py-20 bg-gray-50 w-full border-b-2 border-black rounded-3xl">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-10 text-center">Browse by Category</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/fonts?categories=${cat.id}`}
                            className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 block"
                        >
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${cat.color}`}>
                                {cat.count} Fonts
                            </div>
                            <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
                            <p className="text-gray-500">{cat.description}</p>

                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-current opacity-5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
