export async function POST(request: Request) {
  const { messages } = await request.json();

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    // Fallback: return a scripted response when no API key is configured
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    const fallbackReply = generateFallbackReply(lastUserMsg?.content || '');
    return Response.json({ reply: fallbackReply });
  }

  try {
    const systemPrompt = {
      role: 'system',
      content: `You are FinJourney AI, a helpful and empathetic health insurance claim assistant for Paytm. 
You help users navigate the claim filing process step by step.

IMPORTANT RULES:
- Never say a claim is "approved". Always say "submitted for review" or "under review".
- Be concise — keep responses under 3 sentences unless the user asks for detail.
- If the user writes in Hindi or Hinglish, respond in the same language naturally.
- You are working with synthetic/demo data. If asked, acknowledge this transparently.
- Guide users through: describing their situation → selecting policy → providing details → uploading documents → reviewing claim → submitting.
- Be warm, professional, and reassuring. Insurance claims are stressful.`,
    };

    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sarvam-m1',
        messages: [systemPrompt, ...messages],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Sarvam API error:', res.status, errText);
      // Fall back to scripted response
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
      return Response.json({ reply: generateFallbackReply(lastUserMsg?.content || '') });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'I apologize, I could not process that. Could you try again?';

    return Response.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    return Response.json({ reply: generateFallbackReply(lastUserMsg?.content || '') });
  }
}

function generateFallbackReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('claim') || lower.includes('hospital') || lower.includes('admit')) {
    return "I understand you need to file a health insurance claim. I'm here to help! Let's start — could you briefly describe what happened? For example, the reason for hospitalization and approximate dates.";
  }

  if (lower.includes('policy') || lower.includes('insurance') || lower.includes('cover')) {
    return "I can help you understand your policy coverage. You have 2 active policies. Would you like me to explain the coverage details, or shall we proceed with selecting one for your claim?";
  }

  if (lower.includes('document') || lower.includes('upload') || lower.includes('paper')) {
    return "For your claim, you'll need to upload: (1) Discharge Summary, (2) Hospital Bills/Receipts, (3) ID Proof, and (4) Prescriptions. You can upload these on the Documents page — I'll verify each one.";
  }

  if (lower.includes('status') || lower.includes('track') || lower.includes('where')) {
    return "You can track your claim status on the Claim Tracking page. Once submitted, you'll receive a claim ID and can monitor each stage of the review process.";
  }

  if (lower.includes('hindi') || lower.includes('हिंदी') || lower.includes('मुझे') || lower.includes('मेरा')) {
    return "जी हाँ, मैं हिंदी में भी आपकी मदद कर सकता हूँ! बताइए, आपको किस तरह की सहायता चाहिए — क्या आप health insurance claim file करना चाहते हैं?";
  }

  if (lower.includes('help') || lower.includes('hello') || lower.includes('hi') || lower.includes('start')) {
    return "Hello! I'm FinJourney AI, your insurance claim copilot. I'll guide you through filing a health insurance claim step by step. To begin, could you tell me what happened — were you or a family member hospitalized recently?";
  }

  return "I'm here to help you with your health insurance claim journey. Could you tell me more about your situation? For example, you can describe your hospitalization, ask about your policy coverage, or let me know where you are in the claim process.";
}
