import { Expense, Settlement } from './types';

export function calculateSettlement(
  members: string[],
  expenses: Expense[]
): Settlement[] {
  if (members.length === 0 || expenses.length === 0) return [];

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const share = total / members.length;

  const paid: Record<string, number> = {};
  for (const member of members) {
    paid[member] = 0;
  }
  for (const expense of expenses) {
    paid[expense.paidBy] = (paid[expense.paidBy] || 0) + expense.amount;
  }

  const creditors: { name: string; amount: number }[] = [];
  const debtors: { name: string; amount: number }[] = [];

  for (const member of members) {
    const balance = Math.round(((paid[member] || 0) - share) * 100) / 100;
    if (balance > 0.01) {
      creditors.push({ name: member, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ name: member, amount: -balance });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const transfer = Math.min(creditors[i].amount, debtors[j].amount);
    const rounded = Math.round(transfer * 100) / 100;

    if (rounded > 0) {
      settlements.push({
        from: debtors[j].name,
        to: creditors[i].name,
        amount: rounded,
      });
    }

    creditors[i].amount -= transfer;
    debtors[j].amount -= transfer;

    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return settlements;
}
