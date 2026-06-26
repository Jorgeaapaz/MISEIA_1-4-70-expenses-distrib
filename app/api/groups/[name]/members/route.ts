import * as groupsService from '@/lib/services/groups.service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const body = await request.json();
  const result = await groupsService.addMember(name, body?.memberName ?? '');
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return Response.json({ success: true });
}
