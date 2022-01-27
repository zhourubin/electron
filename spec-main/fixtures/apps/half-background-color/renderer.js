const { ipcRenderer } = require('electron');

window.setTimeout(async (_) => {
  ipcRenderer.send('window-painted');
}, 3000);
