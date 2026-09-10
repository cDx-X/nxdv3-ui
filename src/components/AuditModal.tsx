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
        style={{ maxWidth: '850px', width: '92vw' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="icon-gold" />
            <h2 className="text-lg font-bold">A.I. Smart Contract Audit</h2>
            <p>NXDv3 Protocol smart contracts - audited periodically</p>
            <p>Last updated: 14/08/2026</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            maxHeight: '72vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          <AuditPart1 />
          <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
          <AuditPart2 />
          <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
          <AuditPart3 />
          <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
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
