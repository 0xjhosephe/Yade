import type { Contest } from '../types';

export interface OpenF1Session {
    session_key: number;
    session_type: string;
    session_name: string;
    date_start: string;
    date_end: string;
    meeting_key: number;
    circuit_key: number;
    circuit_short_name: string;
    country_key: number;
    country_code: string;
    country_name: string;
    location: string;
    year: number;
}

/**
 * Fetch upcoming Formula 1 sessions from OpenF1 API and map to Contests
 */
export async function fetchOpenF1Events(): Promise<Contest[]> {
    try {
        const year = new Date().getFullYear();
        const response = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`);

        if (!response.ok) {
            console.error('OpenF1 API returned an error:', response.status);
            return [];
        }

        const data: OpenF1Session[] = await response.json();
        const now = new Date();
        const events: Contest[] = [];

        // Sort sessions by date
        data.sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

        for (const session of data) {
            const startDate = new Date(session.date_start);

            // Only show upcoming or recently active sessions (within last 24h)
            if (startDate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
                continue;
            }

            const title = `F1 ${session.country_name} GP - ${session.session_name}`;

            events.push({
                id: `openf1_${session.session_key}`,
                betType: 'prediction',
                question: title,
                description: `${session.location} Circuit`,
                category: 'formula 1',
                metricSource: 'topic',
                metric: 'social_volume_24h',
                metricLabel: 'Social Engagement',
                contenders: [
                    { label: 'Max Verstappen', currentValue: 0, paysOut: 1.9, bets: 0, icon: 'sports_motorsports', iconType: 'icon' },
                    { label: 'Lando Norris', currentValue: 0, paysOut: 2.1, bets: 0, icon: 'sports_motorsports', iconType: 'icon' },
                    { label: 'Charles Leclerc', currentValue: 0, paysOut: 3.5, bets: 0, icon: 'sports_motorsports', iconType: 'icon' },
                    { label: 'Lewis Hamilton', currentValue: 0, paysOut: 5.0, bets: 0, icon: 'sports_motorsports', iconType: 'icon' },
                ],
                status: startDate > now ? 'active' : 'finished',
                winner: null,
                curatorHandle: 'openf1_data',
                createdAt: now.getTime(),
                expiresAt: startDate.getTime(),
                volume: 5000 + (session.session_key % 1000) * 10,
                totalBets: 150 + (session.session_key % 100),
                type: 'official_sports',
                espnEventId: String(session.session_key),
                sportCategory: 'racing',
                settlementMethod: 'manual',
            });
        }

        return events;
    } catch (err) {
        console.error('Failed to fetch from OpenF1 API:', err);
        return [];
    }
}
