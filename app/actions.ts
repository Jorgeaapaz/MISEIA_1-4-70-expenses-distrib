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

export async function addMember(_prevState: unknown, formData: FormData) {
  const groupName = formData.get('groupName') as string;
  const memberName = formData.get('memberName') as string;
  if (!groupName) return { error: 'Group name is required' };
  const result = await groupsService.addMember(groupName, memberName);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/group/${groupName}`);
  return { success: true };
}

export async function addExpense(_prevState: unknown, formData: FormData) {
  const groupName = formData.get('groupName') as string;
  const paidBy = formData.get('paidBy') as string;
  const amountStr = formData.get('amount') as string;
  const description = formData.get('description') as string;
  if (!groupName) return { error: 'Group name is required' };
  const amount = parseFloat(amountStr);
  const result = await groupsService.addExpense(groupName, paidBy, amount, description);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/group/${groupName}`);
  return { success: true };
}
