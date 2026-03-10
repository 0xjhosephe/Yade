import type { Contest } from '../types';

/**
 * Generate mock sports events for sports without free open APIs
 * Currently used for: MMA, Tennis, Golf
 */
export async function fetchMockSportsEvents(sport: string): Promise<Contest[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const now = new Date();
    const mockEvents: Contest[] = [];

    if (sport === 'mma') {
        const fighters = [
            ['Ilia Topuria', 'Max Holloway'],
            ['Jon Jones', 'Stipe Miocic'],
            ['Alex Pereira', 'Jamahal Hill'],
            ['Khamzat Chimaev', 'Kamaru Usman'],
            ['Islam Makhachev', 'Dustin Poirier'],
            ['Sean O\'Malley', 'Merab Dvalishvili']
        ];

        for (let i = 0; i < fighters.length; i++) {
            const eventDate = new Date(now.getTime() + (i * 2 + 1) * 24 * 60 * 60 * 1000);
            mockEvents.push({
                id: `mock_mma_${i}`,
                betType: 'comparison',
                question: 'Who will win the bout?',
                description: `UFC Fight Night Main Card - ${fighters[i][0]} vs ${fighters[i][1]}`,
                category: 'mma',
                metricSource: 'topic',
                metric: 'social_volume_24h',
                metricLabel: 'Social Interactions',
                contenders: [
                    { label: fighters[i][0], currentValue: 0, paysOut: 1.8, bets: 45, icon: 'sports_martial_arts', iconType: 'icon' },
                    { label: fighters[i][1], currentValue: 0, paysOut: 2.1, bets: 55, icon: 'sports_martial_arts', iconType: 'icon' },
                ],
                status: 'active',
                winner: null,
                curatorHandle: 'ufc_insider',
                createdAt: now.getTime(),
                expiresAt: eventDate.getTime(),
                volume: 12000 + i * 500,
                totalBets: 800 + i * 50,
                type: 'official_sports',
                espnEventId: `mock_mma_${i}`,
                sportCategory: 'mma',
                settlementMethod: 'manual',
            });
        }
    } else if (sport === 'tennis') {
        const matches = [
            ['Carlos Alcaraz', 'Jannik Sinner'],
            ['Daniil Medvedev', 'Novak Djokovic'],
            ['Alexander Zverev', 'Holger Rune'],
            ['Aryna Sabalenka', 'Iga Swiatek'],
            ['Coco Gauff', 'Elena Rybakina']
        ];

        for (let i = 0; i < matches.length; i++) {
            const eventDate = new Date(now.getTime() + (i + 1) * 12 * 60 * 60 * 1000);
            mockEvents.push({
                id: `mock_tennis_${i}`,
                betType: 'comparison',
                question: 'Who will advance to the next round?',
                description: `ATP/WTA Masters 1000 - ${matches[i][0]} vs ${matches[i][1]}`,
                category: 'tennis',
                metricSource: 'topic',
                metric: 'social_volume_24h',
                metricLabel: 'Match Anticipation',
                contenders: [
                    { label: matches[i][0], currentValue: 0, paysOut: 1.5, bets: 50, icon: 'sports_tennis', iconType: 'icon' },
                    { label: matches[i][1], currentValue: 0, paysOut: 2.4, bets: 50, icon: 'sports_tennis', iconType: 'icon' },
                ],
                status: 'active',
                winner: null,
                curatorHandle: 'tennis_tv',
                createdAt: now.getTime(),
                expiresAt: eventDate.getTime(),
                volume: 5000 + i * 200,
                totalBets: 300 + i * 20,
                type: 'official_sports',
                espnEventId: `mock_tennis_${i}`,
                sportCategory: 'tennis',
                settlementMethod: 'manual',
            });
        }
    } else if (sport === 'golf') {
        const tournaments = [
            { name: 'Masters Tournament', location: 'Augusta National' },
            { name: 'PGA Championship', location: 'Valhalla Golf Club' },
            { name: 'US Open', location: 'Pinehurst Resort' },
            { name: 'The Open Championship', location: 'Royal Troon' }
        ];

        for (let i = 0; i < tournaments.length; i++) {
            const eventDate = new Date(now.getTime() + (i * 7 + 3) * 24 * 60 * 60 * 1000);
            mockEvents.push({
                id: `mock_golf_${i}`,
                betType: 'prediction',
                question: `Who will win the ${tournaments[i].name}?`,
                description: `PGA Tour - ${tournaments[i].location}`,
                category: 'golf',
                metricSource: 'topic',
                metric: 'social_volume_24h',
                metricLabel: 'Social Engagement',
                contenders: [
                    { label: 'Scottie Scheffler', currentValue: 0, paysOut: 4.5, bets: 30, icon: 'sports_golf', iconType: 'icon' },
                    { label: 'Rory McIlroy', currentValue: 0, paysOut: 6.0, bets: 25, icon: 'sports_golf', iconType: 'icon' },
                    { label: 'Jon Rahm', currentValue: 0, paysOut: 8.5, bets: 20, icon: 'sports_golf', iconType: 'icon' },
                    { label: 'Brooks Koepka', currentValue: 0, paysOut: 12.0, bets: 15, icon: 'sports_golf', iconType: 'icon' },
                    { label: 'Xander Schauffele', currentValue: 0, paysOut: 14.0, bets: 10, icon: 'sports_golf', iconType: 'icon' }
                ],
                status: 'active',
                winner: null,
                curatorHandle: 'pga_tour',
                createdAt: now.getTime(),
                expiresAt: eventDate.getTime(),
                volume: 8000 + i * 1000,
                totalBets: 400 + i * 50,
                type: 'official_sports',
                espnEventId: `mock_golf_${i}`,
                sportCategory: 'golf',
                settlementMethod: 'manual',
            });
        }
    }

    // Sort by expiration date (soonest first)
    mockEvents.sort((a, b) => a.expiresAt - b.expiresAt);
    return mockEvents;
}
