'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NavigateToGroup() {
  const [name, setName] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (slug) {
      router.push(`/group/${slug}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del grupo"
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        required
      />
      <button
        type="submit"
        className="rounded-lg bg-gray-700 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors cursor-pointer"
      >
        Ir
      </button>
    </form>
  );
}
