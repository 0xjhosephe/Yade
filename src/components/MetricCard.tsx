import type { Metric } from '../types';

export default function MetricCard({ label, value, delta, deltaType, helperText }: Metric) {
    const deltaColor =
        deltaType === 'positive'
            ? 'text-yes'
            : deltaType === 'negative'
                ? 'text-no'
                : 'text-text-muted';

    return (
        <div className="rounded-[32px] border border-border-subtle bg-bg-card p-5 transition-all duration-300 hover:border-brand-lemon/30">
            <p className="text-xs font-medium text-text-muted">{label}</p>
            <div className="mt-2 flex items-baseline gap-2">
                <h4 className="text-lg font-bold text-text-main">{value}</h4>
                <span className={`text-xs font-semibold ${deltaColor}`}>{delta}</span>
            </div>
            {helperText && (
                <p className="mt-4 text-[11px] text-text-muted">
                    {helperText}
                </p>
            )}
        </div>
    );
}
