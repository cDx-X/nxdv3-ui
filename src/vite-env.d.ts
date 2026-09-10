/// <reference types="vite/client" />

interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on(eventName: string, listener: (...args: unknown[]) => void): void;
  removeListener(eventName: string, listener: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
}

interface Window {
  ethereum?: Eip1193Provider;
}
