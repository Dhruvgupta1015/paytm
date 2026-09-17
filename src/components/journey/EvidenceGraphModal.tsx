'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ClaimEvidenceGraph } from '@/types';

interface EvidenceGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: ClaimEvidenceGraph;
}

export const EvidenceGraphModal: React.FC<EvidenceGraphModalProps> = ({
  isOpen,
  onClose,
  graph,
}) => {
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) || graph.nodes[0];

  const contradictions = graph.relationships.filter((r) => r.isContradiction);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl shadow-xs">
              🕸️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Deterministic Claim Evidence Graph
                </h3>
                <Badge
                  variant={contradictions.length > 0 ? 'danger' : 'success'}
                  size="sm"
                  className="bg-white/10 text-xs py-0.5"
                >
                  {contradictions.length > 0
                    ? `${contradictions.length} Conflict Detected`
                    : 'All Corroborated ✓'}
                </Badge>
              </div>
              <p className="text-xs text-indigo-300 mt-0.5">
                Multi-document cross-verification topology linking clinical, identity & billing facts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* View Mode Switcher & Stats Bar */}
        <div className="bg-slate-50 border-b border-indigo-100/80 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span>
              <strong>{graph.nodes.length}</strong> Evidence Nodes
            </span>
            <span>·</span>
            <span>
              <strong>{graph.relationships.length}</strong> Semantic Relationships
            </span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">
              {(
                (graph.nodes.reduce((acc, n) => acc + n.confidence, 0) / graph.nodes.length) *
                100
              ).toFixed(0)}
              % Avg Confidence
            </span>
          </div>

          <div className="flex items-center bg-white rounded-lg p-1 border border-indigo-100 shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'graph'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-text-secondary hover:text-indigo-950'
              }`}
            >
              🕸️ Interactive Visual Graph
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-text-secondary hover:text-indigo-950'
              }`}
            >
              📊 Linked Evidence Matrix (Table)
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {viewMode === 'graph' ? (
            <div className="space-y-6">
              {/* Contradiction Alert if any */}
              {contradictions.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">⚠️</span>
                  <div>
                    <strong className="font-bold text-red-950">
                      Cross-Document Contradiction Detected in Topology:
                    </strong>
                    <p className="mt-0.5 text-red-800">{contradictions[0].relationship}</p>
                  </div>
                </div>
              )}

              {/* Visual Graph Node Grid */}
              <div>
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-3">
                  Evidence Topology Nodes (Click to Inspect Extracted Facts)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {graph.nodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const nodeTypeBadge =
                      node.type === 'document'
                        ? 'indigo'
                        : node.type === 'policy'
                        ? 'success'
                        : 'default';

                    return (
                      <button
                        type="button"
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant={nodeTypeBadge} size="sm" className="text-[10px]">
                            {node.type.toUpperCase()}
                          </Badge>
                          <span className="text-[11px] font-mono font-bold text-emerald-700">
                            {(node.confidence * 100).toFixed(0)}% Conf.
                          </span>
                        </div>

                        <div className="font-bold text-xs text-indigo-950 truncate mb-1">
                          {node.source}
                        </div>

                        <div className="text-[11px] text-text-secondary line-clamp-2">
                          {node.extractedFacts[0]}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span
                            className={
                              node.verified ? 'text-emerald-700 font-semibold' : 'text-amber-600'
                            }
                          >
                            {node.verified ? '✓ Verified Source' : '○ Pending Confirmation'}
                          </span>
                          <span className="text-indigo-600 font-medium">Inspect Facts →</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Node Inspector */}
              {selectedNode && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-indigo-100/90 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100/80">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📄</span>
                      <div>
                        <h5 className="text-xs font-bold text-indigo-950">
                          Extracted Facts from {selectedNode.source}
                        </h5>
                        <span className="text-[10px] text-text-secondary font-mono">
                          Node ID: {selectedNode.id} · Type: {selectedNode.type}
                        </span>
                      </div>
                    </div>
                    <Badge variant={selectedNode.verified ? 'success' : 'warning'} size="sm">
                      {selectedNode.verified ? 'Verified Active Fact' : 'Unconfirmed'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    {selectedNode.extractedFacts.map((fact, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-slate-800 bg-white p-2 rounded-lg border border-slate-200/70"
                      >
                        <span className="text-indigo-600 font-bold">▪</span>
                        <span>{fact}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connected Relationships for Selected Node */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                      Corroborating Relationships
                    </span>
                    <div className="space-y-1.5">
                      {graph.relationships
                        .filter(
                          (r) =>
                            r.sourceId === selectedNode.id || r.targetId === selectedNode.id
                        )
                        .map((rel, idx) => {
                          const otherNodeId =
                            rel.sourceId === selectedNode.id ? rel.targetId : rel.sourceId;
                          const otherNode = graph.nodes.find((n) => n.id === otherNodeId);

                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                                rel.isContradiction
                                  ? 'bg-red-50 border-red-200 text-red-900 font-semibold'
                                  : 'bg-white border-slate-200 text-text-secondary'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{rel.isContradiction ? '⚠️' : '➔'}</span>
                                <span>
                                  {rel.relationship} ({otherNode?.source || otherNodeId})
                                </span>
                              </div>
                              <span className="font-mono text-[11px] text-indigo-700 shrink-0 ml-2">
                                {(rel.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Structured Evidence Matrix (Table View per prompt spec) */
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-indigo-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 text-indigo-950 font-bold border-b border-indigo-100">
                    <tr>
                      <th className="p-3">Source Document / Node</th>
                      <th className="p-3">Extracted Clinical & Financial Facts</th>
                      <th className="p-3">What It Supports (Target)</th>
                      <th className="p-3">Semantic Relationship</th>
                      <th className="p-3 text-right">Confidence</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {graph.relationships.map((rel, idx) => {
                      const sourceNode = graph.nodes.find((n) => n.id === rel.sourceId);
                      const targetNode = graph.nodes.find((n) => n.id === rel.targetId);

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            rel.isContradiction ? 'bg-red-50/50' : ''
                          }`}
                        >
                          <td className="p-3 font-semibold text-indigo-950 align-top whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">📄</span>
                              <span>{sourceNode?.source}</span>
                            </div>
                            <span className="text-[10px] text-text-muted font-normal block mt-0.5">
                              Type: {sourceNode?.type}
                            </span>
                          </td>
                          <td className="p-3 align-top max-w-xs">
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-text-secondary">
                              {sourceNode?.extractedFacts.slice(0, 2).map((fact, fIdx) => (
                                <li key={fIdx} className="truncate">
                                  {fact}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-3 font-semibold text-indigo-950 align-top whitespace-nowrap">
                            {targetNode?.source}
                          </td>
                          <td className="p-3 align-top">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                                rel.isContradiction
                                  ? 'bg-red-100 text-red-800 font-bold'
                                  : 'bg-indigo-50 text-indigo-800 font-medium'
                              }`}
                            >
                              {rel.relationship}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700 align-top whitespace-nowrap">
                            {(rel.confidence * 100).toFixed(0)}%
                          </td>
                          <td className="p-3 text-center align-top whitespace-nowrap">
                            <Badge
                              variant={
                                rel.isContradiction
                                  ? 'danger'
                                  : sourceNode?.verified
                                  ? 'success'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {rel.isContradiction
                                ? 'Conflict'
                                : sourceNode?.verified
                                ? 'Verified'
                                : 'Pending'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-indigo-100 flex items-center justify-between text-xs text-text-muted shrink-0">
          <span>
            Strictly derived from synthetic demo documents. Zero hallucinated policy terms.
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Evidence Graph
          </Button>
        </div>
      </div>
    </div>
  );
};
