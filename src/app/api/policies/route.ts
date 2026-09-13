import policies from '@/data/policies.json';

export async function GET() {
  return Response.json(policies);
}
