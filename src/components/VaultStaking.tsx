import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useProtocol } from '../context/ProtocolContext';
import { ethers } from 'ethers';
import { NXDv3StakingVaultABI, NXDv3ERC20ABI, CONTRACT_ADDRESSES } from '../abis/contracts';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { parseVaultError } from '../utils/contractErrors';

interface VaultStakingProps {
  vaultAddress: string;
  nxdAddress: string;
}

interface VaultDataState {
  nxdBalance: string;
  nxdAllowance: string;
  stakedBalance: string;
  pendingETH: string;
  pendingXEN: string;
  cooldownRequest: { amount: string; releaseTime: number } | null;
  totalVaultStaked: string;
  emergencyWithdrawEnabled: boolean;
}

export const VaultStaking: React.FC<VaultStakingProps> = React.memo(
  ({ vaultAddress, nxdAddress }) => {
    const { isConnected, signer, address } = useWallet();
    const { globalData, userData, refreshAll, isLoadingGlobal } = useProtocol();
    const [stakeAmount, setStakeAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [activeTab, setActiveTab] = useState<'stake' | 'withdraw'>('stake');
    const [isLoading, setIsLoading] = useState(false);
    const [txMessage, setTxMessage] = useState<{ type: string; text: string } | null>(null);
    const [claimToCustom, setClaimToCustom] = useState(false);
    const [customRecipient, setCustomRecipient] = useState('');
    const effectiveVaultAddress =
      vaultAddress && ethers.isAddress(vaultAddress)
        ? vaultAddress
        : CONTRACT_ADDRESSES.vaultAddress;
    const effectiveNxdAddress =
      nxdAddress && ethers.isAddress(nxdAddress) ? nxdAddress : CONTRACT_ADDRESSES.nxdAddress;

    const fetchVaultData = useCallback(async () => {
      await refreshAll(true);
    }, [refreshAll]);

    useEffect(() => {
      if (isConnected && effectiveVaultAddress) {
        fetchVaultData();
      }
    }, [isConnected, effectiveVaultAddress, fetchVaultData]);

    const vaultData: VaultDataState = useMemo(() => {
      return {
        nxdBalance: ethers.formatEther(userData.nxdBalance || 0n),
        nxdAllowance: ethers.formatEther(userData.nxdAllowance || 0n),
        stakedBalance: ethers.formatEther(userData.stakedBalance || 0n),
        pendingETH: ethers.formatEther(userData.pendingETH || 0n),
        pendingXEN: ethers.formatEther(userData.pendingXEN || 0n),
        cooldownRequest: userData.cooldownRequest
          ? {
              amount: ethers.formatEther(userData.cooldownRequest.amount),
              releaseTime: userData.cooldownRequest.releaseTime,
            }
          : null,
        totalVaultStaked: ethers.formatEther(globalData.totalVaultStaked || 0n),
        emergencyWithdrawEnabled: globalData.emergencyWithdrawEnabled,
      };
    }, [globalData, userData]);

    const handleApprove = async () => {
      if (!signer || !effectiveNxdAddress || !effectiveVaultAddress) return;
      setIsLoading(true);
      setTxMessage(null);
      try {
        const nxd = new ethers.Contract(effectiveNxdAddress, NXDv3ERC20ABI, signer);
        const tx = await nxd.approve(effectiveVaultAddress, ethers.parseEther('1000000000'));
        setTxMessage({ type: 'info', text: 'Approving NXDv3 in progress...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'Successfully approved NXDv3 for Vault!' });
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseVaultError(err) });
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeposit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signer || !effectiveVaultAddress || !stakeAmount) return;
      if (parseFloat(stakeAmount) > parseFloat(vaultData.nxdBalance)) {
        setTxMessage({ type: 'error', text: 'Wallet balance exceeded' });
        return;
      }
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.deposit(ethers.parseEther(stakeAmount));
        setTxMessage({ type: 'info', text: 'Vault deposit sent...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'Successfully staked NXDv3!' });
        setStakeAmount('');
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({
          type: 'error',
          text: parseVaultError(err, 'deposit', stakeAmount, vaultData),
        });
      } finally {
        setIsLoading(false);
      }
    };

    const handleWithdraw = async (acceptsPenalty: boolean) => {
      const amountToUse = withdrawAmount;
      if (!signer || !effectiveVaultAddress || !amountToUse) return;
      const maxAvailable = vaultData.cooldownRequest
        ? Math.max(
            0,
            parseFloat(vaultData.stakedBalance) - parseFloat(vaultData.cooldownRequest.amount)
          )
        : parseFloat(vaultData.stakedBalance);
      if (parseFloat(amountToUse) > maxAvailable) {
        setTxMessage({ type: 'error', text: 'The withdrawal exceeds available funds.' });
        return;
      }
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.withdraw(ethers.parseEther(amountToUse), acceptsPenalty);
        setTxMessage({ type: 'info', text: 'Withdrawal request sent...' });
        await tx.wait();
        setTxMessage({
          type: 'success',
          text: acceptsPenalty
            ? 'Successfully withdrawn instantly with penalty deduction!'
            : 'Withdrawal requested (24h cooldown).',
        });
        setWithdrawAmount('');
        await fetchVaultData();
      } catch (err: unknown) {
        console.error('Vault withdraw error:', err);
        setTxMessage({
          type: 'error',
          text: parseVaultError(
            err,
            acceptsPenalty ? 'withdrawPenalty' : 'withdraw',
            amountToUse,
            vaultData
          ),
        });
      } finally {
        setIsLoading(false);
      }
    };

    const handleWithdrawCooldown = async () => {
      if (!signer || !effectiveVaultAddress) return;
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.withdrawCooldown();
        setTxMessage({ type: 'info', text: 'Finalizing withdrawal after cooldown...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'Successfully claimed NXDv3!' });
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseVaultError(err, 'withdrawCooldown') });
      } finally {
        setIsLoading(false);
      }
    };

    const handleClaimRewards = async () => {
      if (!signer || !effectiveVaultAddress) return;
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.claimRewards();
        setTxMessage({ type: 'info', text: 'Claiming all rewards...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'All rewards claimed successfully!' });
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseVaultError(err, 'claimRewards') });
      } finally {
        setIsLoading(false);
      }
    };

    const handleClaimRewardsTo = async () => {
      if (!signer || !effectiveVaultAddress) return;
      if (!customRecipient || !ethers.isAddress(customRecipient)) {
        setTxMessage({ type: 'error', text: 'Invalid recipient address' });
        return;
      }
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.claimRewardsTo(customRecipient);
        setTxMessage({
          type: 'info',
          text: `Claiming all rewards to ${customRecipient.slice(0, 6)}...${customRecipient.slice(-4)}...`,
        });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'All rewards claimed to recipient successfully!' });
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseVaultError(err, 'claimRewardsTo') });
      } finally {
        setIsLoading(false);
      }
    };

    const handleClaimETH = async () => {
      if (!signer || !effectiveVaultAddress) return;
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.claimETH();
        setTxMessage({ type: 'info', text: 'Claiming ETH rewards...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'ETH rewards claimed successfully!' });
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseVaultError(err, 'claimETH') });
      } finally {
        setIsLoading(false);
      }
    };

    const handleClaimETHTo = async () => {
      if (!signer || !effectiveVaultAddress) return;
      if (!customRecipient || !ethers.isAddress(customRecipient)) {
        setTxMessage({ type: 'error', text: 'Invalid recipient address' });
        return;
      }
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.claimETHTo(customRecipient);
        setTxMessage({
          type: 'info',
          text: `Claiming ETH to ${customRecipient.slice(0, 6)}...${customRecipient.slice(-4)}...`,
        });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'ETH rewards claimed to recipient successfully!' });
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseVaultError(err, 'claimETHTo') });
      } finally {
        setIsLoading(false);
      }
    };

    const handleClaimXEN = async () => {
      if (!signer || !effectiveVaultAddress) return;
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.claimXEN();
        setTxMessage({ type: 'info', text: 'Claiming XEN rewards...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'XEN rewards claimed successfully!' });
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseVaultError(err, 'claimXEN') });
      } finally {
        setIsLoading(false);
      }
    };

    const handleClaimXENTo = async () => {
      if (!signer || !effectiveVaultAddress) return;
      if (!customRecipient || !ethers.isAddress(customRecipient)) {
        setTxMessage({ type: 'error', text: 'Invalid recipient address' });
        return;
      }
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.claimXENTo(customRecipient);
        setTxMessage({
          type: 'info',
          text: `Claiming XEN to ${customRecipient.slice(0, 6)}...${customRecipient.slice(-4)}...`,
        });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'XEN rewards claimed to recipient successfully!' });
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({ type: 'error', text: parseVaultError(err, 'claimXENTo') });
      } finally {
        setIsLoading(false);
      }
    };

    /* const handleEmergencyWithdraw = async () => {
      if (!signer || !effectiveVaultAddress) return;
      if (
        !window.confirm(
          'Are you sure you want to perform an Emergency Withdraw? Staked NXD tokens will be withdrawn immediately, but accumulated ETH rewards will be lost.'
        )
      ) {
        return;
      }
      setIsLoading(true);
      setTxMessage(null);
      try {
        const vault = new ethers.Contract(effectiveVaultAddress, NXDv3StakingVaultABI, signer);
        const tx = await vault.emergencyWithdraw();
        setTxMessage({ type: 'info', text: 'Performing emergency withdrawal...' });
        await tx.wait();
        setTxMessage({ type: 'success', text: 'Emergency withdrawal completed successfully!' });
        await fetchVaultData();
      } catch (err: unknown) {
        setTxMessage({
          type: 'error',
          text: parseVaultError(err, 'emergencyWithdraw', undefined, vaultData),
        });
      } finally {
        setIsLoading(false);
      }
    }; */

    const needsApproval = parseFloat(vaultData.nxdAllowance) < parseFloat(stakeAmount || '0');
    const now = Math.floor(Date.now() / 1000);
    const isCooldownReady = vaultData.cooldownRequest
      ? now >= vaultData.cooldownRequest.releaseTime
      : false;
    const isStakeActive =
      !isLoading && stakeAmount && !isNaN(parseFloat(stakeAmount)) && parseFloat(stakeAmount) > 0;
    const isWithdrawActive =
      !isLoading &&
      withdrawAmount &&
      !isNaN(parseFloat(withdrawAmount)) &&
      parseFloat(withdrawAmount) > 0;

    if (!isConnected) {
      return (
        <div className="card">
          <h2>NXDv3StakingVault - NXDv3 Staking</h2>
          <p className="placeholder-text">Connect your wallet to manage staking and ETH rewards.</p>
        </div>
      );
    }

    if (!effectiveVaultAddress) {
      return (
        <div className="card">
          <h2>NXDv3StakingVault - NXDv3 Staking</h2>
          <p className="placeholder-text">The protocol address is not configured.</p>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-header justify-between">
          <div className="flex items-center gap-2">
            <h2>Staking & Rewards</h2>
          </div>
          <button
            className="btn-icon"
            onClick={refreshAll}
            title="Refresh data"
            disabled={isLoading || isLoadingGlobal}
          >
            <RefreshCw size={14} className={isLoading || isLoadingGlobal ? 'animate-spin' : ''} />
          </button>
        </div>

        <div
          className="stats-grid"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '1rem' }}
        >
          <div className="stat-box">
            <span className="stat-label">Your NXDv3 Stake</span>
            <span className="stat-value">{parseFloat(vaultData.stakedBalance).toFixed(4)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total NXDv3 in Vault</span>
            <span className="stat-value">{parseFloat(vaultData.totalVaultStaked).toFixed(2)}</span>
          </div>
        </div>

        <div
          className="stats-grid"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '1rem' }}
        >
          <div className="stat-box">
            <span className="stat-label">ETH Rewards</span>
            <span className="stat-value text-gold">
              {parseFloat(vaultData.pendingETH).toFixed(6)}
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-label">XEN Rewards</span>
            <span className="stat-value text-gold">
              {parseFloat(vaultData.pendingXEN).toFixed(6)}
            </span>
          </div>
        </div>

        {(parseFloat(vaultData.pendingETH) > 0 || parseFloat(vaultData.pendingXEN) > 0) && (
          <div className="rewards-claim-section">
            <div className="claim-recipient-toggle">
              <button
                type="button"
                className={`toggle-btn ${!claimToCustom ? 'active' : ''}`}
                onClick={() => setClaimToCustom(false)}
              >
                My Wallet
              </button>
              <button
                type="button"
                className={`toggle-btn ${claimToCustom ? 'active' : ''}`}
                onClick={() => {
                  setClaimToCustom(true);
                  if (!customRecipient && address) setCustomRecipient(address);
                }}
              >
                Custom Address
              </button>
            </div>

            {claimToCustom && (
              <div className="custom-recipient-input">
                <input
                  type="text"
                  className="input-field"
                  placeholder="0x... recipient address"
                  value={customRecipient}
                  onChange={(e) => setCustomRecipient(e.target.value)}
                />
                {address && (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setCustomRecipient(address)}
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    Use Mine
                  </button>
                )}
              </div>
            )}

            <div className="claim-buttons-grid">
              {claimToCustom ? (
                <>
                  <button
                    className="btn btn-gold"
                    onClick={handleClaimRewardsTo}
                    disabled={isLoading || !customRecipient}
                  >
                    Claim All
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleClaimETHTo}
                    disabled={
                      isLoading || !customRecipient || parseFloat(vaultData.pendingETH) === 0
                    }
                  >
                    Claim ETH
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleClaimXENTo}
                    disabled={
                      isLoading || !customRecipient || parseFloat(vaultData.pendingXEN) === 0
                    }
                  >
                    Claim XEN
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-gold"
                    onClick={handleClaimRewards}
                    disabled={isLoading}
                  >
                    Claim All
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleClaimETH}
                    disabled={isLoading || parseFloat(vaultData.pendingETH) === 0}
                  >
                    Claim ETH
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleClaimXEN}
                    disabled={isLoading || parseFloat(vaultData.pendingXEN) === 0}
                  >
                    Claim XEN
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {vaultData.cooldownRequest && (
          <div className="alert alert-warning flex-row-justify">
            <div>
              <strong>Pending withdrawal request:</strong>{' '}
              {parseFloat(vaultData.cooldownRequest.amount).toFixed(4)} NXDv3
              <div className="text-sm">
                {isCooldownReady
                  ? 'Cooldown has passed. You can claim your funds!'
                  : `Available after: ${new Date(vaultData.cooldownRequest.releaseTime * 1000).toLocaleString()}`}
              </div>
            </div>
            {isCooldownReady && (
              <button
                className="btn btn-sm btn-primary"
                onClick={handleWithdrawCooldown}
                disabled={isLoading}
              >
                Claim Withdrawal
              </button>
            )}
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'stake' ? 'active' : ''}`}
            onClick={() => setActiveTab('stake')}
          >
            Stake
          </button>
          <button
            className={`tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw
          </button>
        </div>

        {activeTab === 'stake' ? (
          <form onSubmit={handleDeposit} className="deposit-form">
            <div className="form-group">
              <label htmlFor="stakeAmount">Amount to stake:</label>
              <div className="input-with-max">
                <input
                  id="stakeAmount"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.0 NXDv3"
                  className="form-control"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-max"
                  onClick={() => setStakeAmount(vaultData.nxdBalance)}
                >
                  MAX
                </button>
              </div>
              <span className="text-xs text-gray mt-1">
                Available in wallet: {parseFloat(vaultData.nxdBalance).toFixed(4)} NXDv3
              </span>
            </div>

            <div className="action-buttons">
              {needsApproval ? (
                <button
                  type="button"
                  className="btn btn-warning full-width"
                  style={
                    isStakeActive
                      ? {
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#0d131f',
                          fontWeight: '700',
                          boxShadow: '0 6px 22px rgba(245, 158, 11, 0.65)',
                          transform: 'translateY(-1px)',
                          border: '1px solid #fde047',
                        }
                      : {}
                  }
                  disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                  onClick={handleApprove}
                >
                  {isLoading ? 'Approving...' : 'Authorize NXDv3 for Vault'}
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary full-width"
                  style={
                    isStakeActive
                      ? {
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          boxShadow: '0 6px 22px rgba(59, 130, 246, 0.65)',
                          transform: 'translateY(-1px)',
                          fontWeight: '700',
                        }
                      : {}
                  }
                  disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                >
                  {isLoading ? 'Processing...' : 'Stake NXDv3'}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="deposit-form">
            <div className="form-group">
              <label htmlFor="withdrawAmount">Amount to withdraw:</label>
              <div className="input-with-max">
                <input
                  id="withdrawAmount"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.0 NXDv3"
                  className="form-control"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-max"
                  onClick={() => {
                    const maxAvailable = vaultData.cooldownRequest
                      ? Math.max(
                          0,
                          parseFloat(vaultData.stakedBalance) -
                            parseFloat(vaultData.cooldownRequest.amount)
                        ).toString()
                      : vaultData.stakedBalance;
                    setWithdrawAmount(maxAvailable);
                  }}
                >
                  MAX
                </button>
              </div>
              <span className="text-xs text-gray mt-1">
                Staked: {parseFloat(vaultData.stakedBalance).toFixed(4)} NXDv3
                {vaultData.cooldownRequest
                  ? ` (Active cooldown: ${parseFloat(vaultData.cooldownRequest.amount).toFixed(4)})`
                  : ''}
              </span>
            </div>

            <div className="action-buttons flex flex-col gap-2">
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  width: '100%',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  className="btn flex-1"
                  style={
                    isWithdrawActive
                      ? {
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          border: '1px solid #fde047',
                          color: '#0d131f',
                          fontWeight: '700',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          padding: '11px 14px',
                          minWidth: '200px',
                          boxShadow: '0 6px 22px rgba(245, 158, 11, 0.65)',
                          transform: 'translateY(-1px)',
                        }
                      : {
                          background: '#1f2937',
                          border: '1px solid #facc15',
                          color: '#ffffff',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          padding: '11px 14px',
                          minWidth: '200px',
                        }
                  }
                  disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  onClick={() => handleWithdraw(false)}
                >
                  {isLoading ? 'Processing...' : 'Request Withdrawal (24h Cooldown)'}
                </button>
                <button
                  type="button"
                  className="btn flex-1"
                  style={
                    isWithdrawActive
                      ? {
                          background: 'linear-gradient(135deg, #1f2937, #111827)',
                          border: '2px solid #facc15',
                          color: '#facc15',
                          fontWeight: '700',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          padding: '11px 14px',
                          minWidth: '200px',
                          boxShadow: '0 4px 18px rgba(250, 204, 21, 0.45)',
                          transform: 'translateY(-1px)',
                        }
                      : {
                          background: '#1f2937',
                          border: '1px solid #facc15',
                          color: '#ffffff',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          padding: '11px 14px',
                          minWidth: '200px',
                        }
                  }
                  disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  onClick={() => handleWithdraw(true)}
                >
                  {isLoading ? 'Processing...' : 'Withdraw Now (25% Penalty)'}
                </button>
              </div>

              {/*<button
                type="button"
                className="btn full-width"
                style={
                  vaultData.emergencyWithdrawEnabled
                    ? {
                        background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
                        border: '2px solid #f87171',
                        color: '#ffffff',
                        fontWeight: '700',
                        justifyContent: 'center',
                        marginTop: '22px',
                        padding: '11px 16px',
                        boxShadow: '0 4px 18px rgba(239, 68, 68, 0.5)',
                        transform: 'translateY(-1px)',
                        opacity:
                          vaultData.emergencyWithdrawEnabled &&
                          withdrawAmount &&
                          !isNaN(parseFloat(withdrawAmount)) &&
                          parseFloat(withdrawAmount) > 0
                            ? 1
                            : 0.8,
                      }
                    : {
                        background: '#1f2937',
                        border: '1px solid #facc15',
                        color: '#ffffff',
                        justifyContent: 'center',
                        marginTop: '22px',
                        padding: '11px 16px',
                        opacity: 0.8,
                      }
                }
                disabled={
                  isLoading ||
                  !vaultData.emergencyWithdrawEnabled ||
                  !withdrawAmount ||
                  isNaN(parseFloat(withdrawAmount)) ||
                  parseFloat(withdrawAmount) <= 0
                }
                onClick={handleEmergencyWithdraw}
              >
                {isLoading
                  ? 'Processing...'
                  : `Emergency Withdraw (${vaultData.emergencyWithdrawEnabled ? 'active' : 'inactive'})`}
              </button>*/}
            </div>
          </div>
        )}

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
