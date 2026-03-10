import { useMemo } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import type { BetMarket } from '../types';

interface MarketChartProps {
    market: BetMarket;
}

export default function MarketChart({ market }: MarketChartProps) {
    const isYesNo = market.options.length === 2 &&
        market.options.every((o) => o.label === 'Yes' || o.label === 'No');

    // Base colors for generic markets using theme variables
    const baseColors = useMemo(() => ['var(--color-yes)', 'var(--color-no)', 'var(--color-accent)', 'var(--color-contrast-2)', 'var(--color-info)'], []);

    // Map specific options to their designated colors if Yes/No, else fallback to sequence
    const optionColors = useMemo(() => {
        return market.options.map((opt, i) => {
            if (isYesNo) {
                return opt.label === 'Yes' ? 'var(--color-yes)' : 'var(--color-no)';
            }
            return baseColors[i % baseColors.length];
        });
    }, [market.options, isYesNo, baseColors]);
    // Generate mock historical odds data ending with the current odds
    const data = useMemo(() => {
        const now = Date.now();
        const hour = 60 * 60 * 1000;
        const dataPoints = [];

        // We'll generate 30 data points representing progress over time
        for (let i = 30; i >= 0; i--) {
            const timestamp = now - i * hour * 24; // day by day
            const point: Record<string, number> = { timestamp };

            market.options.forEach((opt) => {
                // Random walk that ends at opt.odds
                // To do this simply, we interpolate from a random start to opt.odds
                const progress = (30 - i) / 30;
                // Adds some noise
                const noise = (Math.random() - 0.5) * 15 * (1 - progress);

                let value = Math.round(opt.odds * progress + (50 * (1 - progress)) + noise);
                if (value < 1) value = 1;
                if (value > 99) value = 99;

                // Ensure the final point matches exactly
                if (i === 0) value = opt.odds;

                point[opt.label] = value;
            });

            dataPoints.push(point);
        }
        return dataPoints;
    }, [market.options]);

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* Custom Legend */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 px-2">
                {market.options.map((opt, i) => {
                    const color = optionColors[i];
                    let bgColorClass = '';
                    if (color === 'var(--color-yes)') bgColorClass = 'bg-yes';
                    else if (color === 'var(--color-no)') bgColorClass = 'bg-no';
                    else if (color === 'var(--color-accent)') bgColorClass = 'bg-accent';
                    else if (color === 'var(--color-contrast-2)') bgColorClass = 'bg-contrast-2';
                    else bgColorClass = 'bg-info';

                    return (
                        <div key={opt.label} className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${bgColorClass}`} />
                            <span className="text-xs text-muted">{opt.label}</span>
                            <span className="text-xs font-bold text-text-main">{opt.odds}%</span>
                        </div>
                    );
                })}
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={formatTime}
                            stroke="var(--text-muted)"
                            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            tickFormatter={(v) => `${v}%`}
                            stroke="var(--text-muted)"
                            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                                color: 'var(--text-main)',
                                fontSize: '12px',
                            }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                            labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any, name: any) => [`${value}%`, name]}
                            labelFormatter={(label) => new Date(label).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        />
                        {market.options.map((opt, i) => (
                            <Line
                                key={opt.label}
                                type="stepAfter"
                                dataKey={opt.label}
                                stroke={optionColors[i]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: optionColors[i], stroke: 'var(--bg-base)' }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
