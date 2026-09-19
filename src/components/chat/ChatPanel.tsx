'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useJourney } from '@/context/JourneyContext';
import { ChatMessage, ActionButton } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import type { ChatMessage as ChatMessageType, SupportedLanguage, ProposedAction } from '@/types';

const getWelcomeMessage = (lang: SupportedLanguage = 'en'): string => {
  if (lang === 'hi') {
    return 'नमस्ते राहुल! मैं FinJourney AI हूँ, आपका 24x7 स्वास्थ्य बीमा सहायक।\n\nमैं कैशलेस या प्रतिपूर्ति (reimbursement) क्लेम दाखिल करने, पॉलिसी शर्तों को सरल हिंदी में समझाने और दस्तावेज़ जमा करने में आपका मार्गदर्शन कर सकता हूँ। आज मैं आपकी क्या सहायता करूँ?';
  }
  if (lang === 'hinglish') {
    return 'Namaste Rahul! Main FinJourney AI hoon, aapka 24x7 Health Insurance Copilot.\n\nMain aapko cashless ya reimbursement claim file karne mein, clauses ko simple bhasha mein samajhne mein, aur document verification mein guide karunga. Aaj main aapki kya help kar sakta hoon?';
  }
  return 'Namaste Rahul! I am FinJourney AI, your 24x7 Health Insurance Copilot.\n\nI can help you file a cashless or reimbursement claim, explain clauses in simple Hindi/English, or guide you through document submission. How can I assist you today?';
};

export const ChatPanel: React.FC = () => {
  const router = useRouter();
  const { state, advanceStep, selectPolicy, setLanguage } = useJourney();
  const currentLanguage: SupportedLanguage = state.language || 'en';

  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: getWelcomeMessage('en'),
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [humanEscalated, setHumanEscalated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounterRef = useRef(1);

  // Sync initial welcome message when user switches language before conversation starts
  useEffect(() => {
    const tId = setTimeout(() => {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === 'msg-welcome') {
          return [
            {
              ...prev[0],
              content: getWelcomeMessage(currentLanguage),
            },
          ];
        }
        return prev;
      });
    }, 0);
    return () => clearTimeout(tId);
  }, [currentLanguage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (content: string) => {
    const nowIso = new Date().toISOString();
    const userMsgId = `user_${++msgIdCounterRef.current}`;
    const userMsg: ChatMessageType = {
      id: userMsgId,
      role: 'user',
      content,
      timestamp: nowIso,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Check for human escalation trigger
    const lower = content.toLowerCase();
    if (
      lower.includes('human') ||
      lower.includes('agent') ||
      lower.includes('executive') ||
      lower.includes('talk to someone') ||
      lower.includes('representative') ||
      lower.includes('अधिकारी')
    ) {
      setHumanEscalated(true);
      setTimeout(() => {
        const asstMsgId = `asst_${++msgIdCounterRef.current}`;
        const escalationMsg: ChatMessageType = {
          id: asstMsgId,
          role: 'assistant',
          content:
            currentLanguage === 'hi'
              ? 'मैंने आपको वरिष्ठ क्लेम सपोर्ट अधिकारी प्रिया वर्मा (कर्मचारी आईडी: PAYTM-ESC-9042) से जोड़ दिया है। वे आपकी क्लेम फ़ाइल की समीक्षा कर रही हैं।'
              : currentLanguage === 'hinglish'
              ? 'Maine aapko Senior Claims Support Officer Priya Verma (Employee ID: PAYTM-ESC-9042) se connect kar diya hai. Vo aapki claim file review kar rahi hain.'
              : 'I have connected you with Senior Claims Support Officer Priya Verma (Employee ID: PAYTM-ESC-9042). She is reviewing your claim file right now.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, escalationMsg]);
        setIsLoading(false);
      }, 700);
      return;
    }

    try {
      const response = await api.sendChatMessage(content, messages, currentLanguage, state);
      const asstReplyId = `asst_${++msgIdCounterRef.current}`;
      const assistantMsg: ChatMessageType = {
        id: asstReplyId,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        isLiveSarvam: response.isLiveSarvam,
        decisionTrace: response.decisionTrace,
        proposedAction: response.proposedAction,
        simulationResult: response.simulationResult,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errMsgId = `err_${++msgIdCounterRef.current}`;
      const errorMsg: ChatMessageType = {
        id: errMsgId,
        role: 'assistant',
        content:
          currentLanguage === 'hi'
            ? 'क्षमा करें, मुझे कनेक्शन में क्षणिक समस्या का सामना करना पड़ा। आप नीचे दिए गए चरण कार्यों के साथ आगे बढ़ सकते हैं या पुनः प्रयास कर सकते हैं।'
            : currentLanguage === 'hinglish'
            ? 'Sorry, connection issue aayi hai. Aap neeche diye gaye step actions ke saath continue kar sakte hain ya fir se try karein.'
            : 'I apologize, but I encountered a momentary connection issue. You can continue advancing through the step actions below or try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage, messages, state]);

  // Handle explicit customer approval on AI recommended proposed actions
  const handleExecuteProposedAction = useCallback(
    (action: ProposedAction) => {
      switch (action.actionKey) {
        case 'confirm_hospitalization':
          advanceStep();
          break;
        case 'select_policy':
          selectPolicy('POL-HEALTH-001');
          advanceStep();
          break;
        case 'upload_documents':
          router.push('/documents');
          break;
        case 'review_draft':
          router.push('/claim/draft');
          break;
        case 'submit_claim':
          router.push('/claim/draft');
          break;
        case 'track_claim':
          router.push('/claim/tracking');
          break;
        case 'escalate_human':
          setHumanEscalated(true);
          break;
        default:
          advanceStep();
          break;
      }
    },
    [advanceStep, selectPolicy, router]
  );

  const handleSelectSimulationScenario = useCallback(
    (amount: number) => {
      const prompt =
        currentLanguage === 'hi'
          ? `अगर मेरा अस्पताल बिल ₹${amount.toLocaleString('en-IN')} हो तो क्या होगा?`
          : currentLanguage === 'hinglish'
          ? `Agar mera hospital bill ₹${amount.toLocaleString('en-IN')} ho toh kya hoga?`
          : `What if my hospital bill is ₹${amount.toLocaleString('en-IN')}?`;
      handleSendMessage(prompt);
    },
    [currentLanguage, handleSendMessage]
  );

  const handleResetSimulation = useCallback(() => {
    const prompt =
      currentLanguage === 'hi'
        ? 'सिमुलेशन रीसेट करें और वास्तविक क्लेम पर वापस जाएं'
        : currentLanguage === 'hinglish'
        ? 'Simulation reset karein aur actual claim par wapas aayein'
        : 'Reset scenario back to my actual claim';
    handleSendMessage(prompt);
  }, [currentLanguage, handleSendMessage]);

  // Generate explicit UI Action Buttons based on current deterministic journey step
  const getContextualActionButtons = (): ActionButton[] => {
    switch (state.currentStep) {
      case 1: // Intent
        return [
          {
            label:
              currentLanguage === 'hi'
                ? '🏥 अस्पताल में भर्ती की पुष्टि करें (डेंगू, 4 दिन)'
                : currentLanguage === 'hinglish'
                ? '🏥 Confirm Hospitalization (Dengue, 4 Days)'
                : '🏥 Confirm Hospitalization (Dengue, 4 Days)',
            action: () => {
              advanceStep();
              setMessages((prev) => [
                ...prev,
                {
                  id: `asst-${Date.now()}`,
                  role: 'assistant',
                  content:
                    currentLanguage === 'hi'
                      ? 'समझ गया। मैंने आपकी अस्पताल में भर्ती होने की घटना दर्ज कर ली है। कृपया चुनें कि आप अपनी किस सक्रिय पॉलिसी के तहत यह क्लेम दर्ज करना चाहते हैं।'
                      : currentLanguage === 'hinglish'
                      ? 'Understood. Maine aapki hospitalization incident record kar li hai. Please select karein ki aap kis active policy ke against claim file karna chahte hain.'
                      : 'Understood. I have recorded your hospitalization incident. Please select which of your active policies you would like to file this claim against.',
                  timestamp: new Date().toISOString(),
                },
              ]);
            },
          },
        ];

      case 2: // Policy Selection
        return [
          {
            label: 'Paytm Health Secure Plus (₹5,00,000 Sum Insured)',
            action: () => {
              selectPolicy('POL-HEALTH-001');
              advanceStep();
              setMessages((prev) => [
                ...prev,
                {
                  id: `asst-${Date.now()}`,
                  role: 'assistant',
                  content:
                    currentLanguage === 'hi'
                      ? '"Paytm Health Secure Plus" चुनी गई। अब आइए आपके अस्पताल और उपचार विवरण की पुष्टि करें। अपोलो अस्पताल दिल्ली का आपके बीमाकर्ता के साथ कैशलेस टाई-अप है।'
                      : currentLanguage === 'hinglish'
                      ? '"Paytm Health Secure Plus" selected. Next, chaliye hospital aur treatment details confirm karte hain. Apollo Hospital Delhi ka aapke insurer ke saath cashless tie-up hai.'
                      : 'Selected "Paytm Health Secure Plus". Next, let us confirm your hospital and treatment details. Apollo Hospital Delhi has cashless tie-ups with your insurer.',
                  timestamp: new Date().toISOString(),
                },
              ]);
            },
          },
          {
            label: 'Paytm Family Shield (₹10,00,000 Sum Insured)',
            variant: 'outline',
            action: () => {
              selectPolicy('POL-HEALTH-002');
              advanceStep();
              setMessages((prev) => [
                ...prev,
                {
                  id: `asst-${Date.now()}`,
                  role: 'assistant',
                  content:
                    currentLanguage === 'hi'
                      ? '"Paytm Family Shield" चुनी गई। अब आइए आपके अस्पताल और उपचार विवरण की पुष्टि करें।'
                      : currentLanguage === 'hinglish'
                      ? '"Paytm Family Shield" selected. Next, chaliye hospital aur treatment details confirm karte hain.'
                      : 'Selected "Paytm Family Shield". Next, let us confirm your hospital and treatment details.',
                  timestamp: new Date().toISOString(),
                },
              ]);
            },
          },
        ];

      case 3: // Claim Details
        return [
          {
            label:
              currentLanguage === 'hi'
                ? 'अपोलो अस्पताल विवरण की पुष्टि करें (1-5 सितंबर, कुल: ₹85,000)'
                : currentLanguage === 'hinglish'
                ? 'Confirm Apollo Hospital (1-5 Sep, Total: ₹85,000)'
                : 'Confirm Apollo Hospital (1-5 Sep, Total: ₹85,000)',
            action: () => {
              advanceStep();
              setMessages((prev) => [
                ...prev,
                {
                  id: `asst-${Date.now()}`,
                  role: 'assistant',
                  content:
                    currentLanguage === 'hi'
                      ? 'अस्पताल विवरण दर्ज कर लिया गया है। अब हमें आपके सहायक दस्तावेज़ (डिस्चार्ज सारांश, बिल, पहचान प्रमाण, डॉक्टर का पर्चा) जमा करने होंगे।'
                      : currentLanguage === 'hinglish'
                      ? 'Hospitalization details log ho gayi hain. Ab humein supporting documents (Discharge Summary, Bills, ID Proof, Doctor Rx) submit karne hain.'
                      : 'Hospitalization details logged. Now we need to submit your supporting documents (Discharge Summary, Bills, Identity Proof, Doctor Prescription).',
                  timestamp: new Date().toISOString(),
                },
              ]);
            },
          },
        ];

      case 4: // Documents
      case 5: // Verify
        return [
          {
            label:
              currentLanguage === 'hi'
                ? 'दस्तावेज़ अपलोड और सत्यापन पर जाएं'
                : currentLanguage === 'hinglish'
                ? 'Go to Document Upload & Verification'
                : 'Go to Document Upload & Verification',
            action: () => {
              router.push('/documents');
            },
          },
        ];

      case 6: // Draft
      case 7: // Submit
        return [
          {
            label:
              currentLanguage === 'hi'
                ? 'क्लेम ड्राफ्ट देखें और सबमिट करें'
                : currentLanguage === 'hinglish'
                ? 'Review Claim Draft & Submit'
                : 'Review Claim Draft & Submit',
            action: () => {
              router.push('/claim/draft');
            },
          },
          {
            label:
              currentLanguage === 'hi'
                ? '💡 ₹78,500 क्यों? कटौतियां समझाइए'
                : currentLanguage === 'hinglish'
                ? '💡 Why ₹78,500? Explain Deductions'
                : '💡 Why ₹78,500? Explain Deductions',
            variant: 'outline',
            action: () => {
              handleSendMessage(
                currentLanguage === 'hi'
                  ? 'मेरे ₹85,000 के बिल में से ₹6,500 की कटौती क्यों हुई? मेरा देय भुगतान समझाइए।'
                  : currentLanguage === 'hinglish'
                  ? 'Mere ₹85,000 ke bill mein se ₹6,500 kyu deduct hua? Mera payout explain karein.'
                  : 'Why was ₹6,500 deducted from my ₹85,000 bill? Explain my payout calculation.'
              );
            },
          },
        ];

      case 8: // Tracking
        return [
          {
            label:
              currentLanguage === 'hi'
                ? 'सबमिट किए गए क्लेम की स्थिति ट्रैक करें'
                : currentLanguage === 'hinglish'
                ? 'Track Submitted Claim Status'
                : 'Track Submitted Claim Status',
            action: () => {
              router.push('/claim/tracking');
            },
          },
        ];

      default:
        return [];
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-indigo-100/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-700 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-indigo-950">
                FinJourney Assistant
              </h2>
              <Badge variant="indigo" size="sm">
                Sarvam AI
              </Badge>
            </div>
            <p className="text-[11px] text-text-muted">
              {currentLanguage === 'hi'
                ? 'बहुभाषी सहायक · स्वास्थ्य क्लेम विशेषज्ञ'
                : currentLanguage === 'hinglish'
                ? 'Bilingual Copilot · Health Claims Specialist'
                : 'Bilingual Copilot · Health Claims Specialist'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 🌐 Strict Language Selector Toggle (Change 2) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-indigo-100 text-xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-text-secondary hover:text-indigo-900'
              }`}
              title="Switch to English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                currentLanguage === 'hi'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-text-secondary hover:text-indigo-900'
              }`}
              title="हिन्दी में बदलें"
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hinglish')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                currentLanguage === 'hinglish'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-text-secondary hover:text-indigo-900'
              }`}
              title="Switch to Hinglish"
            >
              Hinglish
            </button>
          </div>

          {humanEscalated ? (
            <Badge variant="warning" size="md">
              Agent Connected
            </Badge>
          ) : (
            <button
              onClick={() =>
                handleSendMessage(
                  currentLanguage === 'hi'
                    ? 'मुझे क्लेम अधिकारी से बात करनी है'
                    : currentLanguage === 'hinglish'
                    ? 'I want to talk to human officer'
                    : 'I want to talk to a human agent'
                )
              }
              className="text-xs font-semibold text-text-secondary hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200/80 flex items-center gap-1.5 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{currentLanguage === 'hi' ? 'अधिकारी से संपर्क' : 'Escalate to Human'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Human Escalation Alert Banner */}
      {humanEscalated && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 animate-slide-down">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>
              <strong>Case #ESC-2026-8819</strong> transferred to Claims Officer
              Priya Verma.
            </span>
          </div>
          <Link
            href="/escalation"
            className="font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 flex items-center gap-1"
          >
            Open Escalation Desk
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((msg, index) => {
          const isLatestAssistantMsg =
            !isLoading &&
            msg.role === 'assistant' &&
            index === messages.length - 1;

          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              actionButtons={
                isLatestAssistantMsg ? getContextualActionButtons() : undefined
              }
              onExecuteProposedAction={handleExecuteProposedAction}
              onSelectSimulationScenario={handleSelectSimulationScenario}
              onResetSimulation={handleResetSimulation}
            />
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-center gap-3 my-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-white text-xs">
              🤖
            </div>
            <div className="bg-white border border-indigo-100 rounded-2xl rounded-tl-none p-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-text-muted ml-2 font-medium">
                  FinJourney AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};
