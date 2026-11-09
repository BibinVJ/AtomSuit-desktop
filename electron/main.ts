import { app, BrowserWindow, Menu } from "electron";
import * as path from "path";
import * as url from "url";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      // Disable CORS in dev to allow local renderer to call API directly
      webSecurity: !isDev ? true : false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "renderer/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  // Disable Ctrl+R reload
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.key.toLowerCase() === "r") {
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Custom menu (no reload options)
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [{ role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [{ role: "togglefullscreen" }, { role: "toggleDevTools" }],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
