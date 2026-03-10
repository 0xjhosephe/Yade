import type { Topic, SeriesPoint, Creator, Post, Metric, BetMarket, Contest, LunarCrushCategory } from '../types';

// ─── Helpers ───
const now = Date.now();
const hour = 60 * 60 * 1000;

function generateSeries(
    base: { interactions: number; posts: number; contributors: number },
    variance: number,
): SeriesPoint[] {
    return Array.from({ length: 24 }, (_, i) => ({
        timestamp: now - (23 - i) * hour,
        interactions: Math.round(base.interactions + (Math.random() - 0.5) * variance * 2),
        postsActive: Math.round(base.posts + (Math.random() - 0.5) * (variance / 4)),
        contributorsActive: Math.round(base.contributors + (Math.random() - 0.5) * (variance / 8)),
    }));
}

// ─── F1 ───
const f1Metrics: Metric[] = [
    { label: 'Social Interactions (24h)', value: '1.2M', delta: '+32%', deltaType: 'positive', helperText: 'Spike during Bahrain GP quali' },
    { label: 'Mentions (24h)', value: '340K', delta: '+18%', deltaType: 'positive' },
    { label: 'Active Creators', value: '4,210', delta: '+5%', deltaType: 'positive' },
    { label: 'Sentiment Score', value: '72', delta: '-2%', deltaType: 'negative', helperText: 'Slight dip after red flag incident' },
];

const f1Creators: Creator[] = [
    { id: '1', name: 'F1 Insider', handle: '@f1_insider', followers: 128000, creatorRank: 92, interactions24h: 24000, interactionsChange24h: 32 },
    { id: '2', name: 'PitWall Data', handle: '@pitwall_data', followers: 89000, creatorRank: 87, interactions24h: 18500, interactionsChange24h: 15 },
    { id: '3', name: 'Verstappen Fan', handle: '@verstappen_fan', followers: 210000, creatorRank: 85, interactions24h: 16200, interactionsChange24h: -4 },
    { id: '4', name: 'Scuderia Talk', handle: '@scuderia_talk', followers: 67000, creatorRank: 81, interactions24h: 12100, interactionsChange24h: 22 },
    { id: '5', name: 'F1 Strategy', handle: '@f1strategy', followers: 54000, creatorRank: 78, interactions24h: 9800, interactionsChange24h: 8 },
];

const f1Posts: Post[] = [
    { id: '1', network: 'x', author: 'F1 News', authorHandle: '@f1news', text: 'Huge drama at the last lap in Bahrain GP – Verstappen overtakes Hamilton in the final corner! The crowd goes wild as the championship battle intensifies.', likes: 12400, replies: 3400, shares: 1800, sentiment: 0.82, createdAt: now - 2 * hour, url: '#' },
    { id: '2', network: 'reddit', author: 'PitWallAnalyst', authorHandle: 'u/PitWallAnalyst', text: 'McLaren\'s new floor upgrade shows promising results in FP2. Wind tunnel data suggests up to 0.3s improvement per lap. Ferrari should be worried.', likes: 8700, replies: 890, shares: 420, sentiment: 0.75, createdAt: now - 5 * hour, url: '#' },
    { id: '3', network: 'x', author: 'ScuderiaFans', authorHandle: '@scuderia_talk', text: 'Leclerc sets fastest sector 3 time in qualifying! Ferrari\'s low-speed corner performance is finally matching Red Bull. Championship is wide open.', likes: 6200, replies: 780, shares: 340, sentiment: 0.88, createdAt: now - 8 * hour, url: '#' },
    { id: '4', network: 'youtube', author: 'F1 Strategy', authorHandle: '@f1strategy', text: 'Breakdown: Why Mercedes\' new sidepod concept could change the game in 2025. Full technical analysis of the W16\'s aerodynamic philosophy.', likes: 15300, replies: 1200, shares: 890, sentiment: 0.71, createdAt: now - 12 * hour, url: '#' },
];

const f1Markets: BetMarket[] = [
    {
        id: 'f1-m1', question: 'Who will win the Bahrain GP?', category: 'RACE WINNER',
        description: 'The season opener at the Bahrain International Circuit sets the stage for the 2025 championship. Verstappen looks to continue his dominance, while Ferrari and McLaren bring significant upgrades aiming to challenge Red Bull.',
        status: 'live', statusDetail: 'Lap 42 of 57', volume: 2_340_000, trend24h: 12,
        closesAt: now + 2 * hour,
        options: [
            { label: 'Max Verstappen', odds: 62, paysOut: 1.35, votes: 187_400 },
            { label: 'Charles Leclerc', odds: 24, paysOut: 3.80, votes: 72_100 },
        ],
    },
    {
        id: 'f1-m2', question: 'Will there be a Safety Car?', category: 'RACE EVENT',
        status: 'live', statusDetail: 'Lap 42 of 57', volume: 890_000, trend24h: 4,
        closesAt: now + 2 * hour,
        options: [
            { label: 'Yes', odds: 78, paysOut: 1.18, votes: 134_500 },
            { label: 'No', odds: 22, paysOut: 4.10, votes: 38_200 },
        ],
    },
    {
        id: 'f1-m3', question: 'Constructors Champion 2025?', category: 'SEASON',
        status: 'upcoming', volume: 5_100_000, trend24h: -2,
        closesAt: now + 90 * 24 * hour,
        options: [
            { label: 'Red Bull', odds: 45, paysOut: 1.95, votes: 312_000 },
            { label: 'Ferrari', odds: 32, paysOut: 2.80, votes: 224_000 },
        ],
    },
    {
        id: 'f1-m4', question: 'Will Verstappen get pole position at Jeddah?', category: 'QUALIFYING',
        status: 'upcoming', volume: 1_200_000, trend24h: 8,
        closesAt: now + 7 * 24 * hour,
        options: [
            { label: 'Yes', odds: 55, paysOut: 1.65, votes: 98_700 },
            { label: 'No', odds: 45, paysOut: 2.05, votes: 80_300 },
        ],
    },
    {
        id: 'f1-m5', question: 'McLaren vs Mercedes – More points in Round 3?', category: 'HEAD TO HEAD',
        status: 'upcoming', volume: 780_000, trend24h: -5,
        closesAt: now + 14 * 24 * hour,
        options: [
            { label: 'McLaren', odds: 58, paysOut: 1.55, votes: 67_800 },
            { label: 'Mercedes', odds: 42, paysOut: 2.20, votes: 49_100 },
        ],
    },
];

const f1Contests: Contest[] = [
    {
        id: 'f1-c1', betType: 'race',
        question: 'Who reaches 1M social interactions first?',
        description: 'A race between Verstappen and Leclerc fan bases to generate 1 million social interactions. Verified by LunarCrush real-time social tracking.',
        category: 'formula 1', metricSource: 'topic', metric: 'interactions_24h', metricLabel: 'Social Interactions',
        threshold: 1_000_000, thresholdLabel: '1M interactions',
        status: 'active', winner: null,
        contenders: [
            { label: 'Max Verstappen', icon: '🟡', currentValue: 723_400, bets: 14_200, paysOut: 1.45 },
            { label: 'Charles Leclerc', icon: '🔴', currentValue: 618_200, bets: 11_800, paysOut: 1.72 },
        ],
        curatorHandle: '@f1_insider',
        createdAt: Date.now() - 14 * hour, expiresAt: Date.now() + 10 * hour,
        volume: 850_000, totalBets: 26_000,
    },
    {
        id: 'f1-c2', betType: 'comparison',
        question: 'Who will have higher sentiment after Bahrain GP?',
        description: 'Comparing social sentiment between Red Bull and Ferrari fans after the race. Data from LunarCrush sentiment analysis.',
        category: 'formula 1', metricSource: 'topic', metric: 'sentiment', metricLabel: 'Social Sentiment',
        status: 'active', winner: null,
        contenders: [
            { label: 'Red Bull Racing', icon: '🐂', currentValue: 74, bets: 8_400, paysOut: 1.55 },
            { label: 'Scuderia Ferrari', icon: '🐎', currentValue: 68, bets: 9_100, paysOut: 1.38 },
        ],
        curatorHandle: '@pitwall_data',
        createdAt: Date.now() - 16 * hour, expiresAt: Date.now() + 8 * hour,
        volume: 520_000, totalBets: 17_500,
    },
];

// ─── NBA ───
const nbaMetrics: Metric[] = [
    { label: 'Social Interactions (24h)', value: '2.8M', delta: '+45%', deltaType: 'positive', helperText: 'Lakers vs Celtics game night' },
    { label: 'Mentions (24h)', value: '890K', delta: '+62%', deltaType: 'positive' },
    { label: 'Active Creators', value: '8,450', delta: '+12%', deltaType: 'positive' },
    { label: 'Sentiment Score', value: '81', delta: '+4%', deltaType: 'positive', helperText: 'High engagement during double OT' },
];

const nbaCreators: Creator[] = [
    { id: '1', name: 'NBA Guru', handle: '@nba_guru', followers: 340000, creatorRank: 96, interactions24h: 52000, interactionsChange24h: 45 },
    { id: '2', name: 'HoopCentral', handle: '@hoopcentral', followers: 280000, creatorRank: 93, interactions24h: 41000, interactionsChange24h: 28 },
    { id: '3', name: 'Laker Nation', handle: '@lakernation', followers: 195000, creatorRank: 89, interactions24h: 33500, interactionsChange24h: 55 },
    { id: '4', name: 'Celtic Pride', handle: '@celtic_pride', followers: 160000, creatorRank: 86, interactions24h: 27800, interactionsChange24h: 38 },
    { id: '5', name: 'Dub Nation', handle: '@dub_nation', followers: 220000, creatorRank: 91, interactions24h: 29200, interactionsChange24h: -8 },
];

const nbaPosts: Post[] = [
    { id: '1', network: 'x', author: 'NBA Central', authorHandle: '@nba_guru', text: 'LeBron James drops 42 points in double OT thriller against the Celtics! At 41 years old, he continues to defy Father Time. This man is not human.', likes: 45200, replies: 8900, shares: 12300, sentiment: 0.92, createdAt: now - 1 * hour, url: '#' },
    { id: '2', network: 'reddit', author: 'HoopAnalytics', authorHandle: 'u/HoopAnalytics', text: 'Advanced stats breakdown: Curry\'s off-ball movement creates 3.2 more open threes per game than any other player. The gravity effect is real.', likes: 12400, replies: 1560, shares: 780, sentiment: 0.78, createdAt: now - 4 * hour, url: '#' },
    { id: '3', network: 'x', author: 'Laker Nation', authorHandle: '@lakernation', text: 'BREAKING: Anthony Davis returns from injury with a monster performance – 28 pts, 15 reb, 4 blocks. The Brow is BACK and the West should be scared.', likes: 23800, replies: 4500, shares: 5600, sentiment: 0.85, createdAt: now - 6 * hour, url: '#' },
    { id: '4', network: 'youtube', author: 'HoopCentral', authorHandle: '@hoopcentral', text: 'Film study: How the Celtics\' switching defense is revolutionizing NBA strategy. Mazulla\'s system is the blueprint every team is trying to copy.', likes: 18900, replies: 2300, shares: 3400, sentiment: 0.74, createdAt: now - 10 * hour, url: '#' },
];

const nbaMarkets: BetMarket[] = [
    {
        id: 'nba-m1', question: 'Lakers vs Celtics – Who wins tonight?', category: 'GAME',
        description: 'The greatest rivalry in basketball resumes at TD Garden. Both teams are fighting for the top spot in their respective conferences, with LeBron James and Jayson Tatum expected to duel in a highly anticipated matchup.',
        status: 'live', statusDetail: '4th Quarter · 3:42', volume: 4_500_000, trend24h: 18,
        closesAt: now + 1 * hour,
        options: [
            { label: 'Lakers', odds: 55, paysOut: 1.65, votes: 289_000 },
            { label: 'Celtics', odds: 45, paysOut: 2.05, votes: 236_000 },
        ],
    },
    {
        id: 'nba-m2', question: 'Will LeBron score 30+ points?', category: 'PLAYER PROP',
        status: 'live', statusDetail: '28pts so far', volume: 1_800_000, trend24h: 15,
        closesAt: now + 1 * hour,
        options: [
            { label: 'Yes', odds: 72, paysOut: 1.25, votes: 156_000 },
            { label: 'No', odds: 28, paysOut: 3.20, votes: 60_800 },
        ],
    },
    {
        id: 'nba-m3', question: 'Warriors vs Nuggets – Who wins?', category: 'GAME',
        status: 'upcoming', volume: 3_200_000, trend24h: 3,
        closesAt: now + 5 * hour,
        options: [
            { label: 'Warriors', odds: 42, paysOut: 2.20, votes: 178_000 },
            { label: 'Nuggets', odds: 58, paysOut: 1.55, votes: 245_000 },
        ],
    },
    {
        id: 'nba-m4', question: 'NBA MVP 2025-26?', category: 'SEASON AWARD',
        status: 'upcoming', volume: 8_900_000, trend24h: -4,
        closesAt: now + 60 * 24 * hour,
        options: [
            { label: 'Nikola Jokić', odds: 38, paysOut: 2.40, votes: 445_000 },
            { label: 'Luka Dončić', odds: 28, paysOut: 3.20, votes: 328_000 },
        ],
    },
    {
        id: 'nba-m5', question: 'Will the Celtics repeat as champions?', category: 'SEASON',
        status: 'upcoming', volume: 6_700_000, trend24h: 7,
        closesAt: now + 90 * 24 * hour,
        options: [
            { label: 'Yes', odds: 32, paysOut: 2.80, votes: 310_000 },
            { label: 'No', odds: 68, paysOut: 1.35, votes: 658_000 },
        ],
    },
];

const nbaContests: Contest[] = [
    {
        id: 'nba-c1', betType: 'race',
        question: 'Who reaches 1M interactions first?',
        description: 'Lakers vs Celtics: the biggest rivalry in basketball extends to social media. Which fanbase hits 1 million interactions first?',
        category: 'nba', metricSource: 'topic', metric: 'interactions_24h', metricLabel: 'Social Interactions',
        threshold: 1_000_000, thresholdLabel: '1M interactions',
        status: 'active', winner: null,
        contenders: [
            { label: 'Los Angeles Lakers', icon: '💜', currentValue: 812_000, bets: 22_400, paysOut: 1.30 },
            { label: 'Boston Celtics', icon: '☘️', currentValue: 745_600, bets: 19_800, paysOut: 1.52 },
        ],
        curatorHandle: '@nba_guru',
        createdAt: Date.now() - 18 * hour, expiresAt: Date.now() + 6 * hour,
        volume: 1_450_000, totalBets: 42_200,
    },
    {
        id: 'nba-c2', betType: 'threshold',
        question: 'Will LeBron James surpass 500K interactions in 24h?',
        description: 'A Yes/No bet on whether LeBron\'s social presence will break the 500K interactions barrier today.',
        category: 'nba', metricSource: 'creator', metric: 'interactions_24h', metricLabel: 'Creator Interactions',
        threshold: 500_000, thresholdLabel: '500K interactions',
        status: 'finished', winner: 'Yes',
        contenders: [
            { label: 'Yes', icon: '✅', currentValue: 500_000, bets: 18_300, paysOut: 1.40 },
            { label: 'No', icon: '❌', currentValue: 500_000, bets: 15_600, paysOut: 1.58 },
        ],
        curatorHandle: '@hoopcentral',
        createdAt: Date.now() - 22 * hour, expiresAt: Date.now() + 2 * hour,
        volume: 980_000, totalBets: 33_900,
    },
];

// ─── NFL ───
const nflMetrics: Metric[] = [
    { label: 'Social Interactions (24h)', value: '3.5M', delta: '+78%', deltaType: 'positive', helperText: 'Sunday matchday + trade rumors' },
    { label: 'Mentions (24h)', value: '1.1M', delta: '+54%', deltaType: 'positive' },
    { label: 'Active Creators', value: '12,300', delta: '+22%', deltaType: 'positive' },
    { label: 'Sentiment Score', value: '68', delta: '-7%', deltaType: 'negative', helperText: 'Controversial call in KC game' },
];

const nflCreators: Creator[] = [
    { id: '1', name: 'NFL Insider', handle: '@nfl_insider', followers: 520000, creatorRank: 97, interactions24h: 78000, interactionsChange24h: 62 },
    { id: '2', name: 'Chiefs Kingdom', handle: '@chiefskingdom', followers: 310000, creatorRank: 94, interactions24h: 55000, interactionsChange24h: 72 },
    { id: '3', name: '49ers Faithful', handle: '@49ers_faithful', followers: 245000, creatorRank: 90, interactions24h: 42000, interactionsChange24h: 35 },
    { id: '4', name: 'Eagles Nation', handle: '@eagles_nation', followers: 198000, creatorRank: 88, interactions24h: 38000, interactionsChange24h: 18 },
    { id: '5', name: 'NFL Analytics', handle: '@nfl_analytics', followers: 175000, creatorRank: 85, interactions24h: 31000, interactionsChange24h: 24 },
];

const nflPosts: Post[] = [
    { id: '1', network: 'x', author: 'NFL Insider', authorHandle: '@nfl_insider', text: 'BREAKING: Patrick Mahomes throws 5 TDs in a dominant display as the Chiefs clinch the #1 seed in the AFC. Dynasty mode: ACTIVATED.', likes: 67800, replies: 12400, shares: 18900, sentiment: 0.88, createdAt: now - 3 * hour, url: '#' },
    { id: '2', network: 'reddit', author: 'NFLFilmStudy', authorHandle: 'u/NFLFilmStudy', text: 'Deep dive into the 49ers\' new zone-run scheme. Shanahan has completely reinvented their ground game. The numbers are absolutely insane.', likes: 15600, replies: 2100, shares: 980, sentiment: 0.76, createdAt: now - 7 * hour, url: '#' },
    { id: '3', network: 'x', author: 'Eagles Nation', authorHandle: '@eagles_nation', text: 'Saquon Barkley rushes for 180 yards and 2 TDs in his Eagles debut. Best free agent signing of the decade? The NFC East is on notice.', likes: 34500, replies: 6700, shares: 8900, sentiment: 0.91, createdAt: now - 9 * hour, url: '#' },
    { id: '4', network: 'youtube', author: 'NFL Analytics', authorHandle: '@nfl_analytics', text: 'Why the dual-threat QB is becoming extinct in 2025. The data shows pocket passers are making a massive comeback. Full statistical breakdown inside.', likes: 22100, replies: 3800, shares: 4500, sentiment: 0.65, createdAt: now - 14 * hour, url: '#' },
];

const nflMarkets: BetMarket[] = [
    {
        id: 'nfl-m1', question: 'Chiefs vs 49ers – Who wins Sunday?', category: 'GAME',
        description: 'A Super Super Bowl rematch with massive playoff implications. Patrick Mahomes and the dominant Chiefs offense face off against Kyle Shanahan\'s versatile scheme and a suffocating 49ers defense at Arrowhead.',
        status: 'live', statusDetail: '3rd Quarter · 8:15', volume: 7_200_000, trend24h: 22,
        closesAt: now + 2 * hour,
        options: [
            { label: 'Chiefs', odds: 58, paysOut: 1.55, votes: 512_000 },
            { label: '49ers', odds: 42, paysOut: 2.20, votes: 371_000 },
        ],
    },
    {
        id: 'nfl-m2', question: 'Will Mahomes throw 3+ TDs?', category: 'PLAYER PROP',
        status: 'live', statusDetail: '2 TDs so far', volume: 2_100_000, trend24h: 14,
        closesAt: now + 2 * hour,
        options: [
            { label: 'Yes', odds: 65, paysOut: 1.40, votes: 198_000 },
            { label: 'No', odds: 35, paysOut: 2.60, votes: 106_500 },
        ],
    },
    {
        id: 'nfl-m3', question: 'Eagles vs Cowboys – Who wins?', category: 'GAME',
        status: 'upcoming', volume: 5_400_000, trend24h: -1,
        closesAt: now + 8 * hour,
        options: [
            { label: 'Eagles', odds: 61, paysOut: 1.45, votes: 398_000 },
            { label: 'Cowboys', odds: 39, paysOut: 2.35, votes: 255_000 },
        ],
    },
    {
        id: 'nfl-m4', question: 'Super Bowl LX Champion?', category: 'SEASON',
        status: 'upcoming', volume: 12_500_000, trend24h: 5,
        closesAt: now + 120 * 24 * hour,
        options: [
            { label: 'Chiefs', odds: 22, paysOut: 4.10, votes: 890_000 },
            { label: 'Eagles', odds: 18, paysOut: 5.00, votes: 725_000 },
        ],
    },
    {
        id: 'nfl-m5', question: 'Will there be a defensive TD in Chiefs game?', category: 'GAME EVENT',
        status: 'live', statusDetail: '3rd Quarter', volume: 950_000, trend24h: 2,
        closesAt: now + 2 * hour,
        options: [
            { label: 'Yes', odds: 35, paysOut: 2.60, votes: 48_200 },
            { label: 'No', odds: 65, paysOut: 1.40, votes: 89_500 },
        ],
    },
];

const nflContests: Contest[] = [
    {
        id: 'nfl-c1', betType: 'comparison',
        question: 'Chiefs vs 49ers – Who will have more social dominance?',
        description: 'Comparing social dominance between Chiefs and 49ers fanbases over the next 24 hours.',
        category: 'nfl', metricSource: 'topic', metric: 'social_dominance', metricLabel: 'Social Dominance',
        status: 'active', winner: null,
        contenders: [
            { label: 'Kansas City Chiefs', icon: '🏹', currentValue: 4.2, bets: 31_200, paysOut: 1.35 },
            { label: 'San Francisco 49ers', icon: '⛏️', currentValue: 3.8, bets: 28_500, paysOut: 1.50 },
        ],
        curatorHandle: '@nfl_insider',
        createdAt: Date.now() - 12 * hour, expiresAt: Date.now() + 12 * hour,
        volume: 2_100_000, totalBets: 59_700,
    },
    {
        id: 'nfl-c2', betType: 'prediction',
        question: 'Which team will be #1 in NFL topic_rank tomorrow?',
        description: 'Predict which NFL team will lead the social rankings by tomorrow morning.',
        category: 'nfl', metricSource: 'topic', metric: 'topic_rank', metricLabel: 'Topic Rank',
        status: 'active', winner: null,
        contenders: [
            { label: 'Kansas City Chiefs', icon: '🏹', currentValue: 2, bets: 18_400, paysOut: 1.80 },
            { label: 'Philadelphia Eagles', icon: '🦅', currentValue: 5, bets: 14_200, paysOut: 2.40 },
            { label: 'Dallas Cowboys', icon: '⭐', currentValue: 8, bets: 11_800, paysOut: 3.20 },
        ],
        curatorHandle: '@nfl_analytics',
        createdAt: Date.now() - 6 * hour, expiresAt: Date.now() + 18 * hour,
        volume: 1_340_000, totalBets: 44_400,
    },
];

// ─── Football (Soccer) ───
const footballMetrics: Metric[] = [
    { label: 'Social Interactions (24h)', value: '4.1M', delta: '+56%', deltaType: 'positive', helperText: 'El Clásico matchday' },
    { label: 'Mentions (24h)', value: '1.5M', delta: '+41%', deltaType: 'positive' },
    { label: 'Active Creators', value: '15,800', delta: '+18%', deltaType: 'positive' },
    { label: 'Sentiment Score', value: '76', delta: '+3%', deltaType: 'positive', helperText: 'Exciting late winner in El Clásico' },
];

const footballCreators: Creator[] = [
    { id: '1', name: 'Football Daily', handle: '@football_daily', followers: 890000, creatorRank: 98, interactions24h: 120000, interactionsChange24h: 48 },
    { id: '2', name: 'Real Madrid World', handle: '@rmcf_world', followers: 650000, creatorRank: 95, interactions24h: 95000, interactionsChange24h: 62 },
    { id: '3', name: 'Barca Universal', handle: '@barca_universal', followers: 580000, creatorRank: 93, interactions24h: 82000, interactionsChange24h: 55 },
    { id: '4', name: 'PL Insider', handle: '@pl_insider', followers: 420000, creatorRank: 91, interactions24h: 68000, interactionsChange24h: 32 },
    { id: '5', name: 'La Liga Data', handle: '@la_liga_data', followers: 310000, creatorRank: 87, interactions24h: 51000, interactionsChange24h: 25 },
];

const footballPosts: Post[] = [
    { id: '1', network: 'x', author: 'Football Daily', authorHandle: '@football_daily', text: 'WHAT A GOAL! Vinícius Jr scores an incredible bicycle kick in the 93rd minute to seal El Clásico for Real Madrid! The Bernabéu is SHAKING.', likes: 89400, replies: 18200, shares: 34500, sentiment: 0.95, createdAt: now - 1 * hour, url: '#' },
    { id: '2', network: 'reddit', author: 'TacticsBoard', authorHandle: 'u/TacticsBoard', text: 'Tactical analysis: How Arsenal\'s inverted fullback system has transformed their ball progression. Arteta is creating something special at the Emirates.', likes: 24600, replies: 3400, shares: 1800, sentiment: 0.82, createdAt: now - 4 * hour, url: '#' },
    { id: '3', network: 'x', author: 'Barça Universal', authorHandle: '@barca_universal', text: 'Pedri completes 94% of his passes in the first half vs Real Madrid. His vision and composure under pressure at 22 is absolutely world class.', likes: 42300, replies: 7800, shares: 11200, sentiment: 0.87, createdAt: now - 6 * hour, url: '#' },
    { id: '4', network: 'youtube', author: 'PL Insider', authorHandle: '@pl_insider', text: 'Why the Premier League is the most competitive league in 2025. Four teams separated by 3 points at the top. Full breakdown of the title race.', likes: 31200, replies: 4500, shares: 6700, sentiment: 0.79, createdAt: now - 11 * hour, url: '#' },
];

const footballMarkets: BetMarket[] = [
    {
        id: 'fb-m1', question: 'Real Madrid vs Barcelona – El Clásico winner?', category: 'MATCH',
        description: 'The biggest match in world football. Real Madrid hosts Barcelona at the Santiago Bernabéu with the La Liga title race hanging in the balance. Expect high drama, world-class talent, and intense tactical battles.',
        status: 'live', statusDetail: '78\' · 2-1', volume: 9_800_000, trend24h: 31,
        closesAt: now + 30 * 60 * 1000,
        options: [
            { label: 'Real Madrid', odds: 68, paysOut: 1.35, votes: 678_000 },
            { label: 'Barcelona', odds: 32, paysOut: 2.80, votes: 318_000 },
        ],
    },
    {
        id: 'fb-m2', question: 'Will there be a red card in El Clásico?', category: 'MATCH EVENT',
        status: 'live', statusDetail: '78\' played', volume: 1_200_000, trend24h: -3,
        closesAt: now + 30 * 60 * 1000,
        options: [
            { label: 'Yes', odds: 42, paysOut: 2.20, votes: 78_500 },
            { label: 'No', odds: 58, paysOut: 1.55, votes: 108_900 },
        ],
    },
    {
        id: 'fb-m3', question: 'Arsenal vs Man City – Premier League?', category: 'MATCH',
        status: 'upcoming', volume: 6_400_000, trend24h: 11,
        closesAt: now + 3 * 24 * hour,
        options: [
            { label: 'Arsenal', odds: 40, paysOut: 2.30, votes: 312_000 },
            { label: 'Man City', odds: 45, paysOut: 2.00, votes: 351_000 },
        ],
    },
    {
        id: 'fb-m4', question: 'Premier League Champion 2025-26?', category: 'SEASON',
        status: 'upcoming', volume: 14_200_000, trend24h: 6,
        closesAt: now + 120 * 24 * hour,
        options: [
            { label: 'Arsenal', odds: 35, paysOut: 2.60, votes: 890_000 },
            { label: 'Man City', odds: 30, paysOut: 3.00, votes: 765_000 },
        ],
    },
    {
        id: 'fb-m5', question: 'Champions League – Will Real Madrid reach the final?', category: 'TOURNAMENT',
        status: 'upcoming', volume: 4_800_000, trend24h: 9,
        closesAt: now + 60 * 24 * hour,
        options: [
            { label: 'Yes', odds: 52, paysOut: 1.75, votes: 345_000 },
            { label: 'No', odds: 48, paysOut: 1.90, votes: 318_000 },
        ],
    },
];

const footballContests: Contest[] = [
    {
        id: 'fb-c1', betType: 'race',
        question: 'Who reaches 1.5M interactions first?',
        description: 'El Clásico rivalry extends to social media! Real Madrid vs Barcelona – which fanbase will generate 1.5 million interactions first?',
        category: 'champions league', metricSource: 'topic', metric: 'interactions_24h', metricLabel: 'Social Interactions',
        threshold: 1_500_000, thresholdLabel: '1.5M interactions',
        status: 'active', winner: null,
        contenders: [
            { label: 'Real Madrid', icon: '⚪', currentValue: 1_120_000, bets: 28_400, paysOut: 1.42 },
            { label: 'FC Barcelona', icon: '🔵', currentValue: 1_050_000, bets: 25_800, paysOut: 1.55 },
        ],
        curatorHandle: '@football_daily',
        createdAt: Date.now() - 15 * hour, expiresAt: Date.now() + 9 * hour,
        volume: 1_800_000, totalBets: 54_200,
    },
    {
        id: 'fb-c2', betType: 'threshold',
        question: 'Will Premier League hit 100K contributors in 24h?',
        description: 'Can the Premier League community reach 100K unique social contributors in a single day?',
        category: 'premier league', metricSource: 'topic', metric: 'num_contributors', metricLabel: 'Contributors',
        threshold: 100_000, thresholdLabel: '100K contributors',
        status: 'expired', winner: null,
        contenders: [
            { label: 'Yes', icon: '✅', currentValue: 87_400, bets: 12_100, paysOut: 1.60 },
            { label: 'No', icon: '❌', currentValue: 87_400, bets: 10_800, paysOut: 1.75 },
        ],
        curatorHandle: '@pl_insider',
        createdAt: Date.now() - 24 * hour, expiresAt: Date.now() - 1 * 60 * 1000,
        volume: 640_000, totalBets: 22_900,
    },
];

// ─── LunarCrush Categories ───
export const lunarCrushCategories: LunarCrushCategory[] = [
    // Sports
    // Sports
    { category: 'nba', title: 'NBA', icon: 'sports_basketball', group: 'sports' },
    { category: 'nfl', title: 'NFL', icon: 'sports_football', group: 'sports' },
    { category: 'mlb', title: 'MLB', icon: 'sports_baseball', group: 'sports' },
    { category: 'nhl', title: 'NHL', icon: 'sports_hockey', group: 'sports' },
    { category: 'mls', title: 'MLS', icon: 'sports_soccer', group: 'sports' },
    { category: 'ufc', title: 'UFC', icon: 'sports_mma', group: 'sports' },
    { category: 'formula 1', title: 'Formula 1', icon: 'sports_motorsports', group: 'sports' },
    { category: 'nascar', title: 'NASCAR', icon: 'sports_score', group: 'sports' },
    { category: 'ncaa football', title: 'NCAA Football', icon: 'stadium', group: 'sports' },
    { category: 'ncaa basketball', title: 'NCAA Basketball', icon: 'sports_basketball', group: 'sports' },
    { category: 'pga golfers', title: 'PGA Golfers', icon: 'sports_golf', group: 'sports' },
    { category: 'premier league', title: 'Premier League', icon: 'sports_soccer', group: 'sports' },
    { category: 'la liga', title: 'La Liga', icon: 'sports_soccer', group: 'sports' },
    { category: 'bundesliga', title: 'Bundesliga', icon: 'sports_soccer', group: 'sports' },
    { category: 'liga mx', title: 'Liga MX', icon: 'sports_soccer', group: 'sports' },
    { category: 'champions league', title: 'Champions League', icon: 'trophy', group: 'sports' },
    // Finance
    { category: 'cryptocurrencies', title: 'Cryptocurrencies', icon: 'currency_bitcoin', group: 'finance' },
    { category: 'stocks', title: 'Stocks', icon: 'trending_up', group: 'finance' },
    { category: 'currencies', title: 'Currencies', icon: 'currency_exchange', group: 'finance' },
    { category: 'exchanges', title: 'Exchanges', icon: 'account_balance_wallet', group: 'finance' },
    { category: 'finance', title: 'Finance', icon: 'payments', group: 'finance' },
    { category: 'financial services', title: 'Financial Services', icon: 'atm', group: 'finance' },
    // Brands
    { category: 'fashion brands', title: 'Fashion Brands', icon: 'apparel', group: 'brands' },
    { category: 'luxury brands', title: 'Luxury Brands', icon: 'diamond', group: 'brands' },
    { category: 'automotive brands', title: 'Automotive Brands', icon: 'directions_car', group: 'brands' },
    { category: 'technology brands', title: 'Technology Brands', icon: 'computer', group: 'brands' },
    { category: 'products', title: 'Products', icon: 'package', group: 'brands' },
    // Entertainment
    { category: 'musicians', title: 'Musicians', icon: 'music_note', group: 'entertainment' },
    { category: 'celebrities', title: 'Celebrities', icon: 'star', group: 'entertainment' },
    { category: 'gaming', title: 'Gaming', icon: 'sports_esports', group: 'entertainment' },
    { category: 'nfts', title: 'NFTs', icon: 'image', group: 'entertainment' },
    // Other
    { category: 'social networks', title: 'Social Networks', icon: 'smartphone', group: 'other' },
    { category: 'travel destinations', title: 'Travel Destinations', icon: 'flight', group: 'other' },
    { category: 'countries', title: 'Countries', icon: 'public', group: 'other' },
    { category: 'agencies', title: 'Agencies', icon: 'corporate_fare', group: 'other' },
    { category: 'vc firms', title: 'VC Firms', icon: 'rocket_launch', group: 'other' },
    { category: 'events', title: 'Events', icon: 'festival', group: 'other' },
];

// ─── Exported topics ───
export const topics: Topic[] = [
    {
        id: 'f1',
        label: 'Formula 1',
        icon: 'sports_motorsports',
        mockMetrics: f1Metrics,
        mockSeries: generateSeries({ interactions: 50000, posts: 2200, contributors: 420 }, 12000),
        mockCreators: f1Creators,
        mockPosts: f1Posts,
        mockMarkets: f1Markets,
        mockContests: f1Contests,
    },
    {
        id: 'nba',
        label: 'NBA',
        icon: 'sports_basketball',
        mockMetrics: nbaMetrics,
        mockSeries: generateSeries({ interactions: 115000, posts: 5400, contributors: 845 }, 28000),
        mockCreators: nbaCreators,
        mockPosts: nbaPosts,
        mockMarkets: nbaMarkets,
        mockContests: nbaContests,
    },
    {
        id: 'nfl',
        label: 'NFL',
        icon: 'sports_football',
        mockMetrics: nflMetrics,
        mockSeries: generateSeries({ interactions: 145000, posts: 8200, contributors: 1230 }, 35000),
        mockCreators: nflCreators,
        mockPosts: nflPosts,
        mockMarkets: nflMarkets,
        mockContests: nflContests,
    },
    {
        id: 'football',
        label: 'Football',
        icon: 'sports_soccer',
        mockMetrics: footballMetrics,
        mockSeries: generateSeries({ interactions: 170000, posts: 9800, contributors: 1580 }, 42000),
        mockCreators: footballCreators,
        mockPosts: footballPosts,
        mockMarkets: footballMarkets,
        mockContests: footballContests,
    },
];

export function getTopicById(id: string): Topic | undefined {
    return topics.find((t) => t.id === id);
}
