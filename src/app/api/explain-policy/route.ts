import policies from '@/data/policies.json';

export async function POST(request: Request) {
  const { policyId, clause } = await request.json();

  const policy = policies.find((p) => p.id === policyId);
  if (!policy) {
    return Response.json({ message: 'Policy not found' }, { status: 404 });
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    // Fallback: return a templated explanation
    return Response.json({
      explanation: generateFallbackExplanation(policy.name, clause),
    });
  }

  try {
    console.log('[SARVAM EXPLAIN-POLICY] Requesting explanation using sarvam-105b-conversations');
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

    const status = res.status;
    const rawBody = await res.text();
    console.log(`[SARVAM EXPLAIN-POLICY] Status: ${status}, Body: ${rawBody}`);

    if (!res.ok) {
      return Response.json({
        explanation: generateFallbackExplanation(policy.name, clause),
        isLiveSarvam: false,
      });
    }

    const data = JSON.parse(rawBody);
    const explanation =
      data.choices?.[0]?.message?.content ||
      generateFallbackExplanation(policy.name, clause);

    return Response.json({ explanation, isLiveSarvam: true });
  } catch (err) {
    console.error('[SARVAM EXPLAIN-POLICY] Exception:', err);
    return Response.json({
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
