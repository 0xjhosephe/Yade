import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { BetMarket } from '../types';
import Icon from './Icon';


interface BettingCardProps {
    market: BetMarket;
    topicId?: string;
    hideDetailsLink?: boolean;
    selectedOption?: string | null;
    onSelectOption?: (optionLabel: string | null) => void;
    onBet?: (market: BetMarket, contenderLabel: string, rect?: DOMRect) => void;
}

function formatVolume(n: number): string {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
    return '$' + n.toString();
}

function formatVotes(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
}

function formatClosesAt(closesAt: number): string {
    const diff = closesAt - Date.now();
    if (diff <= 0) return 'Closed';

    const days = Math.floor(diff / (24 * 3600 * 1000));
    const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
    const totalHours = Math.floor(diff / (3600 * 1000));
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);

    if (days > 0) {
        return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s remaining`;
    }

    if (totalHours > 0) return `${totalHours}h ${mins}m remaining`;
    return `${mins}m remaining`;
}

const statusStyles: Record<string, { dot: string; text: string; bg: string }> = {
    live: { dot: 'bg-yes animate-pulse', text: 'text-yes', bg: 'bg-yes/10' },
    upcoming: { dot: 'bg-lemon', text: 'text-lemon', bg: 'bg-lemon/10' },
    closed: { dot: 'bg-slate-500', text: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export default function BettingCard({ market, topicId, hideDetailsLink, selectedOption, onSelectOption, onBet }: BettingCardProps) {
    // const [isModalOpen, setIsModalOpen] = useState(false);  // Removed local modal state
    const style = statusStyles[market.status];
    const isYesNo = market.options.length === 2 &&
        market.options.every((o) => o.label === 'Yes' || o.label === 'No');

    const winningOdds = Math.max(...market.options.map((o) => o.odds));

    // Determine Theme Color based on Selected Option
    const selectedThemeColor = useMemo(() => {
        if (!selectedOption) return 'bg-accent';

        const opt = market.options.find(o => o.label === selectedOption);
        const isWinning = opt?.odds === winningOdds;

        if (isYesNo) {
            return selectedOption === 'Yes' ? 'bg-yes' : 'bg-no';
        }

        // Highlight top option in Olive green for any market type
        if (isWinning) return 'bg-yes';

        return 'bg-accent';
    }, [selectedOption, isYesNo, market.options, winningOdds]);

    // Derived classes for border
    // selectedBorderClass is intended for future usage or can be removed if handled inline

    return (
        <div className="rounded-[24px] border border-border-subtle bg-bg-card p-6 transition hover:border-muted-dark hover:-translate-y-[1px]">
            {/* Header row - Standardized height for alignment */}
            <div className="flex items-start justify-between gap-2 h-6">
                <div className="min-w-0 flex-1 flex items-center">
                    <span className="rounded bg-yes/15 px-1.5 py-0.5 text-[10px] font-medium text-yes mt-0.5">
                        {market.category}
                    </span>
                </div>

                {/* Status badge */}
                <span className={`flex shrink-0 items-center gap-1 rounded bg-bg-card-hover/40 border border-border-subtle/40 px-1.5 py-0.5 text-[10px] font-medium ${style.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {market.status}
                </span>
            </div>

            <h4 className="mt-4 text-sm font-bold leading-snug text-text-main line-clamp-2 min-h-[44px]">
                {market.question}
            </h4>

            {/* Status detail - Fixed height to avoid grid shifts */}
            <div className="mt-2 h-4 flex items-center">
                <p className="text-[11px] text-muted">
                    {market.statusDetail || (market.closesAt ? formatClosesAt(market.closesAt) : '')}
                </p>
            </div>

            {/* Options */}
            <div className="mt-5 space-y-3">
                {market.options.map((opt) => {
                    const isSelected = selectedOption === opt.label;
                    const isWinning = opt.odds === winningOdds;

                    let optionBorderClass = 'border-accent';
                    let hoverBorderClass = 'hover:border-accent';
                    if (isYesNo) {
                        optionBorderClass = opt.label === 'Yes' ? 'border-yes' : 'border-no';
                        hoverBorderClass = opt.label === 'Yes' ? 'hover:border-yes' : 'hover:border-no';
                    } else if (isWinning) {
                        optionBorderClass = 'border-yes';
                        hoverBorderClass = 'hover:border-yes';
                    }

                    return (
                        <div
                            key={opt.label}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectOption ? onSelectOption(isSelected ? null : opt.label) : undefined}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (onSelectOption) onSelectOption(isSelected ? null : opt.label);
                                }
                            }}
                            className={`group cursor-pointer relative w-full overflow-hidden rounded-md border px-3 py-2 text-left transition min-h-[44px] ${isSelected
                                ? `${optionBorderClass} bg-bg-card`
                                : `border-border-subtle bg-bg-card/40 ${hoverBorderClass} hover:bg-bg-card/60`
                                }`}
                        >
                            {/* Odds bar background */}
                            <div
                                className={`absolute inset-y-0 left-0 transition-all duration-500 ${isSelected
                                    ? isYesNo
                                        ? opt.label === 'Yes' ? 'bg-yes/20' : 'bg-no/20'
                                        : isWinning ? 'bg-yes/20' : 'bg-accent/15'
                                    : isYesNo
                                        ? opt.label === 'Yes' ? 'bg-yes/10' : 'bg-no/10'
                                        : isWinning ? 'bg-yes/10' : 'bg-accent/5'
                                    }`}
                                ref={(el) => { if (el) el.style.width = `${opt.odds}%`; }}
                            />

                            {/* Content */}
                            <div className="relative flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    {/* Yes/No color indicator */}
                                    {isYesNo && (
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${opt.label === 'Yes' ? 'bg-yes' : 'bg-no'
                                                }`}
                                        />
                                    )}
                                    {opt.icon && (
                                        opt.iconType === 'image' ? (
                                            <img src={opt.icon} alt={opt.label} className="w-5 h-5 rounded-full object-cover border border-zinc-700" />
                                        ) : (
                                            <Icon name={opt.icon} className="icon-md text-text-muted" />
                                        )
                                    )}
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold transition ${isSelected ? 'text-text-main' : 'text-text-muted'}`}>
                                            {opt.label}
                                        </span>
                                        {opt.subLabel && (
                                            opt.link ? (
                                                <span onClick={(e) => { e.stopPropagation(); window.open(opt.link, '_blank'); }} className="mt-0.5 text-[10px] text-muted hover:text-accent hover:underline decoration-accent/50 transition cursor-pointer">
                                                    {opt.subLabel}
                                                </span>
                                            ) : (
                                                <span className="mt-0.5 text-[10px] text-muted">
                                                    {opt.subLabel}
                                                </span>
                                            )
                                        )}
                                    </div>

                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Payout multiplier */}
                                    <span className="text-xs text-muted">
                                        {opt.paysOut.toFixed(2)}x
                                    </span>

                                    {/* Odds pill */}
                                    <span
                                        className={`min-w-[52px] rounded-md px-2.5 py-1 text-center text-sm font-bold transition ${isSelected
                                            ? isYesNo
                                                ? opt.label === 'Yes'
                                                    ? 'bg-yes text-black'
                                                    : 'bg-no text-black'
                                                : isWinning
                                                    ? 'bg-yes text-black'
                                                    : 'bg-accent text-black'
                                            : isYesNo
                                                ? opt.label === 'Yes'
                                                    ? 'bg-yes/15 text-yes'
                                                    : 'bg-no/15 text-no'
                                                : isWinning
                                                    ? 'bg-yes/15 text-yes'
                                                    : 'bg-border-subtle text-text-main'
                                            }`}
                                    >
                                        {opt.odds}%
                                    </span>
                                </div>
                            </div>

                            {/* Votes */}
                            <p className="relative mt-1 text-[10px] text-muted">
                                {formatVotes(opt.votes)} votes
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle/60 pt-3">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted">
                        {formatVolume(market.volume)} vol
                    </span>

                    {selectedOption ? (
                        <button
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                onBet?.(market, selectedOption, rect);
                            }}
                            className={`rounded-md px-4 py-1.5 text-xs font-bold text-black transition active:scale-95 ${selectedThemeColor} hover:opacity-90`}
                        >
                            Place bet
                        </button>
                    ) : (
                        topicId && !hideDetailsLink && (
                            <Link
                                id={`view-details-${market.id}`}
                                to={`/market/${topicId}/${market.id}`}
                                className="rounded-md border border-border-subtle bg-bg-card-hover/50 px-4 py-2 text-xs font-bold text-text-main transition hover:border-muted hover:bg-bg-card-hover"
                            >
                                View Social Details
                            </Link>
                        )
                    )}
                </div>
            </div>

        </div>
    );
}
