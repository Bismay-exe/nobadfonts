import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsChartsProps {
    type: 'downloads' | 'favorites';
    data: { date: string, count: number }[];
}

export default function AnalyticsChart({ type, data }: AnalyticsChartsProps) {
    const isFavorites = type === 'favorites';
    const color = isFavorites ? 'var(--color-accent)' : 'var(--color-foreground)';
    const activeDotColor = isFavorites ? 'var(--color-foreground)' : 'var(--color-accent)';

    return (
        <div className="h-64 w-full -translate-x-5 md:-translate-x-8">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(str) => {
                            const date = new Date(str);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                        tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                        interval={4}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                    <Tooltip
                        contentStyle={{ 
                            borderRadius: '12px', 
                            border: '2px solid var(--color-border)', 
                            fontWeight: 'bold', 
                            backgroundColor: 'var(--color-card-background)',
                            borderColor: isFavorites ? 'var(--color-accent)' : 'var(--color-border)'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke={color}
                        strokeWidth={3}
                        dot={{ r: 4, fill: color }}
                        activeDot={{ r: 6, fill: activeDotColor }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
