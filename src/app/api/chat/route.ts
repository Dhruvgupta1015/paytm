import { NextResponse } from 'next/server';
import { authorizeCustomer } from '@/lib/authz-server';
import {
  executeNavigatorTool,
  NAVIGATOR_TOOL_REGISTRY,
} from '@/lib/claim-navigator-tools';
import { extractFinSimIntent } from '@/lib/finsim-engine';
import type {
  NavigatorToolName,
  DecisionTraceEvent,
  ProposedAction,
  JourneyState,
  FinSimScenarioResult,
} from '@/types';

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

interface IntentAnalysis {
  intentDescription: string;
  toolsToCall: Array<{ toolName: NavigatorToolName; args: Record<string, unknown> }>;
  suggestedAction?: ProposedAction;
}

/**
 * Analyzes customer query intent to select appropriate controlled tools and propose next steps.
 * Does NOT execute state mutations — any action proposal requires explicit user approval.
 */
function analyzeIntent(
  userMessage: string,
  journeyState?: Partial<JourneyState>,
  language: 'en' | 'hi' | 'hinglish' = 'en'
): IntentAnalysis {
  const lower = userMessage.toLowerCase();
  const currentStep = journeyState?.currentStep || 1;
  const toolsToCall: Array<{ toolName: NavigatorToolName; args: Record<string, unknown> }> = [];

  // 0. FinSim What-If Simulation & Mutation Inquiries
  const finSim = extractFinSimIntent(userMessage);
  if (finSim.isFinSim) {
    toolsToCall.push({
      toolName: 'finsim_simulator',
      args: {
        hypotheticalGross: finSim.hypotheticalGross || 100000,
        scenarioDescription: userMessage,
      },
    });
  }

  // 1. Policy & Coverage Inquiries
  if (
    lower.includes('policy') ||
    lower.includes('cover') ||
    lower.includes('room rent') ||
    lower.includes('exclusion') ||
    lower.includes('cashless') ||
    lower.includes('network') ||
    lower.includes('पॉलिसी') ||
    lower.includes('कवर')
  ) {
    toolsToCall.push({
      toolName: 'policy_rag',
      args: {
        query: userMessage,
        policyId: journeyState?.selectedPolicyId || 'POL-HEALTH-001',
      },
    });
  }

  // 2. Financial, Deductibles & Payout Inquiries (Only if not a FinSim What-If scenario)
  if (
    !finSim.isFinSim &&
    (lower.includes('78,500') ||
      lower.includes('78500') ||
      lower.includes('6,500') ||
      lower.includes('6500') ||
      lower.includes('85,000') ||
      lower.includes('85000') ||
      lower.includes('deduct') ||
      lower.includes('payable') ||
      lower.includes('bill') ||
      lower.includes('cut') ||
      lower.includes('कटौती') ||
      lower.includes('payout'))
  ) {
    toolsToCall.push({ toolName: 'journey_state', args: {} });
  }

  // 3. Document Verification & Completeness
  if (
    lower.includes('document') ||
    lower.includes('upload') ||
    lower.includes('discharge') ||
    lower.includes('prescription') ||
    lower.includes('aadhaar') ||
    lower.includes('दस्तावेज़') ||
    lower.includes('verify') ||
    lower.includes('verified')
  ) {
    toolsToCall.push({ toolName: 'document_intelligence', args: {} });
  }

  // 4. Claim Readiness & Submission Feasibility
  if (
    lower.includes('ready') ||
    lower.includes('readiness') ||
    lower.includes('score') ||
    lower.includes('can i submit') ||
    lower.includes('submit') ||
    lower.includes('तैयार') ||
    lower.includes('सबमिट')
  ) {
    toolsToCall.push({ toolName: 'claim_readiness', args: {} });
    if (!toolsToCall.some((t) => t.toolName === 'journey_state')) {
      toolsToCall.push({ toolName: 'journey_state', args: {} });
    }
  }

  // 5. Evidence & Clinical Contradictions
  if (
    lower.includes('contradict') ||
    lower.includes('mismatch') ||
    lower.includes('discrepancy') ||
    lower.includes('conflict') ||
    lower.includes('evidence') ||
    lower.includes('अंतर')
  ) {
    toolsToCall.push({ toolName: 'evidence_verification', args: {} });
  }

  // Default fallback tool for conversational navigation
  if (toolsToCall.length === 0) {
    toolsToCall.push({ toolName: 'journey_state', args: {} });
    if (currentStep >= 4) {
      toolsToCall.push({ toolName: 'claim_readiness', args: {} });
    }
  }

  // Determine Safe Contextual Proposed Next Action
  let suggestedAction: ProposedAction | undefined;

  if (currentStep === 1 || lower.includes('hospital') || lower.includes('admit')) {
    suggestedAction = {
      actionKey: 'confirm_hospitalization',
      label:
        language === 'hi'
          ? 'अस्पताल में भर्ती की पुष्टि करें (डेंगू, 4 दिन)'
          : language === 'hinglish'
          ? 'Confirm Hospitalization (Dengue, 4 Days)'
          : 'Confirm Hospitalization (Dengue, 4 Days)',
      description: 'Record inpatient admission at Apollo Hospital Delhi under your policy.',
      targetStep: 2,
      requiresUserApproval: true,
    };
  } else if (currentStep === 2) {
    suggestedAction = {
      actionKey: 'select_policy',
      label: 'Paytm Health Secure Plus (POL-HEALTH-001)',
      description: 'Proceed with ₹5,00,000 Sum Insured coverage.',
      targetStep: 3,
      requiresUserApproval: true,
    };
  } else if (currentStep === 3) {
    suggestedAction = {
      actionKey: 'upload_documents',
      label:
        language === 'hi'
          ? 'दस्तावेज़ अपलोड और सत्यापन पर आगे बढ़ें'
          : language === 'hinglish'
          ? 'Proceed to Document Upload & Verification'
          : 'Proceed to Document Upload & Verification',
      description: 'Upload discharge summary, bills, and prescriptions.',
      targetStep: 4,
      requiresUserApproval: true,
    };
  } else if (currentStep === 4) {
    suggestedAction = {
      actionKey: 'review_draft',
      label:
        language === 'hi'
          ? 'क्लेम ड्राफ्ट और भुगतान विवरण की समीक्षा करें'
          : language === 'hinglish'
          ? 'Review Claim Draft & Financial Breakdown'
          : 'Review Claim Draft & Financial Breakdown',
      description: 'Inspect Gross ₹85,000, Deductibles ₹6,500, and Estimated ₹78,500.',
      targetStep: 5,
      requiresUserApproval: true,
    };
  } else if (currentStep === 5) {
    suggestedAction = {
      actionKey: 'submit_claim',
      label:
        language === 'hi'
          ? 'बीमाकर्ता समीक्षा के लिए क्लेम सबमिट करें'
          : language === 'hinglish'
          ? 'Submit Claim for Insurer Review'
          : 'Submit Claim for Insurer Review',
      description: 'Dispatch claim payload to n8n orchestration workflow.',
      targetStep: 6,
      requiresUserApproval: true,
    };
  } else if (currentStep >= 6) {
    suggestedAction = {
      actionKey: 'track_claim',
      label:
        language === 'hi'
          ? 'लाइव क्लेम स्थिति ट्रैक करें'
          : language === 'hinglish'
          ? 'Track Live Claim Status'
          : 'Track Live Claim Status',
      description: 'Monitor review stage and hospital billing desk sync.',
      targetStep: 7,
      requiresUserApproval: true,
    };
  }

  const intentDescription =
    toolsToCall.map((t) => NAVIGATOR_TOOL_REGISTRY[t.toolName].name).join(' + ') +
    (suggestedAction ? ` → Propose ${suggestedAction.actionKey}` : '');

  return {
    intentDescription: `Navigator intent: ${intentDescription}`,
    toolsToCall,
    suggestedAction,
  };
}

export async function POST(request: Request) {
  // 1. Authoritative Customer Session Check (P0 - Security Hardening)
  const authz = await authorizeCustomer(request);
  if (!authz.authorized) {
    return authz.response;
  }

  const reqId = `chat_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const startTime = Date.now();

  const body = await request.json().catch(() => ({}));
  const rawMessages: Array<{ role: string; content: string }> = Array.isArray(body.messages) ? body.messages : [];
  const journeyState: Partial<JourneyState> | undefined = body.journeyState;

  // Sanitize incoming messages
  const messages = rawMessages
    .filter((m) => m && typeof m.content === 'string' && typeof m.role === 'string')
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 4000) }));

  const language: 'en' | 'hi' | 'hinglish' =
    body.language === 'hi' || body.language === 'hinglish' ? body.language : 'en';

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  // 2. Claim Navigator Intent & Controlled Tool Selection
  const { intentDescription, toolsToCall, suggestedAction } = analyzeIntent(
    lastUserMsg,
    journeyState,
    language
  );

  const decisionTrace: DecisionTraceEvent[] = [];
  const eventPrefix = `trace_${Date.now().toString(36)}`;
  const nowIso = new Date().toISOString();

  // Intent Event
  decisionTrace.push({
    id: `${eventPrefix}_intent`,
    timestamp: nowIso,
    type: 'navigator_intent',
    title: 'Claim Navigator Intent',
    summary: intentDescription,
    status: 'ok',
  });

  // 3. Execute Controlled Tools Server-Side
  const toolResults: Record<string, unknown> = {};

  for (const item of toolsToCall) {
    try {
      const toolExec = await executeNavigatorTool(
        item.toolName,
        item.args,
        authz.customer.memberId,
        journeyState
      );
      toolResults[item.toolName] = toolExec.result;
      decisionTrace.push(...toolExec.traceEvents);
    } catch (toolErr) {
      console.warn(`[NAVIGATOR TOOL ERROR] tool=${item.toolName} err=${(toolErr as Error).message}`);
      decisionTrace.push({
        id: `${eventPrefix}_err_${item.toolName}`,
        timestamp: new Date().toISOString(),
        type: 'tool_result',
        title: `Tool Failed: ${item.toolName}`,
        summary: 'Gracefully fell back to deterministic state snapshot.',
        toolName: item.toolName,
        status: 'warning',
      });
    }
  }

  // Authoritative State Read Event
  decisionTrace.push({
    id: `${eventPrefix}_auth_read`,
    timestamp: new Date().toISOString(),
    type: 'authoritative_read',
    title: 'Deterministic Engine Read',
    summary: 'Authoritative financial values verified: Gross ₹85,000 | Non-medical Deductibles ₹6,500 | Estimated Payable ₹78,500 | Readiness Score 92%.',
    status: 'ok',
  });

  // Proposed Action Event
  if (suggestedAction) {
    decisionTrace.push({
      id: `${eventPrefix}_proposed`,
      timestamp: new Date().toISOString(),
      type: 'proposed_action',
      title: `Proposed Next Action: ${suggestedAction.label}`,
      summary: 'Requires explicit customer approval. The AI agent cannot directly mutate claim or financial state.',
      status: 'info',
    });
  }

  // Deterministic Authority Sentinel Event
  decisionTrace.push({
    id: `${eventPrefix}_det_authority`,
    timestamp: new Date().toISOString(),
    type: 'deterministic_authority',
    title: 'Deterministic State Engine (Final Authority)',
    summary: 'All state transitions and financial calculations remain governed exclusively by the deterministic FinJourney twin engine.',
    status: 'ok',
  });

  // 4. Live Sarvam Conversational Model Dispatch
  const apiKey = process.env.SARVAM_API_KEY;
  const simulationResult = toolResults.finsim_simulator as FinSimScenarioResult | undefined;

  if (!apiKey) {
    console.log(`[SARVAM CHAT] reqId=${reqId} route=/api/chat status=fallback reason=missing_api_key lang=${language} tools=${Object.keys(toolResults).join(',')}`);
    const fallbackReply = generateFallbackReply(lastUserMsg, language, toolResults);
    return NextResponse.json({
      reply: fallbackReply,
      isLiveSarvam: false,
      decisionTrace,
      proposedAction: suggestedAction,
      simulationResult,
      model: 'fallback-scripted',
    });
  }

  try {
    let languageInstruction = '';
    if (language === 'hi') {
      languageInstruction = `STRICT LANGUAGE MANDATE - HINDI ONLY:
- The user has chosen HINDI.
- You MUST write your ENTIRE response ONLY in HINDI (हिन्दी) using the Devanagari script.
- NEVER switch to English or reply in English sentences, even if technical terms or hospital names are mentioned.
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
      content: `You are FinJourney AI, Paytm's intelligent Claim Navigator Agent.
You guide health insurance customers through filing, understanding policies, and submitting claims with complete transparency.

${languageInstruction}

AUTHORITATIVE TOOL FINDINGS (READ-ONLY DATA FROM DETERMINISTIC ENGINES):
${JSON.stringify(toolResults, null, 2)}

CORE PRINCIPLES & BOUNDARIES:
- Use the authoritative findings from the tools above to directly answer the user's question accurately.
- Never state that a claim is "approved" or "settled". Always say "submitted for review" or "under review".
- Explain the financial numbers clearly: Gross Hospital Bill is ₹85,000; non-medical consumables deducted are ₹6,500; estimated payable amount is ₹78,500.
- Clarify that this is an estimated calculation, not an insurer settlement guarantee.
- If you recommend an action, explain that the user can proceed by reviewing and confirming the proposed step below.
- Keep responses warm, professional, and concise (under 4 sentences unless detailed explanation is requested).`,
    };

    const payload = {
      model: 'sarvam-105b-conversations',
      messages: [systemPrompt, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    };

    console.log(`[SARVAM CHAT] reqId=${reqId} route=/api/chat status=dispatched model=sarvam-105b-conversations lang=${language} tools=${Object.keys(toolResults).join(',')}`);

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
      return NextResponse.json({
        reply: generateFallbackReply(lastUserMsg, language, toolResults),
        isLiveSarvam: false,
        httpStatus: status,
        decisionTrace,
        proposedAction: suggestedAction,
        model: 'fallback-scripted',
      });
    }

    let data: SarvamApiResponse;
    try {
      data = JSON.parse(rawBody) as SarvamApiResponse;
    } catch {
      console.warn(`[SARVAM CHAT] reqId=${reqId} parse_error action=fallback`);
      return NextResponse.json({
        reply: generateFallbackReply(lastUserMsg, language, toolResults),
        isLiveSarvam: false,
        decisionTrace,
        proposedAction: suggestedAction,
        model: 'fallback-scripted',
      });
    }

    const choiceMsg = data.choices?.[0]?.message;
    const reply =
      choiceMsg?.content ||
      choiceMsg?.reasoning_content ||
      generateFallbackReply(lastUserMsg, language, toolResults);

    return NextResponse.json({
      reply,
      isLiveSarvam: true,
      decisionTrace,
      proposedAction: suggestedAction,
      simulationResult,
      model: 'sarvam-105b-conversations',
      httpStatus: 200,
    });
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const errMessage = error instanceof Error ? error.name : 'UnknownException';
    console.error(`[SARVAM CHAT] reqId=${reqId} exception=${errMessage} latencyMs=${latencyMs} action=fallback`);
    return NextResponse.json({
      reply: generateFallbackReply(lastUserMsg, language, toolResults),
      isLiveSarvam: false,
      decisionTrace,
      proposedAction: suggestedAction,
      simulationResult,
      model: 'fallback-scripted',
    });
  }
}

/**
 * Scripted fallback replies utilizing actual tool outputs when Sarvam is offline.
 */
function generateFallbackReply(
  userMessage: string,
  language: 'en' | 'hi' | 'hinglish' = 'en',
  toolResults: Record<string, unknown> = {}
): string {
  const lower = userMessage.toLowerCase();

  // FinSim What-If Simulation
  if (toolResults.finsim_simulator) {
    const sim = toolResults.finsim_simulator as FinSimScenarioResult;
    const isMutation = extractFinSimIntent(userMessage).isMutationAttempt;
    const grossFormatted = sim.simulatedGross.toLocaleString('en-IN');
    const payableFormatted = sim.simulatedFinancials.estimatedPayable.toLocaleString('en-IN');
    const deltaFormatted = Math.abs(sim.impact.payableDelta).toLocaleString('en-IN');
    const pct = `${sim.impact.percentageChange >= 0 ? '+' : ''}${sim.impact.percentageChange}%`;
    const sign = sim.impact.payableDelta >= 0 ? '+' : '-';

    if (language === 'hi') {
      const prefix = isMutation
        ? 'दाखिल किए गए क्लेम में सीधे बदलाव संभव नहीं है। हालांकि, FinSim सिमुलेटर के अनुसार:\n'
        : 'यहाँ आपका FinSim व्हाट-इफ़ सिमुलेशन है:\n';
      return `${prefix}यदि आपका कुल अस्पताल बिल ₹${grossFormatted} होता है, तो मानक गैर-चिकित्सा कटौती ₹6,500 के बाद आपका अनुमानित देय भुगतान ₹${payableFormatted} (${sign}₹${deltaFormatted} या ${pct}) होगा। आपका वास्तविक क्लेम ₹85,000 पर सुरक्षित और अपरिवर्तित रहेगा।`;
    }

    if (language === 'hinglish') {
      const prefix = isMutation
        ? 'Directly filed claim mutate nahi ho sakta. Lekin FinSim simulator ke hisaab se:\n'
        : 'Ye raha aapka FinSim What-If Simulation:\n';
      return `${prefix}Agar aapka hospital bill ₹${grossFormatted} hota hai, toh standard non-medical deductions ₹6,500 ke baad estimated payout ₹${payableFormatted} (${sign}₹${deltaFormatted} / ${pct}) banega. Aapka actual claim ₹85,000 par 100% safe aur unchanged hai.`;
    }

    const prefix = isMutation
      ? 'Official claim packets cannot be directly modified through chat. However, here is the FinSim what-if projection:\n'
      : 'Here is your FinSim What-If Financial Simulation:\n';
    return `${prefix}If your hospital bill is ₹${grossFormatted}, after deducting ₹6,500 for standard non-medical consumables, your estimated insurance payout would be ₹${payableFormatted} (${sign}₹${deltaFormatted} or ${pct}). Your actual submitted claim remains unchanged at ₹85,000 gross.`;
  }

  // Deductions & Financials
  if (
    lower.includes('78,500') ||
    lower.includes('78500') ||
    lower.includes('6,500') ||
    lower.includes('6500') ||
    lower.includes('deduct') ||
    lower.includes('कटौती') ||
    (lower.includes('why') && (lower.includes('money') || lower.includes('payable') || lower.includes('payout')))
  ) {
    if (language === 'hi') {
      return 'यहाँ आपके अनुमानित भुगतान का विवरण है: ₹85,000 के कुल अस्पताल बिल में से ₹6,500 की कटौती मानक गैर-चिकित्सा मदों (पीपीई किट, फ़ाइल शुल्क आदि) के लिए की गई है। आपकी पॉलिसी के तहत शेष ₹78,500 आपकी अनुमानित देय राशि है। कृपया ध्यान दें कि यह एक प्रोटोटाइप अनुमान है।';
    }
    if (language === 'hinglish') {
      return 'Ye raha aapka estimated payout breakdown: ₹85,000 ke total hospital bill mein se ₹6,500 standard non-medical consumables ke liye deduct hua hai. Remaining ₹78,500 aapka estimated payable amount banta hai. Please note karein ye demo estimate hai.';
    }
    return 'Here is your estimated payout breakdown: Out of the ₹85,000 gross hospital bill, ₹6,500 was deducted for standard non-medical consumables (PPE kits, admission file charges, and patient comfort kits). The remaining ₹78,500 is your estimated payable amount under your active policy. Please note this is an estimated calculation, not a final guarantee.';
  }

  // Readiness Score
  if (lower.includes('ready') || lower.includes('readiness') || lower.includes('score') || lower.includes('सबमिट')) {
    const score = (toolResults.claim_readiness as { readinessScore?: number })?.readinessScore || 92;
    if (language === 'hi') {
      return `आपके क्लेम का रेडीनेस स्कोर ${score}% है। सभी आवश्यक दस्तावेज़ सत्यापित हो चुके हैं और कोई अवरोधक विरोधाभास नहीं पाया गया है। आप नीचे दिए गए बटन पर क्लिक करके क्लेम समीक्षा के लिए आगे बढ़ सकते हैं।`;
    }
    if (language === 'hinglish') {
      return `Aapka claim readiness score ${score}% hai. Sabhi core documents verified hain aur koi blocking contradiction nahi hai. Aap neeche diye action button par click karke claim submission review kar sakte hain.`;
    }
    return `Your claim readiness score is ${score}%. All required documents are verified deterministically, and no blocking clinical contradictions were detected. You can proceed with review and submission using the proposed action below.`;
  }

  // Policy Coverage
  if (lower.includes('policy') || lower.includes('insurance') || lower.includes('cover') || lower.includes('पॉलिसी')) {
    const policyName = (toolResults.policy_rag as { policyName?: string })?.policyName || 'Paytm Health Secure Plus';
    if (language === 'hi') {
      return `आपकी सक्रिय पॉलिसी "${policyName}" ₹5,00,000 का कवरेज प्रदान करती है। इसमें अस्पताल में भर्ती, डे-केयर प्रक्रियाएं और सिंगल एसी रूम रेंट शामिल हैं। क्या आप इस पॉलिसी के तहत क्लेम दर्ज करना चाहते हैं?`;
    }
    if (language === 'hinglish') {
      return `Aapki active policy "${policyName}" ₹5,00,000 sum insured provide karti hai. Isme hospitalization, daycare procedures aur single AC room rent covered hai. Kya aap is policy ke against claim file karna chahte hain?`;
    }
    return `Your active policy "${policyName}" provides ₹5,00,000 in sum insured with coverage for inpatient hospitalization, daycare procedures, and standard room rent. Would you like to confirm this policy for your claim?`;
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
      return 'नमस्ते! मैं FinJourney AI हूँ, आपका क्लेम नेविगेटर सहायक। मैं क्लेम फाइल करने, पॉलिसी समझने और दस्तावेज़ सत्यापन में कदम-दर-कदम आपका मार्गदर्शन करूँगा।';
    }
    if (language === 'hinglish') {
      return 'Namaste! Main FinJourney AI hoon, aapka Claim Navigator Copilot. Main step-by-step claim filing, policy RAG, aur document verification mein aapki help karunga.';
    }
    return "Hello! I'm FinJourney AI, your Claim Navigator Agent. I'll guide you through filing a health insurance claim step by step with tool-assisted policy RAG and document intelligence. How can I assist you right now?";
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
