import * as groupsRepo from '@/lib/repositories/groups.repository';
import * as expensesRepo from '@/lib/repositories/expenses.repository';
import { calculateSettlement } from '@/lib/settlement';
import type { Group, Expense, Settlement } from '@/lib/types';

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function createGroup(
  name: string
): Promise<ServiceResult<{ slug: string }>> {
  if (!name || name.trim().length === 0) {
    return { ok: false, error: 'El nombre del grupo es obligatorio', status: 400 };
  }
  const slug = slugify(name);
  if (slug.length === 0) {
    return { ok: false, error: 'Nombre de grupo no válido', status: 400 };
  }
  try {
    await groupsRepo.insertGroup(slug);
    return { ok: true, data: { slug } };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      return { ok: false, error: 'Ya existe un grupo con ese nombre', status: 409 };
    }
    return { ok: false, error: 'Error al crear el grupo', status: 500 };
  }
}

export async function getGroup(name: string): Promise<ServiceResult<Group>> {
  const group = await groupsRepo.findGroupByName(name);
  if (!group) {
    return { ok: false, error: 'Grupo no encontrado', status: 404 };
  }
  return { ok: true, data: group };
}

export async function addMember(
  groupName: string,
  memberName: string
): Promise<ServiceResult<void>> {
  if (!memberName || memberName.trim().length === 0) {
    return { ok: false, error: 'El nombre del miembro es obligatorio', status: 400 };
  }
  const found = await groupsRepo.addMemberToGroup(groupName, memberName.trim());
  if (!found) {
    return { ok: false, error: 'Grupo no encontrado', status: 404 };
  }
  return { ok: true, data: undefined };
}

export async function addExpense(
  groupName: string,
  paidBy: string,
  amount: number,
  description: string
): Promise<ServiceResult<void>> {
  if (!paidBy || !description?.trim()) {
    return { ok: false, error: 'Todos los campos son obligatorios', status: 400 };
  }
  if (isNaN(amount) || amount <= 0) {
    return { ok: false, error: 'El importe debe ser un número positivo', status: 400 };
  }
  const group = await groupsRepo.findGroupByName(groupName);
  if (!group) {
    return { ok: false, error: 'Grupo no encontrado', status: 404 };
  }
  if (!group.members.includes(paidBy)) {
    return { ok: false, error: 'La persona debe ser miembro del grupo', status: 400 };
  }
  await expensesRepo.insertExpense({
    groupId: group._id!,
    paidBy,
    amount: Math.round(amount * 100) / 100,
    description: description.trim(),
  });
  return { ok: true, data: undefined };
}

export async function getExpenses(
  groupName: string
): Promise<ServiceResult<Expense[]>> {
  const group = await groupsRepo.findGroupByName(groupName);
  if (!group) {
    return { ok: false, error: 'Grupo no encontrado', status: 404 };
  }
  const expenses = await expensesRepo.findExpensesByGroupId(group._id!);
  return { ok: true, data: expenses };
}

export async function getSettlement(
  groupName: string
): Promise<ServiceResult<Settlement[]>> {
  const group = await groupsRepo.findGroupByName(groupName);
  if (!group) {
    return { ok: false, error: 'Grupo no encontrado', status: 404 };
  }
  const expenses = await expensesRepo.findExpensesByGroupId(group._id!);
  const settlements = calculateSettlement(group.members, expenses);
  return { ok: true, data: settlements };
}
