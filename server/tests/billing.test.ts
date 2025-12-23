import { describe, it, expect } from 'vitest';
import { calculateSettlement } from '../billing';

describe('Billing Logic', () => {
    const ratePerSecond = 0.01; // $0.01 per second
    const START_TIME = new Date('2024-01-01T12:00:00Z');

    it('should calculate cost correctly for elapsed time', () => {
        const now = new Date(START_TIME.getTime() + 60000); // 60 seconds later
        const result = calculateSettlement(ratePerSecond, START_TIME, now);

        expect(result.cost).toBeCloseTo(0.60); // 0.01 * 60
        expect(result.actualTimeElapsed).toBe(60);
        expect(result.x4pnReward).toBeCloseTo(6.0); // 0.60 * 10
    });

    it('should return 0 cost if no time elapsed', () => {
        const result = calculateSettlement(ratePerSecond, START_TIME, START_TIME);
        expect(result.cost).toBe(0);
    });

    it('should cap cost to maxBalance', () => {
        const now = new Date(START_TIME.getTime() + 100000); // 100 seconds = $1.00
        const maxBalance = 0.50; // Only have $0.50

        const result = calculateSettlement(ratePerSecond, START_TIME, now, maxBalance);

        expect(result.cost).toBe(0.50);
        expect(result.actualTimeElapsed).toBe(50); // Should only pay for 50s
    });

    it('should handle negative time gracefull (clock skew)', () => {
        const past = new Date(START_TIME.getTime() - 1000);
        const result = calculateSettlement(ratePerSecond, START_TIME, past);
        expect(result.cost).toBe(0);
        expect(result.actualTimeElapsed).toBe(0);
    });
});
