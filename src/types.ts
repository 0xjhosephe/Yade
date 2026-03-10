// ─── Series data for time-series chart ───
export type SeriesPoint = {
    timestamp: number;
    interactions: number;
    postsActive: number;
    contributorsActive: number;
};

// ─── Metric card ───
export interface Metric {
    label: string;
    value: string;
    delta: string;
    deltaType: 'positive' | 'negative' | 'neutral';
    helperText?: string;
}

// ─── Creator ───
export interface Creator {
    id: string;
    handle: string;
    name: string;
    followers: number;
    creatorRank: number;
    interactions24h: number;
    interactionsChange24h: number;
    avatar?: string;
}

// ─── Post ───
export interface Post {
    id: string;
    network: 'x' | 'reddit' | 'youtube';
    author: string;
    authorHandle: string;
    text: string;
    likes: number;
    replies: number;
    shares: number;
    sentiment: number;
    createdAt: number;
    url: string;
}

// ─── Bet Market ───
export type MarketStatus = 'live' | 'upcoming' | 'closed';

export interface MarketOption {
    label: string;
    odds: number;       // probability percentage 0-100
    paysOut: number;    // payout multiplier e.g. 1.3
    votes: number;      // total votes / contracts
    icon?: string;
    iconType?: 'emoji' | 'image' | 'icon';
    subLabel?: string;
    link?: string;
}

export interface BetMarket {
    id: string;
    question: string;
    description?: string;
    category: string;
    status: MarketStatus;
    statusDetail?: string;
    volume: number;         // total volume traded
    trend24h?: number; // Added for Kalshi layout
    topicIcon?: string; // Added for Global Trending mixture
    closesAt: number;       // timestamp
    options: MarketOption[];
}

// ─── Contest (Flexible Betting System) ───
export type BetType = 'race' | 'threshold' | 'comparison' | 'prediction';
export type ContestStatus = 'active' | 'finished' | 'expired';
export type MetricSource = 'topic' | 'creator' | 'coin';
export type LunarMetric =
    | 'interactions_24h'
    | 'social_volume_24h'
    | 'social_dominance'
    | 'sentiment'
    | 'num_contributors'
    | 'num_posts'
    | 'topic_rank'
    | 'creator_rank'
    | 'creator_followers'
    | 'galaxy_score'
    | 'alt_rank'
    | 'volatility';

export interface Contender {
    label: string;
    icon: string;           // emoji or image url block string
    iconType?: 'emoji' | 'image' | 'icon'; // defaults to emoji if not specified
    subLabel?: string;
    link?: string;
    currentValue: number;   // current metric value
    bets: number;           // total bets placed
    paysOut: number;        // payout multiplier
}

export interface Contest {
    id: string;
    betType: BetType;
    question: string;
    description?: string;
    category: string;          // LunarCrush category slug
    metricSource: MetricSource;
    metric: LunarMetric;
    metricLabel: string;       // human label, e.g. 'Social Interactions'
    // Race & Threshold
    threshold?: number;        // target value
    thresholdLabel?: string;   // e.g. '1M interactions'
    // Contenders (Race & Comparison: 2 sides, Prediction: multiple options)
    contenders: Contender[];
    // Result
    status: ContestStatus;
    winner: string | null;
    // Metadata
    curatorHandle: string;
    createdAt: number;
    expiresAt: number;
    volume: number;
    totalBets: number;
    isUserGenerated?: boolean;
    // ─── ESPN Official Sports Fields (optional) ───
    type?: 'social' | 'official_sports';
    espnEventId?: string;
    sportCategory?: string;       // ESPN league slug, e.g. 'nba', 'eng.1'
    espnLink?: string;            // Gamecast / Summary URL
    settlementMethod?: 'manual' | 'automatic_espn';
}

// ─── ESPN API Types ───
export interface ESPNLeagueConfig {
    sport: string;          // e.g. 'basketball'
    league: string;         // e.g. 'nba'
    label: string;          // e.g. 'NBA'
    icon: string;           // Material icon name
    allowDraw: boolean;     // Soccer = true, NBA/NFL = false
}

export interface ESPNTeam {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;           // CDN url for the team crest
    score?: string;
}

export interface ESPNEvent {
    id: string;
    name: string;           // e.g. 'Los Angeles Lakers at Golden State Warriors'
    shortName: string;      // e.g. 'LAL @ GSW'
    date: string;           // ISO date string
    status: 'pre' | 'in' | 'post';
    statusDetail: string;   // e.g. 'Final', '3rd Quarter', 'Scheduled'
    homeTeam: ESPNTeam;
    awayTeam: ESPNTeam;
    venue?: string;
    broadcast?: string;
    odds?: string;          // e.g. 'LAL -3.5'
    league: string;         // slug
    sport: string;          // slug
}

export interface ESPNNewsArticle {
    headline: string;
    description: string;
    published: string;      // ISO date
    link: string;
    imageUrl?: string;
}

// ─── LunarCrush Category ───
export interface LunarCrushCategory {
    category: string;   // slug, e.g. 'nba'
    title: string;      // display name, e.g. 'NBA'
    icon: string;       // emoji
    group: 'sports' | 'finance' | 'brands' | 'entertainment' | 'other';
}

// ─── Topic ───
export type TopicId = string;

export interface Topic {
    id: TopicId;
    label: string;
    icon: string;
    mockMetrics: Metric[];
    mockSeries: SeriesPoint[];
    mockCreators: Creator[];
    mockPosts: Post[];
    mockMarkets: BetMarket[];
    mockContests: Contest[];
}
