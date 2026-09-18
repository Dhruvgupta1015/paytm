'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { N8nExecutionResult, N8nRoute } from '@/types';

interface N8nWorkflowVisualizerProps {
  claimId: string;
  readinessScore?: number;
  contradictionCount?: number;
  grossAmount?: number;
  deductions?: number;
  estimatedPayable?: number;
  customerName?: string;
  policyNumber?: string;
  hospitalName?: string;
  autoRunOnMount?: boolean;
}

export const N8nWorkflowVisualizer: React.FC<N8nWorkflowVisualizerProps> = ({
  claimId,
  readinessScore = 92,
  contradictionCount = 0,
  grossAmount = 85000,
  deductions = 6500,
  estimatedPayable = 78500,
  customerName = 'Rahul Sharma',
  policyNumber = 'POL-HEALTH-001',
  hospitalName = 'Apollo Hospital, Delhi',
  autoRunOnMount = false,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const storageKey = `finjourney_n8n_exec_${claimId}`;

  // Lazy initialize execution result from session cache
  const [executionResult, setExecutionResult] = useState<N8nExecutionResult | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem(`finjourney_n8n_exec_${claimId}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'trace' | 'notification' | 'hospital' | 'audit'>('trace');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const handleRunWorkflow = useCallback(async (overrideWebhookUrl?: string) => {
    setIsRunning(true);
    setTestStatus(null);

    const payload = {
      claimId,
      customerName,
      policyNumber,
      hospitalName,
      readinessScore,
      contradictions: contradictionCount > 0 ? [{ id: 'flag_1', description: 'Cross-document discrepancy flagged' }] : [],
      grossAmount,
      deductions,
      estimatedPayable,
      claimStatus: 'SUBMITTED_FOR_REVIEW',
      documentsVerified: true,
      customWebhookUrl: overrideWebhookUrl || (customWebhookUrl.trim() ? customWebhookUrl.trim() : undefined),
    };

    try {
      const res = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: N8nExecutionResult = await res.json();
      setExecutionResult(data);

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // Storage safe fallback
      }
    } catch (err) {
      console.error('Workflow trigger exception:', err);
    } finally {
      setIsRunning(false);
    }
  }, [
    claimId,
    customerName,
    policyNumber,
    hospitalName,
    readinessScore,
    contradictionCount,
    grossAmount,
    deductions,
    estimatedPayable,
    customWebhookUrl,
    storageKey,
  ]);

  const hasAutoRunRef = useRef(false);
  useEffect(() => {
    if (autoRunOnMount && !hasAutoRunRef.current && !executionResult && !isRunning) {
      hasAutoRunRef.current = true;
      handleRunWorkflow();
    }
  }, [autoRunOnMount, executionResult, isRunning, handleRunWorkflow]);

  const handleDownloadWorkflowJson = () => {
    const link = document.createElement('a');
    link.href = '/finjourney-claims-orchestrator.json';
    link.download = 'finjourney-claims-orchestrator.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentRoute: N8nRoute = executionResult?.route || (contradictionCount > 0 ? 'HUMAN_REVIEW' : readinessScore >= 90 ? 'FAST_TRACK' : 'STANDARD_REVIEW');

  return (
    <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-2xl border border-indigo-100/90 shadow-sm p-6 md:p-8 space-y-6 mt-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-indigo-100 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-200">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-indigo-950">
              Automated Claim Orchestration
            </h3>
            <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              Powered by n8n
            </span>
            {executionResult && (
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  executionResult.mode === 'live'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {executionResult.mode === 'live' ? '● Live n8n Cloud' : '● Local Simulation'}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Event-driven workflow engine routing claim dossier through AI triage, automated queues, customer alerts, and audit logging.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadWorkflowJson}
            className="text-xs flex items-center gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            title="Download full 11-node n8n workflow file ready to import into n8n Cloud"
          >
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download n8n Workflow JSON</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleRunWorkflow()}
            disabled={isRunning}
            className="text-xs flex items-center gap-1.5 shadow-sm"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Orchestrating...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{executionResult ? 'Re-Run Orchestration' : 'Run Claim Automation'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Orchestration Meta Summary Bar */}
      {executionResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-100/70 border border-indigo-100/70 text-xs">
          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Execution ID</span>
            <span className="font-mono font-bold text-indigo-950 text-xs truncate block" title={executionResult.executionId}>
              {executionResult.executionId}
            </span>
          </div>
          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Routing Decision</span>
            <span className="font-bold text-indigo-950 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                executionResult.route === 'FAST_TRACK' ? 'bg-emerald-500' :
                executionResult.route === 'HUMAN_REVIEW' ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              {executionResult.route}
            </span>
          </div>
          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Execution Latency</span>
            <span className="font-semibold text-emerald-700">{executionResult.latencyMs} ms</span>
          </div>
          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Status</span>
            <span className="font-semibold text-indigo-900">Adjudication Pipeline Dispatched</span>
          </div>
        </div>
      )}

      {/* ─── WORKFLOW PIPELINE VISUALIZATION ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
            <span>Workflow Execution Pipeline</span>
            <span className="text-[10px] font-normal text-text-secondary">
              (Live DAG state progression)
            </span>
          </span>
          <span className="text-[11px] text-text-muted font-medium">
            Readiness: <strong className="text-indigo-900">{readinessScore}%</strong> · Contradictions: <strong className="text-indigo-900">{contradictionCount}</strong>
          </span>
        </div>

        {/* Pipeline Nodes Container */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-inner border border-slate-800 space-y-4 font-sans">
          {/* Linear Nodes 1 to 4 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Node 1: Webhook Ingest */}
            <div className={`p-3 rounded-lg border transition-all ${
              executionResult ? 'bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-slate-800/40 border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>1. Webhook Ingestion</span>
                <span className={executionResult ? 'text-emerald-400' : 'text-slate-500'}>
                  {executionResult ? '✓ 200 OK' : 'Ready'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Receives verified dossier from FinJourney Copilot
              </p>
            </div>

            {/* Node 2: Payload Validation */}
            <div className={`p-3 rounded-lg border transition-all ${
              executionResult ? 'bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-slate-800/40 border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>2. Payload Schema</span>
                <span className={executionResult ? 'text-emerald-400' : 'text-slate-500'}>
                  {executionResult ? '✓ Verified' : 'Ready'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Sanitizes claim ID, gross amounts, & member ID
              </p>
            </div>

            {/* Node 3: AI Triage */}
            <div className={`p-3 rounded-lg border transition-all ${
              executionResult ? 'bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-slate-800/40 border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>3. AI Triage</span>
                <span className={executionResult ? 'text-emerald-400' : 'text-slate-500'}>
                  {executionResult ? `Score: ${readinessScore}%` : 'Ready'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Evaluates readiness score vs contradiction thresholds
              </p>
            </div>

            {/* Node 4: Router */}
            <div className={`p-3 rounded-lg border transition-all ${
              executionResult ? 'bg-slate-800/90 border-indigo-500/50 ring-1 ring-indigo-500/20' : 'bg-slate-800/40 border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>4. Conditional Router</span>
                <span className={executionResult ? 'text-indigo-400' : 'text-slate-500'}>
                  {executionResult ? 'Branching' : 'Ready'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Triages to Fast Track, Standard, or Human Review
              </p>
            </div>
          </div>

          {/* Dynamic 3-Way Routing Decision Branches */}
          <div className="relative pt-1 pb-1">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Orchestrated Queue Routing (Condition: Contradictions &gt; 0 ? Human : Score &ge; 90 ? Fast Track : Standard)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Branch A: Fast Track */}
              <div
                className={`p-3.5 rounded-xl border transition-all relative ${
                  executionResult && currentRoute === 'FAST_TRACK'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/30'
                    : 'bg-slate-800/30 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>⚡ Fast Track Queue</span>
                    {executionResult && currentRoute === 'FAST_TRACK' && (
                      <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                        ACTIVE ROUTE
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono">SLA: 24h</span>
                </div>
                <p className="text-[10px] mt-1.5 leading-relaxed">
                  High-readiness packet eligible for expedited insurer review queue. (Priority routing — non-instant payout).
                </p>
              </div>

              {/* Branch B: Standard Review */}
              <div
                className={`p-3.5 rounded-xl border transition-all relative ${
                  executionResult && currentRoute === 'STANDARD_REVIEW'
                    ? 'bg-blue-950/50 border-blue-500 text-blue-100 ring-2 ring-blue-500/30'
                    : 'bg-slate-800/30 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>⚖️ Standard Review</span>
                    {executionResult && currentRoute === 'STANDARD_REVIEW' && (
                      <span className="text-[9px] bg-blue-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                        ACTIVE ROUTE
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono">SLA: 48h</span>
                </div>
                <p className="text-[10px] mt-1.5 leading-relaxed">
                  Regular claims queue for standard policyholder packet assessment and verification.
                </p>
              </div>

              {/* Branch C: Human Review */}
              <div
                className={`p-3.5 rounded-xl border transition-all relative ${
                  executionResult && currentRoute === 'HUMAN_REVIEW'
                    ? 'bg-red-950/50 border-red-500 text-red-100 ring-2 ring-red-500/30'
                    : 'bg-slate-800/30 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span>🛡️ Human Officer Queue</span>
                    {executionResult && currentRoute === 'HUMAN_REVIEW' && (
                      <span className="text-[9px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded uppercase">
                        ACTIVE ROUTE
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono">SLA: 4h (Critical)</span>
                </div>
                <p className="text-[10px] mt-1.5 leading-relaxed">
                  Discrepancy or contradiction flagged. Enqueued to senior claims officer desk with discrepancy dossier.
                </p>
              </div>
            </div>
          </div>

          {/* Convergence Nodes 5 to 7 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Node 5: Customer Alert Prep */}
            <div className={`p-3 rounded-lg border transition-all ${
              executionResult ? 'bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-slate-800/40 border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>5. Notification Prep</span>
                <span className={executionResult ? 'text-emerald-400' : 'text-slate-500'}>
                  {executionResult ? '✓ Prepared (Demo)' : 'Pending'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Generates policyholder submission acknowledgment SMS/App alert
              </p>
            </div>

            {/* Node 6: Hospital Dossier */}
            <div className={`p-3 rounded-lg border transition-all ${
              executionResult ? 'bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-slate-800/40 border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>6. Hospital Dossier</span>
                <span className={executionResult ? 'text-emerald-400' : 'text-slate-500'}>
                  {executionResult ? '✓ Synced (Demo)' : 'Pending'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Packages billing deductions & test sync payload for hospital desk
              </p>
            </div>

            {/* Node 7: Audit Logger */}
            <div className={`p-3 rounded-lg border transition-all ${
              executionResult ? 'bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-slate-800/40 border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>7. Audit Record</span>
                <span className={executionResult ? 'text-emerald-400' : 'text-slate-500'}>
                  {executionResult ? '✓ Immutable Log' : 'Pending'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Stores deterministic timestamped execution trace for compliance review
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TABBED ARTIFACT INSPECTOR ─────────────────────────────────────── */}
      {executionResult && (
        <div className="pt-2">
          {/* Tab buttons */}
          <div className="flex items-center gap-2 border-b border-indigo-100 pb-2 text-xs font-semibold text-text-secondary">
            <button
              type="button"
              onClick={() => setActiveTab('trace')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'trace'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'hover:bg-slate-100 text-text-secondary'
              }`}
            >
              Execution Trace ({executionResult.nodes.length} Nodes)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notification')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'notification'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'hover:bg-slate-100 text-text-secondary'
              }`}
            >
              Customer Alert Payload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hospital')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'hospital'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'hover:bg-slate-100 text-text-secondary'
              }`}
            >
              Hospital Dossier Payload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'hover:bg-slate-100 text-text-secondary'
              }`}
            >
              Audit Record
            </button>
          </div>

          {/* Tab content: Execution Trace */}
          {activeTab === 'trace' && (
            <div className="mt-3 bg-white rounded-xl border border-indigo-100 p-4 space-y-2.5">
              <div className="text-xs font-bold text-indigo-950 mb-2 flex items-center justify-between">
                <span>Node-by-Node Execution Trail</span>
                <span className="text-[11px] text-text-muted font-normal font-mono">
                  Engine: {executionResult.mode === 'live' ? 'n8n Cloud Webhook Gateway' : 'FinJourney Deterministic Orchestration Engine'}
                </span>
              </div>
              <div className="space-y-2">
                {executionResult.nodes.map((node, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50/80 border border-indigo-100/60 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-indigo-950">{node.name}</span>
                        <span className="text-[10px] font-mono text-emerald-600 font-semibold uppercase">{node.status}</span>
                      </div>
                      {node.outputSummary && (
                        <p className="text-[11px] text-text-secondary mt-0.5">{node.outputSummary}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab content: Notification */}
          {activeTab === 'notification' && (
            <div className="mt-3 bg-white rounded-xl border border-indigo-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950">
                  {executionResult.notification.headline}
                </span>
                <Badge variant="warning" size="sm">
                  {executionResult.notification.status}
                </Badge>
              </div>
              <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-indigo-900">
                  <span><strong>Channel:</strong> {executionResult.notification.channel}</span>
                  <span><strong>Recipient:</strong> {executionResult.notification.recipient}</span>
                </div>
                <div className="p-2.5 rounded bg-white border border-indigo-200/70 text-indigo-950 font-mono text-xs">
                  {executionResult.notification.message}
                </div>
                <p className="text-[10px] text-text-muted">
                  Notice: Message simulation created for the Paytm Build for India AI Hackathon. No live SMS carrier was billed.
                </p>
              </div>
            </div>
          )}

          {/* Tab content: Hospital Dossier */}
          {activeTab === 'hospital' && (
            <div className="mt-3 bg-white rounded-xl border border-indigo-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950">
                  Hospital Billing Desk Sync Payload
                </span>
                <Badge variant="indigo" size="sm">
                  {executionResult.hospitalDossier.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-indigo-100/70 text-xs">
                <div>
                  <span className="text-text-muted block text-[10px]">Medical Facility</span>
                  <span className="font-semibold text-indigo-950">{executionResult.hospitalDossier.facility}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Member Reference</span>
                  <span className="font-mono text-indigo-950 font-semibold">{executionResult.hospitalDossier.patientMemberId}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Invoiced Amount</span>
                  <span className="font-bold text-indigo-950">{executionResult.hospitalDossier.invoicedAmount}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Excluded Items</span>
                  <span className="font-semibold text-amber-700">{executionResult.hospitalDossier.excludedConsumables}</span>
                </div>
              </div>
              <p className="text-[10px] text-text-muted">
                Dossier prepared for insurer-hospital reconciliation. Synthetic hackathon test fixture.
              </p>
            </div>
          )}

          {/* Tab content: Audit Record */}
          {activeTab === 'audit' && (
            <div className="mt-3 bg-white rounded-xl border border-indigo-100 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950">
                  Compliance Audit Ledger Record
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  {executionResult.auditRecord.timestamp}
                </span>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto">
                {JSON.stringify(executionResult.auditRecord, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ─── ADVANCED CONNECTION TESTING (COLLAPSIBLE) ───────────────────────── */}
      <div className="pt-2 border-t border-indigo-100/70">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer"
        >
          <span>{showAdvanced ? '▼' : '►'} Advanced / Test n8n Connection</span>
          <span className="text-[10px] font-normal text-text-secondary">(Optional custom webhook URL)</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-indigo-100 text-xs space-y-3">
            <p className="text-text-secondary text-[11px]">
              By default, FinJourney AI reads <code className="bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded font-mono">N8N_WEBHOOK_URL</code> from your server environment or seamlessly falls back to the deterministic local simulation mode. If you have an active n8n Cloud webhook for live evaluation, you can enter it below to test:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="url"
                placeholder="https://your-n8n-instance.app.n8n.cloud/webhook/finjourney-claim"
                value={customWebhookUrl}
                onChange={(e) => setCustomWebhookUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleRunWorkflow(customWebhookUrl)}
                disabled={isRunning || !customWebhookUrl.trim()}
                className="text-xs"
              >
                Test Custom URL
              </Button>
            </div>
            {testStatus && (
              <p className="text-[11px] text-indigo-700 font-medium">{testStatus}</p>
            )}
            <p className="text-[10px] text-text-muted">
              Note: Credentials and sensitive tokens are never exposed in client bundles. Always keep production secrets in private server environment variables.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
