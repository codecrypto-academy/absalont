declare global {
  interface Window {
    ethereum?: {
      request(args: { method: string; params?: unknown[] }): Promise<any>;
      on(eventName: string, handler: (...args: any[]) => void): void;
      removeListener(eventName: string, handler: (...args: any[]) => void): void;
      isMetaMask?: boolean;
    };
  }
}

export {};
