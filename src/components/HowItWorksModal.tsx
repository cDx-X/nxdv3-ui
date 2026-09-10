import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { HowItWorksPart1 } from './HowItWorksPart1';
import { HowItWorksPart2 } from './HowItWorksPart2';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="icon-gold" />
            <h2 className="text-lg font-bold">NXD v3 — Protocol Documentation</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="lead-text">
            NXDv3 Protocol introduces the NXDv3 token, a hyper-deflationary cryptocurrency designed
            as a deflationary derivative of the DXNv2 Protocol.
            <li>
              {' '}
              Deflationary Tokenomics & Price Floor: Utilizing an automated vault system, it aims to
              increase its value by employing strategies that burn NXDv3 tokens, including a Fee on
              Transfer mechanism and Locked Liquidity to boost the price floor. This enhances the
              protocol's ROI by reducing the supply of NXDv3 tokens and increasing their baseline
              price, mirroring share buyback strategies of listed companies to enhance shareholder
              value.
            </li>
            <li>
              {' '}
              Deflationary Derivative of DXNv2: NXDv3's connection with the DXNv2 Protocol signifies
              that an optimistic outlook on DXNv2 translates to a stronger belief in NXDv3's
              potential, given its role as a derivative. The protocol's tokenomics are structured to
              benefit NXDv3 minters by leveraging deflationary mechanisms, including a
              buy-back-and-burn program, which incrementally elevates NXDv3's value over DXN and
              improves the ROI per NXDv3 token.
            </li>
            <li>
              Increasing the Intrinsic Value of NXD: Value levers within the NXD Protocol, such as
              ETH income through DXN staking and Fee-on-Transfer mechanisms, aim to prevent value
              leakage and ensure a sustainable income stream. These measures also include enhancing
              liquidity through community LPs and utilizing trading volumes to further increase the
              DXN Price Floor.
            </li>
            <li>
              Rising Floor Price: A key feature of NXD is its perpetually increasing price floor,
              achieved through a combination of capped supply, locked liquidity, and deflationary
              tokenomics. This creates a favorable imbalance between NXD and DXN, positioning NXD as
              a growing store of value within the DXN ecosystem and paving the way for future dApp
              development.
            </li>
            The protocol operates on a continuous feedback loop: capturing fees from DBXen,
            executing automated buybacks, burning tokens permanently, and distributing raw ETH
            directly to NXDv3 stakers.
          </p>

          <HowItWorksPart1 />
          <HowItWorksPart2 />
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
