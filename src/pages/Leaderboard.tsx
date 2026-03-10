import { useState } from 'react';
import { topics } from '../mocks/topics';
import Icon from '../components/Icon';

// Mock leaderboard data per category
const createMockLeaderboard = (categoryId: string) => {
    const seed = categoryId.length;
    return Array.from({ length: 15 }).map((_, i) => ({
        rank: i + 1,
        address: `SP${1234 + i * seed}...${categoryId.slice(0, 4).toUpperCase()}`,
        wins: Math.max(1, 45 - i * 3 - (seed % 5)),
        winRate: (60 + Math.max(0, 35 - i * 2) - (seed % 10)).toFixed(1),
        totalProfit: `$${((15 - i) * (seed * 100 + 450)).toLocaleString()}`
    }));
};

import Header from '../components/Header';
import { connect, disconnect, isConnected } from '@stacks/connect';

export default function Leaderboard() {
    const [selectedCategoryId, setSelectedCategoryId] = useState('f1');
    const [userAddress, setUserAddress] = useState<string | null>(null);

    const handleLogin = async () => {
        try {
            if (isConnected()) return;
            const response = await connect();
            const addresses = (response as { addresses?: { symbol: string; address: string }[] })?.addresses;
            if (Array.isArray(addresses)) {
                const stx = addresses.find((a) => a.symbol === 'STX') || addresses[0];
                if (stx?.address) setUserAddress(stx.address);
            }
        } catch (error) {
            console.error('Wallet connection failed', error);
        }
    };

    const handleLogout = () => {
        disconnect();
        setUserAddress(null);
    };

    const leaderboardData = createMockLeaderboard(selectedCategoryId);

    return (
        <div className="min-h-screen bg-bg-base text-text-main">
            <Header
                userAddress={userAddress}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
            />

            <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">

                {/* Active topic banner */}
                <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Icon name="military_tech" className="!text-3xl text-accent" />
                        <div>
                            <h2 className="text-xl font-bold text-text-main">
                                Leaderboard
                            </h2>
                            <p className="text-sm text-text-muted">The most profitable and accurate accounts by category.</p>
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
                    {topics.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedCategoryId(t.id)}
                            className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-border-subtle px-4 py-1.5 text-xs font-bold transition ${selectedCategoryId === t.id
                                ? 'bg-accent text-text-inverted border-accent'
                                : 'bg-bg-card/40 text-text-muted hover:border-muted hover:text-text-main'
                                }`}
                        >
                            <Icon name={t.icon} className="icon-sm" />
                            <span className="whitespace-nowrap">{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* Leaderboard Table */}
                <div className="rounded-md border border-border-subtle bg-bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-bg-surface border-b border-border-subtle text-xs text-text-muted">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Rank</th>
                                    <th className="px-6 py-4 font-bold">Bettor Address (Stacks)</th>
                                    <th className="px-6 py-4 font-bold text-right">Contests Won</th>
                                    <th className="px-6 py-4 font-bold text-right">Win Rate</th>
                                    <th className="px-6 py-4 font-bold text-right">Total Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle/50">
                                {leaderboardData.map((user) => (
                                    <tr key={user.address} className="transition-colors hover:bg-bg-card-hover/40">
                                        <td className="px-6 py-4">
                                            {user.rank === 1 ? <Icon name="military_tech" className="!text-[24px] text-yellow-500" /> :
                                                user.rank === 2 ? <Icon name="military_tech" className="!text-[24px] text-slate-400" /> :
                                                    user.rank === 3 ? <Icon name="military_tech" className="!text-[24px] text-amber-700" /> :
                                                        <span className="font-mono text-text-muted pl-1">#{user.rank}</span>}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-text-main">
                                            {user.address}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="rounded bg-accent/10 px-2 py-0.5 font-bold text-accent">
                                                {user.wins}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-yes">
                                            {user.winRate}%
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-text-main">
                                            {user.totalProfit}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
}
