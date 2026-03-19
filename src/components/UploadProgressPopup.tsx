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
                <div key={task.id} className="bg-[rgb(var(--color-card)/0.8)] backdrop-blur-md border border-[rgb(var(--color-border))] p-4 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] animate-in slide-in-from-right fade-in duration-300">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            {task.status === 'pending' && <Loader2 className="animate-spin text-[rgb(var(--color-muted-foreground))]" size={16} />}
                            {task.status === 'converting' && <Loader2 className="animate-spin text-[rgb(var(--color-accent))]" size={16} />}
                            {task.status === 'uploading' && <Loader2 className="animate-spin text-[rgb(var(--color-highlight))]" size={16} />}
                            {task.status === 'completed' && <Check className="text-[rgb(var(--color-success,var(--color-accent)))]" size={16} />}
                            {task.status === 'error' && <AlertCircle className="text-[rgb(var(--color-destructive))]" size={16} />}

                            <span className="font-bold text-sm text-[rgb(var(--color-foreground))]">
                                {task.fontName} - {task.variantName}
                            </span>
                        </div>
                        {task.status === 'completed' && (
                            <button onClick={() => clearCompletedTasks()} className="text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="text-[10px] text-[rgb(var(--color-muted-foreground))] font-mono mb-2 uppercase tracking-tight">
                        {task.status === 'pending' && 'Queued...'}
                        {task.status === 'converting' && 'Optimizing...'}
                        {task.status === 'uploading' && `Uploading... ${task.progress}%`}
                        {task.status === 'completed' && 'Done'}
                        {task.status === 'error' && <span className="text-[rgb(var(--color-destructive))]">{task.error}</span>}
                    </div>

                    {task.status !== 'completed' && task.status !== 'error' && (
                        <div className="w-full bg-[rgb(var(--color-muted)/0.2)] rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full bg-[rgb(var(--color-accent))] transition-all duration-300 ease-out"
                                style={{ width: `${task.progress}%` }}
                            />
                        </div>
                    )}

                    {task.status === 'completed' && (
                        <div className="flex justify-end mt-2">
                            <button 
                                onClick={() => {
                                    clearCompletedTasks();
                                    if (window.location.pathname.includes(task.slug || '')) {
                                        window.location.reload();
                                    }
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-highlight))] transition-colors"
                            >
                                View Font
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default UploadProgressPopup;
