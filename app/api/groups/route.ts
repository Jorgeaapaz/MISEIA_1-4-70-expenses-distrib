import * as groupsService from '@/lib/services/groups.service';

export async function POST(request: Request) {
  const body = await request.json();
  const result = await groupsService.createGroup(body?.name ?? '');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return Response.json({ name: result.data.slug }, { status: 201 });
}
