import { cn } from "../../../lib/utils";

interface CardProps {
    shape?: 'none' | 'clip' | 'clip1' | 'clip2' | 'clip3';
    title: string;
    subtitle?: string;
    timestamp?: string;
    showMore?: boolean;
    className?: string;
}

export function Card({
    shape = 'none',
    title,
    subtitle,
    timestamp,
    showMore = false,
    className
}: CardProps) {

    const shapes = {
        none: '',
        clip: 'polygon(0px 0px, 25% 0px, calc(25% + 9px) 9px, calc(75% - 9px) 9px, 75% 0px, 100% 0px, 100% 100%, 60% 100%, calc(60% - 8px) calc(100% - 8px), calc(40% + 8px) calc(100% - 8px), 40% 100%, 0px 100%)', // Original clip paths
        clip1: 'shape(from 4.76% 0.43%, line to 36.9% 0.43%, line to 38.1% 2.17%, line to 61.83% 2.17%, line to 63.1% 0.43%, line to 95.24% 0.43%, line to 95.24% 7.39%, line to 4.76% 7.39%, line to 4.76% 0.43%, close, move to 0% 6.96%, line to 4.76% 6.96%, line to 4.76% 93.04%, line to 0% 93.04%, line to 0% 60.76%, line to 1.19% 59.13%, line to 1.19% 40.92%, line to 0% 39.24%, line to 0% 6.96%, close, move to 100% 93.04%, line to 95.24% 93.04%, line to 95.24% 6.96%, line to 100% 6.96%, line to 100% 39.24%, line to 98.81% 40.87%, line to 98.81% 59.08%, line to 100% 60.76%, line to 100% 93.04%, close, move to 4.76% 6.96%, line to 95.24% 6.96%, line to 95.24% 93.04%, line to 4.76% 93.04%, line to 4.76% 6.96%, close, move to 4.76% 0%, line to 4.76% 6.96%, line to 0% 6.96%, line to 4.76% 0%, close, move to 0% 93.04%, line to 4.76% 93.04%, line to 4.76% 100%, line to 0% 93.04%, close, move to 95.24% 0%, line to 100% 6.96%, line to 95.24% 6.96%, line to 95.24% 0%, close, move to 95.24% 93.04%, line to 100% 93.04%, line to 95.24% 100%, line to 95.24% 93.04%, close, move to 4.76% 100%, line to 14.29% 100%, line to 15.48% 98.26%, line to 84.52% 98.26%, line to 85.71% 100%, line to 95.24% 100%, line to 95.24% 93.04%, line to 4.76% 93.04%, line to 4.76% 100%, close)',
        clip2: 'shape(from 4.76% 6.96%, line to 95.24% 6.96%, line to 95.24% 93.04%, line to 4.76% 93.04%, line to 4.76% 6.96%, close, move to 4.76% 0%, line to 4.76% 6.96%, line to 0% 6.96%, line to 4.76% 0%, close, move to 0% 93.04%, line to 4.76% 93.04%, line to 4.76% 100%, line to 0% 93.04%, close, move to 95.24% 0%, line to 100% 6.96%, line to 95.24% 6.96%, line to 95.24% 0%, close, move to 95.24% 93.04%, line to 100% 93.04%, line to 95.24% 100%, line to 95.24% 93.04%, close, move to 95.24% 0%, line to 83.93% 0%, line to 82.74% 1.74%, line to 62.5% 1.74%, line to 61.31% 0%, line to 4.76% 0%, line to 4.76% 6.96%, line to 95.24% 6.96%, line to 95.24% 0%, close, move to 4.76% 100%, line to 14.29% 100%, line to 15.48% 98.26%, line to 84.52% 98.26%, line to 85.71% 100%, line to 95.24% 100%, line to 95.24% 93.04%, line to 4.76% 93.04%, line to 4.76% 100%, close, move to 0% 6.96%, line to 4.76% 6.96%, line to 4.76% 93.04%, line to 0% 93.04%, line to 0% 50%, line to 1.19% 48.37%, line to 1.19% 19.35%, line to 0% 17.72%, line to 0% 6.96%, close, move to 100% 6.96%, line to 95.24% 6.96%, line to 95.24% 93.04%, line to 100% 93.04%, line to 100% 6.96%, close)',
        clip3: 'shape(from 95.24% 6.96%, line to 4.76% 6.96%, line to 4.76% 93.04%, line to 95.24% 93.04%, line to 95.24% 6.96%, close, move to 95.24% 0%, line to 95.24% 6.96%, line to 100% 6.96%, line to 95.24% 0%, close, move to 100% 93.04%, line to 95.24% 93.04%, line to 95.24% 100%, line to 100% 93.04%, close, move to 4.76% 0%, line to 0% 6.96%, line to 4.76% 6.96%, line to 4.76% 0%, close, move to 4.76% 93.04%, line to 0% 93.04%, line to 4.76% 100%, line to 4.76% 93.04%, close, move to 4.76% 0%, line to 16.07% 0%, line to 17.26% 1.74%, line to 37.5% 1.74%, line to 38.69% 0%, line to 95.24% 0%, line to 95.24% 6.96%, line to 4.76% 6.96%, line to 4.76% 0%, close, move to 95.24% 100%, line to 85.71% 100%, line to 84.52% 98.26%, line to 15.48% 98.26%, line to 14.29% 100%, line to 4.76% 100%, line to 4.76% 93.04%, line to 95.24% 93.04%, line to 95.24% 100%, close, move to 100% 6.96%, line to 95.24% 6.96%, line to 95.24% 93.04%, line to 100% 93.04%, line to 100% 50%, line to 98.81% 48.37%, line to 98.81% 19.35%, line to 100% 17.72%, line to 100% 6.96%, close, move to 0% 6.96%, line to 4.76% 6.96%, line to 4.76% 93.04%, line to 0% 93.04%, line to 0% 6.96%, close)',
    };

    return (
        <div
            className={cn('border-2 p-6 min-w-[200px] h-full flex flex-col', className)}
            style={{ clipPath: shapes[shape] }}
        >
            <div className={cn('h-1 w-8 mb-4')}></div>
            {timestamp && <p className="text-xs mb-2 opacity-70">{timestamp}</p>}
            <h3 className="text-lg font-bold mb-2 uppercase">{title}</h3>
            {subtitle && <p className="text-sm opacity-70 mb-4">{subtitle}</p>}
            <div className="flex-grow"></div>
            {showMore && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-current opacity-50">
                    <div className={cn('h-1 w-6')}></div>
                    <span className="text-xs font-bold uppercase tracking-wider">MORE</span>
                </div>
            )}
        </div>
    );
}