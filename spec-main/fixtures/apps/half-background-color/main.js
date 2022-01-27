const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
// const getColors = require('get-image-colors');

// Chroma key green
const CHROMA_COLOR_HEX = '#00b140';
const RED_COLOR_HEX = '#ff0000';

const formatHexByte = (val) => {
  const str = val.toString(16);
  return str.length === 2 ? str : `0${str}`;
};

// Fetch the test window.
const getWindow = async () => {
  const sources = await desktopCapturer.getSources({ types: ['window'] });
  const filtered = sources.filter(
    (s) => s.name === 'half-background-color-window'
  );

  if (filtered.length === 0) {
    throw new Error('Could not find test window');
  }

  return filtered[0];
};

//  Get the hex color at the given point.
//  NOTE: The color can be off on Windows when using a scale factor different
//  than 1x.
const colorAtPoint = async (image, point) => {
  const pixel = image.crop({ ...point, width: 1, height: 1 });
  const [b, g, r] = pixel.toBitmap();
  return `#${formatHexByte(r)}${formatHexByte(g)}${formatHexByte(b)}`;
  // const png = pixel.toPNG();
  // const result = await getColors(png, { count: 1, type: 'image/png' });
};

async function createWindow () {
  const mainWindow = new BrowserWindow({
    frame: false,
    backgroundColor: CHROMA_COLOR_HEX,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  await mainWindow.loadFile('index.html');
}

ipcMain.on('window-painted', async () => {
  // Ensure enough time has passed for paint
  const window = await getWindow();
  const buf = window.thumbnail;
  const size = window.thumbnail.getSize();
  const leftHalfColor = await colorAtPoint(buf, {
    x: Math.round(size.width / 4),
    y: Math.round(size.height / 2)
  });

  const rightHalfColor = await colorAtPoint(buf, {
    x: size.width - Math.round(size.width / 4),
    y: Math.round(size.height / 2)
  });

  const colors =
    leftHalfColor === CHROMA_COLOR_HEX && rightHalfColor === RED_COLOR_HEX;
  process.exit(colors ? 0 : 1);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
