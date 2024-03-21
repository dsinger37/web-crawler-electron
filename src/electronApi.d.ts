declare global {
  interface Window {
    electronApi: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a generic function that can take any arguments
      invoke: (channel: string, ...args: any) => Promise<any>;
      on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    };
  }
}

export {};
