// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// NOTE: The normal way of doing this doesn't work correctly because of Vite externalizing Node.js modules
// NOTE: See https://vitejs.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility
// NOTE: We are exposing `ipcRenderer.invoke` with contextBridge here so that it can be used in the renderer process
// NOTE: See this file for the contextBridge setup: src/preload.ts
// Example usage in a renderer process:
// Instead of `ipcRenderer.invoke("check-sitemap", websiteUrl)`, use `window.electronApi.invoke("check-sitemap", websiteUrl)`
contextBridge.exposeInMainWorld("electronApi", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a generic function that can take any arguments
  invoke: (channel: string, ...args: any) => ipcRenderer.invoke(channel, ...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a generic function that can take any arguments
  on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on(channel, listener),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This is a generic function that can take any arguments
  send: (channel: string, ...args: any) => ipcRenderer.send(channel, ...args),
});
