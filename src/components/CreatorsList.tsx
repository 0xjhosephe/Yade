import type { Creator } from '../types';

interface CreatorsListProps {
    creators: Creator[];
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
}

export default function CreatorsList({ creators }: CreatorsListProps) {
    return (
        <div className="rounded border border-border-subtle bg-bg-card p-5 transition hover:border-muted hover:-translate-y-[1px]">
            <h3 className="text-sm font-semibold text-text-muted">
                Top Creators
            </h3>

            <ul className="mt-4 space-y-3">
                {creators.map((c, i) => (
                    <li
                        key={c.id}
                        className="flex items-center gap-3 rounded p-2 transition hover:bg-bg-surface"
                    >
                        {/* Rank badge */}
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                            {i + 1}
                        </span>

                        {/* Avatar */}
                        {c.avatar ? (
                            <img src={c.avatar} alt={c.handle} className="h-9 w-9 shrink-0 rounded-full object-cover border border-border-subtle" />
                        ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-text-inverted border border-accent">
                                {c.handle.charAt(0) === '@' ? c.handle.charAt(1).toUpperCase() : c.handle.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-text-main">{c.handle}</p>
                            <p className="text-[10px] text-text-muted">{c.followers.toLocaleString()} trackers</p>
                        </div>

                        {/* Interactions */}
                        <div className="text-right">
                            <p className="text-sm font-semibold text-text-main">
                                {formatNumber(c.interactions24h)}
                            </p>
                            <p
                                className={`text-xs font-medium ${c.interactionsChange24h >= 0 ? 'text-yes' : 'text-no'
                                    }`}
                            >
                                {c.interactionsChange24h >= 0 ? '+' : ''}
                                {c.interactionsChange24h}%
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
