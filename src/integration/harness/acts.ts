import { act, fireEvent } from '@testing-library/react';
import { MineOptions, chain } from './chainSim';

/**
 * Small wrappers that keep every simulated-chain mutation inside React's `act`,
 * so component updates triggered by `useSyncExternalStore` are flushed before the
 * test asserts on the DOM.
 */

export const connectWallet = async (): Promise<void> => {
  await act(async () => {
    chain.connect();
  });
};

export const disconnectWallet = async (): Promise<void> => {
  await act(async () => {
    chain.disconnect();
  });
};

export const click = async (element: HTMLElement): Promise<void> => {
  await act(async () => {
    fireEvent.click(element);
  });
};

export const changeInput = async (element: HTMLElement, value: string): Promise<void> => {
  await act(async () => {
    fireEvent.change(element, { target: { value } });
  });
};

/** Mines every pending simulated transaction. */
export const minePending = async (options?: MineOptions): Promise<void> => {
  await act(async () => {
    await chain.mine(options ?? {});
  });
};
