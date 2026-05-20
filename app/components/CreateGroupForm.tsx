'use client';

import { useActionState } from 'react';
import { createGroup } from '@/app/actions';

export default function CreateGroupForm() {
  const [state, formAction, isPending] = useActionState(createGroup, null);

  return (
    <form action={formAction} className="flex gap-2">
      <input
        type="text"
        name="name"
        placeholder="Nombre del grupo"
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        required
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isPending ? 'Creando...' : 'Crear'}
      </button>
      {state && 'error' in state && (
        <p className="text-red-500 text-xs self-center">{state.error}</p>
      )}
    </form>
  );
}
