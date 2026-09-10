import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { WhyPart1 } from './WhyPart1';
import { WhyPart2 } from './WhyPart2';
import { WhyPart3 } from './WhyPart3';
import { WhyPart4 } from './WhyPart4';
import { WhyPart5 } from './WhyPart5';
import { WhyPart6 } from './WhyPart6';

interface WhyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyModal: React.FC<WhyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '92vw' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="icon-gold" />
            <h2 className="text-lg font-bold">Why NXDv3? — Technical Audit & Comparison Report</h2>
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
          <WhyPart1 />
          <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
          <WhyPart2 />
          <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
          <WhyPart3 />
          <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
          <WhyPart4 />
          <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
          <WhyPart5 />
          <hr style={{ borderColor: 'var(--border-color)', opacity: 0.3 }} />
          <WhyPart6 />
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
