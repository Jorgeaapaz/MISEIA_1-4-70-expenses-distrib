import { getDb } from '@/lib/mongodb';

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: 'Group name is required' }, { status: 400 });
    }

    const slug = slugify(name);
    if (slug.length === 0) {
      return Response.json({ error: 'Invalid group name' }, { status: 400 });
    }

    const db = await getDb();
    await db.collection('groups').insertOne({
      name: slug,
      members: [],
      createdAt: new Date(),
    });

    return Response.json({ name: slug }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
      return Response.json({ error: 'A group with this name already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
