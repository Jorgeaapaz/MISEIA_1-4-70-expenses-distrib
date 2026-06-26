import { describe, it, expect } from 'vitest';
import { calculateSettlement } from '../lib/settlement';
import type { Expense } from '../lib/types';

const mkExpense = (paidBy: string, amount: number): Expense =>
  ({ paidBy, amount }) as unknown as Expense;

describe('calculateSettlement', () => {
  it('returns empty array when members list is empty', () => {
    expect(calculateSettlement([], [mkExpense('Alice', 100)])).toEqual([]);
  });

  it('returns empty array when expenses list is empty', () => {
    expect(calculateSettlement(['Alice', 'Bob'], [])).toEqual([]);
  });

  it('returns empty array for single member who paid everything', () => {
    const result = calculateSettlement(['Alice'], [mkExpense('Alice', 100)]);
    expect(result).toEqual([]);
  });

  it('calculates simple two-person settlement', () => {
    const result = calculateSettlement(
      ['Alice', 'Bob'],
      [mkExpense('Alice', 100)]
    );
    expect(result).toEqual([{ from: 'Bob', to: 'Alice', amount: 50 }]);
  });

  it('returns empty array when expenses are perfectly balanced', () => {
    const result = calculateSettlement(
      ['Alice', 'Bob'],
      [mkExpense('Alice', 50), mkExpense('Bob', 50)]
    );
    expect(result).toEqual([]);
  });

  it('minimizes transactions for three members', () => {
    const result = calculateSettlement(
      ['Alice', 'Bob', 'Charlie'],
      [mkExpense('Alice', 90), mkExpense('Bob', 30)]
    );
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('computes correct amounts for three-member scenario', () => {
    // Alice pays 90, Bob pays 30, Charlie pays 0. Total 120, share 40.
    // Alice: balance +50 (creditor); Bob: balance -10 (debtor); Charlie: balance -40 (debtor)
    const result = calculateSettlement(
      ['Alice', 'Bob', 'Charlie'],
      [mkExpense('Alice', 90), mkExpense('Bob', 30)]
    );
    const total = result.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBeCloseTo(50, 1);
    expect(result.every(s => s.to === 'Alice')).toBe(true);
  });

  it('rounds amounts to 2 decimal places', () => {
    // 100 / 3 = 33.333... — expect no unrounded values
    const result = calculateSettlement(
      ['Alice', 'Bob', 'Charlie'],
      [mkExpense('Alice', 100)]
    );
    result.forEach(s => {
      expect(s.amount).toBe(Math.round(s.amount * 100) / 100);
    });
  });

  it('handles unequal multi-payer scenario without excess transfers', () => {
    const result = calculateSettlement(
      ['Alice', 'Bob', 'Charlie'],
      [mkExpense('Alice', 60), mkExpense('Bob', 60)]
    );
    // Each pays 40, Alice and Bob each overpaid by 20; Charlie owes 40
    expect(result.length).toBe(2);
  });
});
