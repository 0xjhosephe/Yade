import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
import { generateMockMarkets, generateMockContests, isAdmin } from '../services/mockDataGenerator';
import { topics } from '../mocks/topics';
import { featuredBets } from '../mocks/apiResponses';
import type { TopicId, Topic, BetMarket, MarketOption, Contest, SeriesPoint, LunarCrushCategory } from '../types';
import Icon from '../components/Icon';
import MarketChart from '../components/MarketChart';
import TimeSeriesChart from '../components/TimeSeriesChart';
import BettingCard from '../components/BettingCard';
import ContestCard from '../components/ContestCard';
import SidebarList from '../components/SidebarList';
import BetModal from '../components/BetModal';
import { fetchCategories, getGlobalMockStatus, setGlobalMockStatus } from '../services/api';
import { UNIFIED_SPORT_CATEGORIES } from '../services/espnApi';
import { getTopicTimeSeries, getTopicCreators, getTopicPosts, generateDynamicBets } from '../services/lunarcrush';

const globalMarkets = topics.flatMap(t => t.mockMarkets.map(m => ({ ...m, topicIcon: t.icon })));

export default function Dashboard() {
    const [selectedTopicId, setSelectedTopicId] = useState<TopicId | 'trending'>('trending');
    const [selectedBetOption, setSelectedBetOption] = useState<{ market: BetMarket, optionLabel: string } | null>(null);
    const [isBetModalOpen, setIsBetModalOpen] = useState(false);
    const navigate = useNavigate();

    // Collect all sport category slugs so we can differentiate sport vs non-sport
    const allSportSlugs = new Set(UNIFIED_SPORT_CATEGORIES.flatMap(u => u.lunarCategories));

    // Global Selection State ensures only 1 option is selected across the entire dashboard
    const [globalSelection, setGlobalSelection] = useState<{ id: string, option: string } | null>(null);

    // Auth & Categories State
    const [categories, setCategories] = useState<LunarCrushCategory[]>([]);
    const [userAddress, setUserAddress] = useState<string | null>(() => {
        if (isConnected()) {
            const userData = getLocalStorage() as { addresses?: { symbol: string; address: string }[] | { stx?: { address: string }[] } };
            if (userData?.addresses) {
                const stx = Array.isArray(userData.addresses)
                    ? userData.addresses.find((a) => a.symbol === 'STX') || userData.addresses[0]
                    : (userData.addresses as { stx?: { address: string }[] }).stx?.[0];
                return stx?.address || null;
            }
        }
        return null;
    });

    const [showMockData, setShowMockData] = useState(false);

    useEffect(() => {
        const fetchGlobalStatus = async () => {
            const status = await getGlobalMockStatus();
            setShowMockData(status);
        };
        fetchGlobalStatus();
        // Optional: Polling every 30s to stay in sync
        const interval = setInterval(fetchGlobalStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const [initialDateForClosesAt] = useState(() => Date.now() + 86400000);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [showLeftChevron, setShowLeftChevron] = useState(false);
    const [showRightChevron, setShowRightChevron] = useState(true);

    const handleScrollCategories = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftChevron(scrollLeft > 0);
        setShowRightChevron(Math.round(scrollLeft) < scrollWidth - clientWidth - 1);
    };

    useEffect(() => {
        handleScrollCategories();
        window.addEventListener('resize', handleScrollCategories);
        return () => window.removeEventListener('resize', handleScrollCategories);
    }, [categories]);

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 250, behavior: 'smooth' });
        }
    };

    const scrollLeftFn = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -250, behavior: 'smooth' });
        }
    };
    const [customContests, setCustomContests] = useState<Contest[]>(() => {
        const saved = localStorage.getItem('yade_custom_contests');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                console.error('Failed to parse saved contests');
            }
        }
        return [];
    });

    // Live LunarCrush Data
    const [liveSeries, setLiveSeries] = useState<SeriesPoint[] | null>(null);
    const [liveMarkets, setLiveMarkets] = useState<BetMarket[] | null>(null);
    const [liveContests, setLiveContests] = useState<Contest[] | null>(null);

    // Initial load: Auth, Categories & Local Contests
    useEffect(() => {
        // Categories
        fetchCategories(userAddress).then(setCategories);
    }, [userAddress]);

    const handleLogin = async () => {
        try {
            if (isConnected()) return;
            const response = await connect();
            const addresses = (response as { addresses?: { symbol: string; address: string }[] })?.addresses;
            if (Array.isArray(addresses)) {
                const stx = addresses.find((a) => a.symbol === 'STX') || addresses[0];
                if (stx?.address) {
                    setUserAddress(stx.address);
                }
            }
        } catch (error) {
            console.error('Wallet connection failed', error);
        }
    };

    const handleLogout = () => {
        disconnect();
        setUserAddress(null);
    };

    // Live Data Fetching
    const [liveDataCache, setLiveDataCache] = useState<Record<string, { series: SeriesPoint[], markets: BetMarket[], contests: Contest[] }>>({});

    useEffect(() => {
        let isMounted = true;

        let query = 'bitcoin';
        if (selectedTopicId !== 'trending') {
            const cat = categories.find(c => {
                const mappedId = c.category === 'formula 1' ? 'f1' : c.category === 'premier league' ? 'football' : c.category;
                return mappedId === selectedTopicId;
            });
            if (cat) {
                query = cat.category;
            } else {
                query = selectedTopicId;
            }
        }

        async function fetchLive() {
            if (liveDataCache[query]) return;

            setLiveSeries(null);
            setLiveMarkets(null);
            setLiveContests(null);

            const [series, creators, posts] = await Promise.all([
                getTopicTimeSeries(query, userAddress),
                getTopicCreators(query, userAddress),
                getTopicPosts(query, userAddress)
            ]);

            if (isMounted) {
                const activeSeries = series && series.length > 0 ? series : null;
                const generated = generateDynamicBets(query, creators || [], posts || []);
                const activeMarkets = generated.markets;
                const activeContests = generated.contests;

                setLiveSeries(activeSeries);
                setLiveMarkets(activeMarkets.length > 0 ? activeMarkets : null);
                setLiveContests(activeContests.length > 0 ? activeContests : null);

                setLiveDataCache(prev => ({
                    ...prev,
                    [query]: { series: activeSeries || [], markets: activeMarkets || [], contests: activeContests || [] }
                }));
            }
        }

        fetchLive();
        return () => { isMounted = false; };
    }, [selectedTopicId, categories, liveDataCache, userAddress, showMockData]);

    // Background syncing for user-generated custom contests
    useEffect(() => {
        const syncContests = async () => {
            if (customContests.length === 0) return;
            const activeContestsToSync = customContests.filter(c => c.status === 'active');
            if (activeContestsToSync.length === 0) return;

            const categoriesToFetch = new Set(activeContestsToSync.map(c => c.category));

            for (const cat of categoriesToFetch) {
                const query = cat === 'cryptocurrencies' ? 'bitcoin' : cat === 'premier league' ? 'football' : cat;
                const freshCreators = await getTopicCreators(query, userAddress);

                setCustomContests(prevContests => {
                    const newStats = prevContests.map(contest => {
                        if (contest.category === cat) {
                            const { markets, contests: generatedContests } = generateDynamicBets(query, freshCreators, []);
                            return { ...contest, markets: markets, contests: generatedContests };
                        }
                        if (contest.status !== 'active' || contest.category !== cat) return contest;

                        const updatedContenders = contest.contenders.map(contender => {
                            const match = freshCreators.find(c => c.name === contender.label || c.handle === contender.subLabel);
                            if (match) {
                                let newVal = contender.currentValue;
                                switch (contest.metric) {
                                    case 'interactions_24h': newVal = match.interactions24h || 0; break;
                                    case 'creator_followers': newVal = match.followers || 0; break;
                                    case 'creator_rank': newVal = match.creatorRank || 0; break;
                                }
                                return { ...contender, currentValue: newVal };
                            }
                            return contender;
                        });

                        let status: Contest['status'] = contest.status;
                        let winner = contest.winner;

                        if (contest.expiresAt <= Date.now()) {
                            status = 'expired';
                            if (contest.betType === 'race' || contest.betType === 'comparison') {
                                const sorted = [...updatedContenders].sort((a, b) => b.currentValue - a.currentValue);
                                winner = sorted[0].label;
                                status = 'finished';
                            }
                        } else if (contest.betType === 'race' && contest.threshold) {
                            const isRank = contest.metric.includes('rank');
                            updatedContenders.forEach(c => {
                                if ((!isRank && c.currentValue >= contest.threshold!) ||
                                    (isRank && c.currentValue <= contest.threshold!)) {
                                    status = 'finished';
                                    winner = c.label;
                                }
                            });
                        }
                        return { ...contest, contenders: updatedContenders, status, winner };
                    });

                    // Save back to local storage
                    localStorage.setItem('yade_custom_contests', JSON.stringify(newStats));
                    return newStats;
                });
            }
        };

        const interval = setInterval(syncContests, 10 * 60 * 1000);
        setTimeout(syncContests, 10000);
        return () => clearInterval(interval);
    }, [customContests]);

    const matchedCat = categories.find(c =>
        c.category === selectedTopicId ||
        (c.category === 'formula 1' && selectedTopicId === 'f1') ||
        (c.category === 'premier league' && selectedTopicId === 'football')
    );

    const fallbackTopic = {
        id: selectedTopicId,
        label: matchedCat?.title || selectedTopicId,
        icon: matchedCat?.icon || 'analytics',
        mockMetrics: [],
        mockSeries: [],
        mockCreators: [],
        mockPosts: [],
        mockMarkets: [{
            id: `loading-${selectedTopicId}`,
            question: `Fetching live intelligence for ${matchedCat?.title || selectedTopicId}...`,
            category: 'ANALYZING',
            description: 'Analyzing recent social interactions and creator sentiment over the LunarCrush network.',
            status: 'upcoming',
            volume: 0,
            closesAt: initialDateForClosesAt,
            options: [
                { label: 'Yes', odds: 50, paysOut: 2.0, votes: 0 },
                { label: 'No', odds: 50, paysOut: 2.0, votes: 0 }
            ]
        }],
        mockContests: []
    } as Topic;

    const topic = topics.find((t) => t.id === selectedTopicId) || fallbackTopic;

    const query = selectedTopicId === 'trending' ? 'bitcoin' : (categories.find(c => {
        const mappedId = c.category === 'formula 1' ? 'f1' : c.category === 'premier league' ? 'football' : c.category;
        return mappedId === selectedTopicId;
    })?.category || selectedTopicId);

    const displayedMarkets = useMemo(() => {
        const rawMarkets = liveMarkets || liveDataCache[query]?.markets || topic.mockMarkets;
        if (showMockData && selectedTopicId) {
            const cleanRaw = rawMarkets.filter(m => !m.id.startsWith('mock-'));
            return [...cleanRaw, ...generateMockMarkets(selectedTopicId, 8)];
        }
        return rawMarkets;
    }, [liveMarkets, liveDataCache, query, topic.mockMarkets, showMockData, selectedTopicId]);

    const displayedContests = useMemo(() => {
        const rawContests = liveContests || liveDataCache[query]?.contests || topic.mockContests;
        if (showMockData && selectedTopicId) {
            const cleanRaw = rawContests.filter(c => !c.id.startsWith('mock-'));
            return [...cleanRaw, ...generateMockContests(selectedTopicId, 4)];
        }
        return rawContests;
    }, [liveContests, liveDataCache, query, topic.mockContests, showMockData, selectedTopicId]);

    const activeMarkets = displayedMarkets;
    const activeContests = displayedContests;
    const activeSeries = liveSeries || liveDataCache[query]?.series || null;

    const [carouselIndex, setCarouselIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered) return;
        const interval = setInterval(() => {
            setCarouselIndex((current) => (current + 1) % featuredBets.length);
        }, 7000);
        return () => clearInterval(interval);
    }, [isHovered]);

    const activeCarouselItem = featuredBets[carouselIndex];
    const featuredMarket = selectedTopicId === 'trending' ? activeCarouselItem.market : activeMarkets[0];
    const featuredTopicContext = selectedTopicId === 'trending' ? activeCarouselItem.topic : topic;

    const otherMarkets = activeMarkets.slice(1);

    const isSelected = globalSelection?.id === featuredMarket.id;
    let featuredThemeColor = 'bg-accent';
    if (isSelected) {
        const isYesNo = featuredMarket.options.length === 2 &&
            featuredMarket.options.every((o: MarketOption) => o.label === 'Yes' || o.label === 'No');

        if (isYesNo) {
            featuredThemeColor = globalSelection?.option === 'Yes' ? 'bg-yes' : 'bg-no';
        } else {
            const opt = featuredMarket.options.find((o: MarketOption) => o.label === globalSelection?.option);
            if (opt && opt.odds === Math.max(...featuredMarket.options.map((o: MarketOption) => o.odds))) {
                featuredThemeColor = 'bg-yes';
            }
        }
    }

    return (
        <div className="min-h-screen bg-bg-base text-text-main">
            <Header
                userAddress={userAddress}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
            />
            <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
                {/* Categories Strip */}
                <div className="relative mb-8 flex items-center group/categories">
                    {/* Left Chevron */}
                    {showLeftChevron && (
                        <div className="absolute left-0 z-10 flex h-full items-center pl-1 pr-6 bg-gradient-to-r from-bg-base via-bg-base/90 to-transparent">
                            <button
                                onClick={scrollLeftFn}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-card border border-border-subtle text-text-muted hover:text-text-main transition-all active:scale-90"
                                aria-label="Scroll left"
                            >
                                <Icon name="chevron_left" className="!text-sm" />
                            </button>
                        </div>
                    )}

                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScrollCategories}
                        className="flex gap-1.5 overflow-x-auto pb-1 transition-all [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full"
                    >
                        <button
                            onClick={() => {
                                setSelectedTopicId('trending');
                                setGlobalSelection(null);
                            }}
                            className={`flex items-center shrink-0 gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-300 ${selectedTopicId === 'trending'
                                ? 'bg-accent text-bg-base'
                                : 'bg-bg-card/60 text-text-muted hover:text-text-main hover:bg-bg-card-hover/80'
                                }`}
                        >
                            <Icon name="local_fire_department" className="!text-[14px]" />
                            <span className="whitespace-nowrap">Global Trending</span>
                        </button>

                        {/* Unified Sport Buttons */}
                        {UNIFIED_SPORT_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    navigate(`/sports/${cat.id}`);
                                }}
                                className="flex items-center shrink-0 gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-300 bg-bg-card/40 text-text-muted hover:text-text-main hover:bg-bg-card-hover/60"
                            >
                                <Icon name={cat.icon} className="!text-[14px]" />
                                <span className="whitespace-nowrap">{cat.label}</span>
                            </button>
                        ))}

                        {/* Non-sport Lunar Crush categories */}
                        {categories.length > 0 && categories
                            .filter(c => !allSportSlugs.has(c.category.toLowerCase()))
                            .map(c => {
                                const mappedTopicId = c.category;
                                return (
                                    <button
                                        key={c.category}
                                        onClick={() => {
                                            setSelectedTopicId(mappedTopicId as TopicId);
                                            setGlobalSelection(null);
                                        }}
                                        className={`flex items-center shrink-0 gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-300 ${selectedTopicId === mappedTopicId
                                            ? 'bg-accent text-bg-base'
                                            : 'bg-bg-card/40 text-text-muted hover:text-text-main hover:bg-bg-card-hover/60'
                                            }`}
                                    >
                                        <Icon name={c.icon} className="!text-[14px]" />
                                        <span className="whitespace-nowrap">{c.title}</span>
                                    </button>
                                );
                            })}
                    </div>

                    {/* Right Chevron */}
                    {showRightChevron && categories.length > 0 && (
                        <div className="absolute right-0 z-10 flex h-full items-center pr-1 pl-6 bg-gradient-to-l from-bg-base via-bg-base/90 to-transparent">
                            <button
                                onClick={scrollRight}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-card border border-border-subtle text-text-muted hover:text-text-main transition-all active:scale-90"
                                aria-label="Scroll right"
                            >
                                <Icon name="chevron_right" className="!text-sm" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Active topic banner */}
                <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Icon name={selectedTopicId === 'trending' ? 'local_fire_department' : topic.icon} className="!text-3xl text-accent" />
                        <div>
                            <h2 className="text-xl font-bold text-text-main">
                                {selectedTopicId === 'trending' ? 'Global Trending' : topic.label} – AI Predictive Sentiment
                            </h2>
                            <p className="text-sm text-text-muted">Predictive intelligence correlated with social activity</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_350px] lg:gap-10">
                    {/* Left Column */}
                    <div className="flex flex-col gap-6">
                        <div
                            className="rounded-[24px] border border-border-subtle bg-bg-card p-6 md:p-8 relative overflow-hidden group/featured transition-all duration-700 ease-in-out"
                            onMouseEnter={() => selectedTopicId === 'trending' && setIsHovered(true)}
                            onMouseLeave={() => selectedTopicId === 'trending' && setIsHovered(false)}
                        >
                            {/* Chevron Controls */}
                            {selectedTopicId === 'trending' && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCarouselIndex(prev => (prev - 1 + featuredBets.length) % featuredBets.length); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-bg-card/60 backdrop-blur-md border border-border-subtle text-text-main opacity-0 group-hover/featured:opacity-100 transition-all hover:bg-bg-card hover:scale-110 active:scale-95"
                                        aria-label="Previous slide"
                                    >
                                        <Icon name="chevron_left" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCarouselIndex(prev => (prev + 1) % featuredBets.length); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-bg-card/60 backdrop-blur-md border border-border-subtle text-text-main opacity-0 group-hover/featured:opacity-100 transition-all hover:bg-bg-card hover:scale-110 active:scale-95"
                                        aria-label="Next slide"
                                    >
                                        <Icon name="chevron_right" />
                                    </button>
                                </>
                            )}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Icon name={featuredTopicContext.icon} className="text-accent" />
                                    <h3 className="text-xs font-semibold text-text-muted">{featuredTopicContext.label} Featured prediction</h3>
                                </div>
                                <span className="rounded bg-yes/15 px-1.5 py-0.5 text-[10px] font-semibold text-yes animate-pulse">
                                    Live
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[48fr_52fr] gap-6 md:gap-8 transition-opacity duration-500 w-full" key={featuredMarket.id}>
                                <div className="flex flex-col gap-4">
                                    <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2 min-h-[64px]">{featuredMarket.question}</h2>

                                    <div className="flex flex-col gap-2 mb-2">
                                        {featuredMarket.options.map((opt: MarketOption) => {
                                            const isYesNo = featuredMarket.options.length === 2 &&
                                                featuredMarket.options.every((o: MarketOption) => o.label === 'Yes' || o.label === 'No');
                                            const isWinning = opt.odds === Math.max(...featuredMarket.options.map((o: MarketOption) => o.odds));
                                            const isSelected = globalSelection?.id === featuredMarket.id && globalSelection?.option === opt.label;

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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setGlobalSelection(isSelected ? null : { id: featuredMarket.id, option: opt.label });
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            setGlobalSelection(isSelected ? null : { id: featuredMarket.id, option: opt.label });
                                                        }
                                                    }}
                                                    className={`group cursor-pointer relative w-full overflow-hidden rounded-md border px-3 py-2 min-h-[44px] text-left transition ${isSelected
                                                        ? `${optionBorderClass} bg-bg-card`
                                                        : `border-border-subtle bg-bg-card/40 ${hoverBorderClass} hover:bg-bg-card/60`
                                                        }`}
                                                >
                                                    <div
                                                        ref={(el) => { if (el) el.style.width = `${opt.odds}%`; }}
                                                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${isSelected
                                                            ? isYesNo ? (opt.label === 'Yes' ? 'bg-yes/20' : 'bg-no/20') : (isWinning ? 'bg-yes/20' : 'bg-accent/15')
                                                            : isYesNo ? (opt.label === 'Yes' ? 'bg-yes/10' : 'bg-no/10') : (isWinning ? 'bg-yes/10' : 'bg-accent/5')
                                                            }`}
                                                    />

                                                    <div className="relative flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2.5">
                                                            {isYesNo && (
                                                                <span className={`h-2.5 w-2.5 rounded-full ${opt.label === 'Yes' ? 'bg-yes' : 'bg-no'}`} />
                                                            )}
                                                            {opt.icon && (
                                                                opt.iconType === 'image' ? (
                                                                    <img src={opt.icon} alt={opt.label} className="w-5 h-5 rounded-full object-cover border border-zinc-700" />
                                                                ) : (
                                                                    <Icon name={opt.icon} className="icon-md text-text-muted" />
                                                                )
                                                            )}
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-text-main' : 'text-text-muted'}`}>{opt.label}</span>
                                                                    {isWinning && featuredMarket.status === 'live' && (
                                                                        <span className="text-[10px] font-semibold text-yes mt-0.5">Leading</span>
                                                                    )}
                                                                </div>
                                                                {opt.subLabel && (
                                                                    opt.link ? (
                                                                        <span onClick={(e) => { e.stopPropagation(); window.open(opt.link, '_blank'); }} className="mt-0.5 text-[10px] text-muted hover:text-accent hover:underline decoration-accent/50 transition self-start cursor-pointer">
                                                                            {opt.subLabel}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="mt-0.5 text-[10px] text-muted self-start">
                                                                            {opt.subLabel}
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-muted">
                                                                {opt.paysOut.toFixed(2)}x
                                                            </span>
                                                            <span
                                                                className={`min-w-[52px] rounded-md px-2.5 py-1 text-center text-sm font-bold transition ${isSelected
                                                                    ? isYesNo ? (opt.label === 'Yes' ? 'bg-yes text-black' : 'bg-no text-black') : (isWinning ? 'bg-yes text-black' : 'bg-accent text-black')
                                                                    : isYesNo ? (opt.label === 'Yes' ? 'bg-yes/15 text-yes' : 'bg-no/15 text-no') : (isWinning ? 'bg-yes/15 text-yes' : 'bg-border-subtle text-text-main')
                                                                    }`}
                                                            >
                                                                {opt.odds}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-4 mt-2 mb-2">
                                        <div className="flex items-center gap-3 text-xs font-semibold text-muted">
                                            <span>${(featuredMarket.volume / 1000000).toFixed(1)}M vol</span>
                                            <span className="w-1 h-1 rounded-full bg-border-subtle"></span>
                                            <span>{featuredMarket.options.length} markets</span>
                                        </div>

                                        {globalSelection?.id === featuredMarket.id ? (
                                            <button
                                                onClick={() => {
                                                    if (globalSelection) {
                                                        setSelectedBetOption({ market: featuredMarket, optionLabel: globalSelection.option });
                                                        setIsBetModalOpen(true);
                                                        setGlobalSelection(null);
                                                    }
                                                }}
                                                className={`px-4 py-1.5 rounded-md text-xs font-bold text-black transition active:scale-95 ${featuredThemeColor}`}
                                            >
                                                Place bet
                                            </button>
                                        ) : (
                                            <Link to={`/market/${featuredTopicContext.id}/${featuredMarket.id}`} className="flex items-center justify-center gap-1.5 rounded-md border border-border-subtle bg-bg-card-hover/50 px-3 py-1.5 text-[11px] font-bold text-text-main transition hover:border-accent/50 hover:bg-bg-card-hover/80">
                                                <Icon name="visibility" className="!text-[14px]" />
                                                View Social Details
                                            </Link>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-border-subtle/50">
                                        <p className="mt-2 text-xs font-bold leading-relaxed text-text-muted">
                                            <span className="text-accent flex items-center gap-1 mb-1">
                                                <Icon name="newspaper" className="!text-[14px]" />
                                                News
                                            </span>
                                            {topic.mockPosts && topic.mockPosts.length > 0 ? topic.mockPosts[0].text.substring(0, 240) : 'No recent news available for this category.'}...
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col pt-6 md:pt-0 md:pl-8 border-t md:border-t-0 border-border-subtle relative min-h-[400px]">
                                    <div className="flex-1 w-full min-h-0 relative">
                                        <MarketChart market={featuredMarket} />
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border-subtle flex-1 w-full min-h-0 flex flex-col relative">
                                        <div className="flex items-center gap-2 mb-2 shrink-0">
                                            <div className="w-1 h-3 bg-accent rounded-full"></div>
                                            <h3 className="text-xs font-semibold text-text-muted">Social activity context</h3>
                                        </div>
                                        <div className="flex-1 w-full min-h-0 relative">
                                            <TimeSeriesChart data={activeSeries || featuredTopicContext.mockSeries} hideHeader />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Carousel Indicators */}
                            {selectedTopicId === 'trending' && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    {featuredBets.map((_, idx: number) => (
                                        <button
                                            key={idx}
                                            aria-label={`Go to slide ${idx + 1}`}
                                            onClick={() => setCarouselIndex(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'bg-accent w-4' : 'bg-border-subtle w-1.5 hover:bg-muted'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {activeContests.length > 0 && (
                            <div className="mt-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-text-main">Social Contests</h3>
                                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                                            LunarCrush Data
                                        </span>
                                    </div>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    {[...customContests, ...activeContests].map((contest) => (
                                        <ContestCard
                                            key={contest.id}
                                            contest={contest}
                                            selectedOption={globalSelection?.id === contest.id ? globalSelection?.option : null}
                                            onSelectOption={(optionLabel) => setGlobalSelection(optionLabel ? { id: contest.id, option: optionLabel } : null)}
                                            onDelete={(id) => {
                                                setCustomContests(prev => {
                                                    const updated = prev.filter(c => c.id !== id);
                                                    localStorage.setItem('yade_custom_contests', JSON.stringify(updated));
                                                    return updated;
                                                });
                                            }}
                                            onBet={(c, label) => {
                                                const contender = c.contenders.find(ct => ct.label === label);
                                                if (contender) {
                                                    const syntheticMarket: BetMarket = {
                                                        id: c.id,
                                                        question: c.question,
                                                        description: c.description,
                                                        category: c.category.toUpperCase(),
                                                        status: c.status === 'active' ? 'live' : 'closed',
                                                        volume: c.volume,
                                                        closesAt: c.expiresAt,
                                                        options: c.contenders.map(ct => ({
                                                            label: ct.label,
                                                            odds: Math.round((ct.bets / c.totalBets) * 100) || 0,
                                                            paysOut: ct.paysOut,
                                                            votes: ct.bets,
                                                        }))
                                                    };
                                                    setSelectedBetOption({ market: syntheticMarket, optionLabel: label });
                                                    setIsBetModalOpen(true);
                                                    setGlobalSelection(null);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-10">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-lg font-black text-text-main tracking-tight mb-1 flex items-center gap-2">
                                    Active Pools
                                </h3>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {otherMarkets.map((market) => (
                                    <BettingCard
                                        key={market.id}
                                        market={market}
                                        topicId={topic.id}
                                        selectedOption={globalSelection?.id === market.id ? globalSelection?.option : null}
                                        onSelectOption={(optionLabel) => setGlobalSelection(optionLabel ? { id: market.id, option: optionLabel } : null)}
                                        onBet={(m: BetMarket, o: string) => {
                                            setSelectedBetOption({ market: m, optionLabel: o });
                                            setIsBetModalOpen(true);
                                            setGlobalSelection(null);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <SidebarList
                            title="Global Trending"
                            markets={[...globalMarkets].sort((a, b) => (b.trend24h || 0) - (a.trend24h || 0)).slice(0, 5)}
                            topicId="global"
                        />
                        <SidebarList
                            title="Highest Volume"
                            markets={[...globalMarkets].sort((a, b) => b.volume - a.volume).slice(0, 5)}
                            topicId="global"
                        />
                        <SidebarList
                            title="Closing Soon"
                            markets={[...globalMarkets].sort((a, b) => a.closesAt - b.closesAt).slice(0, 5)}
                            topicId="global"
                        />
                    </div>
                </div>
            </main>

            <footer className="mt-24 border-t border-border-subtle bg-bg-surface/30 py-16 text-center">
                <div className="flex items-center justify-center gap-3 mb-4 opacity-40 hover:opacity-100 transition-opacity duration-700 group cursor-default">
                    <span className="text-xl transition-transform group-hover:scale-125">🍊</span>
                    <span className="text-lg tracking-tight text-contrast-2 font-logo">Yade</span>
                </div>
                <p className="text-xs font-medium text-text-muted">
                    YADE © {new Date().getFullYear()} · LunarCrush V4 Live Data Connected
                </p>

                {isAdmin(userAddress) && (
                    <button
                        onClick={async () => {
                            const newValue = !showMockData;
                            setShowMockData(newValue);
                            if (userAddress) {
                                await setGlobalMockStatus(newValue, userAddress);
                            }
                        }}
                        className="mt-6 px-4 py-2 text-[10px] font-bold tracking-widest uppercase border border-border-subtle rounded hover:bg-bg-card transition-colors text-text-muted"
                    >
                        {showMockData ? 'Hide Global Mocks' : 'Show Global Mocks'}
                    </button>
                )}
            </footer>

            <BetModal
                isOpen={isBetModalOpen}
                onClose={() => setIsBetModalOpen(false)}
                market={selectedBetOption?.market || null}
                selectedOptionLabel={selectedBetOption?.optionLabel || null}
                themeColor={
                    selectedBetOption ? (
                        (selectedBetOption.market.options.length === 2 && selectedBetOption.market.options.every((o: MarketOption) => o.label === 'Yes' || o.label === 'No'))
                            ? (selectedBetOption.optionLabel === 'Yes' ? 'bg-yes' : 'bg-no')
                            : (selectedBetOption.market.options.find((o: MarketOption) => o.label === selectedBetOption.optionLabel)?.odds === Math.max(...selectedBetOption.market.options.map((o: MarketOption) => o.odds)) ? 'bg-yes' : 'bg-accent')
                    ) : 'bg-accent'
                }
            />
        </div>
    );
}
