import { notFound } from 'next/navigation';
import { getDb } from '@/lib/mongodb';
import { calculateSettlement } from '@/lib/settlement';
import { Expense } from '@/lib/types';
import AddMemberForm from '@/app/components/AddMemberForm';
import AddExpenseForm from '@/app/components/AddExpenseForm';
import SettlementPanel from '@/app/components/SettlementPanel';
import ExpenseList from '@/app/components/ExpenseList';
import Link from 'next/link';

export default async function GroupPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const db = await getDb();

  const group = await db.collection('groups').findOne({ name });
  if (!group) {
    notFound();
  }

  const expenses = (await db
    .collection('expenses')
    .find({ groupId: group._id })
    .sort({ createdAt: -1 })
    .toArray()) as unknown as Expense[];

  const settlements = calculateSettlement(group.members, expenses);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const expensesForDisplay = expenses.map((e) => ({
    _id: String(e._id),
    paidBy: e.paidBy,
    amount: e.amount,
    description: e.description,
    createdAt: String(e.createdAt),
  }));

  return (
    <div className="mx-auto w-full max-w-4xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            &larr; Inicio
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{group.name}</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total gastos</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalExpenses.toFixed(2)} &euro;
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Members */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Miembros ({group.members.length})
          </h2>
          {group.members.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {group.members.map((member: string) => (
                <span
                  key={member}
                  className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {member}
                </span>
              ))}
            </div>
          )}
          <AddMemberForm groupName={name} />
        </div>

        {/* Settlement */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Liquidacion
          </h2>
          <SettlementPanel settlements={settlements} />
        </div>
      </div>

      {/* Expenses */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Gastos</h2>
        <AddExpenseForm groupName={name} members={group.members} />
        <div className="mt-4">
          <ExpenseList expenses={expensesForDisplay} />
        </div>
      </div>
    </div>
  );
}
