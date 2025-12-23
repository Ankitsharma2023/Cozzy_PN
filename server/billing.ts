import { logger } from "./logger";

export interface SettlementResult {
    cost: number;
    x4pnReward: number;
    actualTimeElapsed: number;
}

export function calculateSettlement(
    ratePerSecond: number,
    lastSettledAt: Date,
    now: Date = new Date(),
    maxBalance?: number
): SettlementResult {
    const timeElapsed = Math.max(0, Math.floor((now.getTime() - lastSettledAt.getTime()) / 1000));
    let cost = ratePerSecond * timeElapsed;

    // Cap to available balance if provided
    if (maxBalance !== undefined && cost > maxBalance) {
        cost = Math.max(0, maxBalance);
    }

    // Ensure non-negative
    if (cost < 0) cost = 0;

    const x4pnReward = cost * 10;
    const actualTimeElapsed = ratePerSecond > 0 ? Math.floor(cost / ratePerSecond) : 0;

    return {
        cost,
        x4pnReward,
        actualTimeElapsed
    };
}
