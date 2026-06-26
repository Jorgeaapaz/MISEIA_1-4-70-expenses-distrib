import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/services/groups.service', () => ({
  createGroup: vi.fn(),
  addMember: vi.fn(),
  addExpense: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { addMember, addExpense } from '../app/actions';
import * as groupsService from '@/lib/services/groups.service';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('addMember', () => {
  it('returns error when service reports failure', async () => {
    (groupsService.addMember as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      error: 'El nombre del miembro es obligatorio',
      status: 400,
    });
    const formData = new FormData();
    formData.append('memberName', '');
    const result = await addMember('test-group', null, formData);
    expect(result).toEqual({ error: 'El nombre del miembro es obligatorio' });
  });

  it('returns success when service succeeds', async () => {
    (groupsService.addMember as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      data: undefined,
    });
    const formData = new FormData();
    formData.append('memberName', 'Alice');
    const result = await addMember('test-group', null, formData);
    expect(result).toEqual({ success: true });
  });
});

describe('addExpense', () => {
  it('returns error when service reports validation failure', async () => {
    (groupsService.addExpense as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      error: 'El importe debe ser un número positivo',
      status: 400,
    });
    const formData = new FormData();
    formData.append('paidBy', 'Alice');
    formData.append('amount', '-10');
    formData.append('description', 'Test');
    const result = await addExpense('test-group', null, formData);
    expect(result).toEqual({ error: 'El importe debe ser un número positivo' });
  });

  it('passes parsed float amount to the service', async () => {
    (groupsService.addExpense as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      data: undefined,
    });
    const formData = new FormData();
    formData.append('paidBy', 'Alice');
    formData.append('amount', '42.50');
    formData.append('description', 'Hotel');
    await addExpense('test-group', null, formData);
    expect(groupsService.addExpense).toHaveBeenCalledWith(
      'test-group',
      'Alice',
      42.5,
      'Hotel'
    );
  });
});
