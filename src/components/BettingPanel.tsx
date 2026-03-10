import { useState, useMemo } from 'react';
import type { BetMarket } from '../types';
import Icon from './Icon';
import { calculateBetSummary } from '../services/feeCalculator';

interface BettingPanelProps {
    market: BetMarket | null;
    selectedOptionLabel: string | null;
    onClearSelection: () => void;
}

type CryptoType = 'USDC' | 'STX' | 'sBTC';
const cryptoRates: Record<CryptoType, number> = {
    USDC: 1,
    STX: 2.50,
    sBTC: 100000,
};

export default function BettingPanel({ market, selectedOptionLabel, onClearSelection }: BettingPanelProps) {
    const [amountUSD, setAmountUSD] = useState<string>('');
    const [crypto, setCrypto] = useState<CryptoType>('USDC');
    const [isBuy, setIsBuy] = useState(true);

    const selectedOption = useMemo(() => {
        if (!market || !selectedOptionLabel) return null;
        return market.options.find(o => o.label === selectedOptionLabel);
    }, [market, selectedOptionLabel]);

    const numericAmount = parseFloat(amountUSD) || 0;
    const cryptoAmount = useMemo(() => {
        return (numericAmount / cryptoRates[crypto]).toFixed(crypto === 'sBTC' ? 8 : 2);
    }, [numericAmount, crypto]);

    const betSummary = useMemo(() => {
        if (!selectedOption || numericAmount <= 0) return null;
        return calculateBetSummary(numericAmount, selectedOption.odds);
    }, [numericAmount, selectedOption]);

    // Empty state
    if (!market || !selectedOptionLabel || !selectedOption) {
        return (
            <div className="rounded-[20px] border border-border-subtle bg-bg-card p-5 sticky top-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center mb-4">
                        <Icon name="touch_app" className="icon-lg text-text-muted/40" />
                    </div>
                    <h4 className="text-sm font-bold text-text-muted mb-1">Select a Market</h4>
                    <p className="text-xs text-text-muted/60 max-w-[200px]">
                        Click on a bet option (Yes/No or a team) to start placing your order.
                    </p>
                </div>
            </div>
        );
    }

    const activeTextColor =
        selectedOptionLabel === 'Yes' ? 'text-yes' :
            selectedOptionLabel === 'No' ? 'text-no' :
                'text-accent';

    return (
        <div className="rounded-[20px] border border-border-subtle bg-bg-card p-4 sticky top-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center shrink-0">
                    <Icon
                        name={market.category === 'NBA' ? 'sports_basketball' : market.category === 'NFL' ? 'sports_football' : 'flag'}
                        className="icon-md text-text-muted"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-text-muted text-[11px] font-medium leading-tight mb-0.5 truncate">{market.question}</h3>
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className={`text-xs font-bold ${activeTextColor}`}>Buy {selectedOptionLabel}</span>
                        <span className="text-text-muted font-bold opacity-40">·</span>
                        <span className="text-text-main text-xs font-bold truncate">{market.category || 'Sports'}</span>
                    </div>
                </div>
                <button
                    onClick={onClearSelection}
                    aria-label="Clear selection"
                    className="text-text-muted hover:text-text-main transition-colors p-1"
                >
                    <Icon name="close" className="!text-lg" />
                </button>
            </div>

            <div className="flex items-center justify-between mb-3">
                <div className="flex bg-bg-surface rounded-xl p-1 border border-border-subtle">
                    <button
                        onClick={() => setIsBuy(true)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isBuy ? 'bg-yes/15 text-yes' : 'text-text-muted hover:text-text-main'}`}
                    >
                        Buy
                    </button>
                    <button
                        onClick={() => setIsBuy(false)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!isBuy ? 'bg-no/15 text-no' : 'text-text-muted hover:text-text-main'}`}
                    >
                        Sell
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-bg-surface rounded-2xl p-1 border border-border-subtle">
                    {(['USDC', 'STX', 'sBTC'] as CryptoType[]).map((c) => (
                        <button
                            key={c}
                            onClick={() => setCrypto(c)}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all ${crypto === c ? 'bg-bg-card-hover text-text-main' : 'text-text-muted hover:text-text-main'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Option Buttons */}
            <div className="flex flex-col gap-2 mb-3">
                {(market.options.length <= 2 ? market.options : [selectedOption]).map(opt => {
                    if (!opt) return null;
                    const isActive = selectedOptionLabel === opt.label;

                    let colorClass = 'text-accent';
                    let borderClass = 'border-accent bg-accent/5';

                    if (opt.label === 'Yes') {
                        colorClass = 'text-yes';
                        borderClass = 'border-yes bg-yes/5';
                    } else if (opt.label === 'No') {
                        colorClass = 'text-no';
                        borderClass = 'border-no bg-no/5';
                    }

                    return (
                        <div
                            key={opt.label}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all ${isActive
                                ? borderClass
                                : 'border-border-subtle opacity-50'
                                }`}
                        >
                            <span className={`text-sm font-black flex-1 min-w-0 truncate ${isActive ? colorClass : 'text-text-muted'}`} title={opt.label}>{opt.label}</span>
                            <span className={`text-sm font-black shrink-0 ${isActive ? colorClass : 'text-text-muted/60'}`}>{opt.odds}%</span>
                        </div>
                    );
                })}
            </div>

            {/* Amount Input */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-3.5 focus-within:border-accent/50 transition-all mb-3">
                <div className="flex items-center justify-between mb-0.5">
                    <span className="text-text-muted font-semibold text-[10px] tracking-tight">{crypto === 'USDC' ? 'Dollars' : crypto}</span>
                    <span className="text-text-muted font-bold text-xl opacity-20">$</span>
                </div>
                <input
                    type="number"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent border-none p-0 text-text-main text-3xl font-black outline-none focus:outline-none focus:ring-0 placeholder-text-muted/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="mt-3 pt-3 border-t border-border-subtle/50 flex items-center justify-between">
                    <span className="text-yes text-[10px] font-bold">Earn 3.25% Interest</span>
                    <span className="text-text-muted text-[10px] font-medium">Available: $25,480.00</span>
                </div>
            </div>

            {/* Fee breakdown */}
            <div className="space-y-2 px-1 mb-3">
                <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] font-medium">Contracts</span>
                    <span className="text-text-main text-xs font-bold">{betSummary?.contracts ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] font-medium">Conversion</span>
                    <span className="text-text-main text-xs font-bold">{cryptoAmount} {crypto}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] font-medium">Fee</span>
                    <span className="text-fee text-xs font-bold">${betSummary?.fee.toFixed(2) ?? '0.00'}</span>
                </div>
                <div className="border-t border-border-subtle/50 pt-2 flex items-center justify-between">
                    <span className="text-text-muted text-[10px] font-medium">Total</span>
                    <span className="text-text-main text-sm font-bold">${betSummary?.total.toFixed(2) ?? '0.00'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] font-medium">Potential Payout</span>
                    <span className="text-yes font-bold text-lg">${betSummary?.potentialPayout.toFixed(2) ?? '0.00'}</span>
                </div>
            </div>

            {/* Buy/Sell Button */}
            <button
                onClick={() => numericAmount > 0 && onClearSelection()}
                disabled={numericAmount <= 0}
                className={`w-full py-3 rounded-xl text-sm font-black transition-all transform active:scale-[0.98] ${numericAmount > 0
                    ? (isBuy ? 'bg-yes text-black hover:bg-yes/90' : 'bg-no text-black hover:bg-no/90')
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
            >
                {isBuy ? 'Buy' : 'Sell'}
            </button>
        </div>
    );
}
