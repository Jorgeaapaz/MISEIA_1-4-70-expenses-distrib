'use client';

import { useActionState, useRef, useEffect } from 'react';
import { addExpense } from '@/app/actions';

export default function AddExpenseForm({
  groupName,
  members,
}: {
  groupName: string;
  members: string[];
}) {
  const addExpenseBound = addExpense.bind(null, groupName);
  const [state, formAction, isPending] = useActionState(addExpenseBound, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && 'success' in state) {
      formRef.current?.reset();
    }
  }, [state]);

  if (members.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        Añade miembros al grupo para poder registrar gastos.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <select
          name="paidBy"
          required
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Pagado por...</option>
          {members.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="amount"
          placeholder="Importe"
          step="0.01"
          min="0.01"
          required
          disabled={isPending}
          className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          name="description"
          placeholder="Descripción"
          required
          disabled={isPending}
          className="flex-1 min-w-[150px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isPending ? 'Añadiendo...' : 'Añadir gasto'}
        </button>
      </div>
      {state && 'error' in state && (
        <p className="text-red-500 text-xs">{state.error}</p>
      )}
    </form>
  );
}
