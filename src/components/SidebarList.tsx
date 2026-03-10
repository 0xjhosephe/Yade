import { Link } from 'react-router-dom';
import type { BetMarket } from '../types';
import Icon from './Icon';

interface SidebarListProps {
    title: string;
    markets: BetMarket[];
    topicId: string;
}

export default function SidebarList({ title, markets, topicId }: SidebarListProps) {
    return (
        <div className="mb-8">
            <h3 className="mb-4 text-[13px] font-semibold text-text-main flex items-center gap-2">
                {title}
                <Icon name="chevron_right" className="text-accent !text-sm" />
            </h3>

            <div className="flex flex-col gap-1">
                {markets.map((market, index) => {
                    const topOption = [...market.options].sort((a, b) => b.odds - a.odds)[0];
                    const trend = market.trend24h || 0;
                    const isPositive = trend >= 0;

                    return (
                        <Link
                            key={market.id}
                            to={`/market/${topicId}/${market.id}`}
                            className="group flex items-start gap-3 p-2.5 transition rounded-xl hover:bg-bg-surface/50"
                        >
                            <div className="flex flex-col items-center gap-1 min-w-[20px]">
                                <span className="text-sm font-bold text-muted pt-0.5">{index + 1}</span>
                                {market.topicIcon && <Icon name={market.topicIcon} className="!text-[12px]" />}
                            </div>

                            <div className="flex-1">
                                <h4 className="text-sm font-semibold leading-snug text-text-main group-hover:text-accent transition">
                                    {market.question}
                                </h4>
                                <p className="mt-1 text-xs text-muted">
                                    {topOption.label}
                                </p>
                            </div>

                            <div className="flex flex-col items-end pt-0.5">
                                <span className="text-sm font-bold text-text-main mb-1">
                                    {topOption.odds}%
                                </span>
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isPositive ? '▲' : '▼'} {Math.abs(trend)}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <button className="mt-2 w-full border-t border-border-subtle pt-3 text-center text-xs font-semibold text-text-muted transition hover:text-text-main">
                View all in {title}
            </button>
        </div>
    );
}
