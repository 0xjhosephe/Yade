import type { Post } from '../types';
import Icon from './Icon';

interface PostsFeedProps {
    posts: Post[];
}

function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
}

const networkLabels: Record<string, { label: string; color: string }> = {
    x: { label: '𝕏', color: 'text-text-main' },
    reddit: { label: 'Reddit', color: 'text-orange-500' },
    youtube: { label: 'YouTube', color: 'text-rose-500' },
};

function sentimentBar(score: number) {
    const pct = Math.round(score * 100);
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-border-subtle overflow-hidden">
                <div
                    className="h-full rounded-full bg-accent"
                    ref={(el) => { if (el) el.style.width = `${pct}%`; }}
                />
            </div>
            <span className="text-xs text-text-muted">{pct}%</span>
        </div>
    );
}

export default function PostsFeed({ posts }: PostsFeedProps) {
    return (
        <div className="rounded border border-border-subtle bg-bg-card p-5 transition hover:border-muted hover:-translate-y-[1px]">
            <h3 className="text-sm font-semibold text-text-muted">
                Key Posts
            </h3>

            <div className="mt-4 space-y-4">
                {posts.map((p) => {
                    const net = networkLabels[p.network] ?? { label: p.network, color: 'text-text-muted' };
                    return (
                        <article
                            key={p.id}
                            className="rounded border border-border-subtle bg-bg-surface/30 p-3 transition hover:bg-bg-surface/50"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`font-bold ${net.color}`}>{net.label}</span>
                                <span className="text-text-muted">·</span>
                                <span className="font-medium text-text-main">{p.authorHandle}</span>
                                <span className="ml-auto text-text-muted">{timeAgo(p.createdAt)}</span>
                            </div>

                            {/* Body */}
                            <p className="mt-2 text-sm leading-relaxed text-text-main line-clamp-3">
                                {p.text}
                            </p>

                            {/* Metrics row */}
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
                                <span className="flex items-center gap-1"><Icon name="favorite" className="!text-[14px]" /> {formatCount(p.likes)}</span>
                                <span className="flex items-center gap-1"><Icon name="comment" className="!text-[14px]" /> {formatCount(p.replies)}</span>
                                <span className="flex items-center gap-1"><Icon name="repeat" className="!text-[14px]" /> {formatCount(p.shares)}</span>
                                {sentimentBar(p.sentiment)}
                            </div>

                            {/* CTA */}
                            <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-accent transition hover:text-[#D9533B] capitalize"
                            >
                                View on {net.label}
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
