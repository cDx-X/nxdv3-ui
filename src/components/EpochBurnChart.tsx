/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { NXDv3ERC20ABI, CONTRACT_ADDRESSES } from '../abis/contracts';
import { multicall, MulticallCall } from '../utils/multicall';

interface EpochData {
  epochIndex: number;
  startDateFormatted: string;
  startTimestamp: number;
  burnedAmountEth: number;
  isCurrentEpoch: boolean;
}

const STORAGE_EPOCH_CACHE_KEY = 'nxdv3_epoch_burn_cache_v3';

interface CachedEpochState {
  firstBurnDateFormatted: string;
  currentEpochNum: number;
  totalBurnedEth: number;
  epochs: EpochData[];
}

function loadEpochCache(): CachedEpochState | null {
  try {
    const raw = localStorage.getItem(STORAGE_EPOCH_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveEpochCache(data: CachedEpochState) {
  try {
    localStorage.setItem(STORAGE_EPOCH_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore cache write error
  }
}

export const EpochBurnChart: React.FC<{ nxdAddress?: string }> = ({
  nxdAddress = CONTRACT_ADDRESSES.nxdAddress,
}) => {
  const [initialCached] = useState(() => loadEpochCache());
  const [firstBurnDateFormatted, setFirstBurnDateFormatted] = useState<string>(
    initialCached?.firstBurnDateFormatted || 'Awaiting'
  );
  const [currentEpochNum, setCurrentEpochNum] = useState<number>(
    initialCached?.currentEpochNum || 0
  );
  const [totalBurnedEth, setTotalBurnedEth] = useState<number>(initialCached?.totalBurnedEth || 0);
  const [epochs, setEpochs] = useState<EpochData[]>(initialCached?.epochs || []);
  const [isLoading, setIsLoading] = useState<boolean>(
    !initialCached || initialCached.epochs.length === 0
  );
  const [hoveredEpoch, setHoveredEpoch] = useState<EpochData | null>(null);

  const formatDateOnly = (tsSec: number): string => {
    if (!tsSec || tsSec <= 0) return 'Awaiting';
    const d = new Date(tsSec * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day} UTC`;
  };

  const fetchData = useCallback(async () => {
    try {
      const addr =
        nxdAddress && ethers.isAddress(nxdAddress) ? nxdAddress : CONTRACT_ADDRESSES.nxdAddress;

      // Single Multicall3 call to fetch first burn time, current epoch, total burned, and all epochs burn data
      const calls: MulticallCall[] = [
        { target: addr, abi: NXDv3ERC20ABI, functionName: 'firstBurnTimestamp' },
        { target: addr, abi: NXDv3ERC20ABI, functionName: 'currentEpoch' },
        { target: addr, abi: NXDv3ERC20ABI, functionName: 'totalNXDBurned' },
        { target: addr, abi: NXDv3ERC20ABI, functionName: 'getAllEpochsBurnData' },
      ];

      const res = await multicall(calls);

      const firstBurnTs = res[0]?.success ? BigInt(res[0].result || 0) : 0n;
      const currEpoch = res[1]?.success ? BigInt(res[1].result || 0) : 0n;
      const totalBurnedWei = res[2]?.success ? BigInt(res[2].result || 0) : 0n;
      const allEpochsRaw = res[3]?.success && Array.isArray(res[3].result) ? res[3].result : [];

      const cEpoch = Number(currEpoch);
      const totalBurnedEthVal = parseFloat(ethers.formatEther(totalBurnedWei));
      const firstBurnFormatted =
        firstBurnTs > 0n ? formatDateOnly(Number(firstBurnTs)) : 'Awaiting';

      const list: EpochData[] = [];

      if (allEpochsRaw.length > 0) {
        allEpochsRaw.forEach((item: any, idx: number) => {
          const epNum = item?.epoch !== undefined ? Number(item.epoch) : Number(item[0] ?? idx);
          const startTs =
            item?.startTime !== undefined ? Number(item.startTime) : Number(item[1] ?? 0);
          const burnedWei = item?.burned !== undefined ? BigInt(item.burned) : BigInt(item[2] ?? 0);

          list.push({
            epochIndex: epNum,
            startDateFormatted: formatDateOnly(startTs),
            startTimestamp: startTs,
            burnedAmountEth: parseFloat(ethers.formatEther(burnedWei)),
            isCurrentEpoch: epNum === cEpoch,
          });
        });
      } else if (firstBurnTs > 0n) {
        // Fallback if array was empty but first burn exists
        list.push({
          epochIndex: 0,
          startDateFormatted: firstBurnFormatted,
          startTimestamp: Number(firstBurnTs),
          burnedAmountEth: totalBurnedEthVal,
          isCurrentEpoch: true,
        });
      }

      setFirstBurnDateFormatted(firstBurnFormatted);
      setCurrentEpochNum(cEpoch);
      setTotalBurnedEth(totalBurnedEthVal);
      setEpochs(list);

      saveEpochCache({
        firstBurnDateFormatted: firstBurnFormatted,
        currentEpochNum: cEpoch,
        totalBurnedEth: totalBurnedEthVal,
        epochs: list,
      });
    } catch (err) {
      console.error('[EpochBurnChart] Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [nxdAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxBurned = Math.max(...epochs.map((e) => e.burnedAmountEth), 0.000001);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <p className="text-xs text-secondary">Historical 7-day epoch burn analytics.</p>
      </div>

      {/* Summary Cards */}
      <div className="epoch-summary-grid">
        <div className="card px-2 py-2 flex flex-col min-w-0">
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              whiteSpace: 'nowrap',
              textAlign: 'left',
              lineHeight: 1.2,
            }}
          >
            First Burn
          </span>
          <span
            className="text-sm font-bold text-yellow-400 mt-1 truncate"
            style={{ whiteSpace: 'nowrap' }}
            title={firstBurnDateFormatted}
          >
            {firstBurnDateFormatted.replace(' UTC', '')}
          </span>
        </div>
        <div className="card px-2 py-2 flex flex-col min-w-0">
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              whiteSpace: 'nowrap',
              textAlign: 'left',
              lineHeight: 1.2,
            }}
          >
            Active Epoch
          </span>
          <span
            className="text-sm font-bold text-blue-400 mt-1 truncate"
            style={{ whiteSpace: 'nowrap' }}
          >
            Epoch #{currentEpochNum}
          </span>
        </div>
        <div className="card px-2 py-2 flex flex-col min-w-0">
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              whiteSpace: 'nowrap',
              textAlign: 'left',
              lineHeight: 1.2,
            }}
            title="Total NXD Burned"
          >
            Total NXD Burned
          </span>
          <span
            className="text-sm font-bold text-red-400 mt-1 truncate"
            style={{ whiteSpace: 'nowrap' }}
          >
            {totalBurnedEth.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}
          </span>
        </div>
        <div className="card px-2 py-2 flex flex-col min-w-0">
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              whiteSpace: 'nowrap',
              textAlign: 'left',
              lineHeight: 1.2,
            }}
          >
            Epoch Duration
          </span>
          <span
            className="text-sm font-bold text-white mt-1 truncate"
            style={{ whiteSpace: 'nowrap' }}
          >
            7 Days
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card p-4 relative epochs-chart-box epoch-burn-chart-box">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <span className="text-xs font-semibold text-secondary">
            NXDv3 Burn Volume per 7-Day Epoch
          </span>
          {hoveredEpoch && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
              Epoch #{hoveredEpoch.epochIndex}:{' '}
              <strong>{hoveredEpoch.burnedAmountEth.toLocaleString()} NXD</strong> (
              {hoveredEpoch.startDateFormatted})
            </span>
          )}
        </div>

        {epochs.length === 0 ? (
          <div
            style={{
              height: '160px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              gap: '6px',
            }}
          >
            <span>{isLoading ? 'Loading epoch data...' : 'No burns recorded yet'}</span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Epoch 0 will initialize aligned to 00:00:00 UTC upon the first token burn.
            </span>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }} className="epoch-burn-scroll-wrapper">
            <div
              className="epoch-bars-container"
              style={{
                minWidth: `${Math.max(epochs.length * 75, 320)}px`,
                height: '180px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                paddingBottom: '32px',
                paddingTop: '16px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  bottom: '32px',
                  left: '0',
                  right: '0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  pointerEvents: 'none',
                  opacity: 0.12,
                }}
              >
                <div style={{ borderBottom: '1px dashed var(--text-secondary)', width: '100%' }} />
                <div style={{ borderBottom: '1px dashed var(--text-secondary)', width: '100%' }} />
                <div style={{ borderBottom: '1px dashed var(--text-secondary)', width: '100%' }} />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  height: '100%',
                  zIndex: 1,
                  gap: '8px',
                }}
              >
                {epochs.map((ep) => {
                  const pct =
                    maxBurned > 0
                      ? Math.max(
                          (ep.burnedAmountEth / maxBurned) * 100,
                          ep.burnedAmountEth > 0 ? 8 : 4
                        )
                      : 4;
                  const isHover = hoveredEpoch?.epochIndex === ep.epochIndex;

                  return (
                    <div
                      key={ep.epochIndex}
                      onMouseEnter={() => setHoveredEpoch(ep)}
                      onMouseLeave={() => setHoveredEpoch(null)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        flex: 1,
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: ep.isCurrentEpoch ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          marginBottom: '3px',
                        }}
                      >
                        {ep.burnedAmountEth > 0
                          ? ep.burnedAmountEth.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })
                          : '0'}
                      </span>

                      <div
                        style={{
                          width: '100%',
                          maxWidth: '34px',
                          height: `${pct}%`,
                          borderRadius: '4px 4px 0 0',
                          background: ep.isCurrentEpoch
                            ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                            : 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
                          boxShadow: isHover
                            ? ep.isCurrentEpoch
                              ? '0 0 12px rgba(245, 158, 11, 0.7)'
                              : '0 0 12px rgba(59, 130, 246, 0.7)'
                            : 'none',
                          transition: 'all 0.2s ease',
                          opacity: ep.burnedAmountEth === 0 ? 0.35 : 1,
                        }}
                      />

                      <div
                        className="epoch-bar-label"
                        style={{
                          position: 'absolute',
                          bottom: '-20px',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: ep.isCurrentEpoch ? 'var(--accent-gold)' : 'var(--text-primary)',
                          }}
                        >
                          Ep #{ep.epochIndex}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
