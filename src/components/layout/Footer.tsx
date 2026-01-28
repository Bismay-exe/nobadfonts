export default function Footer() {
    return (
        <footer className="w-full flex justify-between items-center p-4 border-b-2 bg-white rounded-3xl">
            <div className="w-full flex justify-center md:justify-between gap-1 text-center text-gray-600">
                <span>&copy; {new Date().getFullYear()} Fontique.</span> 
                <span>All rights reserved.</span>
            </div>
        </footer>
    );
}
