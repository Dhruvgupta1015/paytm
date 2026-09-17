export async function POST(request: Request) {
  const { messages } = await request.json();

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    console.log('\n======================================================');
    console.log('[SARVAM CHAT] No SARVAM_API_KEY configured in environment');
    console.log('[SARVAM CHAT] Routing to deterministic fallback');
    console.log('======================================================\n');
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    const fallbackReply = generateFallbackReply(lastUserMsg?.content || '');
    return Response.json({ reply: fallbackReply, isLiveSarvam: false, model: 'fallback-scripted' });
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

    const payload = {
      model: 'sarvam-105b-conversations',
      messages: [systemPrompt, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    };

    console.log('\n======================================================');
    console.log('[SARVAM API REQUEST START]');
    console.log('Endpoint: https://api.sarvam.ai/v1/chat/completions');
    console.log('Model: sarvam-105b-conversations');
    console.log('Key prefix:', apiKey.substring(0, Math.min(8, apiKey.length)) + '...');
    console.log('Last user prompt:', messages[messages.length - 1]?.content);
    console.log('======================================================');

    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const status = res.status;
    const rawBody = await res.text();

    console.log('\n======================================================');
    console.log('[SARVAM API RAW RESPONSE]');
    console.log(`HTTP Status Code: ${status} ${res.statusText}`);
    console.log('Raw Response Body:', rawBody);
    console.log('======================================================\n');

    if (!res.ok) {
      console.error(`[SARVAM API ERROR] Failed with status ${status}. Triggering deterministic fallback.`);
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
      return Response.json({
        reply: generateFallbackReply(lastUserMsg?.content || ''),
        isLiveSarvam: false,
        httpStatus: status,
        rawError: rawBody,
        model: 'fallback-scripted',
      });
    }

    let data: any;
    try {
      data = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error('[SARVAM API] Failed to parse JSON response:', parseErr);
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
      return Response.json({
        reply: generateFallbackReply(lastUserMsg?.content || ''),
        isLiveSarvam: false,
        model: 'fallback-scripted',
      });
    }

    const choiceMsg = data.choices?.[0]?.message;
    const reply =
      choiceMsg?.content ||
      choiceMsg?.reasoning_content ||
      'I apologize, I could not process that. Could you try again?';

    return Response.json({
      reply,
      isLiveSarvam: true,
      model: 'sarvam-105b-conversations',
      httpStatus: 200,
    });
  } catch (error: any) {
    console.error('\n======================================================');
    console.error('[SARVAM API NETWORK / RUNTIME EXCEPTION]:', error?.message || error);
    console.error('======================================================\n');
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    return Response.json({
      reply: generateFallbackReply(lastUserMsg?.content || ''),
      isLiveSarvam: false,
      model: 'fallback-scripted',
    });
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

  if (
    lower.includes('78,500') ||
    lower.includes('78500') ||
    lower.includes('6,500') ||
    lower.includes('6500') ||
    lower.includes('deduct') ||
    lower.includes('why') && (lower.includes('money') || lower.includes('payable') || lower.includes('payout'))
  ) {
    return "Here is your estimated payout breakdown: Out of the ₹85,000 gross hospital bill, ₹6,500 was deducted for standard non-medical consumables (PPE kits, admission file charges, and patient comfort kits). The remaining ₹78,500 is your estimated payable amount under your active policy. Please note this is an estimated calculation, not a final guarantee.";
  }

  if (lower.includes('hindi') || lower.includes('हिंदी') || lower.includes('मुझे') || lower.includes('मेरा') || lower.includes('पैसे') || lower.includes('कटौती')) {
    if (lower.includes('कटौती') || lower.includes('पैसे') || lower.includes('6500') || lower.includes('78500')) {
      return "आपके ₹85,000 के कुल अस्पताल बिल में से ₹6,500 की कटौती मानक गैर-चिकित्सा वस्तुओं (जैसे दस्ताने, पीपीई किट, फ़ाइल शुल्क) के लिए की गई है। इसके बाद आपकी अनुमानित देय राशि ₹78,500 बनती है। कृपया ध्यान दें कि यह एक अनुमानित गणना है।";
    }
    return "जी हाँ, मैं हिंदी में भी आपकी मदद कर सकता हूँ! बताइए, आपको किस तरह की सहायता चाहिए — क्या आप health insurance claim file करना चाहते हैं?";
  }

  if (lower.includes('help') || lower.includes('hello') || lower.includes('hi') || lower.includes('start')) {
    return "Hello! I'm FinJourney AI, your insurance claim copilot. I'll guide you through filing a health insurance claim step by step. To begin, could you tell me what happened — were you or a family member hospitalized recently?";
  }

  return "I'm here to help you with your health insurance claim journey. Could you tell me more about your situation? For example, you can describe your hospitalization, ask about your policy coverage, or let me know where you are in the claim process.";
}

