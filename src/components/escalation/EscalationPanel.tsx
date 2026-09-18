'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useJourney } from '@/context/JourneyContext';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import type { OfficerQueueCase } from '@/types';

export interface EscalationPanelProps {
  caseData?: OfficerQueueCase;
  isOfficerMode?: boolean;
  onClose?: () => void;
}

export const EscalationPanel: React.FC<EscalationPanelProps> = ({
  caseData,
  isOfficerMode = false,
  onClose,
}) => {
  const { twin } = useJourney();

  const [notes, setNotes] = useState('');
  const [sentNotes, setSentNotes] = useState(false);

  // Read-only local state for officer demo interactions
  const [isAssignedToMe, setIsAssignedToMe] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);

  // Shared browser-native speech recognition hook (Change 4 & Change 1)
  const {
    isListening,
    transcript: speechTranscript,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({ lang: 'en-IN' });

  // Stream voice transcript into notes
  const prevTranscriptRef = useRef(speechTranscript);
  useEffect(() => {
    if (speechTranscript && speechTranscript !== prevTranscriptRef.current) {
      prevTranscriptRef.current = speechTranscript;
      const tId = setTimeout(() => {
        setNotes(speechTranscript);
      }, 0);
      return () => clearTimeout(tId);
    }
  }, [speechTranscript]);

  // Local camera preview state (strictly opt-in, never transmitted)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCameraPreview = async () => {
    setCameraError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera API is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch {
      setCameraError('Camera permission denied or camera unavailable. Continuing with voice & note mode.');
      setIsCameraActive(false);
    }
  };

  const stopCameraPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // Clean up camera hardware tracks immediately on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening, stopListening]);

  // Defaults match real twin state
  const ticketId = caseData?.caseId ?? 'ESC-2026-8819';
  const officerName = caseData?.officerName ?? 'Priya Verma';
  const officerInitials = caseData?.officerInitials ?? 'PV';
  const officerTitle = caseData?.officerTitle ?? 'Senior Claims Adjudicator';
  const officerBadge = caseData?.officerBadge ?? 'Paytm Insurance Officer #9042';

  // Dynamic readiness and contradiction from active twin
  const dynamicReadiness = twin?.readiness?.overallScore ?? caseData?.aiConfidence ?? 68;
  const contradictions = twin?.contradictions ?? [];
  const blockingContradiction = contradictions.find((c) => c.severity === 'BLOCKING');

  let triggerReason = caseData?.triggerReason ?? 'Human assistance requested';
  if (!caseData && blockingContradiction) {
    triggerReason = `Blocking contradiction: ${blockingContradiction.explanation}`;
  }

  const statusLabel = isReviewed
    ? 'Reviewed by Officer'
    : isAssignedToMe
    ? 'Assigned to Current Officer'
    : (caseData?.status ?? 'Human Support Handoff — Demo');

  const summaryText =
    caseData?.summary ??
    'Insured Rahul Sharma (34) has submitted claim draft for Inpatient Dengue treatment at Apollo Hospital Delhi (01 Sep – 05 Sep).';
  const claimedGross =
    caseData?.claimedGross ??
    `₹${(twin?.financialSummary?.grossHospitalBill ?? 85000).toLocaleString('en-IN')}`;
  const estimatedPayable =
    caseData?.estimatedPayable ??
    `₹${(twin?.financialSummary?.estimatedPayable ?? 78500).toLocaleString('en-IN')}`;
  const deductiblesInfo =
    caseData?.deductiblesInfo ??
    `Deductibles: ₹${(twin?.financialSummary?.deductibles ?? 6500).toLocaleString('en-IN')} non-medical items`;
  const policyInfo = caseData
    ? `${caseData.policyName} (${caseData.policyNumber})`
    : 'Paytm Health Secure Plus (POL-HEALTH-001, Sum Insured ₹5,00,000, 100% active balance)';
  const attachedDocs =
    caseData?.attachedDocsSummary ??
    'Discharge Summary (verified), Bills (verified), Aadhaar (verified), Prescription (verified)';

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6 md:p-8 shadow-sm">
      {/* ⚠️ Transparent Prototype Banner */}
      <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🛡️</span>
          <span>
            <strong>HUMAN SUPPORT HANDOFF — PROTOTYPE DEMO:</strong> Responsible human-in-the-loop escalation safeguard. No remote call center connection or video transmission is established. Voice & camera interactions run strictly on your local browser.
          </span>
        </div>
        <Badge variant="warning" size="sm" className="shrink-0 uppercase font-bold text-[10px]">
          Demo Session
        </Badge>
      </div>

      {/* Header with Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-indigo-100/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-indigo-950">
              {isOfficerMode ? 'Claims Officer Adjudication Console' : 'Human Support Handoff'}
            </h2>
            <Badge
              variant={
                isReviewed
                  ? 'success'
                  : isAssignedToMe
                  ? 'indigo'
                  : 'warning'
              }
              size="sm"
            >
              {statusLabel}
            </Badge>

            {isOfficerMode && caseData?.priority && (
              <Badge
                variant={
                  caseData.priority === 'Critical'
                    ? 'danger'
                    : caseData.priority === 'High'
                    ? 'warning'
                    : 'indigo'
                }
                size="sm"
              >
                {caseData.priority} Priority
              </Badge>
            )}

            {blockingContradiction && (
              <Badge variant="danger" size="sm">
                Blocking Conflict
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {isOfficerMode
              ? 'Real-time claim escalation review with AI confidence triage and verified clinical documents.'
              : 'Interactive escalation safeguard for policyholders requiring complex clarification or human review.'}
          </p>
        </div>

        <div className="text-right flex flex-col sm:items-end">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Escalation Ticket
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="text-text-muted hover:text-indigo-950 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close case view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <span className="font-mono text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 mt-0.5">
            {ticketId}
          </span>
        </div>
      </div>

      {/* Officer Profile & Ticket Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {/* Officer Card with Interactive Voice & Camera Controls */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/90 to-sky-50/50 border border-indigo-100 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {officerInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <h3 className="text-sm font-bold text-indigo-950">{officerName}</h3>
          <p className="text-xs text-text-secondary">{officerTitle}</p>
          <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full mt-2 font-medium">
            {officerBadge}
          </span>

          {/* Real Session Status Indicators */}
          <div className="w-full mt-3 p-2 rounded-lg bg-white/80 border border-indigo-100 text-[10px] text-left space-y-1 text-text-muted">
            <div className="flex justify-between items-center">
              <span>Voice Channel:</span>
              <span className={`font-semibold ${isListening ? 'text-red-600 animate-pulse' : 'text-slate-600'}`}>
                {isListening ? '🎙️ Listening to mic' : 'Microphone idle'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Camera Channel:</span>
              <span className={`font-semibold ${isCameraActive ? 'text-emerald-600' : 'text-slate-600'}`}>
                {isCameraActive ? '📹 Self-view active' : 'Camera off'}
              </span>
            </div>
          </div>

          {/* Interactive Microphone & Camera Action Buttons (Change 4) */}
          <div className="w-full mt-3 pt-3 border-t border-indigo-200/60 space-y-2">
            {/* 🎙️ Voice Interaction Button */}
            <Button
              variant={isListening ? 'danger' : 'primary'}
              size="sm"
              onClick={isListening ? stopListening : startListening}
              disabled={!isSpeechSupported}
              className="w-full text-xs flex items-center justify-center gap-1.5"
            >
              {isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>⏹️ Stop Voice (Listening...)</span>
                </>
              ) : (
                <>
                  <span>🎙️</span>
                  <span>Start Voice (Microphone Demo)</span>
                </>
              )}
            </Button>

            {/* 📹 Optional Camera Preview Button */}
            <Button
              variant={isCameraActive ? 'danger' : 'outline'}
              size="sm"
              onClick={isCameraActive ? stopCameraPreview : startCameraPreview}
              className="w-full text-xs flex items-center justify-center gap-1.5"
            >
              {isCameraActive ? (
                <>
                  <span>⏹️ Stop Camera</span>
                </>
              ) : (
                <>
                  <span>📹 Start Camera Preview</span>
                </>
              )}
            </Button>

            {/* Local Camera Self-View Window */}
            {isCameraActive && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700 w-full animate-fade-in text-left">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Local Self-View
                  </span>
                  <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    Never Transmitted
                  </span>
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-36 object-cover rounded-lg bg-black border border-slate-800"
                />
              </div>
            )}

            {cameraError && (
              <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 text-left">
                ⚠️ {cameraError}
              </p>
            )}

            {speechError && (
              <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 text-left">
                ⚠️ {speechError}
              </p>
            )}

            {/* Officer Console Action Buttons */}
            {isOfficerMode && (
              <div className="pt-2 flex flex-col gap-1.5 w-full">
                <Button
                  variant={isAssignedToMe ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setIsAssignedToMe((prev) => !prev)}
                  className="w-full text-xs"
                >
                  {isAssignedToMe ? '✓ Assigned to Me' : 'Assign to Me'}
                </Button>
                <Button
                  variant={isReviewed ? 'success' : 'secondary'}
                  size="sm"
                  onClick={() => setIsReviewed((prev) => !prev)}
                  className="w-full text-xs"
                >
                  {isReviewed ? '✓ Mark Completed' : 'Mark Reviewed'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* AI Handover Context Card with Real Twin Readiness & Contradiction Data */}
        <div className="md:col-span-2 p-5 rounded-xl bg-slate-50/80 border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <span>Automated Handover Packet</span>
              <Badge
                variant={dynamicReadiness >= 90 && !blockingContradiction ? 'success' : blockingContradiction ? 'danger' : 'warning'}
                size="sm"
              >
                Readiness: {dynamicReadiness}%
              </Badge>
            </h4>
            <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
              blockingContradiction
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              Trigger: {triggerReason}
            </span>
          </div>

          <div className="text-xs text-indigo-950 space-y-2 bg-white p-3 rounded-lg border border-indigo-100/60 leading-relaxed">
            <p>
              <strong>Summary:</strong> {summaryText}
            </p>
            <p>
              <strong>Claimed Gross:</strong> {claimedGross} | <strong>Estimated Payable:</strong> {estimatedPayable} ({deductiblesInfo}).
            </p>
            <p>
              <strong>Policy:</strong> {policyInfo}.
            </p>
            <p>
              <strong>Attached Docs:</strong> {attachedDocs}.
            </p>

            {blockingContradiction && (
              <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-red-900 text-[11px] space-y-1">
                <span className="font-bold block">Contradiction Rationale:</span>
                <span>{blockingContradiction.explanation}</span>
                <div className="flex justify-between text-[10px] text-red-800 pt-1">
                  <span>Expected: {blockingContradiction.values.expected}</span>
                  <span>Found: {blockingContradiction.values.found}</span>
                </div>
              </div>
            )}
          </div>

          {/* Officer Live Note Box (Supports Typing and Voice Dictation) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-indigo-950">
                Direct Note to Officer {officerName}:
              </label>
              {isListening && (
                <span className="text-[10px] text-red-600 font-bold animate-pulse">
                  🎙️ Dictating via Microphone...
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type or click 'Start Voice' to speak your note to the officer..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 text-indigo-950"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (notes.trim()) {
                    setSentNotes(true);
                    setNotes('');
                    resetTranscript();
                  }
                }}
                disabled={!notes.trim()}
                className="text-xs"
              >
                Send Note
              </Button>
            </div>
            {sentNotes && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                ✓ Note transmitted to officer console.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Human Escalation Safeguards */}
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed mb-6">
        <h5 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Responsible Claims Design — Human Oversight Safeguards
        </h5>
        FinJourney AI operates with responsible human oversight safeguards. Automated claim copilot suggestions can be transferred to a human claims specialist upon policyholder request or whenever clause interpretation involves complex medical history or document contradictions.
      </div>

      {/* Footer Navigation CTA */}
      <div className="pt-4 border-t border-indigo-100 flex items-center justify-between">
        {isOfficerMode ? (
          <>
            {onClose ? (
              <button
                onClick={onClose}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to Queue Table
              </button>
            ) : (
              <Link
                href="/journey"
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Switch to Customer Copilot
              </Link>
            )}

            <span className="text-[11px] text-text-muted">
              Demo Console · Read-only simulated adjudications
            </span>
          </>
        ) : (
          <>
            <Link
              href="/journey"
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Claim Copilot
            </Link>

            <Link
              href="/claim/tracking"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View Claim Tracking →
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
