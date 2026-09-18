import { NextResponse } from 'next/server';
import policies from '@/data/policies.json';
import { authorizeCustomer, isCustomerAuthorizedForPolicy } from '@/lib/authz-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Authoritative Customer Session Check (P0 - Finding 2)
  const authz = await authorizeCustomer(request);
  if (!authz.authorized) {
    return authz.response;
  }

  const { policyId, clause } = await request.json().catch(() => ({}));

  if (!policyId || !clause) {
    return NextResponse.json({ message: 'Missing policyId or clause' }, { status: 400 });
  }

  const policy = policies.find((p) => p.id === policyId);
  if (!policy) {
    return NextResponse.json({ message: 'Policy not found' }, { status: 404 });
  }

  if (!isCustomerAuthorizedForPolicy(authz.customer.memberId, policy.id)) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 });
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    // Fallback: return a templated explanation
    return NextResponse.json({
      explanation: generateFallbackExplanation(policy.name, clause),
    });
  }

  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages: [
          {
            role: 'system',
            content: `You are a helpful insurance policy explainer. Explain insurance terms in simple, plain language that anyone can understand. Keep it under 3 sentences. If the user asks in Hindi, respond in Hindi.`,
          },
          {
            role: 'user',
            content: `Explain this clause from the "${policy.name}" policy in simple terms: "${clause}". Policy details: Sum insured ₹${policy.sumInsured.toLocaleString()}, Room rent: ${policy.coverage.roomRent}, Pre-hospitalization: ${policy.coverage.preHospitalization}.`,
          },
        ],
        max_tokens: 256,
        temperature: 0.5,
      }),
    });

    const rawBody = await res.text();

    if (!res.ok) {
      return NextResponse.json({
        explanation: generateFallbackExplanation(policy.name, clause),
        isLiveSarvam: false,
      });
    }

    const data = JSON.parse(rawBody);
    const explanation =
      data.choices?.[0]?.message?.content ||
      generateFallbackExplanation(policy.name, clause);

    return NextResponse.json({ explanation, isLiveSarvam: true });
  } catch {
    return NextResponse.json({
      explanation: generateFallbackExplanation(policy.name, clause),
      isLiveSarvam: false,
    });
  }
}

function generateFallbackExplanation(policyName: string, clause: string): string {
  const lower = clause.toLowerCase();

  if (lower.includes('room rent') || lower.includes('sub-limit')) {
    return `Under your ${policyName} policy, "room rent" refers to the maximum amount the insurer will pay per day for your hospital room. If you choose a room that costs more than this limit, you'll need to pay the difference yourself. This is one of the most important things to check before hospitalization.`;
  }

  if (lower.includes('pre-existing') || lower.includes('waiting')) {
    return `A "pre-existing condition" is any illness or injury you had before buying this policy. Under ${policyName}, these conditions are not covered for the first few years (the "waiting period"). After that waiting period, they are covered like any other condition.`;
  }

  if (lower.includes('cashless') || lower.includes('network')) {
    return `"Cashless treatment" means you don't pay the hospital directly — your insurer settles the bill directly with the hospital. This only works at "network hospitals" that have a tie-up with your insurer. At other hospitals, you pay first and get reimbursed later.`;
  }

  return `This clause in your ${policyName} policy defines specific terms of your coverage. In simple terms, it sets rules about what is covered and what isn't. If you'd like, I can break down the specific numbers and conditions for you.`;
}
