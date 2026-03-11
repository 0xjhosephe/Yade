import type { BetMarket, Contest } from '../types';

const ADMIN_WALLET = "STTARKRG00YXYFT3AXVAWR45C3QKN26A345CHKGZ";

export function isAdmin(address: string | null): boolean {
    if (!address) return false;
    return address.toUpperCase() === ADMIN_WALLET.toUpperCase();
}

// Deterministic seedable random for stable mock data
function seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
}

export function generateMockMarkets(category: string, count: number = 8): BetMarket[] {
    const markets: BetMarket[] = [];
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const templates = [
        { q: "Will {topic} share of voice increase by more than 5% this week?", cat: "Social Prediction" },
        { q: "Digital Milestone: Will {topic} reach 1M community hits by Sunday?", cat: "Threshold" },
        { q: "Sentiment Pulse: Is {topic} heading for a new record high?", cat: "Sentiment" },
        { q: "Engagement Breakout: Will {topic} social volume spike in the next 24h?", cat: "Volume Pool" },
        { q: "Predictive Hedge: Anticipating a 10% pull-back in {topic} engagement?", cat: "Social Shorting" },
        { q: "Rank Clash: Will {topic} overtake its primary category competitor?", cat: "Rank Clash" },
        { q: "Alpha Divergence: Is {topic} creator activity outpacing historical norms?", cat: "Divergence" },
        { q: "Trend Durability: Will {topic} remain a Top 5 trending topic for >12h?", cat: "Trend Duration" }
    ];

    const topic = category.charAt(0).toUpperCase() + category.slice(1);

    for (let i = 0; i < count; i++) {
        const item = templates[i % templates.length];
        const question = item.q.replace("{topic}", topic);
        const seed = `market-${category}-${i}`;
        const r1 = seededRandom(seed + '1');
        const r2 = seededRandom(seed + '2');
        const r3 = seededRandom(seed + '3');
        const r4 = seededRandom(seed + '4');
        const r5 = seededRandom(seed + '5');

        markets.push({
            id: `mock-m-${category}-${i}`,
            question: question,
            category: item.cat,
            description: `Aggregated data-driven forecast for ${topic} focus area: ${item.cat.toLowerCase()}.`,
            status: i % 3 === 0 ? 'live' : 'upcoming',
            statusDetail: i % 3 === 0 ? 'Live Market' : undefined,
            volume: 100000 + (r1 * 900000),
            trend24h: Math.floor(r2 * 20) - 10,
            closesAt: now + (day * (i + 1)),
            options: [
                { label: 'Yes', odds: Math.floor(40 + (r3 * 20)), paysOut: 1.5 + r4, votes: 10000 + r5 * 50000 },
                { label: 'No', odds: Math.floor(40 + (r5 * 20)), paysOut: 1.5 + r1, votes: 10000 + r2 * 50000 },
            ]
        });
    }

    return markets;
}

export function generateMockContests(category: string, count: number = 4): Contest[] {
    const contests: Contest[] = [];
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    const types: Contest['betType'][] = ['race', 'comparison', 'threshold', 'prediction'];

    const catTitle = category.charAt(0).toUpperCase() + category.slice(1);

    for (let i = 0; i < count; i++) {
        const type = types[i % types.length];
        const typeTitle = type.charAt(0).toUpperCase() + type.slice(1);
        const seed = `contest-${category}-${i}`;
        const r1 = seededRandom(seed + '1');
        const r2 = seededRandom(seed + '2');

        contests.push({
            id: `mock-c-${category}-${i}`,
            betType: type,
            question: `${catTitle} ${typeTitle} Challenge #${i + 1}`,
            description: `Strategic social ${type} index measuring real-time network growth.`,
            category: category,
            metricSource: 'topic',
            metric: 'interactions_24h',
            metricLabel: 'Social Engagement',
            threshold: 500000,
            thresholdLabel: '500K Engagement',
            status: 'active',
            winner: null,
            contenders: [
                { label: 'Market Expansion', icon: '', currentValue: 300000 + (r1 * 100000), bets: 5000, paysOut: 1.6 },
                { label: 'Market Contraction', icon: '', currentValue: 280000 + (r2 * 100000), bets: 4800, paysOut: 1.8 },
            ],
            curatorHandle: '@Yade_Official',
            createdAt: now - 12 * hour,
            expiresAt: now + 12 * hour,
            volume: 500000,
            totalBets: 9800,
        });
    }
    return contests;
}
