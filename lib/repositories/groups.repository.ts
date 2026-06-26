import { getDb } from '@/lib/mongodb';
import type { Group } from '@/lib/types';

export async function findGroupByName(name: string): Promise<Group | null> {
  const db = await getDb();
  return db.collection<Group>('groups').findOne({ name }) as Promise<Group | null>;
}

export async function insertGroup(slug: string): Promise<void> {
  const db = await getDb();
  await db.collection('groups').insertOne({
    name: slug,
    members: [],
    createdAt: new Date(),
  });
}

export async function addMemberToGroup(
  groupName: string,
  memberName: string
): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection('groups').updateOne(
    { name: groupName },
    { $addToSet: { members: memberName } }
  );
  return result.matchedCount > 0;
}
