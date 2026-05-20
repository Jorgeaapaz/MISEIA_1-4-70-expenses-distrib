import { getDb } from '@/lib/mongodb';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const db = await getDb();
  const group = await db.collection('groups').findOne({ name });

  if (!group) {
    return Response.json({ error: 'Group not found' }, { status: 404 });
  }

  return Response.json(group);
}
