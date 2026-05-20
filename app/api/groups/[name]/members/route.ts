import { getDb } from '@/lib/mongodb';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { memberName } = await request.json();

  if (!memberName || typeof memberName !== 'string' || memberName.trim().length === 0) {
    return Response.json({ error: 'Member name is required' }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection('groups').updateOne(
    { name },
    { $addToSet: { members: memberName.trim() } }
  );

  if (result.matchedCount === 0) {
    return Response.json({ error: 'Group not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
