import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsChartsProps {
    type: 'downloads' | 'favorites';
    data: { date: string, count: number }[];
}

export default function AnalyticsChart({ type, data }: AnalyticsChartsProps) {
    const isFavorites = type === 'favorites';
    const color = isFavorites ? 'rgb(var(--color-accent))' : 'rgb(var(--color-foreground))';
    const activeDotColor = isFavorites ? 'rgb(var(--color-foreground))' : 'rgb(var(--color-accent))';

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
                        tick={{ fontSize: 12, fill: 'rgb(var(--color-muted-foreground))' }}
                        interval={4}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'rgb(var(--color-muted-foreground))' }} />
                    <Tooltip
                        contentStyle={{ 
                            borderRadius: '12px', 
                            border: '2px solid rgb(var(--color-border))', 
                            fontWeight: 'bold', 
                            backgroundColor: 'rgb(var(--color-card))',
                            borderColor: isFavorites ? 'rgb(var(--color-accent))' : 'rgb(var(--color-border))'
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
