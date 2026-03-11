import type { ESPNLeagueConfig } from '../types';
import { getLeaguesForCategory, UNIFIED_SPORT_CATEGORIES, ESPN_LEAGUES } from '../services/espnApi';
import Icon from './Icon';

interface SportsSidebarProps {
    sportCategories: Array<{ category: string; title: string; icon: string }>;
    selectedSport: string | null;
    selectedLeague: string | null;
    onSelectSport: (sport: string) => void;
    onSelectLeague: (league: ESPNLeagueConfig) => void;
    onBackToFeed: () => void;
}

// Resolve leagues for a given sport category (unified or Lunar Crush)
function resolveLeagues(sport: string): ESPNLeagueConfig[] {
    const unified = UNIFIED_SPORT_CATEGORIES.find(u => u.id === sport);
    if (unified) {
        return ESPN_LEAGUES.filter(l => l.sport === unified.espnSport);
    }
    return getLeaguesForCategory(sport);
}

export default function SportsSidebar({
    sportCategories,
    selectedSport,
    selectedLeague,
    onSelectSport,
    onSelectLeague,
    onBackToFeed,
}: SportsSidebarProps) {
    const leagues = selectedSport ? resolveLeagues(selectedSport) : [];

    return (
        <div className="flex flex-col gap-1 sticky top-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon name="sports" className="text-brand-lemon !text-base" />
                    <h3 className="text-xs font-bold text-text-main">Sports</h3>
                </div>
                {selectedSport && (
                    <button
                        onClick={onBackToFeed}
                        className="text-[10px] font-bold text-brand-lemon hover:underline"
                    >
                        ← Back
                    </button>
                )}
            </div>

            {/* All (reset filter) */}
            <button
                onClick={onBackToFeed}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-300 ${!selectedSport
                    ? 'bg-brand-lemon/10 border border-brand-lemon/30 text-brand-lemon shadow-[0_0_15px_rgba(204,221,141,0.05)]'
                    : 'text-text-muted hover:bg-bg-card-hover/50 hover:text-text-main border border-transparent hover:border-brand-lemon/10'
                    }`}
            >
                <Icon name="public" className="!text-[16px]" />
                <span className="text-xs font-semibold">All</span>
            </button>

            {/* Sport Categories */}
            {sportCategories.map((cat) => {
                const isSelected = selectedSport === cat.category;
                const catLeagues = resolveLeagues(cat.category);
                const hasLeagues = catLeagues.length > 0;

                return (
                    <div key={cat.category}>
                        <button
                            onClick={() => onSelectSport(cat.category)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all duration-300 ${isSelected
                                ? 'bg-brand-lemon/10 border border-brand-lemon/30 text-brand-lemon'
                                : 'text-text-muted hover:bg-bg-card-hover/50 hover:text-text-main border border-transparent hover:border-brand-lemon/10'
                                }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Icon name={cat.icon} className="!text-[16px]" />
                                <span className="text-xs font-semibold">{cat.title}</span>
                            </div>
                            {hasLeagues && (
                                <Icon
                                    name={isSelected ? 'expand_more' : 'chevron_right'}
                                    className="!text-[14px] text-text-muted/50"
                                />
                            )}
                        </button>

                        {/* Sub-leagues */}
                        {isSelected && leagues.length > 0 && (
                            <div className="ml-6 mt-1 flex flex-col gap-0.5">
                                {leagues.map((league) => (
                                    <button
                                        key={league.league}
                                        onClick={() => onSelectLeague(league)}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all ${selectedLeague === league.league
                                            ? 'bg-bg-card-hover text-text-main'
                                            : 'text-text-muted/70 hover:text-text-main hover:bg-bg-card-hover/30'
                                            }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                                        <span className="text-[11px] font-medium">{league.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
