import * as groupsService from '@/lib/services/groups.service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const result = await groupsService.getExpenses(name);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status ?? 404 });
  }
  return Response.json(result.data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const body = await request.json();
  const amount = parseFloat(body?.amount);
  const result = await groupsService.addExpense(
    name,
    body?.paidBy ?? '',
    amount,
    body?.description ?? ''
  );
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return Response.json({ success: true }, { status: 201 });
}
