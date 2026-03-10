import { useState } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import type { SeriesPoint } from '../types';

interface TimeSeriesChartProps {
    data: SeriesPoint[];
    isLoading?: boolean;
    hideHeader?: boolean;
}

const pills = ['24h', '7d', '30d'] as const;

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatK(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
    return v.toString();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded border border-border-subtle bg-bg-surface px-3 py-2">
            <p className="mb-1 text-xs font-medium text-text-muted">
                {new Date(label).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            {payload.map((entry: any) => (
                <p
                    key={entry.dataKey}
                    className="text-xs text-gray-50"
                    ref={(el) => { if (el) el.style.color = entry.color; }}
                >
                    {entry.name}: {formatK(entry.value)}
                </p>
            ))}
        </div>
    );
}

export default function TimeSeriesChart({ data, isLoading, hideHeader }: TimeSeriesChartProps) {
    const [activePill, setActivePill] = useState<(typeof pills)[number]>('24h');

    return (
        <div className={`rounded border border-border-subtle bg-bg-card transition hover:border-muted hover:-translate-y-[1px] ${hideHeader ? 'h-full w-full border-none bg-transparent p-0' : 'p-5'}`}>
            {/* Header */}
            {!hideHeader && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-text-main">Social Activity Timeline</h3>
                        <p className="text-[11px] text-text-muted">Interactions, posts & active creators over time</p>
                    </div>

                    {/* Time range pills */}
                    <div className="flex gap-1 rounded bg-gray-900/60 p-0.5 border border-border-subtle">
                        {pills.map((p) => (
                            <button
                                key={p}
                                onClick={() => setActivePill(p)}
                                className={`rounded-md px-3 py-1 text-xs font-medium transition ${activePill === p
                                    ? 'bg-accent text-text-inverted shadow-sm'
                                    : 'text-text-muted hover:text-text-main hover:bg-bg-surface'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Chart area */}
            <div className={`w-full rounded ${hideHeader ? 'h-full bg-transparent p-0' : 'mt-4 h-56 bg-bg-surface/30 p-2'}`}>
                {isLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-600">
                        Loading chart data…
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={formatTime}
                                stroke="var(--text-muted)"
                                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={formatK}
                                stroke="var(--text-muted)"
                                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                contentStyle={{
                                    backgroundColor: '#0B0B0B',
                                    border: '1px solid #262626',
                                    borderRadius: '12px',
                                    color: '#F3F2F0',
                                    fontSize: '12px',
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                align="right"
                                iconType="rect"
                                iconSize={8}
                                wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="interactions"
                                name="Interactions"
                                stroke="#FF6B4A"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#FF6B4A' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="postsActive"
                                name="Active Posts"
                                stroke="#34d399"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#34d399' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="contributorsActive"
                                name="Contributors"
                                stroke="#fbbf24"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#fbbf24' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
