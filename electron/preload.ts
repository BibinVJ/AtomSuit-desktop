const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('auth', {
  login: (identifier: string, password: string) => ipcRenderer.invoke('auth:login', identifier, password),
  logout: () => ipcRenderer.invoke('auth:logout'),
  storeToken: (token: string) => ipcRenderer.invoke('auth:storeToken', token),
  getToken: () => ipcRenderer.invoke('auth:getToken'),
});

contextBridge.exposeInMainWorld('api', {
  getCustomers: () => ipcRenderer.invoke('api:getCustomers'),
  getItems: () => ipcRenderer.invoke('api:getItems'),
  getItem: (id: string) => ipcRenderer.invoke('api:getItem', id),
  getNextInvoiceNumber: () => ipcRenderer.invoke('api:getNextInvoiceNumber'),
  addSale: (sale: any) => ipcRenderer.invoke('api:addSale', sale),
  getSales: () => ipcRenderer.invoke('api:getSales'),
});

contextBridge.exposeInMainWorld('tenant', {
  validate: (subdomain: string) => ipcRenderer.invoke('tenant:validate', subdomain),
});
