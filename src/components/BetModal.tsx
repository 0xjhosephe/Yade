import { useState, useMemo } from 'react';
import type { BetMarket } from '../types';
import Icon from './Icon';
import { calculateBetSummary } from '../services/feeCalculator';

interface BetModalProps {
    isOpen: boolean;
    onClose: () => void;
    market: BetMarket | null;
    selectedOptionLabel: string | null;
    themeColor: string; // Tailwind color class like 'bg-yes', 'bg-no', or 'bg-accent'
}

type CryptoType = 'USDC' | 'STX' | 'sBTC';
const cryptoRates: Record<CryptoType, number> = {
    USDC: 1,
    STX: 2.50, // 1 STX = $2.50
    sBTC: 100000, // 1 sBTC = $100k
};

export default function BetModal({ isOpen, onClose, market, selectedOptionLabel, themeColor }: BetModalProps) {
    const [amountUSD, setAmountUSD] = useState<string>('');
    const [crypto, setCrypto] = useState<CryptoType>('USDC');
    const [isBuy, setIsBuy] = useState(true);
    const selectedOption = useMemo(() => {
        if (!market || !selectedOptionLabel) return null;
        return market.options.find(o => o.label === selectedOptionLabel);
    }, [market, selectedOptionLabel]);

    // Calculate payouts with Kalshi-style fees
    const numericAmount = parseFloat(amountUSD) || 0;
    const cryptoAmount = useMemo(() => {
        return (numericAmount / cryptoRates[crypto]).toFixed(crypto === 'sBTC' ? 8 : 2);
    }, [numericAmount, crypto]);

    const betSummary = useMemo(() => {
        if (!selectedOption || numericAmount <= 0) return null;
        return calculateBetSummary(numericAmount, selectedOption.odds);
    }, [numericAmount, selectedOption]);

    if (!isOpen || !market || !selectedOptionLabel || !selectedOption) return null;
    // Theme derived colors
    const activeTextColor = themeColor.replace('bg-', 'text-');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Click-away backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div
                className="w-full max-w-[360px] rounded-[32px] border border-border-subtle bg-bg-card relative flex flex-col animate-in zoom-in-95 duration-200"
            >

                {/* Header Section (Logo + Event) */}
                <div className="p-3.5 pb-2 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center shrink-0">
                        {/* Default icon or icon based on category */}
                        <Icon
                            name={market.category === 'NBA' ? 'sports_basketball' : market.category === 'NFL' ? 'sports_football' : 'flag'}
                            className="icon-md text-text-muted"
                        />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-text-muted text-[11px] font-medium leading-tight mb-0.5 truncate">{market.question}</h3>
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className={`text-xs font-bold ${activeTextColor}`}>Buy {selectedOptionLabel}</span>
                            <span className="text-text-muted font-bold opacity-40">·</span>
                            <span className="text-text-main text-xs font-bold truncate">{market.category || 'Sports'}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="text-text-muted hover:text-text-main transition-colors p-1"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-3.5 flex items-center justify-between mb-3">
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
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${crypto === c ? 'bg-bg-card-hover text-text-main' : 'text-text-muted hover:text-text-main'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Option Display (Context Aware) */}
                <div className="px-3.5 flex flex-col gap-2 mb-3">
                    {(market.options.length <= 2 ? market.options : [selectedOption]).map(opt => {
                        if (!opt) return null;
                        const isSelected = selectedOptionLabel === opt.label;

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
                            <div key={opt.label} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all ${isSelected ? borderClass : 'border-border-subtle opacity-50'}`}>
                                <span className={`text-sm font-black truncate flex-1 min-w-0 ${isSelected ? colorClass : 'text-text-muted'}`} title={opt.label}>
                                    {opt.label}
                                </span>
                                <span className={`text-sm font-black shrink-0 ${isSelected ? colorClass : 'text-text-muted/60'}`}>
                                    {opt.odds}%
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="px-3.5 mb-3">
                    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-3.5 focus-within:border-brand-lemon/50 transition-all">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-text-muted font-semibold text-[10px] tracking-tight">{crypto === 'USDC' ? 'Dollars' : crypto}</span>
                            <div className="flex flex-col items-end">
                                <span className="text-text-muted font-bold text-xl opacity-20">$</span>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={amountUSD}
                            onChange={(e) => setAmountUSD(e.target.value)}
                            placeholder="0"
                            autoFocus
                            className="w-full bg-transparent border-none p-0 text-text-main text-4xl font-black outline-none focus:outline-none focus:ring-0 placeholder-text-muted/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="mt-3 pt-3 border-t border-border-subtle/50 flex items-center justify-between">
                            <span className="text-yes text-[10px] font-bold">Earn 3.25% Interest</span>
                            <span className="text-text-muted text-[10px] font-medium">Available: $25,480.00</span>
                        </div>
                    </div>
                </div>

                {/* Subtext and Main Button */}
                <div className="p-3.5 pt-0 mt-auto">
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

                    <button
                        onClick={() => numericAmount > 0 && onClose()}
                        disabled={numericAmount <= 0}
                        className={`w-full py-3 rounded-xl text-sm font-black transition-all transform active:scale-[0.98] ${numericAmount > 0 ? (isBuy ? 'bg-yes text-black hover:bg-yes/90' : 'bg-no text-black hover:bg-no/90') : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                    >
                        {isBuy ? 'Buy' : 'Sell'}
                    </button>
                </div>
            </div>
        </div>
    );
}
