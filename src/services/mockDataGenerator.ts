import type { BetMarket, Contest } from '../types';

const ADMIN_WALLET = "STTARKRG00YXYFT3AXVAWR45C3QKN26A345CHKGZ";

export function isAdmin(address: string | null): boolean {
    if (!address) return false;
    return address.toUpperCase() === ADMIN_WALLET.toUpperCase();
}

export function generateMockMarkets(category: string, count: number = 8): BetMarket[] {
    const markets: BetMarket[] = [];
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const templates = [
        { q: "Will {topic} social dominance increase by 5%?", cat: "SOCIAL PREDICTION" },
        { q: "Will {topic} reach 1M mentions this week?", cat: "THRESHOLD" },
        { q: "Is {topic} sentiment heading for a record high?", cat: "SENTIMENT" },
        { q: "Will the next 24h see a breakout in {topic} volume?", cat: "VOLUME POOL" },
        { q: "Predicting a 10% drop in {topic} engagement?", cat: "SOCIAL SHORTING" },
        { q: "Will {topic} flip its main competitor in social rank?", cat: "RANK CLASH" },
        { q: "Is {topic} creator activity decoupling from price?", cat: "DIVERGENCE" },
        { q: "Will {topic} trend on X (Twitter) for > 12 hours?", cat: "TREND DURATION" }
    ];

    const topic = category.charAt(0).toUpperCase() + category.slice(1);

    for (let i = 0; i < count; i++) {
        const item = templates[i % templates.length];
        const question = item.q.replace("{topic}", topic);

        markets.push({
            id: `mock-m-${category}-${i}`,
            question: `[MOCK] ${question}`,
            category: item.cat,
            description: `This is a simulated ${item.cat.toLowerCase()} market for ${topic}.`,
            status: i % 3 === 0 ? 'live' : 'upcoming',
            statusDetail: i % 3 === 0 ? 'High volatility' : undefined,
            volume: 100000 + (Math.random() * 900000),
            trend24h: Math.floor(Math.random() * 20) - 10,
            closesAt: now + (day * (i + 1)),
            options: [
                { label: 'Yes', odds: 40 + (Math.random() * 20), paysOut: 1.5 + Math.random(), votes: 10000 + Math.random() * 50000 },
                { label: 'No', odds: 40 + (Math.random() * 20), paysOut: 1.5 + Math.random(), votes: 10000 + Math.random() * 50000 },
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

    for (let i = 0; i < count; i++) {
        const type = types[i % types.length];
        contests.push({
            id: `mock-c-${category}-${i}`,
            betType: type,
            question: `[MOCK] ${category.toUpperCase()} ${type.toUpperCase()} #${i + 1}`,
            description: `Simulated social ${type} measuring network strength.`,
            category: category,
            metricSource: 'topic',
            metric: 'interactions_24h',
            metricLabel: 'Social Dynamics',
            threshold: 500000,
            thresholdLabel: '500K hits',
            status: 'active',
            winner: null,
            contenders: [
                { label: 'Expansion', icon: '🚀', currentValue: 300000 + (Math.random() * 100000), bets: 5000, paysOut: 1.6 },
                { label: 'Contraction', icon: '📉', currentValue: 280000 + (Math.random() * 100000), bets: 4800, paysOut: 1.8 },
            ],
            curatorHandle: '@YadeMock',
            createdAt: now - 12 * hour,
            expiresAt: now + 12 * hour,
            volume: 500000,
            totalBets: 9800,
        });
    }

    return contests;
}
