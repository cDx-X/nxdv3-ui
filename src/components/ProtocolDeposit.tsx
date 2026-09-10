import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useProtocol } from '../context/ProtocolContext';
import { ethers } from 'ethers';
import { NXDv3ProtocolABI, NXDv3ERC20ABI, CONTRACT_ADDRESSES } from '../abis/contracts';
import { CheckCircle, RefreshCw, Calculator } from 'lucide-react';
import { parseDepositError } from '../utils/contractErrors';

interface ProtocolDepositProps {
  protocolAddress: string;
  dxnAddress: string;
}

interface ProtocolDataState {
  dxnBalance: string;
  dxnAllowance: string;
  currentRate: string;
  mintedDeposit: string;
  maxMintableDeposit: string;
  maxRewardsSupply: string;
  tierSize: string;
}

export const ProtocolDeposit: React.FC<ProtocolDepositProps> = React.memo(
  ({ protocolAddress, dxnAddress }) => {
    const { isConnected, signer } = useWallet();
    const { globalData, userData, refreshAll } = useProtocol();
    const [amount, setAmount] = useState('');
    const [depositMode, setDepositMode] = useState<'mint' | 'nomint'>('mint');

    const effectiveProtocolAddress =
      protocolAddress && ethers.isAddress(protocolAddress)
        ? protocolAddress
        : CONTRACT_ADDRESSES.protocolAddress;
    const effectiveDxnAddress =
      dxnAddress && ethers.isAddress(dxnAddress) ? dxnAddress : CONTRACT_ADDRESSES.dxnAddress;

    const data: ProtocolDataState = React.useMemo(() => {
      const maxRewards =
        globalData.maxRewardsSupply > 0n
          ? ethers.formatEther(globalData.maxRewardsSupply)
          : '100000000';
      const maxMintable =
        globalData.maxMintableDeposit > 0n
          ? ethers.formatEther(globalData.maxMintableDeposit)
          : maxRewards;
      return {
        dxnBalance: ethers.formatEther(userData.dxnBalance),
        dxnAllowance: ethers.formatEther(userData.dxnAllowance),
        currentRate: ethers.formatEther(globalData.currentRate),
        mintedDeposit: ethers.formatEther(globalData.nxdMintedViaDeposit),
        maxMintableDeposit: maxMintable,
        maxRewardsSupply: maxRewards,
        tierSize: ethers.formatEther(globalData.tierSize),
      };
    }, [globalData, userData]);

    const isMintingFinishedCached = React.useMemo(() => {
      const maxLimitNum = parseFloat(data.maxMintableDeposit || '0');
      const mintedNum = parseFloat(data.mintedDeposit || '0');
      return maxLimitNum > 0 && mintedNum >= maxLimitNum;
    }, [data.maxMintableDeposit, data.mintedDeposit]);

    const hasLoaded = globalData.isLoaded;

    const [isLoading, setIsLoading] = useState(false);
    const [txMessage, setTxMessage] = useState<{ type: string; text: string } | null>(null);

    const fetchProtocolData = useCallback(async () => {
      await refreshAll(true);
    }, [refreshAll]);

    useEffect(() => {
      if (isConnected && effectiveProtocolAddress) {
        fetchProtocolData();
      }
    }, [isConnected, effectiveProtocolAddress, fetchProtocolData]);

    // Real-time calculation based on desired tokens to mint (NXD) across tiers, taking already minted tokens into account
    const estimation = React.useMemo(() => {
      try {
        if (!amount || parseFloat(amount) <= 0)
          return { totalNxd: 0n, dxnConsumed: 0n, breakdown: [] };
        const desiredNxdNum = parseFloat(amount);
        const mintedNum = parseFloat(data.mintedDeposit || '0');
        const maxLimitNum =
          data.maxMintableDeposit && data.maxMintableDeposit !== '0'
            ? parseFloat(data.maxMintableDeposit)
            : parseFloat(data.maxRewardsSupply || '0');
        const tSizeNum =
          data.tierSize && data.tierSize !== '0' ? parseFloat(data.tierSize) : maxLimitNum / 3;

        const rate1 =
          data.currentRate && parseFloat(data.currentRate) > 0 ? parseFloat(data.currentRate) : 1;
        const rate2 = rate1 * (10 / 11);
        const rate3 = rate1 * (100 / 121);

        const startNxd = mintedNum;
        const endNxd = Math.min(
          mintedNum + desiredNxdNum,
          maxLimitNum > 0 ? maxLimitNum : mintedNum + desiredNxdNum
        );
        const effectiveDesiredNxd = Math.max(0, endNxd - startNxd);

        if (effectiveDesiredNxd <= 0) return { totalNxd: 0n, dxnConsumed: 0n, breakdown: [] };

        const breakdown: { tier: number; nxd: number; dxn: number; rate: number }[] = [];
        let dxnTotal = 0n;

        const tier1End = tSizeNum;
        const tier2End = tSizeNum * 2;
        const tier3End = maxLimitNum > 0 ? maxLimitNum : tSizeNum * 3;

        // Tier 1 range: [0, tier1End]
        const s1 = Math.max(0, Math.min(startNxd, tier1End));
        const e1 = Math.max(0, Math.min(endNxd, tier1End));
        const nxd1 = Math.max(0, e1 - s1);
        if (nxd1 > 0) {
          const dxn1 = nxd1 / rate1;
          dxnTotal += ethers.parseEther(dxn1.toFixed(18));
          breakdown.push({ tier: 1, nxd: nxd1, dxn: dxn1, rate: rate1 });
        }

        // Tier 2 range: [tier1End, tier2End]
        const s2 = Math.max(tier1End, Math.min(startNxd, tier2End));
        const e2 = Math.max(tier1End, Math.min(endNxd, tier2End));
        const nxd2 = Math.max(0, e2 - s2);
        if (nxd2 > 0) {
          const dxn2 = nxd2 / rate2;
          dxnTotal += ethers.parseEther(dxn2.toFixed(18));
          breakdown.push({ tier: 2, nxd: nxd2, dxn: dxn2, rate: rate2 });
        }

        // Tier 3 range: [tier2End, tier3End]
        const s3 = Math.max(tier2End, Math.min(startNxd, tier3End));
        const e3 = Math.max(tier2End, Math.min(endNxd, tier3End));
        const nxd3 = Math.max(0, e3 - s3);
        if (nxd3 > 0) {
          const dxn3 = nxd3 / rate3;
          dxnTotal += ethers.parseEther(dxn3.toFixed(18));
          breakdown.push({ tier: 3, nxd: nxd3, dxn: dxn3, rate: rate3 });
        }

        let totalNxdNum = 0;
        breakdown.forEach((b) => (totalNxdNum += b.nxd));

        return {
          totalNxd: ethers.parseEther(totalNxdNum.toFixed(18)),
          dxnConsumed: dxnTotal,
          breakdown,
        };
      } catch {
        return { totalNxd: 0n, dxnConsumed: 0n, breakdown: [] };
      }
    }, [
      amount,
      data.mintedDeposit,
      data.maxMintableDeposit,
      data.maxRewardsSupply,
      data.tierSize,
      data.currentRate,
    ]);

    const tierMetrics = React.useMemo(() => {
      const maxNum = parseFloat(data.maxMintableDeposit || '3') || 3;
      const tierSizeNum = maxNum / 3;
      const mintedNum = parseFloat(data.mintedDeposit || '0');

      const activeTier = mintedNum < tierSizeNum ? 1 : mintedNum < tierSizeNum * 2 ? 2 : 3;

      const t1Progress = Math.min(100, Math.max(0, (mintedNum / tierSizeNum) * 100));
      const t2Progress = Math.min(
        100,
        Math.max(0, ((mintedNum - tierSizeNum) / tierSizeNum) * 100)
      );
      const t3Progress = Math.min(
        100,
        Math.max(0, ((mintedNum - tierSizeNum * 2) / tierSizeNum) * 100)
      );

      const maxLimitNum =
        data.maxMintableDeposit && data.maxMintableDeposit !== '0'
          ? parseFloat(data.maxMintableDeposit)
          : parseFloat(data.maxRewardsSupply || '0');
      const computedFinished = maxLimitNum > 0 && mintedNum >= maxLimitNum;
      const isMintingFinished = isMintingFinishedCached || computedFinished;

      return { activeTier, t1Progress, t2Progress, t3Progress, isMintingFinished };
    }, [
      data.maxMintableDeposit,
      data.mintedDeposit,
      data.maxRewardsSupply,
      isMintingFinishedCached,
    ]);

    useEffect(() => {
      if (tierMetrics.isMintingFinished && depositMode === 'mint') {
        setDepositMode('nomint');
      }
    }, [tierMetrics.isMintingFinished, depositMode]);

    const handleApprove = async () => {
      if (!signer || !effectiveDxnAddress || !effectiveProtocolAddress) return;
      setIsLoading(true);
      setTxMessage(null);
      try {
        const dxn = new ethers.Contract(effectiveDxnAddress, NXDv3ERC20ABI, signer);
        const tx = await dxn.approve(effectiveProtocolAddress, ethers.parseEther('1000000000'));
        setTxMessage({ type: 'info', text: 'DXN approval in progress...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'DXN has been approved!' });
        fetchProtocolData();
      } catch (err: unknown) {
        const errorObj = err as { reason?: string; message?: string };
        setTxMessage({
          type: 'error',
          text: errorObj?.reason || errorObj?.message || 'Approval rejected.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeposit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signer || !effectiveProtocolAddress || !amount) return;
      setIsLoading(true);
      setTxMessage(null);
      try {
        const protocol = new ethers.Contract(effectiveProtocolAddress, NXDv3ProtocolABI, signer);
        const tx = await protocol.deposit(estimation.dxnConsumed);
        setTxMessage({ type: 'info', text: 'Payment sent to the network...' });
        await tx.wait();
        setTxMessage({
          type: 'success',
          text: 'Deposit and minting of NXDv3 successfully completed!',
        });
        setAmount('');
        fetchProtocolData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseDepositError(err) });
      } finally {
        setIsLoading(false);
      }
    };

    const handleDepositNoMint = async () => {
      if (!signer || !effectiveProtocolAddress || !amount) return;
      setIsLoading(true);
      setTxMessage(null);
      try {
        const protocol = new ethers.Contract(effectiveProtocolAddress, NXDv3ProtocolABI, signer);
        const dxnAmountWei = ethers.parseEther(amount);
        const tx = await protocol.depositNoMint(dxnAmountWei);
        setTxMessage({ type: 'info', text: 'Non-minting deposit sent...' });
        await tx.wait();
        setTxMessage({
          type: 'success',
          text: 'Deposit without minting (DBXenV2 stake) successfully completed!',
        });
        setAmount('');
        fetchProtocolData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseDepositError(err) });
      } finally {
        setIsLoading(false);
      }
    };

    const requiredAmountWei =
      depositMode === 'mint'
        ? estimation.dxnConsumed || 0n
        : amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0
          ? ethers.parseEther(amount)
          : 0n;
    const needsApproval =
      parseFloat(data.dxnAllowance) < parseFloat(ethers.formatEther(requiredAmountWei));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (depositMode === 'mint') {
        await handleDeposit(e);
      } else {
        await handleDepositNoMint();
      }
    };

    if (!isConnected) {
      return (
        <div className="card">
          <h2>NXDv3Protocol - Deposit DXN</h2>
          <p className="placeholder-text">
            Connect your wallet to view and use the protocol's deposit features.
          </p>
        </div>
      );
    }

    if (!effectiveProtocolAddress) {
      return (
        <div className="card">
          <h2>NXDv3Protocol - Deposit DXN</h2>
          <p className="placeholder-text">The protocol address is not configured.</p>
        </div>
      );
    }
    return (
      <div className="card">
        <div className="card-header justify-between">
          <div className="flex items-center gap-2">
            <h2>Mint NXDv3 (Deposit DXNv2)</h2>
          </div>
          <button
            className="btn-icon"
            onClick={refreshAll}
            title="Refresh data"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="stat-box">
            <span className="stat-label">Your DXNv2 balance</span>
            <span className="stat-value">{parseFloat(data.dxnBalance).toFixed(4)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">1 DXNv2 =</span>
            <span className="stat-value">{parseFloat(data.currentRate).toFixed(4)} NXDv3</span>
          </div>
        </div>

        <div
          className="stat-box mb-5"
          style={{
            width: '100%',
            alignItems: 'flex-start',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <span
            className="stat-label font-semibold mb-2"
            style={{ color: 'var(--text-secondary)', display: 'block' }}
          >
            Minting limit
          </span>
          <div
            className="stat-value text-sm"
            style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}
          >
            {parseFloat(data.mintedDeposit).toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
            /{' '}
            {parseFloat(data.maxMintableDeposit).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{' '}
            NXDv3
          </div>
        </div>

        {!hasLoaded && !tierMetrics.isMintingFinished ? (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Loading minting status...
            </span>
          </div>
        ) : tierMetrics.isMintingFinished ? (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Minting phase completed
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {/* Tier 1 Segment */}
            <div
              style={{
                background:
                  tierMetrics.activeTier === 1 ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-secondary)',
                border:
                  tierMetrics.activeTier === 1
                    ? '2px solid #3b82f6'
                    : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px',
                position: 'relative',
                boxShadow:
                  tierMetrics.activeTier === 1 ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none',
              }}
            >
              {tierMetrics.activeTier === 1 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-9px',
                    right: '8px',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  Active
                </span>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-primary)' }}>
                  Tier 1
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>1 NXDv3</span>
              </div>
              <div
                style={{
                  height: '4px',
                  background: 'var(--border-color)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: '#3b82f6',
                    width: `${tierMetrics.t1Progress}%`,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>

            {/* Tier 2 Segment */}
            <div
              style={{
                background:
                  tierMetrics.activeTier === 2 ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-secondary)',
                border:
                  tierMetrics.activeTier === 2
                    ? '2px solid #3b82f6'
                    : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px',
                position: 'relative',
                boxShadow:
                  tierMetrics.activeTier === 2 ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none',
              }}
            >
              {tierMetrics.activeTier === 2 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-9px',
                    right: '8px',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  Active
                </span>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-primary)' }}>
                  Tier 2
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  0.9091 NXDv3
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  background: 'var(--border-color)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: '#3b82f6',
                    width: `${tierMetrics.t2Progress}%`,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>

            {/* Tier 3 Segment */}
            <div
              style={{
                background:
                  tierMetrics.activeTier === 3 ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-secondary)',
                border:
                  tierMetrics.activeTier === 3
                    ? '2px solid #3b82f6'
                    : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px',
                position: 'relative',
                boxShadow:
                  tierMetrics.activeTier === 3 ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none',
              }}
            >
              {tierMetrics.activeTier === 3 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-9px',
                    right: '8px',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  Active
                </span>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-primary)' }}>
                  Tier 3
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  0.8264 NXDv3
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  background: 'var(--border-color)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: '#3b82f6',
                    width: `${tierMetrics.t3Progress}%`,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="deposit-form" style={{ marginTop: '1.75rem' }}>
          {/* Mode Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${depositMode === 'mint' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                fontSize: '0.8rem',
                padding: '8px',
                textAlign: 'center',
                justifyContent: 'center',
                ...(tierMetrics.isMintingFinished
                  ? {
                      opacity: 0.5,
                      cursor: 'not-allowed',
                      background: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)',
                    }
                  : {}),
              }}
              disabled={tierMetrics.isMintingFinished}
              onClick={() => {
                if (tierMetrics.isMintingFinished) return;
                setDepositMode('mint');
                setAmount('');
                setTxMessage(null);
              }}
            >
              Deposit & Mint
            </button>
            <button
              type="button"
              className={`btn ${depositMode === 'nomint' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                fontSize: '0.8rem',
                padding: '8px',
                textAlign: 'center',
                justifyContent: 'center',
              }}
              onClick={() => {
                setDepositMode('nomint');
                setAmount('');
                setTxMessage(null);
              }}
            >
              Deposit No Mint
            </button>
          </div>

          <div className="form-group mb-4">
            <label htmlFor="depositAmount">
              {depositMode === 'mint'
                ? 'Tokens to mint (NXDv3):'
                : 'DXNv2 amount to deposit (No Mint):'}
            </label>
            <div className="input-with-max">
              <input
                id="depositAmount"
                type="number"
                step="any"
                min="0"
                placeholder={depositMode === 'mint' ? '0.0 NXDv3' : '0.0 DXNv2'}
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn-max"
                onClick={() => {
                  if (depositMode === 'mint') {
                    setAmount(data.maxMintableDeposit || data.maxRewardsSupply || '');
                  } else {
                    setAmount(data.dxnBalance || '');
                  }
                }}
              >
                MAX
              </button>
            </div>
            <small
              className="form-text text-muted mt-1"
              style={{ fontSize: '11px', color: 'var(--text-secondary)' }}
            >
              {depositMode === 'mint'
                ? 'Enter desired NXDv3 tokens to mint via bonding tiers.'
                : 'Enter DXNv2 tokens to stake directly into DBXenV2 without minting NXDv3.'}
            </small>
          </div>

          {/* Real-time Calculation & Tier Breakdown (Only for Mint mode) */}
          {depositMode === 'mint' && amount && parseFloat(amount) > 0 && (
            <div
              className="estimation-box mb-4 p-3"
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold flex items-center gap-1 text-gold">
                  <Calculator size={14} /> Estimated tokens to mint:
                </span>
                <span className="text-sm font-bold text-success">
                  ~{parseFloat(ethers.formatEther(estimation.totalNxd)).toFixed(4)} NXDv3
                </span>
              </div>
              <div
                className="flex flex-col gap-1 text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex justify-between font-semibold mb-1">
                  <span>Required Deposit: </span>
                  <span className="text-primary">
                    {parseFloat(ethers.formatEther(estimation.dxnConsumed || 0n)).toFixed(4)} DXNv2
                  </span>
                </div>
                {estimation.breakdown.map((b) => (
                  <div
                    key={b.tier}
                    className="flex justify-between"
                    style={{ fontSize: '11px', opacity: 0.9, paddingLeft: '4px' }}
                  >
                    <span>
                      • Tier {b.tier} ({b.nxd.toFixed(2)} NXD @ rate {b.rate.toFixed(3)}):
                    </span>
                    <span>{b.dxn.toFixed(4)} DXNv2</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons placed at the bottom */}
          <div className="action-buttons">
            {needsApproval ? (
              <button
                type="button"
                className="btn btn-warning full-width"
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
                onClick={handleApprove}
              >
                {isLoading ? 'Approving...' : 'Approve DXNv2 for Protocol'}
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary full-width"
                style={{
                  fontSize: '0.85rem',
                  padding: '10px',
                  textAlign: 'center',
                  justifyContent: 'center',
                }}
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
              >
                {isLoading
                  ? 'Processing...'
                  : depositMode === 'mint'
                    ? 'Deposit & Mint NXDv3'
                    : 'Deposit No Mint'}
              </button>
            )}
          </div>
        </form>

        {txMessage && (
          <div className={`alert alert-${txMessage.type === 'info' ? 'warning' : txMessage.type}`}>
            {txMessage.type === 'success' && <CheckCircle size={16} />}
            <span>{txMessage.text}</span>
          </div>
        )}
      </div>
    );
  }
);
