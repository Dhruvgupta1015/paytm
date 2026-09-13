'use client';

import React, { useState, useRef } from 'react';
import { ClaimDocument, DocumentType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DocumentUploadProps {
  documents: ClaimDocument[];
  onAddDocument: (doc: ClaimDocument) => void;
  onRemoveDocument?: (id: string) => void;
}

const SAMPLE_DEMO_DOCS: { name: string; type: DocumentType; size: string }[] = [
  { name: 'discharge_summary_apollo.pdf', type: 'discharge_summary', size: '1.4 MB' },
  { name: 'hospital_final_bill_85000.pdf', type: 'bills', size: '2.8 MB' },
  { name: 'aadhaar_rahul_sharma.pdf', type: 'identity', size: '820 KB' },
  { name: 'doctor_dengue_treatment_rx.pdf', type: 'prescription', size: '540 KB' },
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  onAddDocument,
  onRemoveDocument,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (fileName: string, type: DocumentType = 'other') => {
    setIsUploading(true);
    setTimeout(() => {
      const newDoc: ClaimDocument = {
        id: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: fileName,
        type,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
      };
      onAddDocument(newDoc);
      setIsUploading(false);
    }, 400);
  };

  const handleQuickAddAll = () => {
    setIsUploading(true);
    SAMPLE_DEMO_DOCS.forEach((sample, idx) => {
      setTimeout(() => {
        const newDoc: ClaimDocument = {
          id: `DOC-DEMO-${idx + 1}-${Date.now()}`,
          name: sample.name,
          type: sample.type,
          status: 'pending',
          uploadedAt: new Date().toISOString(),
        };
        onAddDocument(newDoc);
        if (idx === SAMPLE_DEMO_DOCS.length - 1) {
          setIsUploading(false);
        }
      }, (idx + 1) * 200);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let inferredType: DocumentType = 'other';
      const lower = file.name.toLowerCase();
      if (lower.includes('discharge')) inferredType = 'discharge_summary';
      else if (lower.includes('bill') || lower.includes('invoice')) inferredType = 'bills';
      else if (lower.includes('id') || lower.includes('aadhaar') || lower.includes('pan')) inferredType = 'identity';
      else if (lower.includes('prescription') || lower.includes('rx')) inferredType = 'prescription';

      simulateUpload(file.name, inferredType);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
            <span>Upload Supporting Documents</span>
            <Badge variant="indigo" size="sm">
              Simulated OCR & Parser
            </Badge>
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            PDF, JPG, or PNG up to 10MB each. 4 key documents required for cashless/reimbursement claim.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleQuickAddAll}
          loading={isUploading}
          className="text-xs self-start sm:self-auto bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
        >
          <svg className="w-3.5 h-3.5 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Add 4 Sample Docs (Demo)
        </Button>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            Array.from(files).forEach((f) => simulateUpload(f.name));
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
              : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/20'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg"
        />

        <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="text-sm font-semibold text-indigo-950">
          Click to browse or drag & drop files here
        </p>
        <p className="text-xs text-text-muted mt-1">
          Supports Discharge Summary, Hospital Bills, Aadhaar/PAN, Medical Prescriptions
        </p>
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-3">
            Uploaded Files ({documents.length})
          </h4>
          <div className="space-y-2.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-xl border border-indigo-100/80 bg-slate-50/60 hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-indigo-950 truncate max-w-xs sm:max-w-md">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-text-muted capitalize">
                        {doc.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-text-muted">•</span>
                      <span className="text-[10px] text-text-muted">
                        {new Date(doc.uploadedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      doc.status === 'verified'
                        ? 'success'
                        : doc.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                    size="sm"
                  >
                    {doc.status === 'verified'
                      ? 'Verified'
                      : doc.status === 'rejected'
                        ? 'Needs Review'
                        : 'Pending Check'}
                  </Badge>

                  {onRemoveDocument && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDocument(doc.id);
                      }}
                      className="p-1 text-text-muted hover:text-red-500 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
