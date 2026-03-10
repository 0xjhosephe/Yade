import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { topics } from '../mocks/topics';
import { getTopicMetrics, getTopicTimeSeries, getTopicCreators, getTopicPosts, generateDynamicBets } from '../services/lunarcrush';
import type { Metric, SeriesPoint, Creator, Post, Topic } from '../types';
import CreatorsList from '../components/CreatorsList';
import PostsFeed from '../components/PostsFeed';
import TimeSeriesChart from '../components/TimeSeriesChart';
import BettingCard from '../components/BettingCard';
import MetricCard from '../components/MetricCard';

import Header from '../components/Header';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
import { generateMockMarkets } from '../services/mockDataGenerator';

export default function MarketDetails() {
    const { topicId, marketId } = useParams();
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
    const [initialDateForRender] = useState(() => Date.now());

    const handleLogin = async () => {
        try {
            if (isConnected()) return;
            const response = await connect();
            const addresses = (response as { addresses?: { symbol: string; address: string }[] })?.addresses;
            if (Array.isArray(addresses)) {
                const stx = addresses.find((a) => a.symbol === 'STX') || addresses[0];
                if (stx?.address) setUserAddress(stx.address);
            }
        } catch (e) {
            console.error('Wallet connection failed', e);
        }
    };

    const handleLogout = () => {
        disconnect();
        setUserAddress(null);
    };

    // Provide a fallback topic for purely dynamic categories lacking mock skeletons
    const fallbackTopic: Topic = {
        id: topicId || 'fallback',
        label: topicId ? topicId.toUpperCase() : 'Market',
        icon: '📊',
        mockMetrics: [],
        mockSeries: [],
        mockCreators: [],
        mockPosts: [],
        mockMarkets: [{
            id: `loading-${topicId}`,
            question: `Fetching details...`,
            category: 'ANALYZING',
            status: 'upcoming',
            volume: 0,
            closesAt: initialDateForRender + 86400000,
            options: []
        }],
        mockContests: []
    };

    const topic = topics.find((t) => t.id === topicId) || fallbackTopic;
    const market = topic.mockMarkets.find((m) => m.id === marketId);

    const [liveMetrics, setLiveMetrics] = useState<Metric[] | null>(null);
    const [liveSeries, setLiveSeries] = useState<SeriesPoint[] | null>(null);
    const [liveCreators, setLiveCreators] = useState<Creator[] | null>(null);
    const [livePosts, setLivePosts] = useState<Post[] | null>(null);

    useEffect(() => {
        let isMounted = true;
        const query = topicId === 'f1' ? 'formula 1' : topicId === 'football' ? 'premier league' : topicId || 'bitcoin';

        async function fetchLive() {
            setLiveMetrics(null);
            setLiveSeries(null);

            const [metrics, series, creators, posts] = await Promise.all([
                getTopicMetrics(query, userAddress),
                getTopicTimeSeries(query, userAddress),
                getTopicCreators(query, userAddress),
                getTopicPosts(query, userAddress)
            ]);

            if (isMounted) {
                setLiveMetrics(metrics);
                setLiveSeries(series);
                setLiveCreators(creators);
                setLivePosts(posts);
            }
        }

        fetchLive();
        return () => { isMounted = false; };
    }, [topicId]);

    // Provide a fallback market if the user navigated directly to a URL and the market wasn't found in mocks
    // Since markets are now dynamic, the ID might not exist in topics.mockMarkets anymore!
    const mockMarket = marketId?.startsWith('mock-') ? generateMockMarkets(topicId || 'bitcoin', 10).find(m => m.id === marketId) : null;
    const effectiveMarket = market || mockMarket || (liveCreators && livePosts ? generateDynamicBets(topicId || 'bitcoin', liveCreators, livePosts).markets.find(m => m.id === marketId) || generateDynamicBets(topicId || 'bitcoin', liveCreators, livePosts).markets[0] : topic.mockMarkets[0]);

    if (!topic || !effectiveMarket) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg-base text-text-main">
                <p>Market loading...</p>
                <Link to="/" className="ml-4 text-accent hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-base text-text-main">
            <Header
                userAddress={userAddress}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
            />

            {/* ─── Main Content ─── */}
            <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">

                {/* Market context header */}
                <div className="mb-8 max-w-3xl">
                    <span className="inline-block rounded-md bg-bg-surface px-2.5 py-1 text-xs font-semibold text-text-muted border border-border-subtle">
                        {effectiveMarket.category}
                    </span>
                    <h2 className="mt-3 text-3xl font-bold leading-tight text-text-main">{effectiveMarket.question}</h2>
                    <p className="mt-3 text-lg leading-relaxed text-text-muted">{effectiveMarket.description || 'Social and on-chain intelligence specifically isolated for this prediction market.'}</p>
                </div>

                {/* 3-column layout similar to dashboard but isolated to this market */}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1.4fr)]">

                    {/* Left: The Bet itself + some stats */}
                    <section className="space-y-4">
                        <h3 className="text-[13px] font-bold text-text-muted">
                            Social Signals Outcome
                        </h3>
                        <BettingCard market={effectiveMarket} hideDetailsLink />

                        {liveMetrics && liveMetrics.length > 0 ? (
                            <div className="mt-6 space-y-4">
                                {liveMetrics.slice(0, 3).map(m => (
                                    <MetricCard key={m.label} label={m.label} value={m.value} delta={m.delta} deltaType={m.deltaType as "positive" | "negative" | "neutral"} helperText={m.helperText} />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6 space-y-4">
                                <MetricCard label="Market Volume" value={`$${(effectiveMarket.volume / 1000).toFixed(1)}K`} delta="+12%" deltaType="positive" />
                                <MetricCard label="Social Mentions" value="4.2K" delta="+5%" deltaType="positive" helperText="Mentions matching this specific outcome" />
                            </div>
                        )}
                    </section>

                    {/* Center: Chart */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-text-main">
                            Outcome Sentiment Timeline
                        </h3>
                        <TimeSeriesChart data={liveSeries || topic.mockSeries} />

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="rounded border border-border-subtle bg-bg-card p-4 text-center">
                                <p className="text-xl font-bold text-text-main">Buy Yes</p>
                                <p className="mt-1 text-[10px] text-text-muted">Dominant sentiment</p>
                            </div>
                            <div className="rounded border border-border-subtle bg-bg-card p-4 text-center">
                                <p className="text-xl font-bold text-yes">82%</p>
                                <p className="mt-1 text-[10px] text-text-muted">Confidence Score</p>
                            </div>
                        </div>
                    </section>

                    {/* Right: Creators & Posts */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-semibold text-text-muted">
                            Top Voices on this Market
                        </h3>
                        <CreatorsList creators={(liveCreators || topic.mockCreators).slice(0, 3)} />
                        <PostsFeed posts={(livePosts || topic.mockPosts).slice(0, 3)} />
                    </section>

                </div>
            </main>
        </div>
    );
}
