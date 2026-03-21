import React, { Suspense } from 'react';

const AnalyticsChart = React.lazy(() => import('./AnalyticsCharts'));

interface AnalyticsSectionProps {
    title: string;
    type: 'downloads' | 'favorites';
    data: { date: string, count: number }[];
    topFonts: { name: string, count: number }[];
    accentColor?: boolean;
}

export default function AnalyticsSection({
    title,
    type,
    data,
    topFonts,
    accentColor = false
}: AnalyticsSectionProps) {
    const colorClass = accentColor ? 'text-[rgb(var(--color-accent))]' : 'text-[rgb(var(--color-foreground))]';
    const bgClass = accentColor ? 'bg-[rgb(var(--color-accent))]' : 'bg-[rgb(var(--color-foreground))]';
    const itemBgClass = accentColor ? 'bg-[rgb(var(--color-accent)/0.05)]' : 'bg-[rgb(var(--color-foreground)/0.03)]';
    const itemBorderClass = accentColor ? 'border-[rgb(var(--color-accent)/0.1)]' : 'border-[rgb(var(--color-border))]';
    const countColorClass = accentColor ? 'text-[rgb(var(--color-accent))]' : 'text-[rgb(var(--color-highlight))]';

    return (
        <div className="mb-12 last:mb-0">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-[rgb(var(--color-foreground))]">
                <div className={`w-3 h-8 ${bgClass} rounded-full`}></div>
                {title}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart */}
                <div className="flex flex-col justify-between bg-[rgb(var(--color-card))] p-6 rounded-4xl border-2 border-[rgb(var(--color-border))] shadow-[4px_4px_0px_0px_rgba(var(--color-border),1)]">
                    <h3 className={`font-bold text-lg mb-6 ${colorClass}`}>{type === 'downloads' ? 'Downloads Trend' : 'Favorites Trend'}</h3>
                    <Suspense fallback={<div className="h-64 flex items-center justify-center bg-[rgb(var(--color-foreground)/0.03)] rounded-2xl border-2 border-dashed border-[rgb(var(--color-border))] font-bold">Loading...</div>}>
                        <AnalyticsChart type={type} data={data} />
                    </Suspense>
                </div>

                {/* Top Fonts */}
                <div className="bg-[rgb(var(--color-card))] p-6 rounded-4xl border-2 border-[rgb(var(--color-border))] shadow-[4px_4px_0px_0px_rgba(var(--color-border),1)]">
                    <h3 className={`font-bold text-lg mb-6 ${colorClass}`}>{type === 'downloads' ? 'Top Downloaded Fonts' : 'Top Favorited Fonts'}</h3>
                    <div className='overflow-y-auto h-65 md:h-80'>
                        {topFonts.length > 0 ? (
                            <div className="space-y-3">
                                {topFonts.map((font, idx) => (
                                    <div key={idx} className={`flex justify-between items-center p-3 ${itemBgClass} rounded-xl border ${itemBorderClass}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 flex items-center justify-center ${bgClass} text-[rgb(var(--color-background))] rounded-full text-xs font-bold`}>
                                                {idx + 1}
                                            </span>
                                            <span className="font-bold text-[rgb(var(--color-foreground))]">{font.name}</span>
                                        </div>
                                        <span className={`font-mono font-bold ${countColorClass}`}>{font.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-[rgb(var(--color-muted-foreground))] py-8">No data available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
