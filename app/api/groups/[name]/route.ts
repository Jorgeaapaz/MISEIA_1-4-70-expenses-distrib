import * as groupsService from '@/lib/services/groups.service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const result = await groupsService.getGroup(name);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status ?? 404 });
  }
  return Response.json(result.data);
}
