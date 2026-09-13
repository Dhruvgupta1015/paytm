import policies from '@/data/policies.json';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const policy = policies.find((p) => p.id === id);

  if (!policy) {
    return Response.json({ message: 'Policy not found' }, { status: 404 });
  }

  return Response.json(policy);
}
