import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { AuditPart1 } from './AuditPart1';
import { AuditPart2 } from './AuditPart2';
import { AuditPart3 } from './AuditPart3';
import { AuditPart4 } from './AuditPart4';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '92vw' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2 modal-header-group">
            <ShieldCheck size={20} className="icon-gold" />
            <h2 className="text-lg font-bold">
              A.I. Smart Contract Architecture, Mathematical Verification, and Security Audit
            </h2>
            <p className="modal-header-subtitle">
              NXDv3 Protocol smart contracts - audited periodically
            </p>
            <p className="modal-header-subtitle">Last updated: 10/09/2026</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body audit-body">
          <AuditPart1 />
          <hr />
          <AuditPart2 />
          <hr />
          <AuditPart3 />
          <hr />
          <AuditPart4 />
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close Audit Report
          </button>
        </div>
      </div>
    </div>
  );
};
