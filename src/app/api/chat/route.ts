import { NextResponse } from 'next/server';
import { authorizeCustomer } from '@/lib/authz-server';

export const dynamic = 'force-dynamic';

interface SarvamChoiceMessage {
  content?: string;
  reasoning_content?: string;
}

interface SarvamApiResponse {
  choices?: Array<{
    message?: SarvamChoiceMessage;
  }>;
}

export async function POST(request: Request) {
  // Authoritative Customer Session Check (P0 - Finding 2)
  const authz = await authorizeCustomer(request);
  if (!authz.authorized) {
    return authz.response;
  }

  const reqId = `chat_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const startTime = Date.now();

  const body = await request.json().catch(() => ({}));
  const rawMessages: Array<{ role: string; content: string }> = Array.isArray(body.messages) ? body.messages : [];
  // Sanitize incoming messages: only permit string role and string content
  const messages = rawMessages
    .filter((m) => m && typeof m.content === 'string' && typeof m.role === 'string')
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 4000) }));

  const language: 'en' | 'hi' | 'hinglish' =
    body.language === 'hi' || body.language === 'hinglish' ? body.language : 'en';

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    console.log(`[SARVAM CHAT] reqId=${reqId} route=/api/chat status=fallback reason=missing_api_key lang=${language}`);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const fallbackReply = generateFallbackReply(lastUserMsg?.content || '', language);
    return NextResponse.json({ reply: fallbackReply, isLiveSarvam: false, model: 'fallback-scripted' });
  }

  try {
    let languageInstruction = '';
    if (language === 'hi') {
      languageInstruction = `STRICT LANGUAGE MANDATE - HINDI ONLY:
- The user has chosen HINDI.
- You MUST write your ENTIRE response ONLY in HINDI (हिन्दी) using the Devanagari script.
- NEVER switch to English or reply in English sentences, even if the user writes English words, hospital names ("Apollo Hospital"), or medical terms ("Dengue").
- Maintain polite, professional, empathetic Hindi throughout.`;
    } else if (language === 'hinglish') {
      languageInstruction = `STRICT LANGUAGE MANDATE - HINGLISH ONLY:
- The user has chosen HINGLISH.
- You MUST write your response in natural conversational HINGLISH using the Roman alphabet (Latin script).
- Example style: "Aapka claim draft review ke liye ready hai. Apollo Hospital ke bills verify ho chuke hain aur estimated payable ₹78,500 calculate hua hai."
- Do NOT use Devanagari script. Do NOT respond in pure formal English.`;
    } else {
      languageInstruction = `STRICT LANGUAGE MANDATE - ENGLISH ONLY:
- The user has chosen ENGLISH.
- You MUST write your ENTIRE response ONLY in clear, empathetic English.
- Do NOT include Hindi words or Devanagari script.`;
    }

    const systemPrompt = {
      role: 'system',
      content: `You are FinJourney AI, a helpful and empathetic health insurance claim assistant for Paytm. 
You help users navigate the claim filing process step by step.

${languageInstruction}

IMPORTANT GENERAL RULES:
- Never say a claim is "approved". Always say "submitted for review" or "under review".
- Be concise — keep responses under 3 sentences unless the user asks for detail.
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

    // Safe non-sensitive diagnostic logging only (P1 - Finding 3)
    console.log(`[SARVAM CHAT] reqId=${reqId} route=/api/chat status=dispatched model=sarvam-105b-conversations lang=${language}`);

    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const status = res.status;
    const latencyMs = Date.now() - startTime;
    const rawBody = await res.text();

    console.log(`[SARVAM CHAT] reqId=${reqId} route=/api/chat httpStatus=${status} latencyMs=${latencyMs} success=${res.ok}`);

    if (!res.ok) {
      console.warn(`[SARVAM CHAT] reqId=${reqId} api_error status=${status} action=fallback`);
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      return NextResponse.json({
        reply: generateFallbackReply(lastUserMsg?.content || '', language),
        isLiveSarvam: false,
        httpStatus: status,
        model: 'fallback-scripted',
      });
    }

    let data: SarvamApiResponse;
    try {
      data = JSON.parse(rawBody) as SarvamApiResponse;
    } catch {
      console.warn(`[SARVAM CHAT] reqId=${reqId} parse_error action=fallback`);
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      return NextResponse.json({
        reply: generateFallbackReply(lastUserMsg?.content || '', language),
        isLiveSarvam: false,
        model: 'fallback-scripted',
      });
    }

    const choiceMsg = data.choices?.[0]?.message;
    const reply =
      choiceMsg?.content ||
      choiceMsg?.reasoning_content ||
      (language === 'hi'
        ? 'क्षमा करें, मैं इसे प्रोसेस नहीं कर पाया। कृपया दोबारा प्रयास करें।'
        : language === 'hinglish'
        ? 'Sorry, main ise process nahi kar paya. Please ek baar fir try karein.'
        : 'I apologize, I could not process that. Could you try again?');

    return NextResponse.json({
      reply,
      isLiveSarvam: true,
      model: 'sarvam-105b-conversations',
      httpStatus: 200,
    });
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const errMessage = error instanceof Error ? error.name : 'UnknownException';
    console.error(`[SARVAM CHAT] reqId=${reqId} exception=${errMessage} latencyMs=${latencyMs} action=fallback`);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    return NextResponse.json({
      reply: generateFallbackReply(lastUserMsg?.content || '', language),
      isLiveSarvam: false,
      model: 'fallback-scripted',
    });
  }
}

function generateFallbackReply(userMessage: string, language: 'en' | 'hi' | 'hinglish' = 'en'): string {
  const lower = userMessage.toLowerCase();

  // Deductions & Payout explanation (₹85,000 / ₹6,500 / ₹78,500)
  if (
    lower.includes('78,500') ||
    lower.includes('78500') ||
    lower.includes('6,500') ||
    lower.includes('6500') ||
    lower.includes('deduct') ||
    lower.includes('कटौती') ||
    lower.includes('why') && (lower.includes('money') || lower.includes('payable') || lower.includes('payout') || lower.includes('कटौती'))
  ) {
    if (language === 'hi') {
      return 'यहाँ आपके अनुमानित भुगतान का विवरण है: ₹85,000 के कुल अस्पताल बिल में से ₹6,500 की कटौती मानक गैर-चिकित्सा मदों (पीपीई किट, फ़ाइल शुल्क आदि) के लिए की गई है। आपकी पॉलिसी के तहत शेष ₹78,500 आपकी अनुमानित देय राशि है। कृपया ध्यान दें कि यह एक प्रोटोटाइप अनुमान है।';
    }
    if (language === 'hinglish') {
      return 'Ye raha aapka estimated payout breakdown: ₹85,000 ke total hospital bill mein se ₹6,500 standard non-medical consumables ke liye deduct hua hai. Remaining ₹78,500 aapka estimated payable amount banta hai. Please note karein ye demo estimate hai.';
    }
    return 'Here is your estimated payout breakdown: Out of the ₹85,000 gross hospital bill, ₹6,500 was deducted for standard non-medical consumables (PPE kits, admission file charges, and patient comfort kits). The remaining ₹78,500 is your estimated payable amount under your active policy. Please note this is an estimated calculation, not a final guarantee.';
  }

  // Claim Filing
  if (lower.includes('claim') || lower.includes('hospital') || lower.includes('admit') || lower.includes('क्लेम')) {
    if (language === 'hi') {
      return 'मैं समझता हूँ कि आपको हेल्थ इंश्योरेंस क्लेम फाइल करना है। मैं आपकी पूरी मदद करूँगा! कृपया बताएं कि अस्पताल में भर्ती होने का कारण और अनुमानित तारीखें क्या थीं?';
    }
    if (language === 'hinglish') {
      return 'Main samajhta hoon ki aapko health insurance claim file karna hai. Main step-by-step aapki help karunga! Kya aap hospitalization ka reason aur approximate dates share kar sakte hain?';
    }
    return "I understand you need to file a health insurance claim. I'm here to help! Let's start — could you briefly describe what happened? For example, the reason for hospitalization and approximate dates.";
  }

  // Policy Coverage
  if (lower.includes('policy') || lower.includes('insurance') || lower.includes('cover') || lower.includes('पॉलिसी')) {
    if (language === 'hi') {
      return 'मैं आपकी पॉलिसी कवरेज को समझने में मदद कर सकता हूँ। आपके पास 2 सक्रिय पॉलिसियाँ हैं। क्या आप कवरेज का विवरण जानना चाहते हैं, या हम क्लेम के लिए पॉलिसी चुनकर आगे बढ़ें?';
    }
    if (language === 'hinglish') {
      return 'Main aapki policy coverage samajhne mein madad kar sakta hoon. Aapke paas 2 active policies hain. Kya aap coverage details dekhna chahte hain ya claim ke liye policy select karein?';
    }
    return 'I can help you understand your policy coverage. You have 2 active policies. Would you like me to explain the coverage details, or shall we proceed with selecting one for your claim?';
  }

  // Document Upload
  if (lower.includes('document') || lower.includes('upload') || lower.includes('paper') || lower.includes('दस्तावेज़')) {
    if (language === 'hi') {
      return 'क्लेम के लिए आपको ये दस्तावेज़ अपलोड करने होंगे: (1) डिस्चार्ज सारांश, (2) अस्पताल बिल, (3) पहचान पत्र (आधार), और (4) डॉक्टर का पर्चा। आप इन्हें दस्तावेज़ पेज पर अपलोड कर सकते हैं — मैं हर एक को सत्यापित करूँगा।';
    }
    if (language === 'hinglish') {
      return 'Claim ke liye aapko ye documents upload karne honge: (1) Discharge Summary, (2) Hospital Bills, (3) ID Proof (Aadhaar), aur (4) Doctor Rx. Aap inhe Documents page par upload karke AI verification kar sakte hain.';
    }
    return "For your claim, you'll need to upload: (1) Discharge Summary, (2) Hospital Bills/Receipts, (3) ID Proof, and (4) Prescriptions. You can upload these on the Documents page — I'll verify each one.";
  }

  // Claim Tracking
  if (lower.includes('status') || lower.includes('track') || lower.includes('where') || lower.includes('स्थिति')) {
    if (language === 'hi') {
      return 'आप क्लेम ट्रैकिंग पेज पर अपने क्लेम की स्थिति देख सकते हैं। सबमिट होने के बाद, आपको एक क्लेम आईडी मिलती है और आप समीक्षा प्रक्रिया के प्रत्येक चरण की निगरानी कर सकते हैं।';
    }
    if (language === 'hinglish') {
      return 'Aap apna claim status Claim Tracking page par track kar sakte hain. Submit hone ke baad aapko claim ID milti hai aur live review stage dekh sakte hain.';
    }
    return "You can track your claim status on the Claim Tracking page. Once submitted, you'll receive a claim ID and can monitor each stage of the review process.";
  }

  // Help / Hello / Greetings
  if (lower.includes('help') || lower.includes('hello') || lower.includes('hi') || lower.includes('मदद') || lower.includes('namaste')) {
    if (language === 'hi') {
      return 'नमस्ते! मैं FinJourney AI हूँ, आपका हेल्थ इंश्योरेंस क्लेम सहायक। मैं क्लेम फाइल करने, पॉलिसी समझने और दस्तावेज़ सत्यापन में कदम-दर-कदम आपका मार्गदर्शन करूँगा।';
    }
    if (language === 'hinglish') {
      return 'Namaste! Main FinJourney AI hoon, aapka health insurance claim copilot. Main step-by-step claim filing, document upload aur verification mein aapki help karunga.';
    }
    return "Hello! I'm FinJourney AI, your insurance claim copilot. I'll guide you through filing a health insurance claim step by step. To begin, could you tell me what happened — were you or a family member hospitalized recently?";
  }

  // Default fallback
  if (language === 'hi') {
    return 'मैं आपकी स्वास्थ्य बीमा क्लेम यात्रा में मदद करने के लिए यहाँ हूँ। कृपया मुझे अपनी स्थिति के बारे में और बताएं या पूछें कि आप आगे क्या करना चाहते हैं।';
  }
  if (language === 'hinglish') {
    return 'Main aapki health insurance claim journey mein help karne ke liye yahan hoon. Aap apni hospitalization ya policy ke baare mein kuch bhi pooch sakte hain.';
  }
  return "I'm here to help you with your health insurance claim journey. Could you tell me more about your situation? For example, you can describe your hospitalization, ask about your policy coverage, or let me know where you are in the claim process.";
}

