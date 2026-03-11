import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Contest, BetType, ContestStatus } from '../types';
import Icon from './Icon';

interface ContestCardProps {
    contest: Contest;
    selectedOption?: string | null;
    onSelectOption?: (optionLabel: string | null) => void;
    onBet?: (contest: Contest, contenderLabel: string, rect?: DOMRect) => void;
    onDelete?: (contestId: string) => void;
    isPreview?: boolean;
}

function formatValue(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    if (n < 10 && n % 1 !== 0) return n.toFixed(1);
    return n.toString();
}

function formatVolume(n: number): string {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
    return '$' + n.toString();
}

function formatCountdown(expiresAt: number): string {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return '00:00:00';
    const days = Math.floor(diff / (24 * 3600 * 1000));
    const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
    const totalHours = Math.floor(diff / (3600 * 1000));
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);

    if (days > 0) {
        return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }

    return `${String(totalHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const betTypeConfig: Record<BetType, { label: string; icon: string; gradient: string }> = {
    race: { label: 'Race', icon: 'flag', gradient: 'bg-accent' },
    threshold: { label: 'Threshold', icon: 'analytics', gradient: 'bg-info' },
    comparison: { label: 'Comparison', icon: 'compare_arrows', gradient: 'bg-warning' },
    prediction: { label: 'Prediction', icon: 'online_prediction', gradient: 'bg-[#9333ea]' },
};

const statusConfig: Record<ContestStatus, { label: string; dot: string; text: string; bg: string }> = {
    active: { label: 'Live', dot: 'bg-yes animate-pulse', text: 'text-yes', bg: 'bg-yes/10' },
    finished: { label: 'Finished', dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent/10' },
    expired: { label: 'Expired', dot: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10' },
};

const contenderColors = [
    { bgBase: 'bg-accent/10', bgSelected: 'bg-accent/20', text: 'text-accent', border: 'border-accent', hoverBorder: 'hover:border-accent' },
    { bgBase: 'bg-contrast-2/10', bgSelected: 'bg-contrast-2/20', text: 'text-contrast-2', border: 'border-contrast-2', hoverBorder: 'hover:border-contrast-2' },
    { bgBase: 'bg-info/10', bgSelected: 'bg-info/20', text: 'text-info', border: 'border-info', hoverBorder: 'hover:border-info' },
];

export default function ContestCard({ contest, selectedOption, onSelectOption, onBet, onDelete }: ContestCardProps) {
    const [countdown, setCountdown] = useState(formatCountdown(contest.expiresAt));
    const typeConfig = betTypeConfig[contest.betType];
    const status = statusConfig[contest.status];
    const isActive = contest.status === 'active';

    // Live countdown
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => setCountdown(formatCountdown(contest.expiresAt)), 1000);
        return () => clearInterval(interval);
    }, [contest.expiresAt, isActive]);

    // Progress for race/threshold
    const progressData = useMemo(() => {
        if (!contest.threshold) return null;

        const isRank = contest.metric.includes('rank') || contest.metricLabel.toLowerCase().includes('rank');

        return contest.contenders.map((c) => {
            let pct = 0;
            if (isRank) {
                // For ranks, lower is better. 
                // E.g., target 50, current 150. (50 / 150) * 100 = 33%. As current decreases to 50, pct reaches 100%.
                if (c.currentValue <= contest.threshold!) {
                    pct = 100; // Goal reached
                } else {
                    pct = (contest.threshold! / Math.max(c.currentValue, 1)) * 100;
                }
            } else {
                // Higher is better.
                // E.g., target 1M, current 500k. (500k / 1M) * 100 = 50%.
                pct = (c.currentValue / contest.threshold!) * 100;
            }

            return {
                ...c,
                pct: Math.max(0, Math.min(pct, 100)),
            };
        });
    }, [contest.contenders, contest.threshold, contest.metric, contest.metricLabel]);

    // Leading contender (highest currentValue)
    const leadingLabel = useMemo(() => {
        const sorted = [...contest.contenders].sort((a, b) => b.currentValue - a.currentValue);
        return sorted[0]?.label || null;
    }, [contest.contenders]);

    return (
        <div className="rounded-[32px] border border-border-subtle bg-bg-card overflow-hidden transition-all duration-300 hover:border-brand-lemon/30">
            <div className="p-6">
                {/* Header: Type badge + Status + Countdown */}
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        <Icon name={typeConfig.icon} className="!text-[14px] text-muted" />
                        <span className="rounded bg-bg-card-hover/80 px-1.5 py-0.5 text-[10px] font-medium text-muted border border-border-subtle">
                            {typeConfig.label}
                        </span>
                        <span className={`flex items-center gap-1 rounded bg-bg-card-hover/40 border border-border-subtle/40 px-1.5 py-0.5 text-[10px] font-medium ${status.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                        </span>
                    </div>
                    {isActive && (
                        <div className="flex items-center gap-1 rounded bg-bg-card-hover/80 px-2 py-1 border border-border-subtle">
                            <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px] font-mono font-bold text-text-main tabular-nums">{countdown}</span>
                        </div>
                    )}
                    {contest.isUserGenerated && contest.totalBets === 0 && onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(contest.id); }}
                            className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-red-500/20 ml-2"
                            title="Delete Contest (No bets placed yet)"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Question */}
                <h4 className="mt-4 text-base font-bold leading-snug text-text-main line-clamp-2 min-h-[48px]">
                    {contest.question}
                </h4>

                {/* Metric + Curator */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-bg-card-hover/60 px-1.5 py-0.5 text-[10px] font-medium text-muted border border-border-subtle">
                        {contest.metricLabel}
                    </span>
                    {contest.thresholdLabel && (
                        <>
                            <span className="text-[10px] text-muted">→</span>
                            <span className="text-[10px] font-bold text-accent">{contest.thresholdLabel}</span>
                        </>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                        {contest.isUserGenerated && (
                            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-400 border border-purple-500/30">
                                User generated
                            </span>
                        )}
                        <span className="text-[10px] text-muted">
                            by <span className="text-text-main font-medium">{contest.curatorHandle}</span>
                        </span>
                    </div>
                </div>

                {/* Winner banner */}
                {contest.winner && contest.status === 'finished' && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-yes/15 border border-yes/30 px-3 py-2">
                        <Icon name="trophy" className="text-yes" />
                        <span className="text-[11px] font-semibold text-yes">Winner:</span>
                        <span className="text-sm font-bold text-text-main">{contest.winner}</span>
                    </div>
                )}

                {/* Expired banner */}
                {contest.status === 'expired' && (
                    <div className="mt-3 flex items-center gap-2 rounded-md bg-gray-500/10 border border-gray-600/30 px-3 py-2">
                        <Icon name="schedule" className="text-muted" />
                        <span className="text-[11px] font-semibold text-gray-400">No winner — bets refunded</span>
                    </div>
                )}

                {/* Contenders */}
                <div className="mt-3 space-y-2">
                    {(progressData || contest.contenders.map(c => ({ ...c, pct: null as number | null }))).map((contender, i) => {
                        const baseColors = contenderColors[i % contenderColors.length];
                        const isLeading = contender.label === leadingLabel;
                        const isSelected = selectedOption === contender.label;
                        const isWinner = contest.winner === contender.label;

                        const neutralColors = { bgBase: 'bg-zinc-800/10', bgSelected: 'bg-zinc-800/20', text: 'text-text-main', border: 'border-border-subtle', hoverBorder: 'hover:border-muted' };

                        const colors = !progressData
                            ? neutralColors
                            : isLeading && isActive
                                ? { bgBase: 'bg-yes/10', bgSelected: 'bg-yes/20', text: 'text-yes', border: 'border-yes', hoverBorder: 'hover:border-yes' }
                                : !isLeading && isActive
                                    ? { bgBase: 'bg-no/10', bgSelected: 'bg-no/20', text: 'text-no', border: 'border-no', hoverBorder: 'hover:border-no' }
                                    : baseColors;

                        return (
                            <button
                                key={contender.label}
                                onClick={() => isActive && onSelectOption ? onSelectOption(isSelected ? null : contender.label) : undefined}
                                disabled={!isActive}
                                className={`group relative overflow-hidden w-full text-left rounded-lg border p-2.5 transition-all duration-300 min-h-[44px] ${isSelected
                                    ? `${colors.border} bg-bg-card`
                                    : isWinner
                                        ? 'border-yes/40 bg-yes/5'
                                        : `border-border-subtle bg-bg-card/40 ${colors.hoverBorder} hover:bg-bg-card/60 hover:border-brand-lemon/30`
                                    } ${!isActive ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {/* Progress bar background */}
                                {contender.pct !== null && contender.pct !== undefined && (
                                    <div
                                        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${isWinner ? 'bg-yes/20' : isSelected ? colors.bgSelected : colors.bgBase}`}
                                        ref={(el) => { if (el) el.style.width = `${contender.pct}%`; }}
                                    />
                                )}

                                <div className="relative flex flex-col gap-2">
                                    {/* Contender header */}
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            {contender.iconType === 'image' ? (
                                                <img src={contender.icon} alt={contender.label} className="w-6 h-6 rounded-full object-cover border border-zinc-700" />
                                            ) : (
                                                <Icon name={contender.icon} className="icon-md text-text-muted" />
                                            )}
                                            <span className={`text-sm ${isSelected ? 'font-bold text-text-main' : 'font-medium text-text-muted'}`}>
                                                {contender.label}
                                            </span>

                                            {isWinner && (
                                                <span className="rounded bg-yes/15 px-1.5 py-0.5 text-[9px] font-semibold text-yes">
                                                    Winner
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted">{contender.paysOut.toFixed(2)}x</span>
                                            {contender.pct !== null && contender.pct !== undefined && (
                                                <span className={`text-xs font-bold ${colors.text}`}>
                                                    {contender.pct.toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>


                                    {/* Stats row */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted">
                                            {formatValue(contender.currentValue)}
                                            {contest.thresholdLabel ? ` / ${contest.thresholdLabel}` : ` ${contest.metricLabel.toLowerCase()}`}
                                        </span>
                                        <span className="text-[10px] text-muted">
                                            {formatValue(contender.bets)} bets
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-3 border-t border-border-subtle/50 pt-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted">
                            {formatVolume(contest.volume)} vol · {contest.totalBets} bets
                        </span>

                        {!isActive ? (
                            <Link
                                to={`/market/${contest.category.toLowerCase()}/${contest.id}`}
                                className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card-hover/50 px-3 py-1.5 text-[11px] font-bold text-text-main transition hover:border-brand-lemon/50 hover:bg-bg-card-hover/80"
                            >
                                View
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        ) : (
                            selectedOption && (
                                <button
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        onBet?.(contest, selectedOption, rect);
                                    }}
                                    className={`rounded-lg px-4 py-1.5 text-xs font-bold text-black bg-brand-orange transition active:scale-95 hover:brightness-110`}
                                >
                                    Place bet
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
