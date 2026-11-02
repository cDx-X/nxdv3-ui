import React, { useState, useEffect, useCallback } from 'react';
import { X, Cpu, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { NXDv3ProtocolABI, NXDv3ERC20ABI } from '../abis/contracts';

const PROCESSOR_ADDRESS = '0xf4899A5b0701434f5625C79a8DBee1Dd1A3F827d';
const PROTOCOL_ADDRESS = '0x9a781f3313635047EAfc0BeD3699721bc077161A';
const TAX_RECIPIENT_ADDRESS = '0x45f042890cB43D575A2029930FD4B40Cb751b8eB';
const NXD_TOKEN_ADDRESS = '0x8FCADd5Bd76BD7B4C5f1BeBcB3792B336C979c07';

interface ProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProcessorModal: React.FC<ProcessorModalProps> = ({ isOpen, onClose }) => {
  const { signer, provider, isConnected } = useWallet();

  const [loadingCollect, setLoadingCollect] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [loadingTax, setLoadingTax] = useState(false);

  const [showCollectInfo, setShowCollectInfo] = useState(false);
  const [showRewardsInfo, setShowRewardsInfo] = useState(false);
  const [showTaxInfo, setShowTaxInfo] = useState(false);

  const [collectResult, setCollectResult] = useState<string | null>(null);
  const [rewardsResult, setRewardsResult] = useState<string | null>(null);
  const [taxResult, setTaxResult] = useState<string | null>(null);

  const [claimableFeesData, setClaimableFeesData] = useState<string>('0.0');
  const [protocolBalanceData, setProtocolBalanceData] = useState<string>('0.0');
  const [taxRecipientBalanceData, setTaxRecipientBalanceData] = useState<string>('0.0');

  const fetchData = useCallback(async () => {
    if (!isOpen) return;
    try {
      const activeProvider = provider || ethers.getDefaultProvider('https://mainnet.optimism.io');
      const protocolContract = new ethers.Contract(
        PROTOCOL_ADDRESS,
        NXDv3ProtocolABI,
        activeProvider
      );
      const nxdContract = new ethers.Contract(NXD_TOKEN_ADDRESS, NXDv3ERC20ABI, activeProvider);

      const [claimable, protocolEthBal, taxRecipientBal] = await Promise.all([
        protocolContract.ourClaimableFees().catch(() => 0n),
        activeProvider.getBalance(PROTOCOL_ADDRESS).catch(() => 0n),
        nxdContract.balanceOf(TAX_RECIPIENT_ADDRESS).catch(() => 0n),
      ]);

      setClaimableFeesData(ethers.formatEther(claimable));
      setProtocolBalanceData(ethers.formatEther(protocolEthBal));
      setTaxRecipientBalanceData(ethers.formatEther(taxRecipientBal));
    } catch (err) {
      console.error('Failed to fetch processor view data:', err);
    }
  }, [isOpen, provider]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchData]);

  if (!isOpen) return null;

  const formatProcessorError = (err: any): string => {
    const msg = err?.message || '';
    const shortMsg = err?.shortMessage || '';
    const code = err?.code;
    if (
      code === 'ACTION_REJECTED' ||
      code === 4001 ||
      msg.toLowerCase().includes('rejected') ||
      shortMsg.toLowerCase().includes('rejected') ||
      msg.toLowerCase().includes('user denied')
    ) {
      return 'Error: Transaction rejected by user.';
    }
    if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('reverted')) {
      return 'Error: Transaction execution reverted or insufficient funds.';
    }
    return 'Error: Transaction failed.';
  };

  const handleCollectFees = async () => {
    if (!signer) {
      setCollectResult('Error: Wallet not connected.');
      return;
    }
    try {
      setLoadingCollect(true);
      setCollectResult(null);
      const processorContract = new ethers.Contract(PROCESSOR_ADDRESS, NXDv3ProtocolABI, signer);
      const tx = await processorContract.collectFees();
      await tx.wait();
      setCollectResult('Fees collected successfully.');
      fetchData();
    } catch (err: any) {
      setCollectResult(formatProcessorError(err));
    } finally {
      setLoadingCollect(false);
    }
  };

  const handleProcessRewards = async () => {
    if (!signer) {
      setRewardsResult('Error: Wallet not connected.');
      return;
    }
    try {
      setLoadingRewards(true);
      setRewardsResult(null);
      const processorContract = new ethers.Contract(PROCESSOR_ADDRESS, NXDv3ProtocolABI, signer);
      const tx = await processorContract.processRewards();
      await tx.wait();
      setRewardsResult('Rewards processed successfully.');
      fetchData();
    } catch (err: any) {
      setRewardsResult(formatProcessorError(err));
    } finally {
      setLoadingRewards(false);
    }
  };

  const handleProcessTax = async () => {
    if (!signer) {
      setTaxResult('Error: Wallet not connected.');
      return;
    }
    try {
      setLoadingTax(true);
      setTaxResult(null);
      const processorContract = new ethers.Contract(PROCESSOR_ADDRESS, NXDv3ProtocolABI, signer);
      const tx = await processorContract.processTax();
      await tx.wait();
      setTaxResult('Tax processed successfully.');
      fetchData();
    } catch (err: any) {
      setTaxResult(formatProcessorError(err));
    } finally {
      setLoadingTax(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content processor-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '92vw' }}
      >
        <div className="modal-header">
          <div
            className="flex items-center gap-2"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Cpu size={22} className="text-amber-400" style={{ color: '#f59e0b' }} />
            <h2
              className="text-lg font-bold text-white"
              style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}
            >
              NXDv3 Processor Dashboard
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body processor-body">
          {/* Row 1: Collect ETH rewards */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCollectInfo(!showCollectInfo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                }}
                title="Toggle Action Description"
              >
                <Info size={14} className="icon-gold" />
                <span>{showCollectInfo ? 'Hide description' : 'Info'}</span>
                {showCollectInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            {showCollectInfo && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '8px',
                }}
              >
                <div>
                  <strong>Function:</strong> <code>collectFees()</code>
                </div>
                <div>
                  <strong>What it does:</strong> Gathers available protocol fee earnings into the
                  processor contract.
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  <strong>Why it is essential:</strong> Prepares protocol revenue for reward
                  processing and distribution to stakers.
                </div>
              </div>
            )}
            <div className="processor-row">
              <button
                onClick={handleCollectFees}
                disabled={loadingCollect}
                className="processor-btn-retro"
              >
                {loadingCollect ? 'Collecting...' : 'Collect ETH rewards'}
              </button>

              <span className="processor-value">{claimableFeesData} ETH</span>
            </div>
            {collectResult && (
              <div
                className="processor-status-msg"
                style={{
                  marginTop: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  background: collectResult.includes('Error')
                    ? 'rgba(185, 28, 28, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)',
                  color: collectResult.includes('Error') ? '#fca5a5' : '#6ee7b7',
                  border: `1px solid ${collectResult.includes('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {collectResult}
              </div>
            )}
          </div>

          {/* Row 2: Process ETH rewards */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '4px',
                marginTop: '12px',
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setShowRewardsInfo(!showRewardsInfo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                }}
                title="Toggle Action Description"
              >
                <Info size={14} className="icon-gold" />
                <span>{showRewardsInfo ? 'Hide description' : 'Info'}</span>
                {showRewardsInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            {showRewardsInfo && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '8px',
                }}
              >
                <div>
                  <strong>Function:</strong> <code>processRewards()</code>
                </div>
                <div>
                  <strong>What it does:</strong> Executes reward distribution, burns DXN, and sends
                  ETH/XEN rewards to the Staking Vault.
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  <strong>Why it is essential:</strong> Core automation function that maintains
                  protocol economics, rewards stakers, and drives deflation.
                </div>
              </div>
            )}
            <div className="processor-row">
              <button
                onClick={handleProcessRewards}
                disabled={loadingRewards}
                className="processor-btn-retro"
              >
                {loadingRewards ? 'Processing...' : 'Process ETH rewards'}
              </button>

              <span className="processor-value">{protocolBalanceData} ETH</span>
            </div>
            {rewardsResult && (
              <div
                className="processor-status-msg"
                style={{
                  marginTop: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  background: rewardsResult.includes('Error')
                    ? 'rgba(185, 28, 28, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)',
                  color: rewardsResult.includes('Error') ? '#fca5a5' : '#6ee7b7',
                  border: `1px solid ${rewardsResult.includes('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {rewardsResult}
              </div>
            )}
          </div>

          {/* Row 3: Process tax */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '4px',
                marginTop: '12px',
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setShowTaxInfo(!showTaxInfo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                }}
                title="Toggle Action Description"
              >
                <Info size={14} className="icon-gold" />
                <span>{showTaxInfo ? 'Hide description' : 'Info'}</span>
                {showTaxInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            {showTaxInfo && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '8px',
                }}
              >
                <div>
                  <strong>Function:</strong> <code>processTax()</code>
                </div>
                <div>
                  <strong>What it does:</strong> Processes accumulated NXDv3 tax balance (stakes
                  DXNv2, adds NXDv3/DXNv2 liquidity).
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  <strong>Why it is essential:</strong> Processes taxes in favor of the protocol.
                </div>
              </div>
            )}
            <div className="processor-row">
              <button
                onClick={handleProcessTax}
                disabled={loadingTax}
                className="processor-btn-retro"
              >
                {loadingTax ? 'Processing...' : 'Process tax'}
              </button>

              <span className="processor-value">{taxRecipientBalanceData} NXD</span>
            </div>
            {taxResult && (
              <div
                className="processor-status-msg"
                style={{
                  marginTop: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  background: taxResult.includes('Error')
                    ? 'rgba(185, 28, 28, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)',
                  color: taxResult.includes('Error') ? '#fca5a5' : '#6ee7b7',
                  border: `1px solid ${taxResult.includes('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {taxResult}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer processor-footer">
          <span className="processor-wallet-status">
            {isConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
          </span>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              minHeight: '36px',
              padding: '6px 18px',
              fontSize: '0.875rem',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
