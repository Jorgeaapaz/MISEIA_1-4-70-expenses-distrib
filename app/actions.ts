'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/mongodb';

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function createGroup(_prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string;

  if (!name || name.trim().length === 0) {
    return { error: 'El nombre del grupo es obligatorio' };
  }

  const slug = slugify(name);
  if (slug.length === 0) {
    return { error: 'Nombre de grupo no válido' };
  }

  const db = await getDb();

  try {
    await db.collection('groups').insertOne({
      name: slug,
      members: [],
      createdAt: new Date(),
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
      return { error: 'Ya existe un grupo con ese nombre' };
    }
    return { error: 'Error al crear el grupo' };
  }

  redirect(`/group/${slug}`);
}

export async function addMember(groupName: string, _prevState: unknown, formData: FormData) {
  const memberName = formData.get('memberName') as string;

  if (!memberName || memberName.trim().length === 0) {
    return { error: 'El nombre del miembro es obligatorio' };
  }

  const db = await getDb();
  const result = await db.collection('groups').updateOne(
    { name: groupName },
    { $addToSet: { members: memberName.trim() } }
  );

  if (result.matchedCount === 0) {
    return { error: 'Grupo no encontrado' };
  }

  revalidatePath(`/group/${groupName}`);
  return { success: true };
}

export async function addExpense(groupName: string, _prevState: unknown, formData: FormData) {
  const paidBy = formData.get('paidBy') as string;
  const amountStr = formData.get('amount') as string;
  const description = formData.get('description') as string;

  if (!paidBy || !amountStr || !description?.trim()) {
    return { error: 'Todos los campos son obligatorios' };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'El importe debe ser un número positivo' };
  }

  const db = await getDb();
  const group = await db.collection('groups').findOne({ name: groupName });

  if (!group) {
    return { error: 'Grupo no encontrado' };
  }

  if (!group.members.includes(paidBy)) {
    return { error: 'La persona debe ser miembro del grupo' };
  }

  await db.collection('expenses').insertOne({
    groupId: group._id,
    paidBy,
    amount: Math.round(amount * 100) / 100,
    description: description.trim(),
    createdAt: new Date(),
  });

  revalidatePath(`/group/${groupName}`);
  return { success: true };
}
