import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useProtocol } from '../context/ProtocolContext';
import { ethers } from 'ethers';
import {
  NXDv3ProtocolABI,
  NXDv3ERC20ABI,
  IDBXenViewsABI,
  CONTRACT_ADDRESSES,
} from '../abis/contracts';
import { ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { parseProtocolError } from '../utils/contractErrors';
import { multicall, MulticallCall } from '../utils/multicall';

interface ProtocolAdminProps {
  protocolAddress: string;
  nxdAddress: string;
}

interface ProtocolAdminState {
  claimableFees: string;
  claimableFeesWei: string;
  protocolEthBalance: string;
  protocolEthBalanceWei: string;
  nxdTaxBalance: string;
  nxdTaxBalanceWei: string;
  unclaimedFees: string;
}

const initialAdminState: ProtocolAdminState = {
  claimableFees: '0',
  claimableFeesWei: '0',
  protocolEthBalance: '0',
  protocolEthBalanceWei: '0',
  nxdTaxBalance: '0',
  nxdTaxBalanceWei: '0',
  unclaimedFees: '0',
};

const formatClaimableEthDisplay = (ethStr: string, _weiStr?: string): string => {
  const val = parseFloat(ethStr);
  if (isNaN(val) || val === 0) return '0.0000';
  if (val < 0.0001) {
    const fixed = val.toFixed(18).replace(/0+$/, '').replace(/\.$/, '');
    return fixed === '0' ? ethStr : fixed;
  }
  return val.toFixed(4);
};

const formatEthDisplay = (ethStr: string, _weiStr?: string): string => {
  const val = parseFloat(ethStr);
  if (isNaN(val) || val === 0) return '0.0000';
  return val.toFixed(4);
};

const formatTokenDisplay = (tokenStr: string): string => {
  const val = parseFloat(tokenStr);
  if (isNaN(val) || val === 0) return '0.0000';
  if (val < 0.0001) {
    const fixed = val.toFixed(18).replace(/0+$/, '').replace(/\.$/, '');
    return fixed === '0' ? tokenStr : fixed;
  }
  return val.toFixed(4);
};

export const ProtocolAdmin: React.FC<ProtocolAdminProps> = React.memo(
  ({ protocolAddress, nxdAddress }) => {
    const { isConnected, signer } = useWallet();
    const { refreshAll, isLoadingGlobal } = useProtocol();
    const [adminState, setAdminState] = useState<ProtocolAdminState>(initialAdminState);
    const [collectedSinceProcessWei, setCollectedSinceProcessWei] = useState<bigint>(0n);
    const [isPending, setIsPending] = useState(false);
    const [txMessage, setTxMessage] = useState<{ type: string; text: string } | null>(null);

    const fetchData = useCallback(async () => {
      if (!protocolAddress || !ethers.isAddress(protocolAddress)) return;
      try {
        const pAddr = protocolAddress;
        const nAddr =
          nxdAddress && ethers.isAddress(nxdAddress) ? nxdAddress : CONTRACT_ADDRESSES.nxdAddress;
        const vViews = CONTRACT_ADDRESSES.iDBXenViews;

        // Batch all admin queries in a SINGLE Multicall3 request (including native ETH balance)
        const calls: MulticallCall[] = [
          { target: pAddr, abi: NXDv3ProtocolABI, functionName: 'ourClaimableFees' },
          { target: pAddr, abi: [], functionName: 'getEthBalance', args: [pAddr] },
          { target: vViews, abi: IDBXenViewsABI, functionName: 'getUnclaimedFees', args: [pAddr] },
          { target: nAddr, abi: NXDv3ERC20ABI, functionName: 'balanceOf', args: [nAddr] },
        ];

        const res = await multicall(calls);

        let claimableWeiVal = 0n;
        if (res[0]?.success && res[0].result !== null) {
          try {
            claimableWeiVal = BigInt(res[0].result);
          } catch {
            // Ignore parse error
          }
        }
        if (claimableWeiVal === 0n && res[2]?.success && res[2].result !== null) {
          try {
            claimableWeiVal = BigInt(res[2].result);
          } catch {
            // Ignore parse error
          }
        }

        if (claimableWeiVal > collectedSinceProcessWei) {
          claimableWeiVal -= collectedSinceProcessWei;
        } else {
          claimableWeiVal = 0n;
        }

        const claimableWei = claimableWeiVal.toString();
        const claimable = ethers.formatEther(claimableWeiVal);

        let ethBalStr = '0';
        let ethBalWei = '0';
        if (res[1]?.success && res[1].result !== null) {
          ethBalWei = res[1].result.toString();
          ethBalStr = ethers.formatEther(res[1].result);
        }

        let unclaimedFeesVal = '0';
        if (res[2]?.success && res[2].result !== null) {
          unclaimedFeesVal = res[2].result.toString();
        }

        let taxBalWei = '0';
        let taxBalStr = '0';
        if (res[3]?.success && res[3].result !== null) {
          taxBalWei = res[3].result.toString();
          taxBalStr = ethers.formatEther(res[3].result);
        }

        setAdminState({
          claimableFees: claimable,
          claimableFeesWei: claimableWei,
          protocolEthBalance: ethBalStr,
          protocolEthBalanceWei: ethBalWei,
          nxdTaxBalance: taxBalStr,
          nxdTaxBalanceWei: taxBalWei,
          unclaimedFees: unclaimedFeesVal,
        });
      } catch (err) {
        console.error('[ProtocolAdmin] Error fetching admin data:', err);
      }
    }, [protocolAddress, nxdAddress, collectedSinceProcessWei]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    const executeTx = async (
      txFn: () => Promise<ethers.TransactionResponse>,
      successMsg: string,
      actionName?: string
    ) => {
      setIsPending(true);
      setTxMessage(null);
      try {
        const tx = await txFn();
        setTxMessage({ type: 'info', text: 'Transaction sent...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: successMsg });
        await Promise.all([fetchData(), refreshAll(true)]);
      } catch (err: unknown) {
        console.error(err);
        const errMsg = parseProtocolError(err, actionName);
        if (errMsg) {
          setTxMessage({ type: 'danger', text: errMsg });
        } else {
          setTxMessage(null);
        }
      } finally {
        setIsPending(false);
      }
    };

    const handleCollectFees = async () => {
      if (!protocolAddress || !signer) return;
      setIsPending(true);
      setTxMessage(null);
      try {
        const claimableAmountWei = BigInt(adminState.claimableFeesWei || '0');
        if (claimableAmountWei <= 0n) {
          setTxMessage({ type: 'danger', text: 'No ETH to claim' });
          setIsPending(false);
          return;
        }

        const protocolSigner = new ethers.Contract(protocolAddress, NXDv3ProtocolABI, signer);
        const tx = await protocolSigner.collectFees();
        setTxMessage({ type: 'info', text: 'Transaction sent...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'Fees collected!' });
        if (claimableAmountWei > 0n) {
          setCollectedSinceProcessWei((prev) => prev + claimableAmountWei);
        }
        await Promise.all([fetchData(), refreshAll(true)]);
      } catch (err: unknown) {
        console.error(err);
        const errMsg = parseProtocolError(err, 'collectFees');
        if (errMsg) {
          setTxMessage({ type: 'danger', text: errMsg });
        } else {
          setTxMessage(null);
        }
      } finally {
        setIsPending(false);
      }
    };

    const handleProcessRewards = async () => {
      if (!protocolAddress || !signer) return;
      await executeTx(
        () => new ethers.Contract(protocolAddress, NXDv3ProtocolABI, signer!).processRewards(),
        'Rewards processed!'
      );
      setCollectedSinceProcessWei(0n);
    };

    const handleProcessTax = async () => {
      if (!nxdAddress || !signer) return;
      setIsPending(true);
      setTxMessage(null);
      try {
        const nxdSigner = new ethers.Contract(nxdAddress, NXDv3ERC20ABI, signer);
        const tx = await nxdSigner.processTax();
        setTxMessage({ type: 'info', text: 'Transaction sent...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'Tax processed!' });
        await Promise.all([fetchData(), refreshAll(true)]);
      } catch (err: unknown) {
        console.error(err);
        const errMsg = parseProtocolError(err, 'processTax');
        if (errMsg) {
          setTxMessage({ type: 'danger', text: errMsg });
        } else {
          setTxMessage(null);
        }
      } finally {
        setIsPending(false);
      }
    };

    if (!isConnected) {
      return (
        <div className="card">
          <div className="card-header">
            <ShieldAlert size={18} className="icon-gold" />
            <h2>Operations Panel</h2>
          </div>

          <p className="card-description">Connect wallet to manage operational functions.</p>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-header justify-between">
          <div className="flex items-center gap-2">
            <h2>Protocol Maintenance</h2>
          </div>

          <button
            className="btn-icon"
            onClick={refreshAll}
            title="Refresh"
            disabled={isLoadingGlobal}
          >
            <RefreshCw size={14} className={isLoadingGlobal ? 'animate-spin' : ''} />
          </button>
        </div>

        <div
          className="admin-section"
          style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-gray" style={{ lineHeight: '1.3' }}>
                Transfers ETH from DBXenv2 Protocol to NXDv3 Protocol.
              </span>
              <div
                className="stat-box p-3"
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '130px 1fr',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <button
                  className="btn btn-sm btn-primary"
                  style={{
                    fontSize: '0.78rem',
                    padding: '6px 12px',
                    width: '100%',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={handleCollectFees}
                  disabled={
                    isPending ||
                    !protocolAddress ||
                    BigInt(adminState.claimableFeesWei || '0') <= 0n
                  }
                >
                  Transfer ETH
                </button>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="text-[10px] text-gray" style={{ display: 'block' }}>
                    Claimable ETH
                  </span>
                  <span className="text-xs font-semibold" style={{ display: 'block' }}>
                    {formatClaimableEthDisplay(
                      adminState.claimableFees,
                      adminState.claimableFeesWei
                    )}{' '}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-gray" style={{ lineHeight: '1.3' }}>
                Processes and distributes ETH in the protocol.
              </span>
              <div
                className="stat-box p-3"
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '130px 1fr',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <button
                  className="btn btn-sm btn-secondary"
                  style={{
                    fontSize: '0.78rem',
                    padding: '6px 12px',
                    width: '100%',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={handleProcessRewards}
                  disabled={
                    isPending ||
                    !protocolAddress ||
                    BigInt(adminState.protocolEthBalanceWei || '0') < ethers.parseEther('0.0001')
                  }
                >
                  Process ETH
                </button>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="text-[10px] text-gray" style={{ display: 'block' }}>
                    Protocol ETH
                  </span>
                  <span className="text-xs font-semibold" style={{ display: 'block' }}>
                    {formatEthDisplay(
                      adminState.protocolEthBalance,
                      adminState.protocolEthBalanceWei
                    )}{' '}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-gray" style={{ lineHeight: '1.3' }}>
                Processes and distributes NXDv3 in the protocol.
              </span>
              <div
                className="stat-box p-3"
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '130px 1fr',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <button
                  className="btn btn-sm btn-primary"
                  style={{
                    fontSize: '0.78rem',
                    padding: '6px 12px',
                    width: '100%',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={handleProcessTax}
                  disabled={
                    isPending || !nxdAddress || BigInt(adminState.nxdTaxBalanceWei || '0') <= 0n
                  }
                >
                  Process tax
                </button>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="text-[10px] text-gray" style={{ display: 'block' }}>
                    NXDv3 Tax Balance
                  </span>
                  <span className="text-xs font-semibold" style={{ display: 'block' }}>
                    {formatTokenDisplay(adminState.nxdTaxBalance)}{' '}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p
            className="card-description text-xs"
            style={{ margin: '14px 0 0 0', color: 'var(--text-secondary)', lineHeight: '1.4' }}
          >
            <li>The functions are called once a week on a random day.</li>
            <li>Any user can call these functions at any time.</li>
            <li>There are no rewards for calling these functions.</li>
          </p>
        </div>

        {txMessage && (
          <div
            className={`alert alert-${txMessage.type === 'info' ? 'warning' : txMessage.type} mt-4`}
          >
            {txMessage.type === 'success' && <CheckCircle size={16} />}
            <span>{txMessage.text}</span>
          </div>
        )}
      </div>
    );
  }
);
