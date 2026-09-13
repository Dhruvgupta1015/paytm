'use client';

import React from 'react';
import policies from '@/data/policies.json';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useJourney } from '@/context/JourneyContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { selectPolicy, resetJourney, goToStep } = useJourney();
  const router = useRouter();

  const handleStartClaimForPolicy = (policyId: string) => {
    resetJourney();
    selectPolicy(policyId);
    goToStep('policy');
    router.push('/journey');
  };

  return (
    <div className="min-h-[calc(100vh-128px)] bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Card */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-700 to-sky-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
              RS
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-indigo-950">Rahul Sharma</h1>
                <Badge variant="success" size="sm">
                  KYC Verified · Tier 1
                </Badge>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Paytm Member ID: <span className="font-mono text-indigo-900 font-semibold">MEM-2024-78432</span> · Mobile: +91 98765 43210
              </p>
              <div className="flex items-center gap-4 text-xs text-text-muted mt-2">
                <span>Age: 32</span>
                <span>•</span>
                <span>City: New Delhi</span>
                <span>•</span>
                <span>Linked UPI: rahul.sharma@paytm</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                resetJourney();
                router.push('/journey');
              }}
              className="w-full md:w-auto text-xs"
            >
              Start New Claim Journey →
            </Button>
          </div>
        </div>

        {/* Active Policies Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-indigo-950">
                Active Health Insurance Policies ({policies.length})
              </h2>
              <p className="text-xs text-text-secondary">
                Policies integrated with instant cashless & reimbursement Copilot
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                        {pol.provider}
                      </span>
                      <h3 className="text-base font-bold text-indigo-950 mt-1">
                        {pol.name}
                      </h3>
                      <p className="text-xs font-mono text-text-muted">{pol.id}</p>
                    </div>
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-indigo-100/60 my-4 text-xs">
                    <div>
                      <span className="text-text-muted block text-[11px]">Sum Insured</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        ₹{pol.sumInsured.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[11px]">Annual Premium</span>
                      <span className="font-semibold text-indigo-950 text-sm">
                        ₹{pol.premium.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-indigo-100/50">
                      <span className="text-text-muted block text-[11px]">Room Rent Clause</span>
                      <span className="font-medium text-indigo-950">
                        {pol.coverage.roomRent}
                      </span>
                    </div>
                  </div>

                  {/* Coverage highlights */}
                  <div className="space-y-1 text-xs text-text-secondary mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500">✓</span>
                      <span>Pre-Hospitalization: {pol.coverage.preHospitalization}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500">✓</span>
                      <span>Post-Hospitalization: {pol.coverage.postHospitalization}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500">✓</span>
                      <span>Ambulance Cover: ₹{pol.coverage.ambulance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-indigo-100/80 flex items-center justify-between">
                  <Link
                    href={`/journey`}
                    onClick={() => selectPolicy(pol.id)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Ask Copilot About Clauses →
                  </Link>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStartClaimForPolicy(pol.id)}
                    className="text-xs"
                  >
                    File Claim Against Policy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Claims History Table */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs">
          <h3 className="text-base font-bold text-indigo-950 mb-3">
            Claims History & Active Filings
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-indigo-100/80 text-text-muted">
                  <th className="py-2.5 px-3 font-semibold">Claim ID</th>
                  <th className="py-2.5 px-3 font-semibold">Policy</th>
                  <th className="py-2.5 px-3 font-semibold">Hospital</th>
                  <th className="py-2.5 px-3 font-semibold">Claim Amount</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-indigo-50/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-indigo-900">CLM-2026-00142</td>
                  <td className="py-3 px-3">Paytm Health Secure Plus</td>
                  <td className="py-3 px-3 font-medium">Apollo Hospital, Delhi</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">₹85,000 (Gross)</td>
                  <td className="py-3 px-3">
                    <Badge variant="warning" size="sm">Submitted for Review</Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link href="/claim/tracking" className="font-semibold text-indigo-600 hover:underline">
                      Track Live →
                    </Link>
                  </td>
                </tr>
                <tr className="hover:bg-indigo-50/30 transition-colors opacity-70">
                  <td className="py-3 px-3 font-mono">CLM-2025-00891</td>
                  <td className="py-3 px-3">Paytm Family Shield</td>
                  <td className="py-3 px-3">Max Hospital, Saket</td>
                  <td className="py-3 px-3">₹34,000</td>
                  <td className="py-3 px-3">
                    <Badge variant="success" size="sm">Settled (₹32,200)</Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-text-muted">Archived</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
