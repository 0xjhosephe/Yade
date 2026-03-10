import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import BettingPanel from '../components/BettingPanel';
import MarketDetailView from '../components/MarketDetailView';
import ContestCard from '../components/ContestCard';
import Icon from '../components/Icon';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
import {
    fetchUpcomingEvents,
    espnEventToContest,
    UNIFIED_SPORT_CATEGORIES,
    ESPN_LEAGUES,
} from '../services/espnApi';
import { fetchOpenF1Events } from '../services/openF1Api';
import { fetchMockSportsEvents } from '../services/mockSportsApi';
import { topics } from '../mocks/topics';
import BettingCard from '../components/BettingCard';
import { fetchCategories } from '../services/api';
import type {
    ESPNLeagueConfig,
    BetMarket,
    Contest,
    LunarCrushCategory,
} from '../types';

type ViewMode = 'feed' | 'detail';

export default function SportsDashboard() {
    const { category: urlCategory } = useParams<{ category: string }>();
    const navigate = useNavigate();

    // ─── Auth State ───
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

    // ─── Categories & Sports ───
    const [categories, setCategories] = useState<LunarCrushCategory[]>([]);
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
    const [selectedLeagueConfig, setSelectedLeagueConfig] = useState<ESPNLeagueConfig | null>(null);

    // Collect all sport category slugs to differentiate sport vs non-sport
    const allSportSlugs = new Set(UNIFIED_SPORT_CATEGORIES.flatMap(u => u.lunarCategories));

    // ─── View State ───
    const [viewMode, setViewMode] = useState<ViewMode>('feed');
    const [activeTab, setActiveTab] = useState<'Upcoming' | 'Props' | 'Futures' | 'Social'>('Upcoming');
    const [selectedContest, setSelectedContest] = useState<Contest | null>(null);

    // ─── Betting State ───
    const [globalSelection, setGlobalSelection] = useState<{ id: string; option: string } | null>(null);
    const [selectedBetMarket, setSelectedBetMarket] = useState<BetMarket | null>(null);
    const [selectedBetLabel, setSelectedBetLabel] = useState<string | null>(null);

    // ─── ESPN Events ───
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch non-sport categories on mount
    useEffect(() => {
        const getCategories = async () => {
            const data = await fetchCategories();
            setCategories(data);
        };
        getCategories();
    }, []);

    // ─── Header Strip Scrolling ───
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

    // ─── Load ALL events for this sport (across all leagues) ───
    const loadAllEvents = useCallback(async (leagues: ESPNLeagueConfig[], sportId?: string) => {
        setLoading(true);
        setContests([]);
        try {
            if (sportId === 'racing') {
                const events = await fetchOpenF1Events();
                setContests(events);
            } else {
                const allPromises = leagues.map(async (league) => {
                    const events = await fetchUpcomingEvents(league.sport, league.league, 7, userAddress);

                    if (events.length === 0 && ['mma', 'tennis', 'golf'].includes(league.sport)) {
                        return fetchMockSportsEvents(league.sport);
                    }

                    return events
                        .filter(e => e.status === 'pre')
                        .map(e => espnEventToContest(e, league));
                });
                const results = await Promise.all(allPromises);
                const merged = results.flat().sort((a, b) => {
                    const dateA = new Date(a.expiresAt).getTime();
                    const dateB = new Date(b.expiresAt).getTime();
                    return dateA - dateB;
                });
                setContests(merged);
            }
        } catch (err) {
            console.error('Failed to load all events:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Initial Load / URL category change ───
    useEffect(() => {
        // Reset state on every category change
        setSelectedLeague(null);
        setSelectedLeagueConfig(null);
        setContests([]);
        setViewMode('feed');
        setSelectedContest(null);
        setGlobalSelection(null);
        setSelectedBetMarket(null);
        setSelectedBetLabel(null);
        setActiveTab('Upcoming');

        if (urlCategory) {
            const unified = UNIFIED_SPORT_CATEGORIES.find(u => u.id === urlCategory.toLowerCase());
            if (unified) {
                setSelectedSport(unified.id);
                // Load all leagues for this sport (Upcoming view)
                const leagues = ESPN_LEAGUES.filter(l => l.sport === unified.espnSport);
                if (leagues.length > 0) {
                    loadAllEvents(leagues, unified.espnSport);
                }
            } else {
                setSelectedSport(urlCategory);
            }
        } else {
            setSelectedSport(null);
        }
    }, [urlCategory, loadAllEvents]);

    // Resolve leagues for the selected sport
    const currentUnified = selectedSport
        ? UNIFIED_SPORT_CATEGORIES.find(u => u.id === selectedSport)
        : null;
    const availableLeagues = currentUnified
        ? ESPN_LEAGUES.filter(l => l.sport === currentUnified.espnSport)
        : [];

    // ─── Fetch ESPN events when league changes ───
    const loadEvents = useCallback(async (league: ESPNLeagueConfig) => {
        setLoading(true);
        setContests([]);
        try {
            if (league.sport === 'racing') {
                const events = await fetchOpenF1Events();
                setContests(events);
            } else {
                const events = await fetchUpcomingEvents(league.sport, league.league, 7, userAddress);

                if (events.length === 0 && ['mma', 'tennis', 'golf'].includes(league.sport)) {
                    const mockEvents = await fetchMockSportsEvents(league.sport);
                    setContests(mockEvents);
                } else {
                    const newContests = events
                        .filter(e => e.status === 'pre') // Only future events
                        .map(e => espnEventToContest(e, league));
                    setContests(newContests);
                }
            }
        } catch (err) {
            console.error('Failed to load events:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedLeagueConfig) {
            loadEvents(selectedLeagueConfig);
        }
    }, [selectedLeagueConfig, loadEvents]);

    // ─── Handlers ───
    const handleLogin = async () => {
        try {
            if (isConnected()) return;
            const response = await connect();
            const addresses = (response as { addresses?: { symbol: string; address: string }[] })?.addresses;
            if (Array.isArray(addresses)) {
                const stx = addresses.find((a) => a.symbol === 'STX') || addresses[0];
                if (stx?.address) setUserAddress(stx.address);
            }
        } catch (error) {
            console.error('Wallet connection failed', error);
        }
    };

    const handleLogout = () => {
        disconnect();
        setUserAddress(null);
    };

    const handleSelectLeague = (league: ESPNLeagueConfig) => {
        setSelectedLeague(league.league);
        setSelectedLeagueConfig(league);
        setViewMode('feed');
        setSelectedContest(null);
        setGlobalSelection(null);
        setActiveTab('Upcoming');
    };



    const handleContestClick = (contest: Contest) => {
        setSelectedContest(contest);
        setViewMode('detail');
        setGlobalSelection(null);
    };

    const handleSelectBetOption = (optionLabel: string | null, contest: Contest) => {
        if (!optionLabel) {
            setGlobalSelection(null);
            setSelectedBetMarket(null);
            setSelectedBetLabel(null);
            return;
        }

        setGlobalSelection({ id: contest.id, option: optionLabel });

        // Build a synthetic BetMarket for the BettingPanel
        const market: BetMarket = {
            id: contest.id,
            question: contest.question,
            description: contest.description,
            category: contest.category.toUpperCase(),
            status: contest.status === 'active' ? 'live' : 'closed',
            volume: contest.volume,
            closesAt: contest.expiresAt,
            options: contest.contenders.map(ct => ({
                label: ct.label,
                odds: contest.totalBets > 0 ? Math.round((ct.bets / contest.totalBets) * 100) : Math.round(100 / contest.contenders.length),
                paysOut: ct.paysOut,
                votes: ct.bets,
                icon: ct.icon,
                iconType: ct.iconType,
            })),
        };

        setSelectedBetMarket(market);
        setSelectedBetLabel(optionLabel);
    };

    // Build synthetic market for MarketDetailView
    const detailMarket: BetMarket | null = selectedContest ? {
        id: selectedContest.id,
        question: selectedContest.question,
        description: selectedContest.description,
        category: selectedContest.category.toUpperCase(),
        status: selectedContest.status === 'active' ? 'live' : 'closed',
        volume: selectedContest.volume,
        closesAt: selectedContest.expiresAt,
        options: selectedContest.contenders.map(ct => ({
            label: ct.label,
            odds: selectedContest.totalBets > 0
                ? Math.round((ct.bets / selectedContest.totalBets) * 100)
                : Math.round(100 / selectedContest.contenders.length),
            paysOut: ct.paysOut,
            votes: ct.bets,
            icon: ct.icon,
            iconType: ct.iconType,
        })),
    } : null;

    // ─── Social Data ───
    const mappedTopicId = selectedSport === 'formula 1' ? 'f1' : selectedSport === 'premier league' ? 'football' : selectedSport;
    const socialTopic = topics.find(t => t.id === mappedTopicId || t.label.toLowerCase() === selectedSport?.toLowerCase());
    const socialContests = socialTopic ? socialTopic.mockContests : [];
    const socialMarkets = socialTopic ? socialTopic.mockMarkets : [];

    return (
        <div className="min-h-screen bg-bg-base text-text-main">
            <Header
                userAddress={userAddress}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
            />

            <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
                {/* Category Strip (always visible) */}
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
                        <Link
                            to="/"
                            className="flex items-center shrink-0 gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-300 bg-bg-card/40 text-text-muted hover:text-text-main hover:bg-bg-card-hover/60"
                        >
                            <Icon name="local_fire_department" className="!text-[14px]" />
                            <span className="whitespace-nowrap">Global Trending</span>
                        </Link>
                        {UNIFIED_SPORT_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => navigate(`/sports/${cat.id}`)}
                                className={`flex items-center shrink-0 gap-1.5 rounded-full px-3 py-1 text-[11px] transition-all duration-300 ${selectedSport === cat.id
                                    ? 'bg-accent text-bg-base font-bold'
                                    : 'bg-bg-card/40 text-text-muted hover:text-text-main hover:bg-bg-card-hover/60 font-semibold'
                                    }`}
                            >
                                <Icon name={cat.icon} className="!text-[14px]" />
                                <span className="whitespace-nowrap">{cat.label}</span>
                            </button>
                        ))}

                        {/* Non-sport Lunar Crush categories */}
                        {categories.length > 0 && categories
                            .filter(c => !allSportSlugs.has(c.category.toLowerCase()))
                            .map(c => (
                                <button
                                    key={c.category}
                                    onClick={() => navigate('/')} // Navigating to main dashboard for non-sport topics
                                    className="flex items-center shrink-0 gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-300 bg-bg-card/40 text-text-muted hover:text-text-main hover:bg-bg-card-hover/60"
                                >
                                    <Icon name={c.icon} className="!text-[14px]" />
                                    <span className="whitespace-nowrap">{c.title}</span>
                                </button>
                            ))
                        }
                    </div>

                    {/* Right Chevron */}
                    {showRightChevron && (
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

                {/* Page Header */}
                <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Icon name={currentUnified?.icon || 'sports'} className="!text-3xl text-accent" />
                        <div>
                            <h2 className="text-xl font-bold text-text-main">
                                {currentUnified
                                    ? `${currentUnified.label}${activeTab !== 'Upcoming' ? ` · ${activeTab}` : (selectedLeagueConfig ? ` · ${selectedLeagueConfig.label}` : ' · Upcoming Events')}`
                                    : 'Sports'}
                            </h2>
                            <p className="text-sm text-text-muted">
                                {activeTab === 'Upcoming' && !selectedLeagueConfig && currentUnified
                                    ? `All upcoming ${currentUnified.label.toLowerCase()} events · ESPN Live Data`
                                    : activeTab === 'Upcoming' && selectedLeagueConfig
                                        ? `Upcoming ${selectedLeagueConfig.label} events · ESPN Live Data`
                                        : activeTab === 'Social'
                                            ? 'Social intelligence from LunarCrush'
                                            : activeTab === 'Futures'
                                                ? 'Long-term prediction markets'
                                                : activeTab === 'Props'
                                                    ? 'Proposition bets and player stats'
                                                    : 'Select a sport to view upcoming events'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3-Column Layout */}
                <div className="grid gap-6 lg:grid-cols-[200px_1fr_320px]">
                    {/* Column 1: Section Nav + Leagues */}
                    <div className="hidden lg:block">
                        <div className="flex flex-col gap-1 sticky top-6">
                            {/* Section Navigation */}
                            {[
                                { key: 'Upcoming' as const, label: 'Upcoming Events', icon: 'schedule' },
                                { key: 'Social' as const, label: 'Social', icon: 'local_fire_department' },
                                { key: 'Futures' as const, label: 'Futures', icon: 'trending_up' },
                                { key: 'Props' as const, label: 'Props', icon: 'casino' },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => {
                                        setActiveTab(item.key);
                                        if (item.key === 'Upcoming' && !selectedLeagueConfig && currentUnified) {
                                            const leagues = ESPN_LEAGUES.filter(l => l.sport === currentUnified.espnSport);
                                            loadAllEvents(leagues);
                                        }
                                        setViewMode('feed');
                                        setSelectedContest(null);
                                        setGlobalSelection(null);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-xs font-semibold ${activeTab === item.key && !selectedLeague
                                        ? 'bg-accent/10 border border-accent/30 text-accent'
                                        : 'text-text-muted hover:bg-bg-card-hover/50 hover:text-text-main'
                                        }`}
                                >
                                    <Icon name={item.icon} className="!text-[14px]" />
                                    <span>{item.label}</span>
                                </button>
                            ))}

                            {/* Divider */}
                            <div className="h-px bg-border-subtle my-2" />

                            {/* Leagues Section */}
                            <h3 className="text-[10px] font-bold text-text-muted mb-1 px-2">
                                {currentUnified ? `${currentUnified.label} Leagues` : 'Leagues'}
                            </h3>
                            {availableLeagues.map(league => (
                                <button
                                    key={league.league}
                                    onClick={() => handleSelectLeague(league)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-xs font-semibold ${selectedLeague === league.league && activeTab === 'Upcoming'
                                        ? 'bg-accent/10 border border-accent/30 text-accent'
                                        : 'text-text-muted hover:bg-bg-card-hover/50 hover:text-text-main'
                                        }`}
                                >
                                    <Icon name={league.icon} className="!text-[14px]" />
                                    <span>{league.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Main Content */}
                    <div className="min-w-0">
                        {viewMode === 'detail' && detailMarket && selectedContest ? (
                            <div className="flex flex-col gap-3">
                                {/* The original card */}
                                <div className="pointer-events-none [&_button]:pointer-events-auto">
                                    <ContestCard
                                        contest={selectedContest}
                                        selectedOption={globalSelection?.id === selectedContest.id ? globalSelection?.option : null}
                                        onSelectOption={(label) => handleSelectBetOption(label, selectedContest)}
                                        onBet={(c, label) => handleSelectBetOption(label, c)}
                                    />
                                </div>

                                <div className="mt-2">
                                    <MarketDetailView
                                        market={detailMarket}
                                        selectedOption={globalSelection?.id === selectedContest.id ? globalSelection?.option ?? null : null}
                                        onSelectOption={(label) => handleSelectBetOption(label, selectedContest)}
                                        onBack={() => {
                                            setViewMode('feed');
                                            setSelectedContest(null);
                                            setGlobalSelection(null);
                                        }}
                                        espnLeague={selectedContest.sportCategory}
                                        espnLink={selectedContest.espnLink}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Loading State */}
                                {loading && activeTab === 'Upcoming' && (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
                                        <span className="text-sm text-text-muted">Fetching events from ESPN...</span>
                                    </div>
                                )}

                                {/* No sport selected */}
                                {!selectedLeagueConfig && !loading && !selectedSport && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border-subtle flex items-center justify-center mb-4">
                                            <Icon name="sports_score" className="icon-lg text-accent/50" />
                                        </div>
                                        <h3 className="text-lg font-bold text-text-main mb-2">Choose a Sport</h3>
                                        <p className="text-sm text-text-muted max-w-[300px]">
                                            Select a sport from the top bar to view upcoming events and place bets.
                                        </p>

                                        {/* Quick sport grid for mobile */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6 lg:hidden w-full max-w-md">
                                            {UNIFIED_SPORT_CATEGORIES.slice(0, 6).map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => navigate(`/sports/${cat.id}`)}
                                                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-card border border-border-subtle hover:border-accent/50 transition-all text-left"
                                                >
                                                    <Icon name={cat.icon} className="text-accent !text-lg" />
                                                    <span className="text-xs font-bold text-text-main">{cat.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Events Feed */}
                                {activeTab === 'Upcoming' && !loading && contests.length > 0 && (
                                    <div className="flex flex-col gap-4">
                                        {contests.map(contest => (
                                            <div
                                                key={contest.id}
                                                onClick={() => handleContestClick(contest)}
                                                className="cursor-pointer transition-transform hover:scale-[1.005]"
                                            >
                                                <ContestCard
                                                    contest={contest}
                                                    selectedOption={globalSelection?.id === contest.id ? globalSelection?.option : null}
                                                    onSelectOption={(label) => {
                                                        // Prevent navigating to detail and selection at the same time
                                                        handleSelectBetOption(label, contest);
                                                    }}
                                                    onBet={(c, label) => {
                                                        handleSelectBetOption(label, c);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Empty state (no events) */}
                                {activeTab === 'Upcoming' && !loading && selectedSport && contests.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <Icon name="event_busy" className="icon-lg text-text-muted/30 mb-3" />
                                        <h3 className="text-sm font-bold text-text-main mb-1">No Upcoming Events</h3>
                                        <p className="text-xs text-text-muted max-w-[250px]">
                                            There are no scheduled games for {selectedLeagueConfig ? selectedLeagueConfig.label : currentUnified?.label} in the next 7 days. Try another league.
                                        </p>
                                    </div>
                                )}

                                {/* Social Tab Content */}
                                {activeTab === 'Social' && (
                                    <div className="flex flex-col gap-6 w-full">
                                        {socialContests.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-text-main mb-3">LunarCrush Social Contests</h3>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    {socialContests.map(contest => (
                                                        <ContestCard
                                                            key={contest.id}
                                                            contest={contest}
                                                            selectedOption={globalSelection?.id === contest.id ? globalSelection?.option : null}
                                                            onSelectOption={(label) => handleSelectBetOption(label, contest)}
                                                            onBet={(c, label) => handleSelectBetOption(label, c)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {socialMarkets.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-text-main mb-3">Live Prediction Pools</h3>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    {socialMarkets.map(market => (
                                                        <BettingCard
                                                            key={market.id}
                                                            market={market}
                                                            topicId={socialTopic?.id || ''}
                                                            selectedOption={globalSelection?.id === market.id ? globalSelection?.option : null}
                                                            onSelectOption={(label) => {
                                                                if (label) {
                                                                    setGlobalSelection({ id: market.id, option: label });
                                                                    setSelectedBetMarket(market);
                                                                    setSelectedBetLabel(label);
                                                                } else {
                                                                    setGlobalSelection(null);
                                                                    setSelectedBetMarket(null);
                                                                    setSelectedBetLabel(null);
                                                                }
                                                            }}
                                                            onBet={(m, o) => {
                                                                setGlobalSelection({ id: m.id, option: o });
                                                                setSelectedBetMarket(m);
                                                                setSelectedBetLabel(o);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {socialContests.length === 0 && socialMarkets.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <Icon name="device_hub" className="icon-lg text-text-muted/30 mb-3" />
                                                <h3 className="text-sm font-bold text-text-main mb-1">No Social Intelligence</h3>
                                                <p className="text-xs text-text-muted max-w-[250px]">
                                                    There are no active LunarCrush pools for {selectedSport || 'this category'}.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Column 3: Betting Panel */}
                    <div className="hidden lg:block">
                        <BettingPanel
                            market={selectedBetMarket}
                            selectedOptionLabel={selectedBetLabel}
                            onClearSelection={() => {
                                setGlobalSelection(null);
                                setSelectedBetMarket(null);
                                setSelectedBetLabel(null);
                            }}
                        />
                    </div>
                </div>
            </main>

            <footer className="mt-24 border-t border-border-subtle bg-bg-surface/30 py-16 text-center">
                <div className="flex items-center justify-center gap-3 mb-4 opacity-40 hover:opacity-100 transition-opacity duration-700 group cursor-default">
                    <span className="text-xl transition-transform group-hover:scale-125">🍊</span>
                    <img src="/Yade.svg" alt="Yade Logo" className="h-6 w-auto" />
                </div>
                <p className="text-xs font-medium text-text-muted">
                    YADE © {new Date().getFullYear()} · ESPN Live Data Connected
                </p>
            </footer>
        </div>
    );
}
