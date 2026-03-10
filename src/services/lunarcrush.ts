import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import type { SeriesPoint, Creator, Post, Metric } from '../types';

async function fetchWithAuth(endpoint: string, userAddress?: string | null) {
    try {
        const getLunarCrushData = httpsCallable(functions, 'getLunarCrushData');
        const response = await getLunarCrushData({ endpoint, userAddress });

        // Firebase callables return data in the `.data` property
        return response.data as any;
    } catch (error) {
        console.error(`Error fetching ${endpoint} via Firebase Functions:`, error);
        return null;
    }
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

/**
 * Fetches basic summary metrics for a given topic
 */
export async function getTopicMetrics(topicName: string, userAddress?: string | null): Promise<Metric[]> {
    const data = await fetchWithAuth(`/topic/${topicName}/v1`, userAddress);
    if (!data) return [];

    return [
        {
            label: 'Social Interactions (24h)',
            value: formatNumber(data.interactions_24h || 0),
            delta: '', // Full history required for exact delta calculation, keeping empty for now
            deltaType: 'neutral',
        },
        {
            label: 'Active Contributors',
            value: formatNumber(data.num_contributors || 0),
            delta: '',
            deltaType: 'neutral',
        },
        {
            label: 'Social Posts',
            value: formatNumber(data.num_posts || 0),
            delta: '',
            deltaType: 'neutral',
        },
        {
            label: 'Sentiment Score',
            value: data.types_sentiment?.tweet?.toString() || data.types_sentiment?.news?.toString() || '75',
            delta: '',
            deltaType: 'neutral',
        },
    ];
}

/**
 * We simulate time series since LunarCrush v4 requires premium for distinct historical charting endpoint.
 * In a fully paid tier we would hit /topic/{topic}/time-series/v1. Here we synthesize a realistic curve
 * using the aggregate base values to align with the visual charts.
 */
export async function getTopicTimeSeries(topicName: string, userAddress?: string | null): Promise<SeriesPoint[]> {
    const data = await fetchWithAuth(`/topic/${topicName}/v1`, userAddress);

    // Fallback static structure if API fails
    const baseInteractions = data?.interactions_24h ? (data.interactions_24h / 24) : 50000;
    const basePosts = data?.num_posts ? (data.num_posts / 24) : 2000;
    const baseContributors = data?.num_contributors ? (data.num_contributors / 24) : 400;
    const variance = baseInteractions * 0.2;

    const now = Date.now();
    const hour = 60 * 60 * 1000;

    return Array.from({ length: 24 }, (_, i) => ({
        timestamp: now - (23 - i) * hour,
        interactions: Math.max(0, Math.round(baseInteractions + (Math.random() - 0.5) * variance * 2)),
        postsActive: Math.max(0, Math.round(basePosts + (Math.random() - 0.5) * (basePosts * 0.4))),
        contributorsActive: Math.max(0, Math.round(baseContributors + (Math.random() - 0.5) * (baseContributors * 0.4))),
    }));
}

/**
 * Fetches actual posts related to the topic
 */
export async function getTopicPosts(topicName: string, userAddress?: string | null): Promise<Post[]> {
    const data = await fetchWithAuth(`/topic/${topicName}/posts/v1`, userAddress);
    if (!data || !Array.isArray(data)) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: Record<string, any>) => ({
        id: item.id || Math.random().toString(),
        network: item.post_type?.includes('youtube') ? 'youtube' : item.post_type?.includes('reddit') ? 'reddit' : 'x',
        author: item.creator_name || 'Anonymous',
        authorHandle: `@${item.creator_name || 'anon'}`,
        text: item.post_title || item.post_text || '',
        likes: item.interactions_24h || 0,
        replies: Math.round((item.interactions_24h || 0) * 0.1), // approximation if explicit replies are missing
        shares: Math.round((item.interactions_24h || 0) * 0.05),
        sentiment: item.post_sentiment || 0,
        createdAt: item.post_created ? item.post_created * 1000 : Date.now(),
        url: item.post_link || '#',
    }));
}

/**
 * Fetches top creators for a given topic
 */
export async function getTopicCreators(topicName: string, userAddress?: string | null): Promise<Creator[]> {
    const data = await fetchWithAuth(`/topic/${topicName}/creators/v1`, userAddress);
    if (!data || !Array.isArray(data)) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: Record<string, any>) => ({
        id: item.creator_id || Math.random().toString(),
        name: item.creator_display_name || item.creator_name || 'Anonymous',
        handle: `@${item.creator_name || 'anon'}`,
        followers: item.creator_followers || 0,
        creatorRank: item.creator_rank || 999,
        interactions24h: item.interactions_24h || 0,
        interactionsChange24h: 0, // Mock delta for now
        avatar: item.creator_avatar || undefined,
    }));
}

/**
 * Dynamically generates BetMarkets and Contests based on real creators and posts data.
 */
import type { BetMarket, Contest } from '../types';

export function generateDynamicBets(topicName: string, creators: Creator[], posts: Post[]): { markets: BetMarket[], contests: Contest[] } {
    const markets: BetMarket[] = [];
    const contests: Contest[] = [];
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    // 1. If we have at least 2 top creators, create a Contributor Race
    if (creators.length >= 2) {
        const c1 = creators[0];
        const c2 = creators[1];

        contests.push({
            id: `dyn-c1-${topicName}`,
            betType: 'race',
            question: `Which creator reaches 1M interactions first?`,
            description: `A race between ${c1.name} and ${c2.name} to generate 1 million social interactions in the ${topicName.toUpperCase()} ecosystem.`,
            category: topicName,
            metricSource: 'creator',
            metric: 'interactions_24h',
            metricLabel: 'Creator Interactions',
            threshold: 1_000_000,
            thresholdLabel: '1M interactions',
            status: 'active',
            winner: null,
            contenders: [
                { label: c1.name, subLabel: c1.handle, link: `https://lunarcrush.com/creators/${c1.handle.replace('@', '')}`, icon: c1.avatar || '⚡', iconType: c1.avatar ? 'image' : 'emoji', currentValue: c1.interactions24h, bets: Math.floor(c1.interactions24h / 50), paysOut: 1.45 },
                { label: c2.name, subLabel: c2.handle, link: `https://lunarcrush.com/creators/${c2.handle.replace('@', '')}`, icon: c2.avatar || '🔥', iconType: c2.avatar ? 'image' : 'emoji', currentValue: c2.interactions24h, bets: Math.floor(c2.interactions24h / 50), paysOut: 1.72 },
            ],
            curatorHandle: '@LunarOracle',
            createdAt: now - 12 * hour,
            expiresAt: now + 12 * hour,
            volume: Math.floor(Math.random() * 500000) + 100000,
            totalBets: Math.floor((c1.interactions24h + c2.interactions24h) / 50),
        });

        markets.push({
            id: `dyn-m1-${topicName}`,
            question: `${c1.name} vs ${c2.name} - Higher Topic Rank tomorrow?`,
            category: 'INFLUENCER CLASH',
            description: `Predicting who will have a stronger social influence rank regarding ${topicName.toUpperCase()} over the next 24 hours.`,
            status: 'live',
            statusDetail: 'Closing soon',
            volume: Math.floor(Math.random() * 2000000) + 500000,
            trend24h: Math.floor(Math.random() * 20) - 10,
            closesAt: now + 6 * hour,
            options: [
                { label: c1.name, subLabel: c1.handle, link: `https://lunarcrush.com/creators/${c1.handle.replace('@', '')}`, odds: 55, paysOut: 1.81, votes: Math.floor(c1.interactions24h / 100), icon: c1.avatar || '⚡', iconType: c1.avatar ? 'image' : 'emoji' },
                { label: c2.name, subLabel: c2.handle, link: `https://lunarcrush.com/creators/${c2.handle.replace('@', '')}`, odds: 45, paysOut: 2.22, votes: Math.floor(c2.interactions24h / 100), icon: c2.avatar || '🔥', iconType: c2.avatar ? 'image' : 'emoji' },
            ],
        });
    }

    // 2. If we have posts, create a news/sentiment bet
    if (posts.length > 0) {
        const topPost = posts[0];
        const secondPost = posts.length > 1 ? posts[1] : null;

        markets.push({
            id: `dyn-m2-${topicName}`,
            question: `Will ${topPost.author}'s post hit ${(topPost.likes * 1.5).toLocaleString()} likes?`,
            category: 'VIRAL EVENT',
            description: `Currently trending: "${topPost.text.substring(0, 100)}..." Will this post continue to accelerate?`,
            status: 'live',
            statusDetail: `${topPost.likes.toLocaleString()} likes so far`,
            volume: topPost.likes * 10,
            trend24h: 15,
            closesAt: now + 3 * hour,
            options: [
                { label: 'Yes', odds: 62, paysOut: 1.61, votes: topPost.likes * 2 },
                { label: 'No', odds: 38, paysOut: 2.63, votes: topPost.likes },
            ],
        });

        if (secondPost) {
            contests.push({
                id: `dyn-c2-${topicName}`,
                betType: 'comparison',
                question: 'Which breaking news drives more engagement today?',
                description: `Comparing the social velocity of two distinct narratives right now in ${topicName.toUpperCase()}.`,
                category: topicName,
                metricSource: 'topic',
                metric: 'sentiment',
                metricLabel: 'Social Engagement',
                status: 'active',
                winner: null,
                contenders: [
                    { label: topPost.author, subLabel: topPost.authorHandle, link: `https://lunarcrush.com/creators/${topPost.authorHandle.replace('@', '')}`, icon: '📰', iconType: 'emoji', currentValue: topPost.likes + topPost.replies + topPost.shares, bets: 4500, paysOut: 1.5 },
                    { label: secondPost.author, subLabel: secondPost.authorHandle, link: `https://lunarcrush.com/creators/${secondPost.authorHandle.replace('@', '')}`, icon: '📢', iconType: 'emoji', currentValue: secondPost.likes + secondPost.replies + secondPost.shares, bets: 3200, paysOut: 1.9 },
                ],
                curatorHandle: '@NewsJunkie',
                createdAt: now - 5 * hour,
                expiresAt: now + 5 * hour,
                volume: 850000,
                totalBets: 7700,
            });
        }
    }

    // 3. Add a generic ecosystem market
    markets.push({
        id: `dyn-m3-${topicName}`,
        question: `Will ${topicName.toUpperCase()} social dominance increase > 2% this week?`,
        category: 'ECOSYSTEM',
        description: `Betting on the overall social market share of the ${topicName.toUpperCase()} space compared to the rest of the market.`,
        status: 'upcoming',
        volume: Math.floor(Math.random() * 5000000) + 1000000,
        trend24h: Math.floor(Math.random() * 10) - 5,
        closesAt: now + 48 * hour,
        options: [
            { label: 'Yes', odds: 40, paysOut: 2.50, votes: 40000 },
            { label: 'No', odds: 60, paysOut: 1.66, votes: 60000 },
        ],
    });

    return { markets, contests };
}
