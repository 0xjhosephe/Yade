// ─── Kalshi-style Fee Calculator ───
// Formula: fee = roundUp(0.07 × C × P × (1 − P))
// P = contract price (0.01–0.99), derived from odds percentage
// C = number of contracts

export type FeeType = 'taker' | 'maker' | 'special';

const FEE_COEFFICIENTS: Record<FeeType, number> = {
    taker: 0.07,
    maker: 0.0175,
    special: 0.035,
};

/**
 * Round up to the nearest cent (Kalshi rounding rule).
 */
function roundUpToCent(value: number): number {
    return Math.ceil(value * 100) / 100;
}

/**
 * Calculate the raw fee for a given number of contracts and price.
 * @param contracts Number of contracts (C)
 * @param price     Price per contract in dollars (P), between 0.01 and 0.99
 * @param type      Fee type — defaults to 'taker'
 */
export function calculateFee(
    contracts: number,
    price: number,
    type: FeeType = 'taker'
): number {
    if (contracts <= 0 || price <= 0 || price >= 1) return 0;
    const coefficient = FEE_COEFFICIENTS[type];
    return roundUpToCent(coefficient * contracts * price * (1 - price));
}

/**
 * Derive number of contracts from a USD amount and odds percentage.
 * Each contract costs P dollars, so contracts = floor(amount / P).
 * @param amountUSD Total dollars the user wants to spend
 * @param price     Price per contract in dollars (P)
 */
export function calculateContracts(amountUSD: number, price: number): number {
    if (amountUSD <= 0 || price <= 0 || price >= 1) return 0;
    return Math.floor(amountUSD / price);
}

/**
 * Full bet summary including fee breakdown.
 * @param amountUSD Total dollars the user wants to bet
 * @param oddsPercent Odds as percentage (0–100), e.g. 65 for 65%
 * @param type Fee type — defaults to 'taker'
 */
export function calculateBetSummary(
    amountUSD: number,
    oddsPercent: number,
    type: FeeType = 'taker'
) {
    const price = oddsPercent / 100; // Convert 65% → 0.65
    const contracts = calculateContracts(amountUSD, price);
    const subtotal = roundUpToCent(contracts * price);
    const fee = calculateFee(contracts, price, type);
    const total = roundUpToCent(subtotal + fee);
    // Each contract pays out $1 if the bet wins
    const potentialPayout = contracts * 1;
    const potentialProfit = roundUpToCent(potentialPayout - total);

    return {
        contracts,
        pricePerContract: price,
        subtotal,
        fee,
        total,
        potentialPayout,
        potentialProfit,
    };
}
