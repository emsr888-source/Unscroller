import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('creatorMode', {
  auth: {
    signIn: (email: string) => ipcRenderer.invoke('auth:signIn', email),
    getSession: () => ipcRenderer.invoke('auth:getSession'),
    signOut: () => ipcRenderer.invoke('auth:signOut'),
  },
  policy: {
    getProviders: () => ipcRenderer.invoke('policy:getProviders'),
    getQuickActions: (providerId: string) => ipcRenderer.invoke('policy:getQuickActions', providerId),
  },
  subscription: {
    openCheckout: () => ipcRenderer.invoke('subscription:openCheckout'),
    getStatus: () => ipcRenderer.invoke('subscription:getStatus'),
  },
  getPolicy: (providerId: string) => ipcRenderer.invoke('policy:getForProvider', providerId),
  browserView: {
    openProvider: (providerId: string) => ipcRenderer.invoke('browserview:openProvider', providerId),
    navigate: (action: 'back' | 'forward' | 'reload') => ipcRenderer.invoke('browserview:navigate', action),
  },
});
