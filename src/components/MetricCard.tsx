import type { Metric } from '../types';

export default function MetricCard({ label, value, delta, deltaType, helperText }: Metric) {
    const deltaColor =
        deltaType === 'positive'
            ? 'text-yes'
            : deltaType === 'negative'
                ? 'text-no'
                : 'text-text-muted';

    return (
        <div className="rounded border border-border-subtle bg-bg-card p-5 transition hover:border-muted hover:-translate-y-[1px]">
            <p className="text-xs font-medium text-text-muted">{label}</p>
            <div className="mt-2 flex items-end gap-3">
                <h4 className="text-[11px] font-semibold text-text-main">{value}</h4>
                <span className={`text-sm font-semibold ${deltaColor}`}>{delta}</span>
            </div>
            {helperText && (
                <p className="mt-4 text-[11px] text-text-muted">
                    {helperText}
                </p>
            )}
        </div>
    );
}
