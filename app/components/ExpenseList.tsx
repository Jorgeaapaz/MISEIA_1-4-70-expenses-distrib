import { Expense } from '@/lib/types';

interface ExpenseDisplay {
  _id: string;
  paidBy: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function ExpenseList({ expenses }: { expenses: ExpenseDisplay[] }) {
  if (expenses.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic text-center py-4">
        No hay gastos registrados todavia.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-600">
            <th className="pb-2 font-medium">Descripcion</th>
            <th className="pb-2 font-medium">Pagado por</th>
            <th className="pb-2 font-medium text-right">Importe</th>
            <th className="pb-2 font-medium text-right">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense._id} className="border-b border-gray-100">
              <td className="py-2">{expense.description}</td>
              <td className="py-2">
                <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {expense.paidBy}
                </span>
              </td>
              <td className="py-2 text-right font-medium">
                {expense.amount.toFixed(2)} &euro;
              </td>
              <td className="py-2 text-right text-gray-500">
                {new Date(expense.createdAt).toLocaleDateString('es-ES')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
