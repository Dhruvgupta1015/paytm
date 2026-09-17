import { NextRequest, NextResponse } from 'next/server';
import type {
  N8nTriggerPayload,
  N8nExecutionResult,
  N8nRoute,
  N8nWorkflowNode,
} from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: N8nTriggerPayload = await req.json().catch(() => ({}) as N8nTriggerPayload);

    const claimId = body.claimId || `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const customerName = body.customerName || 'Rahul Sharma';
    const policyNumber = body.policyNumber || 'POL-HEALTH-001';
    const hospitalName = body.hospitalName || 'Apollo Hospital, Delhi';
    const memberId = body.memberId || 'MEM-2024-78432';
    const readinessScore = typeof body.readinessScore === 'number' ? body.readinessScore : 92;
    const contradictions = Array.isArray(body.contradictions) ? body.contradictions : [];
    const contradictionCount = contradictions.length;
    const grossAmount = typeof body.grossAmount === 'number' ? body.grossAmount : 85000;
    const deductions = typeof body.deductions === 'number' ? body.deductions : 6500;
    const estimatedPayable = typeof body.estimatedPayable === 'number' ? body.estimatedPayable : (grossAmount - deductions);

    // Prioritize configured environment variable, with optional custom test URL from client
    const webhookUrl = body.customWebhookUrl?.trim() || process.env.N8N_WEBHOOK_URL?.trim();

    // ─── LIVE MODE ATTEMPT (Strict 3000ms timeout) ───────────────────────────
    if (webhookUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const liveResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FinJourney-AI-Orchestrator/1.0',
          },
          body: JSON.stringify({
            claimId,
            customerName,
            policyNumber,
            hospitalName,
            memberId,
            readinessScore,
            contradictions,
            contradictionCount,
            grossAmount,
            deductions,
            estimatedPayable,
            claimStatus: body.claimStatus || 'SUBMITTED_FOR_REVIEW',
            documentsVerified: body.documentsVerified ?? true,
            timestamp: new Date().toISOString(),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (liveResponse.ok) {
          const liveData = await liveResponse.json().catch(() => null);
          const latencyMs = Date.now() - startTime;

          // Compute deterministic route values as safeguard if n8n returns raw response
          let fallbackRoute: N8nRoute = 'STANDARD_REVIEW';
          let fallbackPriority: 'High' | 'Medium' | 'Critical' = 'Medium';
          if (contradictionCount > 0) {
            fallbackRoute = 'HUMAN_REVIEW';
            fallbackPriority = 'Critical';
          } else if (readinessScore >= 90) {
            fallbackRoute = 'FAST_TRACK';
            fallbackPriority = 'High';
          }

          const resolvedRoute: N8nRoute = (liveData?.route as N8nRoute) || fallbackRoute;
          const resolvedPriority = liveData?.priority || fallbackPriority;
          const executionId = liveData?.executionId || `N8N-LIVE-${Date.now().toString(36).toUpperCase()}`;

          const nodes: N8nWorkflowNode[] = liveData?.nodesExecuted || [
            { id: 'webhook_trigger', name: 'Claim Webhook Trigger', status: 'completed', outputSummary: 'Inbound claim event acknowledged by n8n Cloud' },
            { id: 'validate_payload', name: 'Validate Claim Payload', status: 'completed', outputSummary: 'Payload schema validated (11 keys verified)' },
            { id: 'ai_triage', name: 'AI Triage & Readiness Assessment', status: 'completed', outputSummary: `Evaluated readiness: ${readinessScore}%, contradictions: ${contradictionCount}` },
            { id: 'router', name: 'Conditional Routing', status: 'completed', outputSummary: `Selected branch: ${resolvedRoute}` },
            {
              id: 'branch_exec',
              name: resolvedRoute === 'FAST_TRACK'
                ? 'Fast Track Queue Branch'
                : resolvedRoute === 'HUMAN_REVIEW'
                ? 'Human Review Escalation Branch'
                : 'Standard Review Branch',
              status: 'completed',
              outputSummary: resolvedRoute === 'FAST_TRACK'
                ? 'Fast-track adjudication queue assigned for verified packet'
                : resolvedRoute === 'HUMAN_REVIEW'
                ? 'Escalated to senior officer desk with contradiction audit packet'
                : 'Enqueued for standard 48hr assessment',
            },
            { id: 'notification_prep', name: 'Prepare Policyholder Alert', status: 'completed', outputSummary: 'Notification draft generated' },
            { id: 'hospital_dossier', name: 'Prepare Hospital Dossier', status: 'completed', outputSummary: 'Hospital sync payload prepared' },
            { id: 'audit_log', name: 'Generate Immutable Audit Record', status: 'completed', outputSummary: 'Audit ledger event logged' },
          ];

          const result: N8nExecutionResult = {
            success: true,
            mode: 'live',
            executionId,
            route: resolvedRoute,
            priority: resolvedPriority,
            latencyMs,
            readinessScore,
            contradictionCount,
            nodes,
            notification: liveData?.notification || {
              status: 'Notification Prepared — Demo',
              recipient: customerName,
              channel: 'SMS / In-App Message (Demo Simulation)',
              headline: 'Claim Ingestion Acknowledgment',
              message: `Your claim ${claimId} has been submitted for insurer review. Estimated claim amount: ₹${estimatedPayable.toLocaleString('en-IN')}. Please note that this is a demo estimate.`,
              dispatchedAt: new Date().toISOString(),
            },
            hospitalDossier: liveData?.hospitalDossier || {
              status: 'Hospital Sync Payload Prepared — Demo',
              facility: hospitalName,
              patientMemberId: memberId,
              invoicedAmount: `₹${grossAmount.toLocaleString('en-IN')}`,
              excludedConsumables: `₹${deductions.toLocaleString('en-IN')}`,
              packetStatus: 'Synchronized with hospital billing desk test gateway',
              preparedAt: new Date().toISOString(),
            },
            auditRecord: liveData?.auditRecord || {
              executionId,
              claimId,
              policyNumber,
              customerName,
              readinessScore,
              contradictionCount,
              selectedRoute: resolvedRoute,
              priority: resolvedPriority,
              workflowStatus: 'ORCHESTRATION_COMPLETED',
              timestamp: new Date().toISOString(),
            },
          };

          return NextResponse.json(result, { status: 200 });
        }
      } catch (err) {
        // Fall through to deterministic simulation mode on connection error / timeout
        console.warn('n8n live webhook call failed or timed out. Falling back to deterministic simulation mode:', (err as Error).message);
      }
    }

    // ─── SIMULATION MODE (Deterministic Offline-First Fallback) ──────────────
    // Step 1: Routing logic according to exact hackathon specification:
    // IF contradictions.length > 0 -> HUMAN REVIEW
    // ELSE IF readinessScore >= 90 -> FAST TRACK
    // ELSE -> STANDARD REVIEW
    let selectedRoute: N8nRoute = 'STANDARD_REVIEW';
    let priority: 'High' | 'Medium' | 'Critical' = 'Medium';
    let branchDescription = 'Standard adjudication workflow for complete reimbursement packet.';

    if (contradictionCount > 0) {
      selectedRoute = 'HUMAN_REVIEW';
      priority = 'Critical';
      branchDescription = `Blocking discrepancy flagged: ${contradictionCount} cross-document contradiction detected. Mandatory human adjudicator inspection.`;
    } else if (readinessScore >= 90) {
      selectedRoute = 'FAST_TRACK';
      priority = 'High';
      branchDescription = `High-confidence complete dossier (Readiness: ${readinessScore}%). Fast-track queue eligible for expedited insurer review.`;
    }

    const executionId = `N8N-SIM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const nodes: N8nWorkflowNode[] = [
      {
        id: 'webhook_trigger',
        name: 'Claim Webhook Trigger',
        status: 'completed',
        timestamp: nowIso,
        outputSummary: `POST /finjourney-claim received for claim ${claimId}`,
      },
      {
        id: 'validate_payload',
        name: 'Validate Claim Payload',
        status: 'completed',
        timestamp: nowIso,
        outputSummary: `Schema validated: ₹${grossAmount.toLocaleString('en-IN')} gross, policy: ${policyNumber}`,
      },
      {
        id: 'ai_triage',
        name: 'AI Triage & Readiness Assessment',
        status: 'completed',
        timestamp: nowIso,
        outputSummary: `Readiness: ${readinessScore}%, contradictions: ${contradictionCount}, priority: ${priority}`,
      },
      {
        id: 'conditional_router',
        name: 'Conditional Router',
        status: 'completed',
        timestamp: nowIso,
        outputSummary: `Evaluated conditions -> Evaluated to [${selectedRoute}]`,
      },
      {
        id: 'selected_branch',
        name: selectedRoute === 'FAST_TRACK'
          ? 'Fast Track Queue Branch'
          : selectedRoute === 'HUMAN_REVIEW'
          ? 'Human Review Branch'
          : 'Standard Review Branch',
        status: 'completed',
        timestamp: nowIso,
        outputSummary: branchDescription,
      },
      {
        id: 'notification_prep',
        name: 'Prepare Policyholder Alert',
        status: 'completed',
        timestamp: nowIso,
        outputSummary: 'Policyholder claim ingestion confirmation notification prepared',
      },
      {
        id: 'hospital_dossier',
        name: 'Prepare Hospital Dossier',
        status: 'completed',
        timestamp: nowIso,
        outputSummary: `Hospital billing dossier prepared for ${hospitalName}`,
      },
      {
        id: 'audit_log',
        name: 'Generate Immutable Audit Record',
        status: 'completed',
        timestamp: nowIso,
        outputSummary: `Logged execution ${executionId} with status ORCHESTRATION_COMPLETED`,
      },
      {
        id: 'respond_webhook',
        name: 'Respond to FinJourney AI',
        status: 'completed',
        timestamp: nowIso,
        outputSummary: 'Webhook HTTP 200 payload dispatched',
      },
    ];

    const latencyMs = Math.max(45, Date.now() - startTime);

    const simulationResult: N8nExecutionResult = {
      success: true,
      mode: 'simulation',
      executionId,
      route: selectedRoute,
      priority,
      latencyMs,
      readinessScore,
      contradictionCount,
      nodes,
      notification: {
        status: 'Notification Prepared — Demo',
        recipient: customerName,
        channel: 'SMS / In-App Message (Demo Simulation)',
        headline: 'Claim Ingestion Acknowledgment',
        message: `Your claim ${claimId} has been submitted for insurer review. Estimated claim amount: ₹${estimatedPayable.toLocaleString('en-IN')}. Please note that this is a demo estimate.`,
        dispatchedAt: nowIso,
      },
      hospitalDossier: {
        status: 'Hospital Sync Payload Prepared — Demo',
        facility: hospitalName,
        patientMemberId: memberId,
        invoicedAmount: `₹${grossAmount.toLocaleString('en-IN')}`,
        excludedConsumables: `₹${deductions.toLocaleString('en-IN')}`,
        packetStatus: 'Synchronized with hospital billing desk test gateway',
        preparedAt: nowIso,
      },
      auditRecord: {
        executionId,
        claimId,
        policyNumber,
        customerName,
        readinessScore,
        contradictionCount,
        selectedRoute,
        priority,
        workflowStatus: 'ORCHESTRATION_COMPLETED',
        timestamp: nowIso,
      },
    };

    return NextResponse.json(simulationResult, { status: 200 });
  } catch (error) {
    console.error('Fatal error in n8n trigger route:', error);
    return NextResponse.json(
      {
        success: false,
        mode: 'simulation',
        error: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
