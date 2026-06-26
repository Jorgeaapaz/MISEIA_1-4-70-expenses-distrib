'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as groupsService from '@/lib/services/groups.service';

export async function createGroup(_prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string;
  const result = await groupsService.createGroup(name);
  if (!result.ok) return { error: result.error };
  revalidatePath('/');
  redirect(`/group/${result.data.slug}`);
}

export async function addMember(groupName: string, _prevState: unknown, formData: FormData) {
  const memberName = formData.get('memberName') as string;
  const result = await groupsService.addMember(groupName, memberName);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/group/${groupName}`);
  return { success: true };
}

export async function addExpense(groupName: string, _prevState: unknown, formData: FormData) {
  const paidBy = formData.get('paidBy') as string;
  const amountStr = formData.get('amount') as string;
  const description = formData.get('description') as string;
  const amount = parseFloat(amountStr);
  const result = await groupsService.addExpense(groupName, paidBy, amount, description);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/group/${groupName}`);
  return { success: true };
}
