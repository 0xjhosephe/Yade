/**
 * ESPN Public API Service
 * Unofficial ESPN API endpoints for fetching sports events, scores, and news.
 * Reference: https://github.com/pseudo-r/Public-ESPN-API
 */
import type { ESPNEvent, ESPNNewsArticle, ESPNLeagueConfig } from '../types';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// ─── Base URLs ───
const SITE_API = 'https://site.api.espn.com/apis/site/v2/sports';
const NOW_API = 'https://now.core.api.espn.com/v1/sports/news';

// ─── League Configurations ───
// Maps Lunar Crush sport categories to ESPN league slugs
export const ESPN_LEAGUES: ESPNLeagueConfig[] = [
    // Basketball
    { sport: 'basketball', league: 'nba', label: 'NBA', icon: 'sports_basketball', allowDraw: false },
    { sport: 'basketball', league: 'wnba', label: 'WNBA', icon: 'sports_basketball', allowDraw: false },
    // Football (American)
    { sport: 'football', league: 'nfl', label: 'NFL', icon: 'sports_football', allowDraw: true },
    { sport: 'football', league: 'college-football', label: 'College Football', icon: 'sports_football', allowDraw: false },
    // Soccer
    { sport: 'soccer', league: 'eng.1', label: 'Premier League', icon: 'sports_soccer', allowDraw: true },
    { sport: 'soccer', league: 'esp.1', label: 'La Liga', icon: 'sports_soccer', allowDraw: true },
    { sport: 'soccer', league: 'ger.1', label: 'Bundesliga', icon: 'sports_soccer', allowDraw: true },
    { sport: 'soccer', league: 'ita.1', label: 'Serie A', icon: 'sports_soccer', allowDraw: true },
    { sport: 'soccer', league: 'fra.1', label: 'Ligue 1', icon: 'sports_soccer', allowDraw: true },
    { sport: 'soccer', league: 'usa.1', label: 'MLS', icon: 'sports_soccer', allowDraw: true },
    { sport: 'soccer', league: 'uefa.champions', label: 'Champions League', icon: 'sports_soccer', allowDraw: true },
    { sport: 'soccer', league: 'fifa.world', label: 'FIFA World Cup', icon: 'sports_soccer', allowDraw: true },
    // Baseball
    { sport: 'baseball', league: 'mlb', label: 'MLB', icon: 'sports_baseball', allowDraw: false },
    // Hockey
    { sport: 'hockey', league: 'nhl', label: 'NHL', icon: 'sports_hockey', allowDraw: true },
    // MMA
    { sport: 'mma', league: 'ufc', label: 'UFC', icon: 'sports_mma', allowDraw: true },
    // Tennis
    { sport: 'tennis', league: 'atp', label: 'ATP', icon: 'sports_tennis', allowDraw: false },
    { sport: 'tennis', league: 'wta', label: 'WTA', icon: 'sports_tennis', allowDraw: false },
    // Racing
    { sport: 'racing', league: 'f1', label: 'Formula 1', icon: 'sports_motorsports', allowDraw: false },
    // Cricket
    { sport: 'cricket', league: 'icc', label: 'Cricket', icon: 'sports_cricket', allowDraw: true },
    // Golf
    { sport: 'golf', league: 'pga', label: 'PGA Tour', icon: 'sports_golf', allowDraw: false },
    // Rugby
    { sport: 'rugby', league: 'world-rugby', label: 'Rugby', icon: 'sports_rugby', allowDraw: true },
];

// ─── Category Mapping (Lunar Crush -> ESPN) ───
// Maps Lunar Crush category slugs to ESPN sport groups
export const LUNAR_TO_ESPN_SPORT: Record<string, string> = {
    'nba': 'basketball',
    'nfl': 'football',
    'mlb': 'baseball',
    'nhl': 'hockey',
    'soccer': 'soccer',
    'premier league': 'soccer',
    'mma': 'mma',
    'tennis': 'tennis',
    'formula 1': 'racing',
    'cricket': 'cricket',
    'golf': 'golf',
    'rugby': 'rugby',
    'esports': 'esports',
    'boxing': 'boxing',
    'hockey': 'hockey',
    'baseball': 'baseball',
    'football': 'football',
    'basketball': 'basketball',
    'motorsport': 'racing',
};

/**
 * Get ESPN league configs for a Lunar Crush category slug
 */
export function getLeaguesForCategory(lunarCategory: string): ESPNLeagueConfig[] {
    const sportKey = LUNAR_TO_ESPN_SPORT[lunarCategory.toLowerCase()];
    if (!sportKey) return [];
    return ESPN_LEAGUES.filter(l => l.sport === sportKey);
}

/**
 * Unified sport categories for the Dashboard header.
 * Each button groups multiple Lunar Crush categories and ESPN leagues.
 */
export interface UnifiedSportCategory {
    id: string;
    label: string;
    icon: string;
    lunarCategories: string[];  // Lunar Crush category slugs that belong to this group
    espnSport: string;          // ESPN sport slug
}

export const UNIFIED_SPORT_CATEGORIES: UnifiedSportCategory[] = [
    { id: 'basketball', label: 'Basketball', icon: 'sports_basketball', lunarCategories: ['nba', 'basketball', 'ncaa basketball', 'wnba'], espnSport: 'basketball' },
    { id: 'football', label: 'Football', icon: 'sports_football', lunarCategories: ['nfl', 'football', 'ncaa football', 'college football'], espnSport: 'football' },
    { id: 'soccer', label: 'Soccer', icon: 'sports_soccer', lunarCategories: ['soccer', 'premier league', 'la liga', 'mls', 'bundesliga', 'serie a', 'ligue 1', 'liga mx', 'champions league', 'fifa world cup', 'world cup'], espnSport: 'soccer' },
    { id: 'baseball', label: 'Baseball', icon: 'sports_baseball', lunarCategories: ['mlb', 'baseball'], espnSport: 'baseball' },
    { id: 'hockey', label: 'Hockey', icon: 'sports_hockey', lunarCategories: ['nhl', 'hockey'], espnSport: 'hockey' },
    { id: 'mma', label: 'MMA', icon: 'sports_mma', lunarCategories: ['mma', 'ufc', 'boxing'], espnSport: 'mma' },
    { id: 'racing', label: 'Motorsport', icon: 'sports_motorsports', lunarCategories: ['formula 1', 'f1', 'motorsport', 'motorsports', 'nascar', 'indycar'], espnSport: 'racing' },
    { id: 'tennis', label: 'Tennis', icon: 'sports_tennis', lunarCategories: ['tennis', 'atp', 'wta'], espnSport: 'tennis' },
    { id: 'golf', label: 'Golf', icon: 'sports_golf', lunarCategories: ['golf', 'pga golfers', 'pga', 'pga tour'], espnSport: 'golf' },
];

// ─── Helper: Format date as YYYYMMDD ───
function formatDateESPN(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

// ─── Helper: Parse ESPN scoreboard event into our ESPNEvent ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEvent(event: any, sport: string, league: string): ESPNEvent | null {
    try {
        const competition = event.competitions?.[0];
        if (!competition) return null;

        const competitors = competition.competitors || [];
        const home = competitors.find((c: { homeAway: string }) => c.homeAway === 'home');
        const away = competitors.find((c: { homeAway: string }) => c.homeAway === 'away');

        if (!home || !away) return null;

        const homeTeam = home.team || {};
        const awayTeam = away.team || {};

        // Try getting odds safely
        let oddsStr: string | undefined;
        if (Array.isArray(competition?.odds) && competition.odds.length > 0) {
            oddsStr = competition.odds[0]?.details;
        }

        // Try getting broadcast safely
        let broadcast: string | undefined;
        if (Array.isArray(competition?.broadcasts) && competition.broadcasts.length > 0) {
            const names = competition.broadcasts[0]?.names;
            if (Array.isArray(names) && names.length > 0) {
                broadcast = names[0];
            }
        }

        const statusState = event.status?.type?.state || 'pre';
        const statusMap: Record<string, 'pre' | 'in' | 'post'> = {
            pre: 'pre',
            in: 'in',
            post: 'post',
        };

        return {
            id: event.id,
            name: event.name || `${awayTeam.displayName || 'TBD'} at ${homeTeam.displayName || 'TBD'}`,
            shortName: event.shortName || `${awayTeam.abbreviation || '?'} @ ${homeTeam.abbreviation || '?'}`,
            date: event.date,
            status: statusMap[statusState] || 'pre',
            statusDetail: event.status?.type?.shortDetail || 'Scheduled',
            homeTeam: {
                id: homeTeam.id || '',
                name: homeTeam.displayName || homeTeam.name || 'TBD',
                abbreviation: homeTeam.abbreviation || '?',
                logo: homeTeam.logo || '',
                score: home.score,
            },
            awayTeam: {
                id: awayTeam.id || '',
                name: awayTeam.displayName || awayTeam.name || 'TBD',
                abbreviation: awayTeam.abbreviation || '?',
                logo: awayTeam.logo || '',
                score: away.score,
            },
            venue: competition.venue?.fullName,
            broadcast,
            odds: oddsStr,
            league,
            sport,
        };
    } catch (err) {
        console.warn('Failed to parse ESPN event:', err);
        return null;
    }
}

/**
 * Fetch upcoming events for a specific league across multiple days
 * @param sport - ESPN sport slug (e.g. 'basketball')
 * @param league - ESPN league slug (e.g. 'nba')
 * @param daysAhead - Number of days to look ahead (default: 7)
 */
export async function fetchUpcomingEvents(
    sport: string,
    league: string,
    daysAhead: number = 7,
    userAddress?: string | null
): Promise<ESPNEvent[]> {
    const events: ESPNEvent[] = [];
    const today = new Date();

    // Build date range string: YYYYMMDD-YYYYMMDD
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);
    const dateRange = `${formatDateESPN(today)}-${formatDateESPN(endDate)}`;

    try {
        const url = `${SITE_API}/${sport}/${league}/scoreboard?dates=${dateRange}&limit=100`;
        const getEspnData = httpsCallable(functions, 'getEspnData');
        const response = await getEspnData({ url, userAddress });

        const data = response.data as any;
        const rawEvents = data.events || [];

        for (const rawEvent of rawEvents) {
            const parsed = parseEvent(rawEvent, sport, league);
            if (parsed) {
                events.push(parsed);
            }
        }
    } catch (err) {
        console.error(`Error fetching ESPN scoreboard for ${sport}/${league}:`, err);
    }

    // Sort by date ascending
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return events;
}

/**
 * Fetch the game summary/result for a specific event
 * Used for validating contest results
 */
export async function fetchEventSummary(
    sport: string,
    league: string,
    eventId: string,
    userAddress?: string | null
): Promise<{ status: string; homeScore: string; awayScore: string; winner: string | null } | null> {
    try {
        const url = `${SITE_API}/${sport}/${league}/summary?event=${eventId}`;
        const getEspnData = httpsCallable(functions, 'getEspnData');
        const response = await getEspnData({ url, userAddress });

        const data = response.data as any;
        const header = data.header;
        if (!header) return null;

        const competition = header.competitions?.[0];
        if (!competition) return null;

        const competitors = competition.competitors || [];
        const home = competitors.find((c: { homeAway: string }) => c.homeAway === 'home');
        const away = competitors.find((c: { homeAway: string }) => c.homeAway === 'away');

        const statusName = header.competitions?.[0]?.status?.type?.name || '';
        const isFinal = statusName === 'STATUS_FINAL';

        let winner: string | null = null;
        if (isFinal && home && away) {
            const homeScore = parseInt(home.score || '0', 10);
            const awayScore = parseInt(away.score || '0', 10);
            if (homeScore > awayScore) {
                winner = home.team?.displayName || 'Home';
            } else if (awayScore > homeScore) {
                winner = away.team?.displayName || 'Away';
            } else {
                winner = 'Draw';
            }
        }

        return {
            status: statusName,
            homeScore: home?.score || '0',
            awayScore: away?.score || '0',
            winner,
        };
    } catch (err) {
        console.error(`Error fetching ESPN summary for event ${eventId}:`, err);
        return null;
    }
}

/**
 * Fetch real-time sports news for a specific league
 * Uses the ESPN Now API
 */
export async function fetchSportsNews(
    league: string,
    limit: number = 5,
    userAddress?: string | null
): Promise<ESPNNewsArticle[]> {
    try {
        const url = `${NOW_API}?leagues=${league}&limit=${limit}`;
        const getEspnData = httpsCallable(functions, 'getEspnData');
        const response = await getEspnData({ url, userAddress });

        const data = response.data as any;
        const articles = data.headlines || data.articles || data.feed || [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return articles.slice(0, limit).map((article: any) => ({
            headline: article.headline || article.title || '',
            description: article.description || article.summary || '',
            published: article.published || article.lastModified || '',
            link: article.links?.web?.href || article.link || '#',
            imageUrl: article.images?.[0]?.url || undefined,
        }));
    } catch (err) {
        console.error(`Error fetching ESPN news for ${league}:`, err);
        return [];
    }
}

/**
 * Convert an ESPN event to a Contest object for the dashboard
 */
export function espnEventToContest(
    event: ESPNEvent,
    leagueConfig: ESPNLeagueConfig
): import('../types').Contest {
    const contenders: import('../types').Contender[] = [
        {
            label: event.awayTeam.name,
            icon: event.awayTeam.logo || '🏟️',
            iconType: event.awayTeam.logo ? 'image' : 'emoji',
            subLabel: event.awayTeam.abbreviation,
            currentValue: 0,
            bets: 0,
            paysOut: 2.0,
        },
        {
            label: event.homeTeam.name,
            icon: event.homeTeam.logo || '🏟️',
            iconType: event.homeTeam.logo ? 'image' : 'emoji',
            subLabel: event.homeTeam.abbreviation,
            currentValue: 0,
            bets: 0,
            paysOut: 2.0,
        },
    ];

    // Add Draw option for soccer and applicable sports
    if (leagueConfig.allowDraw) {
        contenders.push({
            label: 'Draw',
            icon: '🤝',
            iconType: 'emoji',
            subLabel: 'Empate',
            currentValue: 0,
            bets: 0,
            paysOut: 3.0,
        });
    }

    const eventDate = new Date(event.date);

    return {
        id: `espn-${event.id}`,
        betType: 'prediction',
        question: event.name,
        description: `${leagueConfig.label} • ${event.venue || 'TBD'} • ${event.broadcast || ''}`.trim(),
        category: leagueConfig.sport,
        metricSource: 'topic',
        metric: 'interactions_24h',
        metricLabel: leagueConfig.label,
        contenders,
        status: event.status === 'post' ? 'finished' : 'active',
        winner: null,
        curatorHandle: 'PLATFORM',
        createdAt: Date.now(),
        expiresAt: eventDate.getTime(),
        volume: 0,
        totalBets: 0,
        isUserGenerated: false,
        type: 'official_sports',
        espnEventId: event.id,
        sportCategory: event.league,
        espnLink: `https://www.espn.com/${event.sport}/game/_/gameId/${event.id}`,
        settlementMethod: 'automatic_espn',
    };
}
