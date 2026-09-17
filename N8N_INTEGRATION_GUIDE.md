# FinJourney AI + n8n Cloud Orchestration Guide

> **Paytm Build for India AI Hackathon — Delhi Edition**  
> *Track Special Recognition: Best Use of n8n in Your Project*

---

## 1. Purpose of n8n in FinJourney AI

FinJourney AI is an agentic, multi-turn copilot for health insurance reimbursement. While the front-end handles conversational document intake, Sarvam AI Hindi/English voice processing, and real-time cross-document contradiction detection, **n8n acts as the event-driven workflow orchestration backbone**.

Once a policyholder explicitly reviews and approves their claim dossier, FinJourney AI emits an ingestion event to n8n to execute an asynchronous, policy-governed post-submission pipeline:

1. **Payload Sanitization & Ingestion Webhook**
2. **AI Triage & Readiness Assessment**
3. **Conditional Routing Engine** (Fast Track vs. Standard Review vs. Human Escalation)
4. **Policyholder Notification Preparation** (Demo simulation)
5. **Hospital/TPA Billing Dossier Reconciliation** (Demo test gateway payload)
6. **Immutable Audit Ledger Generation** (Deterministic compliance record)

---

## 2. Orchestration Architecture

```
                       [ Policyholder Ingestion ]
                        FinJourney AI Frontend
                                   │
                                   ▼ POST /api/n8n/trigger
             ┌──────────────────────────────────────────────┐
             │ FinJourney API Gateway (Fail-Safe Proxy)     │
             │ Strict 3000ms Timeout & Local Simulation     │
             └──────────────────────┬───────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
         [ N8N_WEBHOOK_URL Configured ]     [ Offline / Fallback ]
                n8n Cloud Webhook              Deterministic Local
            (finjourney-claim endpoint)        Simulation Engine
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    │
                                    ▼
                     AI Triage & Readiness Evaluation
                                    │
                  ┌─────────────────┴─────────────────┐
                  │          Conditional Router       │
                  └─────────────────┬─────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
  [ Contradictions > 0 ]      [ Readiness ≥ 90% ]            [ Else ]
    HUMAN_REVIEW                FAST_TRACK               STANDARD_REVIEW
  (Senior Officer Desk)    (Expedited Queue — 24h)     (Standard Queue — 48h)
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
                       Policyholder Alert Prep
                                    │
                                    ▼
                      Hospital Billing Dossier Prep
                                    │
                                    ▼
                       Immutable Compliance Audit Log
                                    │
                                    ▼
                       Webhook Response / UI Sync
```

> **Safeguard Clarification:** "Fast Track" represents workflow routing priority (24-hour adjudication SLA). It does **not** represent automated payout. FinJourney AI preserves all explicit review, medical underwriting, and human verification checkpoints.

---

## 3. How to Redeem the Hackathon n8n Voucher

The hackathon organizers provided an exclusive hackathon community voucher for n8n Cloud:

* **Voucher Code:** `2026-COMMUNITY-HACKATHON-INDIA-18D35A55`
* **Applicability:** n8n Cloud trial / pro credit for participants during the offline hackathon.

### Steps to Activate:
1. Sign up or log into [n8n Cloud](https://n8n.io/cloud/).
2. Navigate to **Settings → Billing & Plans**.
3. Select **Redeem Voucher / Coupon** and paste `2026-COMMUNITY-HACKATHON-INDIA-18D35A55`.
4. Confirm activation to obtain your dedicated cloud workflow workspace.

---

## 4. How to Import the Workflow

FinJourney AI includes a pre-validated, importable 11-node orchestration workflow file:
`n8n-workflows/finjourney-claims-orchestrator.json` (also accessible via the live app by clicking **"Download n8n Workflow JSON"**).

### Importing into n8n:
1. Open your n8n Cloud workspace.
2. In the left navigation menu, click **Workflows → Add Workflow**.
3. Click the three dots menu (**⋮**) in the upper-right corner of the canvas and select **Import from File**.
4. Upload `finjourney-claims-orchestrator.json`.
5. The workflow canvas will populate with 11 connected nodes:
   - `Claim Webhook Trigger`
   - `Validate Claim Payload`
   - `AI Triage & Readiness Assessment`
   - `Is Human Review Required?`
   - `Is Fast Track Eligible?`
   - `Human Review Branch`
   - `Fast Track Branch`
   - `Standard Review Branch`
   - `Prepare Policyholder Alert`
   - `Prepare Hospital Dossier`
   - `Generate Audit Record`
   - `Respond to FinJourney AI`
6. Click **Save** in n8n.
7. Toggle the workflow status from **Inactive** to **Active**.
8. Copy the Production or Test Webhook URL from the `Claim Webhook Trigger` node (e.g., `https://<workspace>.app.n8n.cloud/webhook/finjourney-claim`).

---

## 5. How to Configure N8N_WEBHOOK_URL

Add the webhook URL to your environment configuration:

1. Copy `.env.example` to `.env.local` if not already present:
   ```bash
   cp .env.example .env.local
   ```
2. Set `N8N_WEBHOOK_URL` in `.env.local`:
   ```bash
   # Optional: n8n Cloud Webhook URL for FinJourney AI claim orchestration
   N8N_WEBHOOK_URL=https://<your-instance>.app.n8n.cloud/webhook/finjourney-claim
   ```
3. Restart the Next.js server (`npm run dev`).

> **Security Rule:** Never commit `.env.local` or private n8n API tokens to Git. FinJourney AI's server-side API proxy strictly executes outbound webhook dispatches to prevent client-side credential exposure.

---

## 6. How Live Mode Works

When `N8N_WEBHOOK_URL` is configured and accessible:

1. When a claim is submitted or the user clicks **"Run Claim Automation"** on `/claim/tracking`, the client invokes `POST /api/n8n/trigger`.
2. The server dispatches the claim packet (claim ID, readiness score, contradiction list, gross amounts, deductibles, patient and hospital details) to n8n Cloud.
3. The server uses an `AbortSignal.timeout(3000)` safeguard.
4. n8n executes the DAG nodes, generates the audit record, prepares notification and hospital sync payloads, and responds with HTTP 200.
5. The UI displays the **"● Live n8n Cloud"** badge, execution ID, live latency (in milliseconds), and interactive node-by-node execution trail.

---

## 7. How Simulation Mode Works (Offline-First Venue Reliability)

Hackathon Wi-Fi venues are frequently unstable. If:
- `N8N_WEBHOOK_URL` is omitted,
- n8n Cloud is unreachable,
- DNS fails or the request times out after 3000ms, or
- Internet connectivity is disrupted,

**FinJourney AI never crashes and never fails the demo.**

Instead, `src/app/api/n8n/trigger/route.ts` executes a deterministic local simulation executing the exact identical mathematical routing rules:
- `IF contradictions.length > 0` $\rightarrow$ `HUMAN_REVIEW` (Priority: Critical)
- `ELSE IF readinessScore >= 90` $\rightarrow$ `FAST_TRACK` (Priority: High)
- `ELSE` $\rightarrow$ `STANDARD_REVIEW` (Priority: Medium)

The response structure, node states, notification drafts, hospital sync payloads, and audit records match the n8n Cloud schema 100%, and the visualizer clearly indicates **"● Local Simulation"**.

---

## 8. How to Test the Workflow

### Method 1: Interactive Claim Flow
1. Navigate to `http://localhost:3000/journey`.
2. Complete document verification (e.g., select policy, verify documents, proceed to draft).
3. Review claim draft and click **"Approve & Submit Claim"**.
4. On `/claim/tracking`, scroll to **"Automated Claim Orchestration"**.
5. Observe the automated pipeline status, active route branch, and click the inspection tabs:
   - **Execution Trace**
   - **Customer Alert Payload**
   - **Hospital Dossier Payload**
   - **Audit Record**

### Method 2: Offline Fallback Verification
1. Ensure `N8N_WEBHOOK_URL` is commented out or set to an invalid URL (`https://invalid-host-999.example/webhook`).
2. Trigger the automation.
3. Verify that the response returns in ~45ms without throwing an unhandled exception, displaying **"● Local Simulation"**.

### Method 3: Live n8n Cloud Connection Testing
1. On the tracking page, expand **"► Advanced / Test n8n Connection"**.
2. Enter your live n8n webhook URL and click **"Test Custom URL"**.
3. Inspect live webhook logs directly inside n8n Cloud's **Executions** tab.

---

## 9. How to Demonstrate to Judges (2-Minute Pitch)

```
"Judges, FinJourney AI doesn't stop at conversational copilot interactions.
Once Rahul approves his claim, watch our automated backend orchestration layer powered by n8n.

1. High-Confidence Demo (Readiness 92%, 0 Contradictions):
   - The claim hits our n8n webhook.
   - The AI Triage node evaluates high readiness and routes the packet to FAST TRACK (24-hour SLA priority).
   - Notice how customer alerts and hospital sync payloads are automatically staged, and an immutable audit hash is recorded.

2. Contradiction & Safeguard Demo (Discrepancy Scenario):
   - When a bill date or amount mismatch is detected, the n8n conditional router immediately diverts the claim to HUMAN REVIEW.
   - Now switch to the 'Claims Officer Console' (/officer) -> Automation tab:
     You can see the exact n8n Execution ID, why straight-through processing was halted, and the SLA assigned to Priya Verma.

3. Resilience:
   - Everything runs live against n8n Cloud, but also includes a deterministic offline fallback so venue Wi-Fi drops will never break the demonstration.
   - You can download the complete, production-ready 11-node workflow JSON right from the interface."
```

---

## 10. Compliance & Ethical Guardrails

- **Synthetic Test Data:** All patient records, hospital names, policy numbers, and amounts are synthetic hackathon fixtures.
- **No Direct Payout Claims:** Fast Track denotes queue prioritization for human/insurer review; it does not claim automated fund disbursement.
- **Simulated Communication:** Notification and hospital synchronization steps are clearly marked with `Demo` labels.
