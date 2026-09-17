'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EscalationPanel } from '@/components/escalation/EscalationPanel';
import type { OfficerQueueCase } from '@/types';

export default function OfficerDashboardPage() {
  const [queue, setQueue] = useState<OfficerQueueCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [localAssignments, setLocalAssignments] = useState<Record<string, boolean>>({});
  const [selectedDossierTab, setSelectedDossierTab] = useState<'dossier' | 'automation'>('dossier');

  useEffect(() => {
    let isMounted = true;
    fetch('/api/officer/queue')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.cases && Array.isArray(data.cases)) {
          setQueue(data.cases);
          if (data.cases.length > 0) {
            setSelectedCaseId(data.cases[0].caseId);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCase = queue.find((c) => c.caseId === selectedCaseId);

  const handleToggleAssign = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalAssignments((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  const filteredQueue = queue.filter((item) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'critical') return item.priority === 'Critical';
    if (filterStatus === 'high') return item.priority === 'High';
    return true;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-128px)] bg-slate-50/60">
      {/* Officer Perspective Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white px-6 py-4 border-b border-indigo-800/40 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-indigo-950 flex items-center justify-center font-black text-sm shadow">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Claims Adjudication Console
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/40 uppercase tracking-wider">
                  Claims Officer View
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Internal human-in-the-loop review queue for escalated, high-value, or ambiguous claim packets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-200 bg-indigo-950/70 border border-indigo-700/50 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Session: Paytm Claims Officer Console</span>
            </span>
          </div>
        </div>
      </div>

      {/* Synthetic Data Notice Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 text-center">
        <p className="text-xs text-amber-900 font-medium">
          ⚠️ <strong>Officer Perspective Demo:</strong> All cases, adjudication decisions, and patient records are synthetic test fixtures. No real policies are modified.
        </p>
      </div>

      {/* Main Body Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Queue Overview & Filters */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <span>Active Escalation Queue</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-200/60">
                  {filteredQueue.length} Cases
                </span>
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Click any row to open the full adjudication dossier and inspect automated findings.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-text-secondary hover:text-indigo-900'
                }`}
              >
                All Cases ({queue.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('critical')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterStatus === 'critical'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-text-secondary hover:text-indigo-900'
                }`}
              >
                Critical (42% AI)
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('high')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterStatus === 'high'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-text-secondary hover:text-indigo-900'
                }`}
              >
                High (68% AI)
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-indigo-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-indigo-950 font-bold border-b border-indigo-100">
                  <th className="py-3 px-4">Claim & Case ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4">Escalation Trigger</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
                {filteredQueue.map((item) => {
                  const isSelected = item.caseId === selectedCaseId;
                  const isAssigned = localAssignments[item.caseId];

                  return (
                    <tr
                      key={item.caseId}
                      onClick={() => setSelectedCaseId(item.caseId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/80 font-medium'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-indigo-900">{item.caseId}</div>
                        <div className="text-[10px] text-text-muted">{item.claimId}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-indigo-950">{item.customerName}</div>
                        <div className="text-[11px] text-text-secondary">
                          {item.hospitalName} · {item.claimedGross}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              item.aiConfidence < 50
                                ? 'bg-red-500'
                                : item.aiConfidence < 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-bold text-indigo-950">
                            {item.aiConfidence}%
                          </span>
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {item.aiConfidence < 50 ? 'Requires Specialist' : 'Ambiguity Threshold'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-text-secondary truncate block" title={item.triggerReason}>
                          {item.triggerReason}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                            {item.officerInitials}
                          </div>
                          <span className="text-indigo-950 font-medium">
                            {isAssigned ? 'You (Assigned)' : item.officerName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            item.priority === 'Critical'
                              ? 'danger'
                              : item.priority === 'High'
                              ? 'warning'
                              : 'indigo'
                          }
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant={isAssigned ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={(e) => handleToggleAssign(item.caseId, e)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          {isAssigned ? '✓ Assigned' : 'Assign to Me'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dossier Detail Section with Adjudication and Automation tabs */}
        {selectedCase ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pb-1 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                  <span>Selected Case:</span>
                  <span className="font-mono text-indigo-600 font-bold">{selectedCase.caseId}</span>
                </h3>
                <span className="text-[11px] text-text-muted">({selectedCase.claimId})</span>
              </div>

              {/* View mode switcher */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setSelectedDossierTab('dossier')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      selectedDossierTab === 'dossier'
                        ? 'bg-white text-indigo-950 shadow-xs font-bold'
                        : 'text-text-secondary hover:text-indigo-900'
                    }`}
                  >
                    📋 Adjudication Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDossierTab('automation')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      selectedDossierTab === 'automation'
                        ? 'bg-indigo-900 text-white shadow-xs font-bold'
                        : 'text-indigo-700 hover:text-indigo-900'
                    }`}
                  >
                    <span>⚡ Automation & n8n Trace</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCaseId(null)}
                  className="text-xs text-text-muted hover:text-indigo-900 px-2 py-1 rounded-lg border border-transparent hover:border-indigo-100"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {selectedDossierTab === 'dossier' ? (
              <EscalationPanel
                caseData={selectedCase}
                isOfficerMode={true}
                onClose={() => setSelectedCaseId(null)}
              />
            ) : (
              /* Automation & n8n Orchestration Section */
              <div className="bg-white rounded-2xl border border-indigo-100 p-6 md:p-8 shadow-sm space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-200">
                        ⚡
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-indigo-950">
                          Automated Claim Orchestration Trace
                        </h3>
                        <p className="text-xs text-text-secondary mt-0.5">
                          n8n workflow execution, routing justification, and compliance audit trail for case {selectedCase.caseId}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href="/finjourney-claims-orchestrator.json"
                    download="finjourney-claims-orchestrator.json"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold"
                    title="Download workflow file for n8n Cloud import"
                  >
                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download n8n Workflow JSON</span>
                  </a>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-indigo-100/80 text-xs">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-semibold">Workflow Branch</span>
                    <span className="font-bold text-red-700 flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      HUMAN_REVIEW
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-semibold">Readiness Score</span>
                    <span className="font-bold text-indigo-950 text-sm mt-0.5 block">{selectedCase.aiConfidence}%</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-semibold">Contradiction Count</span>
                    <span className="font-bold text-indigo-950 text-sm mt-0.5 block">
                      {selectedCase.priority === 'Critical' ? '1 (Discrepancy)' : '0 (Confidence Gated)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-semibold">n8n Execution ID</span>
                    <span className="font-mono font-bold text-indigo-900 text-xs truncate block mt-0.5" title={`N8N-EXEC-${selectedCase.caseId.replace('ESC-', '')}-8842`}>
                      N8N-EXEC-{selectedCase.caseId.replace('ESC-', '')}-8842
                    </span>
                  </div>
                </div>

                {/* Routing Justification Callout */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-300 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-950 font-bold">
                    <span>🛡️ Routing Justification: Why Routed to Human Review</span>
                    <Badge variant="danger" size="sm">
                      HUMAN_REVIEW Diverted
                    </Badge>
                  </div>
                  <p className="text-amber-900 leading-relaxed">
                    {selectedCase.priority === 'Critical'
                      ? `Discrepancy detected: ${selectedCase.triggerReason}. AI triage router evaluated condition (contradictions > 0 or waiting period exception) and automatically halted straight-through processing to prevent unauthorized claim adjudication.`
                      : `AI confidence (${selectedCase.aiConfidence}%) is below the automated fast-track threshold (≥90%). Routed to senior adjudicator queue: ${selectedCase.triggerReason}.`}
                  </p>
                </div>

                {/* Handover Status & SLA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-indigo-100 bg-white space-y-2">
                    <span className="font-bold text-indigo-950 block">Handover & Assignment Status</span>
                    <div className="space-y-1 text-text-secondary">
                      <p><strong>Status:</strong> {selectedCase.status}</p>
                      <p><strong>Assigned Officer:</strong> {selectedCase.officerName} ({selectedCase.officerBadge})</p>
                      <p><strong>Department:</strong> {selectedCase.officerTitle}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-indigo-100 bg-white space-y-2">
                    <span className="font-bold text-indigo-950 block">SLA & Queue Priority</span>
                    <div className="space-y-1 text-text-secondary">
                      <p><strong>Priority:</strong> {selectedCase.priority}</p>
                      <p><strong>Target SLA:</strong> {selectedCase.priority === 'Critical' ? '2 Business Hours' : '4 Business Hours'}</p>
                      <p><strong>Notification Status:</strong> Policyholder notified of human officer handover</p>
                    </div>
                  </div>
                </div>

                {/* Compliance Audit Information */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-950">
                      Immutable Audit Record
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      Hash-locked event ledger
                    </span>
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{JSON.stringify({
  executionId: `N8N-EXEC-${selectedCase.caseId.replace('ESC-', '')}-8842`,
  claimId: selectedCase.claimId,
  caseId: selectedCase.caseId,
  policyNumber: selectedCase.policyNumber,
  customerName: selectedCase.customerName,
  readinessScore: selectedCase.aiConfidence,
  contradictionCount: selectedCase.priority === 'Critical' ? 1 : 0,
  selectedRoute: 'HUMAN_REVIEW',
  workflowBranch: 'Human Escalation Queue',
  routingReason: selectedCase.triggerReason,
  handoverStatus: selectedCase.status,
  assignedOfficer: `${selectedCase.officerName} (${selectedCase.officerBadge})`,
  priority: selectedCase.priority,
  workflowStatus: 'ORCHESTRATION_COMPLETED',
  timestamp: '2026-09-17T16:30:00.000Z'
}, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-indigo-100 text-text-muted text-xs">
            Select an escalation case above to inspect AI handover notes and patient documents.
          </div>
        )}
      </div>
    </div>
  );
}
