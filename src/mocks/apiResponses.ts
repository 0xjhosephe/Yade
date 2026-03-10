import { topics } from './topics';
import type { Contest, Creator, Post } from '../types';

// Featured bets are derived from the first market of each topic
export const featuredBets = topics.map(t => ({
    topic: t,
    market: { ...t.mockMarkets[0], topicIcon: t.icon }
}));

// Initial active contests (from F1 and NBA for example)
export const activeContests: Contest[] = [
    ...topics.find(t => t.id === 'f1')?.mockContests || [],
    ...topics.find(t => t.id === 'nba')?.mockContests || []
];

// Global creators collection
export const creators: Creator[] = topics.flatMap(t => t.mockCreators);

// Global posts collection
export const posts: Post[] = topics.flatMap(t => t.mockPosts);
