import { useEffect, useState } from 'react';
import { useUpload } from '../contexts/UploadContext';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';


const UploadProgressPopup = () => {
    const { tasks, clearCompletedTasks } = useUpload();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (tasks.length > 0) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [tasks]);

    if (!isVisible && tasks.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
            {tasks.map(task => (
                <div key={task.id} className="bg-[#EEEFEB]/70 backdrop-blur-sm border border-[#1C1D1E]/20 p-4 rounded-3xl shadow-[0_0_40px_0_rgba(0,0,0,0.3)] animate-in slide-in-from-right fade-in duration-300">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            {task.status === 'pending' && <Loader2 className="animate-spin text-gray-400" size={16} />}
                            {task.status === 'converting' && <Loader2 className="animate-spin text-blue-500" size={16} />}
                            {task.status === 'uploading' && <Loader2 className="animate-spin text-purple-500" size={16} />}
                            {task.status === 'completed' && <Check className="text-green-500" size={16} />}
                            {task.status === 'error' && <AlertCircle className="text-red-500" size={16} />}

                            <span className="font-bold text-sm">
                                {task.fontName} - {task.variantName}
                            </span>
                        </div>
                        {task.status === 'completed' && (
                            <button onClick={() => clearCompletedTasks()} className="text-gray-400 hover:text-black">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 font-mono mb-2">
                        {task.status === 'pending' && 'Queued...'}
                        {task.status === 'converting' && 'Generating WOFF2...'}
                        {task.status === 'uploading' && 'Uploading WOFF2...'}
                        {task.status === 'completed' && 'Complete!'}
                        {task.status === 'error' && <span className="text-red-500">{task.error}</span>}
                    </div>

                    {task.status !== 'completed' && task.status !== 'error' && (
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full bg-black transition-all duration-300 ease-out"
                                style={{ width: `${task.progress}%` }}
                            />
                        </div>
                    )}

                    {task.status === 'completed' && (
                        <div className="flex justify-end mt-2"
                            onClick={() => {
                                clearCompletedTasks();
                                if (window.location.pathname.includes(task.slug || '')) {
                                    window.location.reload();
                                }
                            }}
                        >
                            View Font
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default UploadProgressPopup;
