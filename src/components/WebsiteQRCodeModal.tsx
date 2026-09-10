import React, { useState } from 'react';
import { X, Copy, Check, Smartphone, ExternalLink } from 'lucide-react';

interface WebsiteQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebsiteQRCodeModal: React.FC<WebsiteQRCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const appUrl = window.location.origin;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(appUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', width: '92vw', textAlign: 'center' }}
      >
        <div
          className="modal-header"
          style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Mobile Connection (QR)
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            className="flex items-center gap-2 text-sm text-secondary"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Smartphone size={16} className="icon-blue" />
            <span>Scan with your phone camera or wallet app</span>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'inline-block',
            }}
          >
            <img
              src={qrCodeUrl}
              alt="QR Code to NXDv3 App"
              width={200}
              height={200}
              style={{ display: 'block', borderRadius: '4px' }}
            />
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>App URL:</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.85rem',
              }}
            >
              <span
                style={{ color: 'var(--text-primary)', wordBreak: 'break-all', textAlign: 'left' }}
              >
                {appUrl}
              </span>
              <button
                className="btn btn-secondary"
                onClick={handleCopy}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '70px',
                  justifyContent: 'center',
                }}
                title="Copy link"
              >
                {copied ? <Check size={14} className="icon-success" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
              background: 'rgba(59, 130, 246, 0.08)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              textAlign: 'left',
            }}
          >
            💡 <strong>Tip:</strong> Scanning the QR code on your phone will open the page in your
            mobile browser or wallet, enabling instant wallet connection (MetaMask, Trust, etc.) on
            the Optimism network.
          </div>
        </div>

        <div
          className="modal-footer"
          style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}
        >
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <span>Open in new tab</span>
            <ExternalLink size={14} />
          </a>
          <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
