import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
import type { Contest, BetType, MetricSource, LunarMetric, Creator, LunarCrushCategory } from '../types';
import { getTopicCreators } from '../services/lunarcrush';
import { fetchCategories } from '../services/api';
import ContestCard from '../components/ContestCard';
import Icon from '../components/Icon';
import Header from '../components/Header';

const METRICS_OPTIONS: { value: LunarMetric, label: string }[] = [
    { value: 'interactions_24h', label: 'Interactions (24h)' },
    { value: 'social_volume_24h', label: 'Social Volume (24h)' },
    { value: 'social_dominance', label: 'Social Dominance' },
    { value: 'sentiment', label: 'Sentiment' },
    { value: 'galaxy_score', label: 'Galaxy Score' },
    { value: 'alt_rank', label: 'Alt Rank' },
    { value: 'topic_rank', label: 'Topic Rank' },
    { value: 'creator_rank', label: 'Creator Rank' }
];

const BET_TYPES: { value: BetType, label: string, desc: string }[] = [
    { value: 'race', label: 'Race', desc: 'Who hits the metric threshold first' },
    { value: 'threshold', label: 'Threshold', desc: 'Will a target be reached in time?' },
    { value: 'comparison', label: 'Comparison', desc: 'Who will have the higher metric?' },
    { value: 'prediction', label: 'Prediction', desc: 'Predict a specific rank or outcome' }
];

export default function CreateContest() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Auth & Categories State
    const [categories, setCategories] = useState<LunarCrushCategory[]>([]);
    const [userAddress, setUserAddress] = useState<string | null>(() => {
        if (isConnected()) {
            const userData = getLocalStorage() as { addresses?: { symbol: string; address: string }[] | { stx?: { address: string }[] } };
            if (userData?.addresses) {
                const stx = Array.isArray(userData.addresses)
                    ? userData.addresses.find((a) => a.symbol === 'STX') || userData.addresses[0]
                    : (userData.addresses as { stx?: { address: string }[] }).stx?.[0];
                return stx?.address || null;
            }
        }
        return null;
    });

    // Default to the first category available, fallback to cryptocurrencies if empty
    const [category, setCategory] = useState('cryptocurrencies');
    const [title, setTitle] = useState('');
    const [betType, setBetType] = useState<BetType>('comparison');
    const [metric, setMetric] = useState<LunarMetric>('social_dominance');
    const metricSource: MetricSource = 'coin'; // hardcoded for now or derived from category

    const [contender1Query, setContender1Query] = useState('');
    const [contender1Creator, setContender1Creator] = useState<Creator | null>(null);
    const [isSearching1, setIsSearching1] = useState(false);

    const [contender2Query, setContender2Query] = useState('');
    const [contender2Creator, setContender2Creator] = useState<Creator | null>(null);
    const [isSearching2, setIsSearching2] = useState(false);

    const [availableCreators, setAvailableCreators] = useState<Creator[]>([]);
    const [threshold, setThreshold] = useState<number | undefined>(undefined);
    const [expiresAt, setExpiresAt] = useState<number>(() => Date.now() + 24 * 60 * 60 * 1000);

    const [nowMs] = useState(() => Date.now());
    const [initialDateId] = useState(() => Date.now());

    useEffect(() => {
        fetchCategories().then(cats => {
            setCategories(cats);
            if (cats.length > 0 && category === 'cryptocurrencies') {
                setCategory(cats[0].category);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogin = async () => {
        try {
            if (isConnected()) return;
            const response = await connect();
            const addresses = (response as { addresses?: { symbol: string; address: string }[] })?.addresses;
            if (Array.isArray(addresses)) {
                const stx = addresses.find((a) => a.symbol === 'STX') || addresses[0];
                if (stx?.address) {
                    setUserAddress(stx.address);
                }
            }
        } catch (error) {
            console.error('Wallet connection failed', error);
        }
    };

    const handleLogout = () => {
        disconnect();
        setUserAddress(null);
    };

    // Fetch creators for the selected category
    useEffect(() => {
        let active = true;
        const query = category === 'cryptocurrencies' ? 'bitcoin' : category === 'premier league' ? 'football' : category;
        getTopicCreators(query).then(creators => {
            if (active) setAvailableCreators(creators);
        });
        return () => { active = false; };
    }, [category]);

    // Helper to extract the correct metric value from a creator
    const getMetricValue = (creator: Creator | null, metricType: LunarMetric): number => {
        if (!creator) return 0;
        const seed1 = creator.interactions24h || 0;
        const seed2 = creator.followers || 0;

        switch (metricType) {
            case 'interactions_24h': return seed1;
            case 'creator_followers': return seed2;
            case 'creator_rank': return creator.creatorRank || 0;
            case 'social_volume_24h': return Math.round(seed1 * 0.35); // Approx 35% of interactions are volume
            case 'social_dominance': return parseFloat((1 + (seed2 % 8) + (seed1 % 100) / 100).toFixed(1)); // Synthesize a fake dominance % (e.g. 4.2)
            case 'sentiment': return 40 + (seed2 % 50); // Fake sentiment score 40-90
            case 'galaxy_score': return 45 + ((seed1 % 55)); // Fake galaxy score 45-100
            case 'alt_rank': return 1 + (seed2 % 100); // Fake rank
            case 'topic_rank': return 1 + (seed1 % 50); // Fake rank
            default: return seed1;
        }
    };

    // Generate Preview Contest
    const previewContest: Contest = {
        id: `user-contest-${initialDateId}`,
        question: title || (betType === 'threshold'
            ? `Will ${contender1Creator ? contender1Creator.name : (contender1Query || 'A')} reach the target in ${metric}?`
            : betType === 'prediction'
                ? `Who will have the highest ${metric} tomorrow?`
                : `Will ${contender1Creator ? contender1Creator.name : (contender1Query || 'A')} beat ${contender2Creator ? contender2Creator.name : (contender2Query || 'B')} in ${metric}?`),
        category,
        betType,
        metric,
        metricLabel: METRICS_OPTIONS.find(m => m.value === metric)?.label || metric,
        metricSource,
        threshold,
        thresholdLabel: threshold ? `${threshold.toLocaleString()} ${METRICS_OPTIONS.find(m => m.value === metric)?.label || metric}` : undefined,
        status: 'active',
        winner: null,
        contenders: betType === 'threshold' ? [
            {
                label: 'Yes',
                icon: 'check',
                iconType: 'icon',
                currentValue: contender1Creator ? getMetricValue(contender1Creator, metric) : 0,
                bets: 0,
                paysOut: 2.0
            },
            {
                label: 'No',
                icon: 'close',
                iconType: 'icon',
                currentValue: contender1Creator ? getMetricValue(contender1Creator, metric) : 0,
                bets: 0,
                paysOut: 2.0
            }
        ] : [
            {
                label: contender1Creator?.name || contender1Query || (betType === 'prediction' ? 'Option 1' : 'Contender 1'),
                subLabel: contender1Creator?.handle,
                link: contender1Creator ? `https://lunarcrush.com/creators/${contender1Creator.handle.replace('@', '')}` : undefined,
                icon: contender1Creator?.avatar || 'person',
                iconType: (contender1Creator?.avatar ? 'image' : 'icon') as 'image' | 'icon',
                currentValue: contender1Creator ? getMetricValue(contender1Creator, metric) : 0,
                bets: 0,
                paysOut: 2.0
            },
            {
                label: contender2Creator?.name || contender2Query || (betType === 'prediction' ? 'Option 2' : 'Contender 2'),
                subLabel: contender2Creator?.handle,
                link: contender2Creator ? `https://lunarcrush.com/creators/${contender2Creator.handle.replace('@', '')}` : undefined,
                icon: contender2Creator?.avatar || 'person',
                iconType: (contender2Creator?.avatar ? 'image' : 'icon') as 'image' | 'icon',
                currentValue: contender2Creator ? getMetricValue(contender2Creator, metric) : 0,
                bets: 0,
                paysOut: 2.0
            }
        ],
        curatorHandle: userAddress ? userAddress.substring(0, 8) + '...' : 'Anonymous',
        createdAt: initialDateId,
        expiresAt: expiresAt,
        volume: 0,
        totalBets: 0,
        isUserGenerated: true
    };

    const handleCreate = () => {
        // Use LocalStorage to persist custom contests
        const existingString = localStorage.getItem('yade_custom_contests');
        const existingContests = existingString ? JSON.parse(existingString) : [];
        const updatedContests = [previewContest, ...existingContests];
        localStorage.setItem('yade_custom_contests', JSON.stringify(updatedContests));
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-bg-base text-text-main flex flex-col">
            <Header
                userAddress={userAddress}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
            />

            <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 w-full">

                {/* Active topic banner */}
                <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Icon name="add_circle" className="!text-3xl text-accent" />
                        <div>
                            <h2 className="text-xl font-bold text-text-main">
                                Custom Contest
                            </h2>
                            <p className="text-sm text-text-muted">Create verifiable smart-contract prediction markets</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[60fr_40fr] lg:gap-10 items-start">

                    {/* Left Column - Form Inputs */}
                    <div className="flex flex-col gap-6">
                        <div className="rounded-[24px] border border-border-subtle bg-bg-card p-6 md:p-8">

                            {/* Category Selector */}
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-text-muted mb-3">Target Category</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {categories.map((c) => (
                                        <button
                                            key={c.category}
                                            onClick={() => setCategory(c.category)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${category === c.category
                                                ? 'border-accent bg-accent/10'
                                                : 'border-border-subtle bg-bg-card-hover/20 hover:border-accent/50 hover:bg-bg-card-hover'
                                                }`}
                                        >
                                            <Icon name={c.icon} className={`!text-[24px] mb-1.5 ${category === c.category ? 'text-accent' : 'text-text-muted'}`} />
                                            <span className={`text-xs font-bold capitalize ${category === c.category ? 'text-accent' : 'text-text-muted'}`}>{c.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Setup Stepper */}
                            <div className="mb-8 flex justify-between items-center relative after:content-[''] after:absolute after:top-1/2 after:left-4 after:right-4 after:-translate-y-1/2 after:h-[1px] after:bg-border-subtle after:z-0">
                                {[
                                    { n: 1, label: 'Type' },
                                    { n: 2, label: 'Metrics' },
                                    { n: 3, label: 'Timing' }
                                ].map(s => (
                                    <div key={s.n} className="flex flex-col items-center gap-2 bg-bg-card px-2 z-10 relative">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= s.n ? 'bg-accent text-bg-base' : 'bg-bg-base text-text-muted border border-border-subtle'}`}>
                                            {step > s.n ? <Icon name="check" className="!text-[16px]" /> : s.n}
                                        </div>
                                        <span className={`text-[11px] font-semibold transition-colors ${step >= s.n ? 'text-text-main' : 'text-text-muted'}`}>{s.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Step Contents */}
                            <div className="min-h-[300px]">
                                {step === 1 && (
                                    <div className="space-y-6 slide-in">
                                        <h3 className="text-lg font-bold text-text-main mb-4 tracking-tight border-b border-border-subtle pb-2">Step 1: Basics & Type</h3>

                                        <div>
                                            <label className="block text-sm font-bold text-text-muted mb-1">Contest Question</label>
                                            <p className="text-xs text-text-muted mb-3 font-medium">This is the main headline users will see on the betting card.</p>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                                placeholder="e.g. Will Bitcoin cross 60% Social Dominance?"
                                                className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-text-main font-medium focus:outline-none focus:border-accent transition-colors"
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <label className="block text-sm font-bold text-text-muted mb-3">Contest Type</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {BET_TYPES.map(type => (
                                                    <label key={type.value} className={`cursor-pointer border rounded-2xl p-5 transition-all w-full flex flex-col gap-1 ${betType === type.value ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border-subtle bg-bg-card/40 hover:border-accent hover:bg-bg-card/60'}`}>
                                                        <input type="radio" name="betType" className="hidden" checked={betType === type.value} onChange={() => setBetType(type.value)} />
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${betType === type.value ? 'border-accent' : 'border-border-subtle'}`}>
                                                                {betType === type.value && <div className="w-2 h-2 rounded-full bg-accent" />}
                                                            </div>
                                                            <div className="font-bold text-text-main">{type.label}</div>
                                                        </div>
                                                        <div className="text-xs text-text-muted pl-6">{type.desc}</div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 slide-in">
                                        <h3 className="text-lg font-bold text-text-main mb-4 tracking-tight border-b border-border-subtle pb-2">Step 2: Metrics & Contenders</h3>

                                        <div>
                                            <label className="block text-sm font-bold text-text-muted mb-3">LunarCrush Metric</label>
                                            <div className="flex flex-wrap gap-3">
                                                {METRICS_OPTIONS.map(m => (
                                                    <button
                                                        key={m.value}
                                                        onClick={() => setMetric(m.value)}
                                                        className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${metric === m.value
                                                            ? 'bg-accent/10 border-accent text-accent shadow-[0_0_10px_rgba(255,102,0,0.15)]'
                                                            : 'bg-bg-card border-border-subtle text-text-muted hover:text-text-main hover:border-accent/40'
                                                            }`}
                                                    >
                                                        {m.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="relative border border-border-subtle rounded-xl p-4 bg-bg-base">
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="block text-sm font-bold text-text-main">
                                                        {betType === 'threshold' ? 'Target Subject' : betType === 'prediction' ? 'Option 1' : 'Contender 1'}
                                                    </label>
                                                    {contender1Creator && (
                                                        <span className="text-xs font-mono font-medium text-accent bg-accent/10 px-2 py-1 rounded">
                                                            Current: {getMetricValue(contender1Creator, metric).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                                {contender1Creator ? (
                                                    <div className="flex items-center justify-between bg-bg-card border border-accent/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-3">
                                                            {contender1Creator.avatar ? (
                                                                <img src={contender1Creator.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-border-subtle flex items-center justify-center">
                                                                    <Icon name="person" className="text-text-muted icon-sm" />
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-text-main leading-none mb-1">{contender1Creator.name}</span>
                                                                <span className="text-xs text-text-muted leading-none">{contender1Creator.handle}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setContender1Creator(null);
                                                                setContender1Query('');
                                                            }}
                                                            className="text-text-muted hover:text-accent p-1 transition-colors"
                                                            title="Remove selected contender"
                                                            aria-label="Remove selected contender"
                                                        >
                                                            <Icon name="close" className="icon-sm" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={contender1Query}
                                                            onChange={e => {
                                                                setContender1Query(e.target.value);
                                                                setContender1Creator(null);
                                                                setIsSearching1(true);
                                                            }}
                                                            onFocus={() => setIsSearching1(true)}
                                                            onBlur={() => setTimeout(() => setIsSearching1(false), 200)}
                                                            placeholder="Search creator or enter target name..."
                                                            className="w-full bg-bg-card border border-border-subtle rounded-lg p-3 text-text-main text-sm focus:outline-none focus:border-accent transition-colors"
                                                        />
                                                        <Icon name="search" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted icon-sm" />
                                                    </div>
                                                )}
                                                {isSearching1 && contender1Query && availableCreators.length > 0 && (
                                                    <div className="absolute z-10 w-full left-0 mt-2 bg-bg-card border border-border-subtle rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                        {availableCreators.filter(c =>
                                                            c.name.toLowerCase().includes(contender1Query.toLowerCase()) ||
                                                            c.handle.toLowerCase().includes(contender1Query.toLowerCase())
                                                        ).map(c => (
                                                            <div
                                                                key={c.id}
                                                                role="button"
                                                                tabIndex={0}
                                                                className="p-3 flex items-center gap-3 hover:bg-bg-card-hover cursor-pointer border-b border-border-subtle last:border-0"
                                                                onClick={() => {
                                                                    setContender1Creator(c);
                                                                    setContender1Query(c.name);
                                                                    setIsSearching1(false);
                                                                }}
                                                            >
                                                                {c.avatar ? <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-border-subtle" />}
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-semibold text-text-main leading-tight">{c.name}</span>
                                                                    <span className="text-xs text-text-muted">{c.handle}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {betType !== 'threshold' && (
                                                <div className="relative border border-border-subtle rounded-xl p-4 bg-bg-base">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <label className="block text-sm font-bold text-text-main">
                                                            {betType === 'prediction' ? 'Option 2' : 'Contender 2'}
                                                        </label>
                                                        {contender2Creator && (
                                                            <span className="text-xs font-mono font-medium text-accent bg-accent/10 px-2 py-1 rounded">
                                                                Current: {getMetricValue(contender2Creator, metric).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {contender2Creator ? (
                                                        <div className="flex items-center justify-between bg-bg-card border border-accent/50 rounded-lg p-3">
                                                            <div className="flex items-center gap-3">
                                                                {contender2Creator.avatar ? (
                                                                    <img src={contender2Creator.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-border-subtle flex items-center justify-center">
                                                                        <Icon name="person" className="text-text-muted icon-sm" />
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-text-main leading-none mb-1">{contender2Creator.name}</span>
                                                                    <span className="text-xs text-text-muted leading-none">{contender2Creator.handle}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setContender2Creator(null);
                                                                    setContender2Query('');
                                                                }}
                                                                className="text-text-muted hover:text-accent p-1 transition-colors"
                                                                title="Remove selected contender"
                                                                aria-label="Remove selected contender"
                                                            >
                                                                <Icon name="close" className="icon-sm" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={contender2Query}
                                                                onChange={e => {
                                                                    setContender2Query(e.target.value);
                                                                    setContender2Creator(null);
                                                                    setIsSearching2(true);
                                                                }}
                                                                onFocus={() => setIsSearching2(true)}
                                                                onBlur={() => setTimeout(() => setIsSearching2(false), 200)}
                                                                placeholder="Search creator..."
                                                                className="w-full bg-bg-card border border-border-subtle rounded-lg p-3 text-text-main text-sm focus:outline-none focus:border-accent transition-colors"
                                                            />
                                                            <Icon name="search" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted icon-sm" />
                                                        </div>
                                                    )}
                                                    {isSearching2 && contender2Query && availableCreators.length > 0 && (
                                                        <div className="absolute z-10 w-full left-0 mt-2 bg-bg-card border border-border-subtle rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                            {availableCreators.filter(c =>
                                                                c.name.toLowerCase().includes(contender2Query.toLowerCase()) ||
                                                                c.handle.toLowerCase().includes(contender2Query.toLowerCase())
                                                            ).map(c => (
                                                                <div
                                                                    key={c.id}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    className="p-3 flex items-center gap-3 hover:bg-bg-card-hover cursor-pointer border-b border-border-subtle last:border-0"
                                                                    onClick={() => {
                                                                        setContender2Creator(c);
                                                                        setContender2Query(c.name);
                                                                        setIsSearching2(false);
                                                                    }}
                                                                >
                                                                    {c.avatar ? <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-border-subtle" />}
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-semibold text-text-main leading-tight">{c.name}</span>
                                                                        <span className="text-xs text-text-muted">{c.handle}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {(betType === 'race' || betType === 'threshold') && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-bold text-text-muted mb-2">Threshold Value</label>
                                                <input
                                                    type="number"
                                                    value={threshold || ''}
                                                    onChange={e => setThreshold(Number(e.target.value))}
                                                    placeholder="e.g. 1000000"
                                                    className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-text-main font-medium focus:outline-none focus:border-accent transition-colors"
                                                />
                                            </div>
                                        )}

                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 slide-in">
                                        <h3 className="text-lg font-bold text-text-main mb-4 tracking-tight border-b border-border-subtle pb-2">Step 3: Timing</h3>
                                        <div>
                                            <label htmlFor="expiresInput" className="block text-sm font-bold text-text-muted mb-2">Contest Deadline</label>
                                            <input
                                                id="expiresInput"
                                                type="datetime-local"
                                                value={new Date(expiresAt - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                                min={new Date(nowMs - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                                onChange={e => {
                                                    if (e.target.value) {
                                                        const newDate = new Date(e.target.value);
                                                        if (newDate.getTime() > Date.now()) {
                                                            setExpiresAt(newDate.getTime());
                                                        }
                                                    }
                                                }}
                                                className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-text-main focus:outline-none focus:border-accent font-bold"
                                            />
                                            <div className="mt-6 p-5 rounded-2xl bg-accent/5 border border-accent/20">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0">
                                                        <Icon name="schedule" className="!text-2xl" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-text-main">
                                                            {new Date(expiresAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </p>
                                                        <p className="text-sm font-semibold text-text-muted mt-1">
                                                            Resolves exactly at {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-text-muted mt-4 bg-bg-base p-4 rounded-xl border border-border-subtle">
                                                The system will automatically verify the LunarCrush API metrics at this exact deadline to determine the absolute result based on verifiable blockchain logic.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-8 flex items-center justify-between border-t border-border-subtle pt-6">
                                    <button
                                        onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
                                        className="px-6 py-2.5 rounded-xl border border-border-subtle text-text-main font-bold hover:bg-bg-card-hover transition-colors text-sm"
                                    >
                                        {step === 1 ? 'Cancel' : 'Back'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (step < 3) {
                                                setStep(step + 1);
                                            } else {
                                                handleCreate();
                                            }
                                        }}
                                    >
                                        {step === 3 ? 'Deploy Contest' : 'Continue'}
                                        {step < 3 && <Icon name="arrow_forward" className="!text-[18px]" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Live Preview */}
                    <div className="flex flex-col gap-4 sticky top-[100px]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon name="visibility" className="text-text-muted" />
                                <h3 className="text-sm font-bold text-text-muted tracking-tight">Live Setup Preview</h3>
                            </div>
                            <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">Real-time</span>
                        </div>
                        <div className="pointer-events-none w-full">
                            <ContestCard
                                contest={previewContest}
                                selectedOption={null}
                                onSelectOption={() => { }}
                                isPreview={true}
                            />
                        </div>
                        <div className="bg-bg-card rounded-xl p-4 border border-border-subtle text-xs text-text-muted font-medium mt-2 flex gap-3">
                            <Icon name="info" className="text-accent shrink-0 mt-0.5 !text-[16px]" />
                            <p className="leading-relaxed">
                                By deploying this contest, you act as the initial liquidity provider. Your connected wallet will sign the smart contract. The resolution source is immutable after deployment.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
