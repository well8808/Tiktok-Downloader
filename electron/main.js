/**
 * Electron main process — empacota Next.js como app desktop.
 *
 * Estratégia: roda Next.js em-process (não child_process), em port
 * dinâmico, BrowserWindow aponta pra http://localhost:PORT.
 *
 * Paths importantes:
 * - Em dev: cwd do projeto
 * - Empacotado: process.resourcesPath/app (electron-builder padrão
 *   quando asar=false e files inclui o projeto inteiro)
 * - bin/, .tmp/, logs/, prisma/dev.db: app.getPath('userData')
 */

const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");

let mainWindow = null;
let nextServer = null;

/**
 * Auto-update via electron-updater + GitHub Releases (repo público).
 * Checa no startup; se houver versão nova, baixa em background e
 * pergunta ao usuário se quer reiniciar pra instalar. Silencioso em
 * caso de erro ou sem atualização (não incomoda). Só roda empacotado.
 */
function setupAutoUpdate() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch {
    return;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-downloaded", async (info) => {
    if (!mainWindow) return;
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Reiniciar agora", "Depois"],
      defaultId: 0,
      cancelId: 1,
      title: "Atualização disponível",
      message: `Versão ${info.version} baixada.`,
      detail:
        "Reinicie pra aplicar a atualização. Se escolher 'Depois', será aplicada no próximo fechamento do app.",
    });
    if (response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });

  autoUpdater.on("error", () => {
    // silencioso — não interromper o uso por falha de update
  });

  try {
    autoUpdater.checkForUpdates();
  } catch {
    // ignore
  }
}

/**
 * Acha uma porta TCP livre via módulo net nativo (porta 0 = OS escolhe).
 * Substitui get-port-please pra não depender de pacote externo no bundle.
 */
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

// --- Setup paths para runtime empacotado ---
function setupRuntimePaths() {
  const userData = app.getPath("userData");
  const downloads = app.getPath("downloads");

  // bin/ (yt-dlp.exe, ffmpeg.exe, ffprobe.exe) vem como extraResources do electron-builder.
  // Em empacotado, fica em process.resourcesPath/bin/.
  // Em dev, fica em <projectRoot>/bin/.
  const binDir = app.isPackaged
    ? path.join(process.resourcesPath, "bin")
    : path.join(__dirname, "..", "bin");

  // Pastas mutáveis sempre em userData (gravável em prod)
  const tmpDir = path.join(userData, ".tmp");
  const logsDir = path.join(userData, "logs");
  const dbDir = path.join(userData, "db");
  const dbFile = path.join(dbDir, "dev.db");

  // Garante existência
  for (const dir of [tmpDir, logsDir, dbDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // Copia dev.db seed (com schema) se ainda não existe no userData
  if (!fs.existsSync(dbFile)) {
    const seed = path.join(app.getAppPath(), "prisma", "dev.db");
    if (fs.existsSync(seed)) {
      fs.copyFileSync(seed, dbFile);
    }
  }

  // Expõe via env pra Next.js / lib/paths.ts / Prisma
  process.env.TTDL_BIN_DIR = binDir;
  process.env.TTDL_TMP_DIR = tmpDir;
  process.env.TTDL_LOGS_DIR = logsDir;
  process.env.TTDL_DOWNLOAD_DIR = path.join(downloads, "TikTok");
  process.env.DATABASE_URL = `file:${dbFile.replace(/\\/g, "/")}`;
}

async function startNextServer() {
  const next = require("next");

  const port = await findFreePort();

  // app.getAppPath() resolve corretamente em dev (projeto root) e
  // empacotado (resources/app, já que asar=false).
  const dir = app.getAppPath();

  const nextApp = next({ dev: false, dir });
  await nextApp.prepare();
  const handle = nextApp.getRequestHandler();

  nextServer = http.createServer((req, res) => handle(req, res));

  await new Promise((resolve, reject) => {
    nextServer.listen(port, "127.0.0.1", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  return port;
}

async function createWindow() {
  let port;
  try {
    port = await startNextServer();
  } catch (err) {
    dialog.showErrorBox(
      "Falha ao iniciar",
      `Não foi possível iniciar o servidor interno:\n${err && err.message ? err.message : String(err)}`,
    );
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#000000",
    title: "TikTok Downloader",
    autoHideMenuBar: true,
    show: false,
    icon: path.join(app.getAppPath(), "public", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Abre links externos no browser do user, não dentro da app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- Single instance lock ---
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// --- Lifecycle ---
app.whenReady().then(() => {
  setupRuntimePaths();
  createWindow();
  setupAutoUpdate();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (nextServer) {
    try {
      nextServer.close();
    } catch {
      // ignore
    }
  }
  if (process.platform !== "darwin") app.quit();
});
