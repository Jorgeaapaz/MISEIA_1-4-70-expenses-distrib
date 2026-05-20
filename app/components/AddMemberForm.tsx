'use client';

import { useActionState, useRef, useEffect } from 'react';
import { addMember } from '@/app/actions';

export default function AddMemberForm({ groupName }: { groupName: string }) {
  const addMemberBound = addMember.bind(null, groupName);
  const [state, formAction, isPending] = useActionState(addMemberBound, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && 'success' in state) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-2">
      <input
        type="text"
        name="memberName"
        placeholder="Nombre de la persona"
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        required
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isPending ? 'Añadiendo...' : 'Añadir'}
      </button>
      {state && 'error' in state && (
        <p className="text-red-500 text-xs self-center">{state.error}</p>
      )}
    </form>
  );
}
