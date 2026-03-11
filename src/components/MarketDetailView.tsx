import { useState, useEffect } from 'react';
import type { BetMarket, MarketOption, ESPNNewsArticle } from '../types';
import { fetchSportsNews } from '../services/espnApi';
import Icon from './Icon';
import MarketChart from './MarketChart';

interface MarketDetailViewProps {
    market: BetMarket;
    selectedOption: string | null;
    onSelectOption: (optionLabel: string | null) => void;
    onBack: () => void;
    espnLeague?: string;
    espnLink?: string;
}

export default function MarketDetailView({
    market,
    selectedOption,
    onSelectOption,
    onBack,
    espnLeague,
    espnLink,
}: MarketDetailViewProps) {
    const [news, setNews] = useState<ESPNNewsArticle[]>([]);
    const [loadingNews, setLoadingNews] = useState(false);
    const [activeTab, setActiveTab] = useState<'chart' | 'rules' | 'activity'>('chart');

    // Fetch news when league is available
    useEffect(() => {
        if (!espnLeague) return;
        const loadNews = async () => {
            setLoadingNews(true);
            try {
                const fetchedNews = await fetchSportsNews(espnLeague, 5);

                // Smart Filter keywords from question and options
                const qTokens = market.question.split(/[\s,?!\-():]+/);
                const oTokens = market.options.map((o: MarketOption) => o.label.split(/[\s,?!\-():]+/)).flat();
                const allTokens = [...qTokens, ...oTokens];

                const keywords = Array.from(new Set(
                    allTokens
                        .map(t => t.toLowerCase())
                        .filter(t => t.length > 3 && !['versus', 'will', 'with', 'that', 'from', 'this', 'into'].includes(t))
                ));

                // Filter news by keywords to ensure high relevance (per user request)
                const relevantNews = fetchedNews.filter(article => {
                    const text = (article.headline + ' ' + article.description).toLowerCase();
                    // If we have keywords, at least one MUST match
                    if (keywords.length > 0) {
                        return keywords.some(kw => text.includes(kw));
                    }
                    return true; // Fallback if no keywords extracted
                });

                setNews(relevantNews);
            } catch (err) {
                console.error('Failed to load news:', err);
                setNews([]);
            } finally {
                setLoadingNews(false);
            }
        };
        loadNews();
    }, [espnLeague, market.question, market.options]);

    // Mock activity data
    const mockActivity = [
        { user: 'João S.', action: 'Bought Yes', amount: '25 USDC', time: 'Now' },
        { user: 'Maria L.', action: 'Bought No', amount: '50 STX', time: '2m ago' },
        { user: 'Pedro R.', action: 'Bought Yes', amount: '100 USDC', time: '5m ago' },
        { user: 'Ana M.', action: 'Sold No', amount: '10 USDC', time: '8m ago' },
        { user: 'Carlos V.', action: 'Bought Yes', amount: '75 STX', time: '12m ago' },
    ];

    return (
        <div className="flex flex-col gap-5">
            {/* Back button + Title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    aria-label="Back to feed"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card border border-border-subtle text-text-muted hover:text-text-main transition-all active:scale-90"
                >
                    <Icon name="arrow_back" className="!text-sm" />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-text-main truncate">{market.question}</h2>
                    {market.description && (
                        <p className="text-xs text-text-muted truncate">{market.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {espnLink && (
                        <a
                            href={espnLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card border border-border-subtle text-text-muted hover:text-accent transition-all"
                            title="Acompanhar ao vivo"
                        >
                            <Icon name="open_in_new" className="!text-sm" />
                        </a>
                    )}
                    <button aria-label="Share" className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card border border-border-subtle text-text-muted hover:text-text-main transition-all">
                        <Icon name="share" className="!text-sm" />
                    </button>
                </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${market.status === 'live' ? 'bg-yes/15 text-yes animate-pulse' :
                    market.status === 'upcoming' ? 'bg-lemon/15 text-lemon' :
                        'bg-zinc-500/15 text-zinc-400'
                    }`}>
                    {market.status === 'live' ? 'Live' : market.status === 'upcoming' ? 'Upcoming' : 'Closed'}
                </span>
                <span className="text-xs text-text-muted">
                    ${(market.volume / 1000000).toFixed(1)}M vol • {market.options.length} options
                </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-bg-card rounded-2xl p-1 border border-border-subtle">
                {(['chart', 'rules', 'activity'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 capitalize ${activeTab === tab
                            ? 'bg-bg-card-hover text-text-main border border-brand-lemon/20'
                            : 'text-text-muted hover:text-text-main hover:bg-bg-card-hover/50'
                            }`}
                    >
                        {tab === 'chart' ? 'Chart' : tab === 'rules' ? 'Rules' : 'Activity'}
                    </button>
                ))}
            </div>

            {/* Chart Tab */}
            {activeTab === 'chart' && (
                <div className="rounded-[32px] border border-border-subtle bg-bg-card p-5">
                    <div className="min-h-[300px]">
                        <MarketChart market={market} />
                    </div>
                </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
                <div className="rounded-[32px] border border-border-subtle bg-bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon name="calendar_today" className="text-accent !text-base" />
                        <h3 className="text-sm font-bold text-text-main">Timeline and Payout</h3>
                    </div>
                    <div className="flex flex-col gap-3 pl-2 border-l-2 border-border-subtle ml-2">
                        <div className="flex items-start gap-3 relative">
                            <div className="absolute -left-[13px] w-3 h-3 rounded-full bg-yes border-2 border-bg-card" />
                            <div className="pl-3">
                                <p className="text-sm font-bold text-text-main">Market Open</p>
                                <p className="text-xs text-text-muted">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 relative">
                            <div className="absolute -left-[13px] w-3 h-3 rounded-full bg-border-subtle border-2 border-bg-card" />
                            <div className="pl-3">
                                <p className="text-sm font-bold text-text-main">Market Closes</p>
                                <p className="text-xs text-text-muted">After the outcome occurs</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 relative">
                            <div className="absolute -left-[13px] w-3 h-3 rounded-full bg-border-subtle border-2 border-bg-card" />
                            <div className="pl-3">
                                <p className="text-sm font-bold text-text-main">Projected Payout</p>
                                <p className="text-xs text-text-muted">1 minute after closing</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-text-muted mt-4 leading-relaxed">
                        This market will close and expire after a winner is declared. Otherwise, it closes by {new Date(market.closesAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                    </p>
                    {espnLink && (
                        <p className="text-xs text-text-muted mt-2">
                            Outcome verified from <a href={espnLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-bold">ESPN</a>.
                        </p>
                    )}
                </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
                <div className="rounded-[32px] border border-border-subtle bg-bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-bold text-text-main">Activity</h3>
                    </div>
                    <div className="flex flex-col">
                        {mockActivity.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3 border-b border-border-subtle/50 last:border-b-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${item.action.includes('Yes') ? 'bg-yes' : 'bg-no'}`} />
                                    <div>
                                        <span className={`text-xs font-bold ${item.action.includes('Yes') ? 'text-yes' : 'text-no'}`}>
                                            {item.action.includes('Bought') ? 'Bought' : 'Sold'} {item.action.includes('Yes') ? 'Yes' : 'No'}
                                        </span>
                                        <span className="text-xs text-text-muted"> · {item.user}</span>
                                        <p className="text-[10px] text-text-muted/60">{item.amount}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-text-muted/60">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vote/Bet Options */}
            <div className="rounded-[32px] border border-border-subtle bg-bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-text-muted font-semibold">Chance</span>
                </div>

                {market.options.map((opt: MarketOption) => {
                    const isWinning = opt.odds === Math.max(...market.options.map(o => o.odds));
                    const isActive = selectedOption === opt.label;
                    const isYesNo = market.options.length === 2 && market.options.every(o => o.label === 'Yes' || o.label === 'No');

                    return (
                        <div
                            key={opt.label}
                            className={`flex items-center justify-between py-3 border-b border-border-subtle/50 last:border-b-0 transition-colors ${isActive ? 'bg-bg-card-hover/30 -mx-5 px-5 rounded-lg' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {opt.icon && (
                                    opt.iconType === 'image' ? (
                                        <img src={opt.icon} alt={opt.label} className="w-6 h-6 rounded-full object-cover border border-border-subtle" />
                                    ) : (
                                        <span className="text-lg">{opt.icon}</span>
                                    )
                                )}
                                <span className="text-sm font-bold text-text-main">{opt.label}</span>
                                <span className={`text-sm font-black ${isWinning ? 'text-yes' : 'text-text-muted'}`}>
                                    {Math.round(opt.odds)}%
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {isYesNo ? (
                                    <>
                                        <button
                                            onClick={() => onSelectOption(isActive && selectedOption === opt.label ? null : opt.label)}
                                            className={`px-4 py-1 rounded-lg text-xs font-bold border transition-all ${isActive ? 'border-yes bg-yes/10 text-yes' : 'border-border-subtle text-yes hover:border-yes'
                                                }`}
                                        >
                                            Yes {Math.round(opt.odds)}¢
                                        </button>
                                        <button
                                            onClick={() => onSelectOption(isActive ? null : opt.label)}
                                            className={`px-4 py-1 rounded-lg text-xs font-bold border transition-all ${isActive ? 'border-no bg-no/10 text-no' : 'border-border-subtle text-no hover:border-no'
                                                }`}
                                        >
                                            No {100 - Math.round(opt.odds)}¢
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => onSelectOption(isActive ? null : opt.label)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${isActive
                                            ? 'border-accent bg-accent/10 text-accent'
                                            : 'border-border-subtle text-text-muted hover:border-accent hover:text-accent'
                                            }`}
                                    >
                                        Bet
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ESPN News Section (Related to sport/league) */}
            {espnLeague && (loadingNews || news.length > 0) && (
                <div className="rounded-[32px] border border-border-subtle bg-bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon name="newspaper" className="text-accent !text-base" />
                        <h3 className="text-sm font-bold text-text-main">Live News</h3>
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">ESPN</span>
                    </div>

                    {loadingNews ? (
                        <div className="flex items-center gap-2 py-4">
                            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                            <span className="text-xs text-text-muted">Loading news...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {news.map((article, idx) => (
                                <a
                                    key={idx}
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex gap-3 py-2 border-b border-border-subtle/50 last:border-b-0 hover:bg-bg-card-hover/30 -mx-2 px-2 rounded-lg transition-colors"
                                >
                                    {article.imageUrl && (
                                        <img
                                            src={article.imageUrl}
                                            alt=""
                                            className="w-16 h-12 rounded-lg object-cover shrink-0 border border-border-subtle"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-text-main group-hover:text-accent transition-colors line-clamp-2">
                                            {article.headline}
                                        </h4>
                                        <p className="text-[10px] text-text-muted mt-0.5 truncate">
                                            {article.published ? new Date(article.published).toLocaleDateString() : ''}
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
