declare global {
  interface Window {
    electronApi: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a generic function that can take any arguments
      invoke: (channel: string, ...args: any) => Promise<any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a generic function that can take any arguments
      on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a generic function that can take any arguments
      send: (channel: string, ...args: any) => void;
    };
  }
}

export {};
